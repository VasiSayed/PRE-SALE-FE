import React from "react";
import "./SearchBar.css";

const SearchBar = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}) => {
  return (
    <div className={`search-bar-wrapper ${className}`}>
      <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24">
        <path
          d="M21 21l-4.3-4.3M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {value && (
        <button
          className="search-clear"
          onClick={() => onChange({ target: { value: "" } })}
          title="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default SearchBar;
