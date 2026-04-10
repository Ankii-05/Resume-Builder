import axios from "axios";
import { BASE_URL } from "./apiPaths";

function persistTokenFromJwt(token) {
  if (!token || typeof token !== "string") return;
  localStorage.setItem("token", token);
  try {
    const part = token.split(".")[1];
    if (!part) return;
    let b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    if (pad) b64 += "=".repeat(4 - pad);
    const json = JSON.parse(atob(b64));
    if (json.role) localStorage.setItem("role", json.role);
  } catch {
    /* ignore malformed payload */
  }
}

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 25000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("token");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    const newTok =
      response.headers["x-new-token"] || response.headers["X-New-Token"];
    if (newTok) {
      persistTokenFromJwt(newTok);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        const reqUrl = error.config?.url || "";
        const isLoginOrRegister =
          reqUrl.includes("/api/auth/login") ||
          reqUrl.includes("/api/auth/register");
        if (!isLoginOrRegister && !reqUrl.includes("/logout")) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          const path = window.location.pathname || "";
          if (path.startsWith("/admin") && !path.startsWith("/admin/login")) {
            window.location.href = "/admin/login";
          } else {
            window.location.href = "/login";
          }
        }
      } else if (error.response.status === 500) {
        console.error("Server error. Please try again later.");
      }
    } else if (error.code === "ECONNABORTED") {
      console.error("Request timeout. Please try again.");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
