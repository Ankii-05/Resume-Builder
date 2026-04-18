import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
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

function scoreBadge(score) {
  const n = Number(score);
  let cls = "bg-gray-600/40 text-gray-300";
  if (n >= 80) cls = "bg-green-500/20 text-green-400";
  else if (n >= 60) cls = "bg-yellow-500/20 text-yellow-400";
  else if (n >= 40) cls = "bg-orange-500/20 text-orange-400";
  else cls = "bg-red-500/20 text-red-400";
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${cls}`}>
      {n}
    </span>
  );
}

export default function AdminUserDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const { data: d } = await axiosInstance.get(API_PATHS.ADMIN.USER(id));
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.message || "Failed to load user");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-gray-700/50 rounded w-1/3" />
        <div className="h-40 bg-gray-700/50 rounded" />
      </div>
    );
  }
  if (err || !data?.user) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
        {err || "Not found"}
      </div>
    );
  }

  const { user, resumes = [], atsLogs = [] } = data;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link to="/admin/users" className="text-sm font-semibold text-blue-400 hover:text-blue-300">
          ← Users
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-white">{user.name}</h1>

      <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Profile</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium text-white">{user.email}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Role</dt>
            <dd>
              <span
                className={
                  user.role === "admin"
                    ? "inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400"
                    : "inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-600/40 text-gray-300"
                }
              >
                {user.role}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Joined</dt>
            <dd className="font-medium text-white">{fmtDate(user.createdAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-gray-700 bg-gray-800 shadow-lg overflow-hidden">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-6 pt-6">Resumes</h2>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-700/50 text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Title</th>
                <th className="px-6 py-3 text-left">Template</th>
                <th className="px-6 py-3 text-left">Updated</th>
                <th className="px-6 py-3 text-left">Downloads</th>
                <th className="px-6 py-3 text-left">Completed</th>
              </tr>
            </thead>
            <tbody>
              {resumes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No resumes
                  </td>
                </tr>
              ) : (
                resumes.map((r) => (
                  <tr key={r._id} className="border-t border-gray-700/50 hover:bg-gray-700/30 text-white">
                    <td className="px-6 py-3 font-medium">{r.title}</td>
                    <td className="px-6 py-3 text-gray-400">{r.template?.theme || "—"}</td>
                    <td className="px-6 py-3 text-gray-400">{fmtDate(r.updatedAt)}</td>
                    <td className="px-6 py-3 tabular-nums text-gray-300">
                      {r.downloadCount?.toLocaleString?.() ?? 0}
                    </td>
                    <td className="px-6 py-3">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-gray-700 bg-gray-800 shadow-lg overflow-hidden">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-6 pt-6">
          ATS submissions
        </h2>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-700/50 text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">File</th>
                <th className="px-6 py-3 text-left">Domain</th>
                <th className="px-6 py-3 text-left">Score</th>
                <th className="px-6 py-3 text-left">Label</th>
                <th className="px-6 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {atsLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No ATS logs for this user
                  </td>
                </tr>
              ) : (
                atsLogs.map((log) => (
                  <tr key={log._id} className="border-t border-gray-700/50 hover:bg-gray-700/30 text-white">
                    <td className="px-6 py-3 text-gray-200">{log.fileName}</td>
                    <td className="px-6 py-3 text-gray-400">{log.domain}</td>
                    <td className="px-6 py-3">{scoreBadge(log.overallScore)}</td>
                    <td className="px-6 py-3 text-gray-400">{log.label}</td>
                    <td className="px-6 py-3 text-gray-400">{fmtDate(log.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
