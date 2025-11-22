// src/context/AuthContext.jsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthAPI } from "../api/endpoints";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [access, setAccess] = useState(() => localStorage.getItem("access"));
  const [refresh, setRefresh] = useState(() => localStorage.getItem("refresh"));
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const navigate = useNavigate();
  const isAuthed = !!access;

  const login = async ({ username, password }) => {
    // Call backend login API
    const data = await AuthAPI.login(username, password);
    const a = data?.access;
    const r = data?.refresh;
    const u = data?.user;

    if (!a || !r) {
      throw new Error("Invalid credentials or token payload");
    }

    // Store tokens
    localStorage.setItem("access", a);
    localStorage.setItem("refresh", r);
    setAccess(a);
    setRefresh(r);

    // Store user data (includes role, is_staff, etc.)
    if (u) {
      localStorage.setItem("user", JSON.stringify(u));
      setUser(u);
    }

    // 🔴 IMPORTANT: return full data so caller can use user.role
    return data;
  };

  const logout = () => {
    // Clear tokens
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    // Clear stored user + project context
    localStorage.removeItem("user");
    localStorage.removeItem("MY_SCOPE");
    localStorage.removeItem("ACTIVE_PROJECT_ID");
    localStorage.removeItem("PROJECT_ID");

    setUser(null);
    setAccess(null);
    setRefresh(null);

    navigate("/login", { replace: true });
  };

  const value = useMemo(
    () => ({
      access,
      refresh,
      user,
      isAuthed,
      login,
      logout,
    }),
    [access, refresh, user, isAuthed]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
