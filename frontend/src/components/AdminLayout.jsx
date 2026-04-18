import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  LogOut,
  Layers,
} from "lucide-react";
import { useContext } from "react";
import { UserContext } from "../context/userContext";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

const nav = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/resumes", label: "Resumes", icon: FileText },
  { to: "/admin/ats-domains", label: "ATS Domains", icon: Layers },
  { to: "/admin/ats-logs", label: "ATS Logs", icon: ClipboardList },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { logout } = useContext(UserContext);
  const [adminUser, setAdminUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axiosInstance.get(API_PATHS.AUTH.VERIFY);
        if (cancelled) return;
        if (!data?.success || !data?.user || data.user.role !== "admin") {
          navigate("/admin/login", { replace: true });
          return;
        }
        setAdminUser(data.user);
      } catch {
        if (!cancelled) navigate("/admin/login", { replace: true });
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem("role");
    navigate("/admin/login", { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-gray-400 hover:bg-gray-700 hover:text-white bg-transparent"
    }`;

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 ml-0">
        <div className="h-10 w-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-900">
      <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 flex flex-col text-white">
        <div className="h-16 px-4 flex items-center border-b border-gray-800">
          <span className="font-bold text-lg text-white tracking-tight">ResumeXpert</span>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800 space-y-3">
          <div className="px-2 text-xs text-gray-400">
            <div className="text-white font-medium truncate">{adminUser?.name || "Admin"}</div>
            <div className="truncate">{adminUser?.email || ""}</div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 ml-64">
        <main className="flex-1 overflow-auto pt-8 px-8 pb-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
