import React, { createContext, useContext, useState, useEffect } from "react";
import { api, setAccessToken } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      try {
        const refreshRes = await api.post("/auth/refresh");
        if (refreshRes.data?.accessToken) {
          setAccessToken(refreshRes.data.accessToken);
        }
      } catch (e) {}

      const res = await api.get("/auth/me");
      if (res.data?.success && res.data.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      setUser(null);
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data?.success) {
      setUser(res.data.user);
      if (res.data.accessToken) {
        setAccessToken(res.data.accessToken);
      }
    }
    return res.data;
  };

  const register = async (userData) => {
    const res = await api.post("/auth/register", userData);
    if (res.data?.success) {
      setUser(res.data.user);
      if (res.data.accessToken) {
        setAccessToken(res.data.accessToken);
      }
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser: fetchCurrentUser,
        isAuthenticated: !!user,
        isStudent: user?.role === "student",
        isClubAdmin:
          user?.role === "club_admin" || user?.role === "super_admin",
        isVolunteer: user?.role === "volunteer" || user?.role === "super_admin",
        isSuperAdmin: user?.role === "super_admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
