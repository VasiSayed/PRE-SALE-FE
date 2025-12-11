// src/utils/theme.js
// Utility to get brand theme from localStorage with defaults

const DEFAULT_THEME = {
  primary_color: "#102a54",
  secondary_color: "#FFFFFF",
  background_color: "#F5F5F7",
  font_family: "Inter",
  base_font_size: 14,
  heading_color: "#111827",
  accent_color: "#2563EB",
  button_primary_bg: "#102A54",
  button_primary_text: "#FFFFFF",
};

/**
 * Get brand theme from localStorage (BRAND_THEME key)
 * Returns theme object with defaults for missing values
 */
export const getBrandTheme = () => {
  try {
    const stored = localStorage.getItem("BRAND_THEME");
    if (!stored) {
      return DEFAULT_THEME;
    }

    const theme = JSON.parse(stored);
    
    // Merge with defaults to ensure all keys exist
    return {
      primary_color: theme.primary_color || DEFAULT_THEME.primary_color,
      secondary_color: theme.secondary_color || DEFAULT_THEME.secondary_color,
      background_color: theme.background_color || DEFAULT_THEME.background_color,
      font_family: theme.font_family || DEFAULT_THEME.font_family,
      base_font_size: theme.base_font_size || DEFAULT_THEME.base_font_size,
      heading_color: theme.heading_color || DEFAULT_THEME.heading_color,
      accent_color: theme.accent_color || DEFAULT_THEME.accent_color,
      button_primary_bg: theme.button_primary_bg || DEFAULT_THEME.button_primary_bg,
      button_primary_text: theme.button_primary_text || DEFAULT_THEME.button_primary_text,
      company_name: theme.company_name || null,
      logo: theme.logo || null,
    };
  } catch (err) {
    console.error("Failed to parse BRAND_THEME from localStorage", err);
    return DEFAULT_THEME;
  }
};

/**
 * Get font family string with fallbacks
 */
export const getFontFamily = (fontFamily) => {
  const font = fontFamily || DEFAULT_THEME.font_family;
  return `${font}, system-ui, -apple-system, 'Segoe UI', 'Roboto', 'Open Sans', sans-serif`;
};

/**
 * Apply theme CSS variables to document root
 */
export const applyThemeToRoot = (theme) => {
  const root = document.documentElement;
  
  root.style.setProperty("--theme-primary-color", theme.primary_color);
  root.style.setProperty("--theme-secondary-color", theme.secondary_color);
  root.style.setProperty("--theme-background-color", theme.background_color);
  root.style.setProperty("--theme-font-family", getFontFamily(theme.font_family));
  root.style.setProperty("--theme-base-font-size", `${theme.base_font_size}px`);
  root.style.setProperty("--theme-heading-color", theme.heading_color);
  root.style.setProperty("--theme-accent-color", theme.accent_color);
  root.style.setProperty("--theme-button-primary-bg", theme.button_primary_bg);
  root.style.setProperty("--theme-button-primary-text", theme.button_primary_text);
};

