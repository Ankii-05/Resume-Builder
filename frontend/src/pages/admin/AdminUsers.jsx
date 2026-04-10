import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", role: "user", password: "" });
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [showCreatePw, setShowCreatePw] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const { data } = await axiosInstance.get(API_PATHS.ADMIN.USERS, {
        params: { page, limit, search: debounced },
      });
      setRows(data.data || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (u) => {
    setForm({
      name: u.name || "",
      email: u.email || "",
      role: u.role || "user",
      password: "",
    });
    setEditUser(u);
  };

  const saveEdit = async () => {
    if (!editUser) return;
    try {
      await axiosInstance.put(API_PATHS.ADMIN.USER(editUser._id), {
        name: form.name,
        email: form.email,
        role: form.role,
        password: form.password || undefined,
      });
      toast.success("User updated");
      setEditUser(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Update failed");
    }
  };

  const submitCreate = async () => {
    if (!createForm.name.trim() || !createForm.email.trim() || createForm.password.length < 8) {
      toast.error("Name, email, and password (8+ chars) are required");
      return;
    }
    try {
      await axiosInstance.post(API_PATHS.ADMIN.USER_CREATE, {
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: "user",
      });
      toast.success("User created and welcome email sent");
      setCreateOpen(false);
      setCreateForm({ name: "", email: "", password: "", role: "user" });
      setPage(1);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Create failed");
    }
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;
    try {
      await axiosInstance.delete(API_PATHS.ADMIN.USER(deleteUser._id));
      toast.success("User deleted");
      setDeleteUser(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white mb-0">Users</h1>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium transition-colors"
        >
          <Plus size={18} />
          Create User
        </button>
      </div>

      {err && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 flex justify-between items-center gap-3">
          <p className="text-sm text-red-300">{err}</p>
          <button type="button" className="text-sm font-semibold text-red-400 underline" onClick={load}>
            Retry
          </button>
        </div>
      )}

      <input
        type="search"
        placeholder="Search name or email…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="w-full max-w-md rounded-lg border border-gray-600 bg-gray-900 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
      />

      <div className="rounded-xl border border-gray-700 bg-gray-800 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[720px]">
            <thead className="bg-gray-700/50 text-gray-400 text-xs uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Resumes</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16">
                    <div className="space-y-2 animate-pulse">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-10 bg-gray-700/50 rounded" />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((u, i) => (
                  <tr
                    key={u._id}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors text-white"
                  >
                    <td className="px-4 py-3 text-gray-400">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-gray-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          u.role === "admin"
                            ? "bg-green-500/20 text-green-400 rounded-full px-2 py-0.5 text-xs"
                            : "bg-gray-600/40 text-gray-300 rounded-full px-2 py-0.5 text-xs"
                        }
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-300">
                      {u.resumesCount?.toLocaleString?.() ?? 0}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{fmtDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        type="button"
                        className="inline-flex p-2 rounded-lg hover:bg-gray-700 text-gray-300"
                        onClick={() => navigate(`/admin/users/${u._id}`)}
                        aria-label="View"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        type="button"
                        className="inline-flex p-2 rounded-lg hover:bg-gray-700 text-gray-300"
                        onClick={() => openEdit(u)}
                        aria-label="Edit"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        type="button"
                        className="inline-flex p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                        onClick={() => setDeleteUser(u)}
                        aria-label="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-700 text-sm text-gray-400">
          <span>
            Total: <strong className="text-white">{total.toLocaleString()}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-600 bg-gray-900 text-gray-300 disabled:opacity-40"
            >
              Prev
            </button>
            <span>
              Page {page} / {pages}
            </span>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-600 bg-gray-900 text-gray-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          onClick={(e) => e.target === e.currentTarget && setCreateOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setCreateOpen(false)}
        >
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 relative">
            <button
              type="button"
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:bg-gray-700"
              onClick={() => setCreateOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-lg font-bold text-white pr-8">Create user</h3>
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Full name
              </label>
              <input
                className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              />
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              />
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showCreatePw ? "text" : "password"}
                  className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 pr-10 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:bg-gray-700"
                  onClick={() => setShowCreatePw((s) => !s)}
                  aria-label={showCreatePw ? "Hide password" : "Show password"}
                >
                  {showCreatePw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Role
              </label>
              <select
                className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                value="user"
                disabled
              >
                <option value="user">User</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-700 text-gray-300 font-medium text-sm"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm"
                onClick={submitCreate}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {editUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          onClick={(e) => e.target === e.currentTarget && setEditUser(null)}
          onKeyDown={(e) => e.key === "Escape" && setEditUser(null)}
        >
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Edit user</h3>
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-400">Name</label>
              <input
                className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <label className="block text-xs font-semibold text-gray-400">Email</label>
              <input
                className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <label className="block text-xs font-semibold text-gray-400">Role</label>
              <select
                className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
              <label className="block text-xs font-semibold text-gray-400">New password (optional)</label>
              <input
                type="password"
                className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Leave blank to keep current"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-700 text-gray-300 font-medium text-sm"
                onClick={() => setEditUser(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm"
                onClick={saveEdit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setDeleteUser(null)}
          onKeyDown={(e) => e.key === "Escape" && setDeleteUser(null)}
        >
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <p className="text-white font-medium">
              Delete &quot;{deleteUser.name}&quot; and all their resumes?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-700 text-gray-300 font-medium text-sm"
                onClick={() => setDeleteUser(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
