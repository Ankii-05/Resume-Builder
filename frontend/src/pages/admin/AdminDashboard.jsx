import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Users, Download, ClipboardCheck, FileEdit, FileCheck } from "lucide-react";
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

function StatCard({ icon: Icon, label, value, loading }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
          <Icon size={22} />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</span>
      </div>
      {loading ? (
        <div className="h-9 w-24 bg-gray-700 rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-white tabular-nums">{value?.toLocaleString?.() ?? value}</p>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [recentAts, setRecentAts] = useState([]);
  const [recentResumes, setRecentResumes] = useState([]);
  const [domainUsage, setDomainUsage] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const [statsRes, monthlyRes, atsRes, resRes, domRes] = await Promise.all([
        axiosInstance.get(API_PATHS.ADMIN.STATS),
        axiosInstance.get(API_PATHS.ADMIN.STATS_MONTHLY),
        axiosInstance.get(API_PATHS.ADMIN.STATS_RECENT_ATS, { params: { limit: 5 } }),
        axiosInstance.get(API_PATHS.ADMIN.STATS_RECENT_RESUMES, { params: { limit: 5 } }),
        axiosInstance.get(API_PATHS.ADMIN.STATS_DOMAIN_USAGE),
      ]);
      setData(statsRes.data);
      setMonthly(monthlyRes.data);
      setRecentAts(atsRes.data?.data || []);
      setRecentResumes(resRes.data?.data || []);
      setDomainUsage((domRes.data?.data || []).slice(0, 5));
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const chartData =
    data?.userGrowth?.map((g) => ({
      name: g.date.slice(5),
      full: g.date,
      count: g.count,
    })) ?? [];

  const barData = domainUsage.map((d) => ({
    name: String(d.domain || "—").replace(/_/g, " "),
    count: d.count,
  }));

  const mostUsedLabel = monthly?.mostUsedDomain
    ? String(monthly.mostUsedDomain).replace(/_/g, " ")
    : "—";

  if (err) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-red-300">{err}</p>
        <button
          type="button"
          onClick={load}
          className="text-sm font-semibold text-red-400 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Total Users" value={data?.totalUsers} loading={loading} />
        <StatCard icon={Download} label="Total Downloads" value={data?.totalDownloads} loading={loading} />
        <StatCard icon={ClipboardCheck} label="ATS Checks" value={data?.totalAtsChecks} loading={loading} />
        <StatCard icon={FileEdit} label="Active Resumes" value={data?.activeResumes} loading={loading} />
        <StatCard icon={FileCheck} label="Completed Resumes" value={data?.completedResumes} loading={loading} />
      </div>

      <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
        <h2 className="text-lg font-bold text-white mb-4">User growth (last 30 days)</h2>
        {loading ? (
          <div className="h-72 w-full bg-gray-700/50 rounded-xl animate-pulse" />
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} stroke="#6b7280" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #374151",
                    background: "#1f2937",
                    color: "#fff",
                  }}
                  labelFormatter={(_, p) => p?.[0]?.payload?.full}
                />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ClipboardCheck}
          label="ATS checks this month"
          value={monthly?.atsChecksThisMonth}
          loading={loading}
        />
        <StatCard
          icon={Download}
          label="PDF downloads this month"
          value={monthly?.pdfDownloadsThisMonth}
          loading={loading}
        />
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <ClipboardCheck size={22} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Average ATS score
            </span>
          </div>
          {loading ? (
            <div className="h-9 w-24 bg-gray-700 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-white tabular-nums">
              {Math.round(Number(monthly?.avgAtsScore) || 0)}/100
            </p>
          )}
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <FileCheck size={22} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Most used domain
            </span>
          </div>
          {loading ? (
            <div className="h-9 w-32 bg-gray-700 rounded animate-pulse" />
          ) : (
            <p className="text-lg font-bold text-white capitalize">{mostUsedLabel}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Recent ATS checks</h2>
            <Link
              to="/admin/ats-logs"
              className="text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-700/50 text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-3 py-2">Domain</th>
                  <th className="text-left px-3 py-2">Score</th>
                  <th className="text-left px-3 py-2">Label</th>
                  <th className="text-left px-3 py-2">Date</th>
                  <th className="text-left px-3 py-2">User</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      Loading…
                    </td>
                  </tr>
                ) : recentAts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No checks yet
                    </td>
                  </tr>
                ) : (
                  recentAts.map((log) => (
                    <tr
                      key={log._id}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 text-white"
                    >
                      <td className="px-3 py-2 text-gray-300">{log.domain}</td>
                      <td className="px-3 py-2 tabular-nums">{log.overallScore}</td>
                      <td className="px-3 py-2 text-gray-400">{log.label}</td>
                      <td className="px-3 py-2 text-gray-400">{fmtDate(log.createdAt)}</td>
                      <td className="px-3 py-2 text-gray-400 text-xs">
                        {log.userId?.email || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
          <h2 className="text-lg font-bold text-white mb-4">Top domains used</h2>
          {loading ? (
            <div className="h-64 bg-gray-700/50 rounded animate-pulse" />
          ) : barData.length === 0 ? (
            <p className="text-gray-500 text-sm">No ATS data yet</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={barData}
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} stroke="#6b7280" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    stroke="#6b7280"
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #374151",
                      background: "#1f2937",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Recent resumes</h2>
            <Link
              to="/admin/resumes"
              className="text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead className="bg-gray-700/50 text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-3 py-2">Title</th>
                  <th className="text-left px-3 py-2">Owner</th>
                  <th className="text-left px-3 py-2">Downloads</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      Loading…
                    </td>
                  </tr>
                ) : recentResumes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No resumes yet
                    </td>
                  </tr>
                ) : (
                  recentResumes.map((r) => (
                    <tr
                      key={r._id}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 text-white"
                    >
                      <td className="px-3 py-2 font-medium truncate max-w-[140px]">{r.title}</td>
                      <td className="px-3 py-2 text-gray-400 text-xs">
                        {r.userId?.email || "—"}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-gray-300">
                        {r.downloadCount ?? 0}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            r.isCompleted
                              ? "bg-green-500/20 text-green-400 rounded-full px-2 py-0.5 text-xs"
                              : "bg-yellow-500/20 text-yellow-400 rounded-full px-2 py-0.5 text-xs"
                          }
                        >
                          {r.isCompleted ? "Completed" : "Active"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-400">{fmtDate(r.updatedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
          <h2 className="text-lg font-bold text-white mb-4">Platform summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-700 bg-gray-900/80 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total users</p>
              <p className="text-xl font-bold text-white tabular-nums">
                {loading ? "—" : data?.totalUsers?.toLocaleString?.() ?? 0}
              </p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-900/80 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total resumes</p>
              <p className="text-xl font-bold text-white tabular-nums">
                {loading ? "—" : data?.totalResumes?.toLocaleString?.() ?? 0}
              </p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-900/80 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Completed resumes</p>
              <p className="text-xl font-bold text-white tabular-nums">
                {loading ? "—" : data?.completedResumes?.toLocaleString?.() ?? 0}
              </p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-900/80 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total ATS checks</p>
              <p className="text-xl font-bold text-white tabular-nums">
                {loading ? "—" : data?.totalAtsChecks?.toLocaleString?.() ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
