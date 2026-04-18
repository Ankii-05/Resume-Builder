import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { BASE_URL, API_PATHS } from "../utils/apiPaths";

function roleFromToken(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    let b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    if (pad) b64 += "=".repeat(4 - pad);
    const payload = JSON.parse(atob(b64));
    return payload.role || null;
  } catch {
    return null;
  }
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${BASE_URL.replace(/\/?$/, "")}${API_PATHS.AUTH.LOGIN}`,
        { email, password },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );

      const token = data.token;
      const roleFromApi = typeof data.role === "string" ? data.role.toLowerCase() : "";
      const roleFromJwt = roleFromToken(token)?.toLowerCase() || "";
      const isAdmin = roleFromApi === "admin" || roleFromJwt === "admin";

      if (!isAdmin) {
        toast.error(
          "This account is not an admin. Set role to \"admin\" for your user in the database, then sign in again."
        );
        return;
      }

      if (token) {
        localStorage.setItem("token", token);
      }
      localStorage.setItem("role", "admin");
      toast.success("Welcome, admin");
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800/80 p-8 shadow-xl">
        <h1 className="text-xl font-bold text-white mb-1">ResumeXpert Admin</h1>
        <p className="text-sm text-slate-400 mb-8">
          Sign in with an account that has <span className="text-slate-300">role: admin</span> in the database.
        </p>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors"
          >
            {loading ? "Signing in…" : "Login as Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
