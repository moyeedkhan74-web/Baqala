const supabase = require('../config/supabase');
const App = require('../models/App');
const User = require('../models/User');

// Helper to manual populate user data from MongoDB
const populateUsers = async (feedbacks) => {
  if (!feedbacks || feedbacks.length === 0) return [];
  
  const userIds = [...new Set(feedbacks.map(f => f.user_id))];
  let userMap = {};

  try {
    // Attempt to pull names/avatars from MongoDB
    const users = await User.find({ _id: { $in: userIds } }).select('name avatar');
    users.forEach(u => {
      userMap[u._id.toString()] = u;
    });
  } catch (mongoErr) {
    // Resilience: Log the error but don't crash. Feedback text is still in Supabase.
    console.error('[DATABASE RESILIENCE] MongoDB unreachable for feedback avatars:', mongoErr.message);
  }

  return feedbacks.map(f => ({
    ...f,
    _id: f.id,
    app: f.app_id,
    user: userMap[f.user_id] || { name: 'Baqala User', avatar: null },
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
      const { data: existing, error: existErr } = await supabase
        .from('feedbacks')
        .select('id')
        .eq('app_id', appId)
        .eq('user_id', userId)
        .is('parent_id', null)
        .maybeSingle();

      if (existErr) {
        console.error('[SUPABASE_ERROR] Failed checking existing feedback:', existErr.message);
        return res.status(503).json({ message: 'Review service is currently unavailable.' });
      }

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
      .maybeSingle();

    if (error || !feedback) {
      console.error('[SUPABASE_ERROR] Failed inserting feedback:', error?.message || 'Empty response');
      return res.status(503).json({ message: 'Review service is currently unavailable.' });
    }

    // 3. Update MongoDB App rating aggregate ONLY if top-level feedback
    if (!parentId) {
      const { data: allTopLevel, error: allTopLevelErr } = await supabase
        .from('feedbacks')
        .select('rating')
        .eq('app_id', appId)
        .is('parent_id', null);

      if (!allTopLevelErr && allTopLevel) {
        const totalRatings = allTopLevel.length;
        const sumRatings = allTopLevel.reduce((acc, f) => acc + (f.rating || 0), 0);
        const averageRating = totalRatings > 0 ? (sumRatings / totalRatings) : 0;

        await App.findByIdAndUpdate(appId, {
          averageRating: Math.round(averageRating * 10) / 10,
          reviewCount: totalRatings
        });
      }
    }

    // 4. Return populated result
    const populated = await populateUsers([feedback]);
    res.status(201).json({ feedback: populated[0] });
  } catch (err) {
    console.error('[CREATE_FEEDBACK_ERROR] Exception:', err.message);
    res.status(503).json({ message: 'Review service is currently unavailable.' });
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

    if (error) {
      console.error('[SUPABASE_ERROR] Error fetching feedbacks:', error.message);
      return res.json({ feedback: [], warning: 'Feedbacks are temporarily unavailable.' });
    }

    const populated = await populateUsers(data || []);
    res.json({ feedback: populated });
  } catch (err) {
    console.error('[GET_FEEDBACK_ERROR] Exception:', err.message);
    res.json({ feedback: [], warning: 'Feedbacks are temporarily unavailable.' });
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
