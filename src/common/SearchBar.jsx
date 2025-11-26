import React from "react";
// import "./SearchBar.css"; // optional if you later want separate CSS

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  wrapperClassName = "",
}) {
  return (
    <div className={`search-wrap ${wrapperClassName}`}>
      <svg width="22" height="22" viewBox="0 0 24 24">
        <path
          d="M21 21l-4.3-4.3M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <input
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
