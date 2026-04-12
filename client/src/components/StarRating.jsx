import { HiStar } from 'react-icons/hi';
import { useState } from 'react';

const StarRating = ({ rating = 0, size = 'md', interactive = false, onRate = null }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const stars = [1, 2, 3, 4, 5];

  const currentDisplayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => interactive && setHoverRating(0)}>
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (interactive && onRate) {
              onRate(star);
            }
          }}
          className={`${interactive ? 'cursor-pointer hover:scale-125 transition-transform p-1.5' : 'cursor-default p-1'} flex items-center justify-center`}
        >
          <HiStar
            className={`${sizes[size]} ${
              star <= Math.round(currentDisplayRating)
                ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]'
                : 'text-white/10'
            } transition-all duration-200`}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
