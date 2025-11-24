import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../Header/Navbar';
import Footer from '../Footer/Footer';
import profileImg from '../../assets/profile.jpg';
import api from "../../api/axiosInstance";
import './Auth.css';

// SVG Icons for form inputs
const UserIcon = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const MailIcon = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

export default function Auth() {
  // Authentication logic from old code
const { login, user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from || "/dashboard";

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

// const handleSubmit = async (e) => {
//   e.preventDefault();
//   setError("");
//   setLoading(true);

//   try {
//     if (isLogin) {
//       // 1) Normal login – this will set access/refresh tokens
//       await login({
//         username: formData.username,
//         password: formData.password,
//       });

//       // 2) Immediately after successful login, fetch my-scope
//       try {
//         const scopeRes = await api.get("/client/my-scope/", {
//           params: { include_units: true },
//         });

//         const scopeData = scopeRes.data || {};

//         // 3) Store full scope in localStorage
//         localStorage.setItem("MY_SCOPE", JSON.stringify(scopeData));

//         // 4) (Optional but very useful) store first project id as active
//         if (scopeData.projects && scopeData.projects.length > 0) {
//           const firstProjectId = scopeData.projects[0].id;
//           if (firstProjectId) {
//             localStorage.setItem("ACTIVE_PROJECT_ID", String(firstProjectId));
//             localStorage.setItem("PROJECT_ID", String(firstProjectId));
//           }
//         }
//       } catch (scopeErr) {
//         console.error("Failed to fetch /client/my-scope/:", scopeErr);
//         // Don’t block login if this fails
//       }

//           const userRole = user?.role || "SALES";
//       const userRole = user?.role || "SALES";

//       if (userRole === "SALES") {
//         nav("/leads", { replace: true });
//       } else {
//         nav(from, { replace: true });
//       }
//     } else {
//       setError("Signup is currently disabled. Please login.");
//     }
//   } catch (err) {
//     setError("Invalid username or password");
//   } finally {
//     setLoading(false);
//   }
// };


const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    if (isLogin) {
      // 1) Call login and GET the response with user + tokens
      const data = await login({
        username: formData.username,
        password: formData.password,
      });

      // 2) Extract role from login response
      const userRole = data?.user?.role || "SALES";

      // 3) Fetch my-scope (non-blocking for navigation)
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

      // 4) Decide redirect based on ROLE from login response
      if (userRole === "SALES") {
        nav("/dashboard", { replace: true });
      } else {
        // for ADMIN or other roles, go to previous or default page
        nav(from, { replace: true });
      }
    } else {
      setError("Signup is currently disabled. Please login.");
    }
  } catch (err) {
    console.error("Login failed:", err);
    setError("Invalid username or password");
  } finally {
    setLoading(false);
  }
};


  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ username: '', password: '', name: '' });
  };

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

              <div className="form-group">
                <label className="form-label">
                  {isLogin ? "Username" : "Email Address"}
                </label>
                <div className="input-wrapper">
                  <MailIcon size={20} />
                  <input
                    type="text"
                    name="username"
                    className="form-input"
                    placeholder={
                      isLogin ? "Enter your username" : "Enter your email"
                    }
                    value={formData.username}
                    onChange={handleInputChange}
                    autoFocus
                    required
                  />
                </div>
              </div>

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

              {error && <div className="error-message">{error}</div>}

              {isLogin && (
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
                    ? "Signing in..."
                    : "Signing up..."
                  : isLogin
                  ? "Login"
                  : "Sign Up"}
              </button>
            </form>

            {/* Toggle Section */}
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
