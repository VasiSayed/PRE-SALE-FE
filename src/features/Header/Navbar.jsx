import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import profileImg from "../../assets/profile.jpg";
import "./Navbar.css";
import { useAuth } from "../../context/AuthContext";
import { getBrandTheme, getFontFamily, applyThemeToRoot } from "../../utils/theme";


const BellIcon = ({ className = "", size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    style={{ color: "white" }}
  >
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const GearIcon = ({ className = "", size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    style={{ color: "white" }}
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 9 3.09V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const ProfileIcon = ({ className = "", size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    style={{ color: "white" }}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// Navbar Component
function Navbar({ currentUser, onLogout, showLogout = true }) {
  const { brand: brandFromAuth } = useAuth();

  // Defaults: when no brand exists
  const [brandLogo, setBrandLogo] = useState(profileImg);
  const [brandName, setBrandName] = useState("Myciti.life");
  const [theme, setTheme] = useState(() => getBrandTheme());

  useEffect(() => {
    const fallbackName = "myciti.life";
    const fallbackLogo = profileImg;

    let effectiveBrand = brandFromAuth || null;

    // If context empty (e.g. fresh reload), try localStorage
    if (!effectiveBrand) {
      try {
        const stored = localStorage.getItem("BRAND_THEME");
        if (stored) {
          effectiveBrand = JSON.parse(stored);
        }
      } catch (err) {
        console.error("Failed to parse BRAND_THEME from localStorage", err);
      }
    }

    // Get theme with defaults
    const currentTheme = getBrandTheme();
    setTheme(currentTheme);

    // Apply CSS variables to root
    applyThemeToRoot(currentTheme);

    // Set brand logo and name
    if (effectiveBrand) {
      setBrandLogo(effectiveBrand.logo || fallbackLogo);
      setBrandName(effectiveBrand.company_name || fallbackName);
    } else {
      setBrandLogo(fallbackLogo);
      setBrandName(fallbackName);
    }
  }, [brandFromAuth]);

  // Convert "SUPER_ADMIN" → "Super Admin"
  const formatLabel = (val) => {
    if (!val) return "";
    return val
      .toLowerCase()
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const roleLabel = formatLabel(currentUser?.role);
  const username = currentUser?.username || currentUser?.email || "";

  const fontFamilyStr = getFontFamily(theme.font_family);

  return (
    <nav
      className="custom-navbar"
      style={{
        margin: 0,
        padding: "12px 32px 12px 12px",
        width: "100%",
        backgroundColor: theme.primary_color,
        borderRadius: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: fontFamilyStr,
        fontSize: `${theme.base_font_size}px`,
      }}
    >
      {/* LEFT SECTION */}
      <div className="d-flex align-items-center">
        <img
          src={brandLogo || profileImg}
          alt={brandName || "Company Logo"}
          className="rounded-circle me-2"
          style={{ width: "60px", height: "60px", marginLeft: 0 }}
        />
        <span
          className="text-white"
          style={{
            fontSize: "1.8rem",
            fontWeight: "600",
            fontFamily: fontFamilyStr,
            color: theme.secondary_color,
            letterSpacing: "-0.5px",
            marginLeft: 8,
          }}
        >
          {brandName}
        </span>
      </div>

      {/* RIGHT SECTION */}
      <div className="ms-auto d-flex align-items-center gap-3">
        {currentUser && (
          <div className="nav-user-block me-2">
            {roleLabel && (
              <div className="nav-user-role" style={{ color: theme.secondary_color }}>
                {roleLabel}
              </div>
            )}
            {username && (
              <div className="nav-user-name" style={{ color: theme.secondary_color }}>
                {username}
              </div>
            )}
          </div>
        )}

        {/* Notification */}
        <BellIcon className="icon" style={{ color: theme.secondary_color }} />

        {/* Settings */}
        <Link to="/setup" aria-label="Open Setup">
          <GearIcon className="icon" style={{ color: theme.secondary_color }} />
        </Link>

        {/* Profile */}
        <Link to="/profile" aria-label="Profile Page">
          <ProfileIcon className="icon" style={{ color: theme.secondary_color }} />
        </Link>

        {/* Logout */}
        {showLogout && (
          <button
            onClick={onLogout}
            className="logout-btn"
            title="Logout"
            style={{
              fontFamily: fontFamilyStr,
              backgroundColor: "transparent",
              borderColor: theme.secondary_color,
              color: theme.secondary_color,
            }}
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
