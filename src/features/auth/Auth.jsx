// src/components/Auth/Auth.jsx (or wherever your Auth component lives)
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../Header/Navbar";
import Footer from "../Footer/Footer";
import profileImg from "../../assets/profile.jpg";
import api from "../../api/axiosInstance";
import "./Auth.css";

// SVG Icons for form inputs
const UserIcon = ({ size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = ({ size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const MailIcon = ({ size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

export default function Auth() {
  const { login, loginWithOtp, user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from || "/dashboard";

  const [isLogin, setIsLogin] = useState(true); // signup disabled but keeping for compatibility

  // "password" or "otp"
  const [loginMode, setLoginMode] = useState("password");

  const [formData, setFormData] = useState({
    username: "", // username OR email (for OTP)
    password: "",
    name: "",
    otp: "",
  });

  const [loading, setLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError("");
  };

  const handleModeChange = (mode) => {
    setLoginMode(mode);
    setError("");
    setOtpSent(false);
    setFormData((prev) => ({
      ...prev,
      password: "",
      otp: "",
    }));
  };

  const handleSendOtp = async () => {
    setError("");

    if (!formData.username) {
      setError("Please enter your email address to receive OTP.");
      return;
    }

    setOtpSending(true);
    try {
      await api.post("/accounts/login/otp/start/", {
        email: formData.username,
      });
      setOtpSent(true);
      // If you have a toast system use that; keeping it silent here
      // e.g. showToast("OTP sent to your email", "success");
    } catch (err) {
      console.error("Failed to send OTP:", err);
      setError("Failed to send OTP. Please check your email and try again.");
    } finally {
      setOtpSending(false);
    }
  };

  // Common post-login actions: fetch scope + redirect based on role
  const doAfterLogin = async (data) => {
    const userRole = data?.user?.role || "SALES";

    // Fetch my-scope (non-blocking for navigation)
    try {
      const scopeRes = await api.get("/client/my-scope/", {
        params: { include_units: true },
      });

      const scopeData = scopeRes.data || {};

      localStorage.setItem("MY_SCOPE", JSON.stringify(scopeData));

      if (scopeData.projects && scopeData.projects.length > 0) {
        const firstProjectId = scopeData.projects[0].id;
        if (firstProjectId) {
          localStorage.setItem("ACTIVE_PROJECT_ID", String(firstProjectId));
          localStorage.setItem("PROJECT_ID", String(firstProjectId));
        }
      }
    } catch (scopeErr) {
      console.error("Failed to fetch /client/my-scope/:", scopeErr);
      // Don’t block login if scope fails
    }

    // Redirect based on role
    if (userRole === "SALES") {
      nav("/dashboard", { replace: true });
    } else {
      nav(from, { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!isLogin) {
        setError("Signup is currently disabled. Please login.");
        return;
      }

      if (loginMode === "password") {
        // ------- Normal username/password login -------
        const data = await login({
          username: formData.username,
          password: formData.password,
        });

        await doAfterLogin(data);
      } else {
        // ------- OTP login flow -------
        if (!formData.username) {
          setError("Please enter your email address.");
          return;
        }
        if (!formData.otp) {
          setError("Please enter the OTP you received.");
          return;
        }

        const data = await loginWithOtp({
          email: formData.username,
          otp: formData.otp,
        });

        await doAfterLogin(data);
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError(
        loginMode === "password"
          ? "Invalid username or password"
          : "Invalid email or OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setFormData({ username: "", password: "", name: "", otp: "" });
  };

  const isPasswordMode = loginMode === "password";
  const isOtpMode = loginMode === "otp";

  return (
    <div className="auth-page">
      {/* Reusable Navbar Component */}
      <Navbar showLogout={false} currentUser={user} />

      {/* Auth Container */}
      <div className="auth-container">
        <div className="auth-background">
          <div className="auth-card">
            {/* Logo Section */}
            <div className="auth-header">
              <div className="auth-logo">
                <img src={profileImg} alt="Logo" className="logo-image" />
              </div>
              <h1 className="auth-title">SHREE RAM KRUSHNA DEVELOPERS</h1>
              <p className="auth-subtitle">
                {isLogin
                  ? "Welcome back! Please login to your account."
                  : "Create your account to get started."}
              </p>
            </div>

            {/* Login mode toggle: Password / OTP */}
            <div className="auth-mode-toggle">
              <button
                type="button"
                className={
                  isPasswordMode ? "mode-btn mode-btn-active" : "mode-btn"
                }
                onClick={() => handleModeChange("password")}
              >
                Password Login
              </button>
              <button
                type="button"
                className={isOtpMode ? "mode-btn mode-btn-active" : "mode-btn"}
                onClick={() => handleModeChange("otp")}
              >
                OTP via Email
              </button>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-wrapper">
                    <UserIcon size={20} />
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}

              {/* Username / Email field */}
              <div className="form-group">
                <label className="form-label">
                  {isPasswordMode ? "Username" : "Email Address"}
                </label>
                <div className="input-wrapper">
                  <MailIcon size={20} />
                  <input
                    type={isPasswordMode ? "text" : "email"}
                    name="username"
                    className="form-input"
                    placeholder={
                      isPasswordMode
                        ? "Enter your username"
                        : "Enter your email"
                    }
                    value={formData.username}
                    onChange={handleInputChange}
                    autoFocus
                    required
                  />
                </div>
              </div>

              {/* Password field only for password login */}
              {isPasswordMode && (
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-wrapper">
                    <LockIcon size={20} />
                    <input
                      type="password"
                      name="password"
                      className="form-input"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              )}

              {/* OTP section for OTP login */}
              {isOtpMode && (
                <>
                  <div className="form-group">
                    <label className="form-label">
                      One-Time Password (OTP)
                    </label>
                    <div className="input-wrapper">
                      <LockIcon size={20} />
                      <input
                        type="text"
                        name="otp"
                        className="form-input"
                        placeholder="Enter the OTP"
                        value={formData.otp}
                        onChange={handleInputChange}
                        maxLength={6}
                      />
                    </div>
                  </div>

                  <div className="form-footer" style={{ marginBottom: "8px" }}>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={handleSendOtp}
                      disabled={otpSending || !formData.username}
                    >
                      {otpSending
                        ? "Sending OTP..."
                        : otpSent
                        ? "Resend OTP"
                        : "Send OTP"}
                    </button>
                  </div>
                </>
              )}

              {error && <div className="error-message">{error}</div>}

              {isPasswordMode && (
                <div className="form-footer">
                  <label className="remember-me">
                    <input type="checkbox" />
                    <span>Remember me</span>
                  </label>
                  <a href="#" className="forgot-password">
                    Forgot Password?
                  </a>
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading
                  ? isLogin
                    ? isPasswordMode
                      ? "Signing in..."
                      : "Verifying OTP..."
                    : "Signing up..."
                  : isLogin
                  ? isPasswordMode
                    ? "Login"
                    : "Verify & Login"
                  : "Sign Up"}
              </button>
            </form>

            {/* Toggle Section (signup disabled) */}
            <div className="auth-toggle">
              <p>
                {/* {isLogin ? "Don't have an account?" : 'Already have an account?'} */}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="toggle-btn"
                >
                  {/* {isLogin ? 'Sign Up' : 'Login'} */}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reusable Footer Component */}
      <Footer />
    </div>
  );
}
