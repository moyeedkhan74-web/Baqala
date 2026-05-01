import { useState, useEffect } from 'react';
import { HiSearch, HiX } from 'react-icons/hi';

const SearchBar = ({ onSearch, placeholder = 'Search apps...' }) => {
  const [query, setQuery] = useState(['']);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative w-full max-w-xl" id="search-bar">
      <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="input-field !pl-12 !pr-10"
        id="search-input"
      />
      {query && (
        <button
          onClick={() => setQuery('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
        >
          <HiX className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
