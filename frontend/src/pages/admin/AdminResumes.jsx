import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Trash2 } from "lucide-react";
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

export default function AdminResumes() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [userFilter, setUserFilter] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [delId, setDelId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(userFilter), 400);
    return () => clearTimeout(t);
  }, [userFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const { data } = await axiosInstance.get(API_PATHS.ADMIN.RESUMES, {
        params: { page, limit, userId: debounced.trim() || undefined },
      });
      setRows(data.data || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load resumes");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmDelete = async () => {
    if (!delId) return;
    try {
      await axiosInstance.delete(API_PATHS.ADMIN.RESUME(delId));
      toast.success("Resume deleted");
      setDelId(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Resumes</h1>
      {err && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 flex justify-between items-center">
          <p className="text-sm text-red-300">{err}</p>
          <button type="button" className="text-sm font-semibold text-red-400 underline" onClick={load}>
            Retry
          </button>
        </div>
      )}
      <input
        placeholder="Filter by user ID (Mongo ObjectId)…"
        value={userFilter}
        onChange={(e) => {
          setUserFilter(e.target.value);
          setPage(1);
        }}
        className="w-full max-w-xl rounded-lg border border-gray-600 bg-gray-900 px-4 py-2.5 text-sm font-mono text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
      />

      <div className="rounded-xl border border-gray-700 bg-gray-800 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[900px]">
            <thead className="bg-gray-700/50 text-gray-400 text-xs uppercase tracking-wider sticky top-0">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Template</th>
                <th className="px-4 py-3">Downloads</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3">Created</th>
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
                rows.map((r, i) => (
                  <tr key={r._id} className="border-b border-gray-700/50 hover:bg-gray-700/30 text-white">
                    <td className="px-4 py-3 text-gray-400">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.userId?.name || "—"}</div>
                      <div className="text-xs text-gray-500">{r.userId?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{r.template?.theme || "—"}</td>
                    <td className="px-4 py-3 tabular-nums text-gray-300">
                      {r.downloadCount?.toLocaleString?.() ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          r.isCompleted
                            ? "bg-green-500/20 text-green-400 rounded-full px-2 py-0.5 text-xs"
                            : "bg-yellow-500/20 text-yellow-400 rounded-full px-2 py-0.5 text-xs"
                        }
                      >
                        {r.isCompleted ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{fmtDate(r.createdAt)}</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        type="button"
                        className="inline-flex p-2 rounded-lg hover:bg-gray-700 text-gray-300"
                        onClick={() => navigate(`/admin/resumes/${r._id}`)}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        type="button"
                        className="inline-flex p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                        onClick={() => setDelId(r._id)}
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
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-600 bg-gray-900 text-gray-300 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-gray-300">
              {page} / {pages}
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

      {delId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setDelId(null)}
        >
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <p className="text-white font-medium">Delete this resume?</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-700 text-gray-300 font-medium text-sm"
                onClick={() => setDelId(null)}
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
