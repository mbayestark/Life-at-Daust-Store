import React, { createContext, useContext, useState, useCallback } from "react";

const SESSION_KEY = "daust_user_session";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((userData) => {
    const s = {
      userId: userData.userId,
      name: userData.name,
      email: userData.email,
      referral_code: userData.referral_code,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, login, logout, isLoggedIn: !!session }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
