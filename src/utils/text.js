// src/utils/text.js
export const toTitleCase = (value) => {
  if (value === null || value === undefined) return "";
  return value
    .toString()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};
