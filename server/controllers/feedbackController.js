const supabase = require('../config/supabase');
const App = require('../models/App');
const User = require('../models/User');

// Helper to manual populate user data from MongoDB
const populateUsers = async (feedbacks) => {
  if (!feedbacks || feedbacks.length === 0) return [];
  
  const userIds = [...new Set(feedbacks.map(f => f.user_id))];
  const users = await User.find({ _id: { $in: userIds } }).select('name avatar');
  
  const userMap = {};
  users.forEach(u => {
    userMap[u._id.toString()] = u;
  });

  return feedbacks.map(f => ({
    ...f,
    _id: f.id,
    app: f.app_id,
    user: userMap[f.user_id] || { name: 'Unknown User' },
    parent: f.parent_id,
    likedBy: f.liked_by || [],
    dislikedBy: f.disliked_by || [],
    createdAt: f.created_at
  }));
};

// Create feedback or reply (Supabase version)
exports.createFeedback = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const { rating, comment, parentId } = req.body;
    const userId = req.user._id.toString();

    // 1. If top-level, check for existing review in Supabase
    if (!parentId) {
      const { data: existing } = await supabase
        .from('feedbacks')
        .select('id')
        .eq('app_id', appId)
        .eq('user_id', userId)
        .is('parent_id', null)
        .single();

      if (existing) {
        return res.status(400).json({ message: 'You have already reviewed this app.' });
      }
    }

    // 2. Insert into Supabase
    const { data: feedback, error } = await supabase
      .from('feedbacks')
      .insert([{
        app_id: appId,
        user_id: userId,
        rating: parentId ? 0 : Number(rating) || 1,
        comment,
        parent_id: parentId || null
      }])
      .select()
      .single();

    if (error) throw error;

    // 3. Update MongoDB App rating aggregate ONLY if top-level feedback
    if (!parentId) {
      const { data: allTopLevel } = await supabase
        .from('feedbacks')
        .select('rating')
        .eq('app_id', appId)
        .is('parent_id', null);

      const totalRatings = allTopLevel.length;
      const sumRatings = allTopLevel.reduce((acc, f) => acc + (f.rating || 0), 0);
      const averageRating = totalRatings > 0 ? (sumRatings / totalRatings) : 0;

      await App.findByIdAndUpdate(appId, {
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: totalRatings
      });
    }

    // 4. Return populated result
    const populated = await populateUsers([feedback]);
    res.status(201).json({ feedback: populated[0] });
  } catch (err) {
    next(err);
  }
};

// Get feedback for an app (Supabase version)
exports.getFeedback = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('app_id', appId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const populated = await populateUsers(data);
    res.json({ feedback: populated });
  } catch (err) {
    next(err);
  }
};

// Like / dislike a feedback (Supabase version)
exports.reactFeedback = async (req, res, next) => {
  try {
    const { feedbackId } = req.params;
    const { type } = req.body;
    const userId = req.user._id.toString();

    const { data: feedback, error: fetchErr } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('id', feedbackId)
      .single();

    if (fetchErr || !feedback) return res.status(404).json({ message: 'Feedback not found.' });

    let likedBy = feedback.liked_by || [];
    let dislikedBy = feedback.disliked_by || [];

    if (type === 'like') {
      if (likedBy.includes(userId)) {
        likedBy = likedBy.filter(id => id !== userId);
      } else {
        likedBy.push(userId);
        dislikedBy = dislikedBy.filter(id => id !== userId);
      }
    } else if (type === 'dislike') {
      if (dislikedBy.includes(userId)) {
        dislikedBy = dislikedBy.filter(id => id !== userId);
      } else {
        dislikedBy.push(userId);
        likedBy = likedBy.filter(id => id !== userId);
      }
    }

    const { data: updated, error: updateErr } = await supabase
      .from('feedbacks')
      .update({
        liked_by: likedBy,
        disliked_by: dislikedBy,
        likes: likedBy.length,
        dislikes: dislikedBy.length
      })
      .eq('id', feedbackId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    const populated = await populateUsers([updated]);
    res.json({ feedback: populated[0] });
  } catch (err) {
    next(err);
  }
};
