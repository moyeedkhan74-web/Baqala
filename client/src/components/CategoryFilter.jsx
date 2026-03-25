const categories = [
  'All', 'Games', 'Social', 'Productivity', 'Education',
  'Entertainment', 'Tools', 'Finance', 'Health',
  'Music', 'Photography', 'Developer Tools', 'Other'
];

const CategoryFilter = ({ selected, onSelect }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" id="category-filter">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat === 'All' ? '' : cat)}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex-shrink-0 ${
            (cat === 'All' && !selected) || selected === cat
              ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/25'
              : 'bg-dark-800/50 text-dark-300 border border-dark-700 hover:border-primary-500/30 hover:text-white'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
