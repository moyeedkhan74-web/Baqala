import { HiStar } from 'react-icons/hi';

const StarRating = ({ rating = 0, size = 'md', interactive = false, onRate = null }) => {
  const sizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate?.(star)}
          className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
        >
          <HiStar
            className={`${sizes[size]} ${
              star <= Math.round(rating)
                ? 'text-yellow-400'
                : 'text-dark-600'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
