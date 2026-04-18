import { Fragment, useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS, BASE_URL } from "../../utils/apiPaths";
import { BUILTIN_ATS_DOMAINS } from "../../utils/builtinAtsDomains";

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
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${cls}`}>{n}</span>
  );
}

function BreakdownBar({ label, value, max = 100 }) {
  const v = Math.min(max, Math.max(0, Number(value) || 0));
  const pct = max ? Math.round((v / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span>
        <span className="tabular-nums">{v}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function mergeDomainSlugs(apiDomains) {
  const set = new Set(BUILTIN_ATS_DOMAINS.map((d) => d.slug));
  for (const row of apiDomains || []) {
    if (row?.slug) set.add(row.slug);
  }
  return [...set].sort();
}

export default function AdminAtsLogs() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [domain, setDomain] = useState("");
  const [domainSlugs, setDomainSlugs] = useState(() =>
    BUILTIN_ATS_DOMAINS.map((d) => d.slug)
  );
  const [userId, setUserId] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(userId), 400);
    return () => clearTimeout(t);
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const base = BASE_URL.replace(/\/?$/, "");
        const res = await fetch(`${base}${API_PATHS.ATS.DOMAINS}`, {
          credentials: "include",
        });
        const body = await res.json().catch(() => ({}));
        if (!cancelled) {
          setDomainSlugs(mergeDomainSlugs(body.domains));
        }
      } catch {
        if (!cancelled) setDomainSlugs(mergeDomainSlugs([]));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const { data } = await axiosInstance.get(API_PATHS.ADMIN.ATS_LOGS, {
        params: {
          page,
          limit,
          domain: domain || undefined,
          userId: debounced.trim() || undefined,
        },
      });
      setRows(data.data || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }, [page, limit, domain, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">ATS Logs</h1>
      {err && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 flex justify-between items-center">
          <p className="text-sm text-red-300">{err}</p>
          <button type="button" className="text-sm font-semibold text-red-400 underline" onClick={load}>
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <select
          value={domain}
          onChange={(e) => {
            setDomain(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
        >
          <option value="">All domains</option>
          {domainSlugs.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <input
          placeholder="Filter by user ID…"
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-600 bg-gray-900 px-4 py-2 text-sm font-mono text-white placeholder-gray-500 flex-1 min-w-[200px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="rounded-xl border border-gray-700 bg-gray-800 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[880px]">
            <thead className="bg-gray-700/50 text-gray-400 text-xs uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 w-10" />
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3">Domain</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Label</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16">
                    <div className="space-y-2 animate-pulse">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-10 bg-gray-700/50 rounded" />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((log, i) => {
                  const expanded = openId === log._id;
                  const u = log.userId;
                  return (
                    <Fragment key={log._id}>
                      <tr
                        className="border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer text-white"
                        onClick={() => setOpenId(expanded ? null : log._id)}
                      >
                        <td className="px-4 py-3 text-gray-400">
                          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </td>
                        <td className="px-4 py-3 text-gray-400">{(page - 1) * limit + i + 1}</td>
                        <td className="px-4 py-3">
                          {u ? (
                            <>
                              <div className="font-medium">{u.name}</div>
                              <div className="text-xs text-gray-500">{u.email}</div>
                            </>
                          ) : (
                            <span className="text-gray-500 italic">Anonymous</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-300 max-w-[180px] truncate">{log.fileName}</td>
                        <td className="px-4 py-3 text-gray-400">{log.domain}</td>
                        <td className="px-4 py-3">{scoreBadge(log.overallScore)}</td>
                        <td className="px-4 py-3 text-gray-400">{log.label}</td>
                        <td className="px-4 py-3 text-gray-400">{fmtDate(log.createdAt)}</td>
                      </tr>
                      {expanded && (
                        <tr className="bg-gray-900/50">
                          <td colSpan={8} className="px-4 py-6">
                            <div className="max-w-3xl space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {log.breakdown &&
                                  Object.entries(log.breakdown).map(([k, v]) => (
                                    <BreakdownBar
                                      key={k}
                                      label={k}
                                      value={v}
                                      max={
                                        k === "keywords"
                                          ? 35
                                          : k === "contact"
                                            ? 10
                                            : k === "experience"
                                              ? 20
                                              : k === "structure"
                                                ? 15
                                                : k === "formatting"
                                                  ? 10
                                                  : k === "skills"
                                                    ? 10
                                                    : 100
                                      }
                                    />
                                  ))}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-500 mb-2">Matched keywords</p>
                                <div className="flex flex-wrap gap-1">
                                  {(log.matchedKeywords || []).map((kw) => (
                                    <span
                                      key={kw}
                                      className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400"
                                    >
                                      {kw}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-500 mb-2">Missing keywords</p>
                                <div className="flex flex-wrap gap-1">
                                  {(log.missingKeywords || []).map((kw) => (
                                    <span
                                      key={kw}
                                      className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400"
                                    >
                                      {kw}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-500 mb-2">Suggestions</p>
                                <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                                  {(log.suggestions || []).map((s, idx) => (
                                    <li key={idx}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
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
    </div>
  );
}
