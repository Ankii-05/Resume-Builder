import React, { createContext, useState, useEffect, useCallback } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS, BASE_URL } from "../utils/apiPaths";

export const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearUser = useCallback(() => {
    setUser(null);
    localStorage.removeItem("token");
  }, []);

  useEffect(() => {
    const accessToken = localStorage.getItem("token");
    if (!accessToken) {
      setLoading(false);
      return;
    }
    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
        setUser(response.data);
      } catch (error) {
        console.error("User not authenticated", error);
        clearUser();
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [clearUser]);

  const updateUser = useCallback((userData) => {
    if (!userData) return;
    if (userData.token) {
      localStorage.setItem("token", userData.token);
    }
    const { token: _t, ...rest } = userData;
    setUser(rest);
    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await axiosInstance.post(API_PATHS.AUTH.LOGOUT);
    } catch {
      /* ignore */
    }
    clearUser();
  }, [clearUser]);

  const loginWithGoogle = useCallback(() => {
    const base = BASE_URL.replace(/\/?$/, "");
    window.location.href = `${base}${API_PATHS.AUTH.GOOGLE}`;
  }, []);

  return (
    <UserContext.Provider
      value={{ user, loading, updateUser, clearUser, logout, loginWithGoogle }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
