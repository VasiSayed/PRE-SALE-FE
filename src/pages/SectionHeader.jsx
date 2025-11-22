// components/SectionHeader.jsx
import React from "react";
import "./SectionHeader.css";

const SectionHeader = ({ title, collapsed, onToggle }) => {
  return (
    <div className="section-header-bar" onClick={onToggle}>
      <div className="section-header-title">{title}</div>
      <div className="section-header-icon">{collapsed ? "▼" : "▲"}</div>
    </div>
  );
};

export default SectionHeader;
