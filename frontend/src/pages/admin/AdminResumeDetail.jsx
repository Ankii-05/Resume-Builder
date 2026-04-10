import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{title}</h3>
      <div className="text-sm text-gray-200 space-y-2">{children}</div>
    </div>
  );
}

export default function AdminResumeDetail() {
  const { id } = useParams();
  const [r, setR] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const { data } = await axiosInstance.get(API_PATHS.ADMIN.RESUME(id));
        if (!cancelled) setR(data);
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="h-40 bg-gray-700/50 rounded-xl animate-pulse" />;
  }
  if (err || !r) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">{err}</div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/resumes" className="text-sm font-semibold text-blue-400 hover:text-blue-300">
        ← Resumes
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-white">{r.title}</h1>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300">
          downloads: {r.downloadCount?.toLocaleString?.() ?? 0}
        </span>
        <span className="text-sm text-gray-400">Created {fmtDate(r.createdAt)}</span>
      </div>
      {r.userId && (
        <p className="text-sm text-gray-400">
          Owner: <strong className="text-white">{r.userId.name}</strong> ({r.userId.email})
        </p>
      )}

      <Section title="Template">
        <pre className="text-xs bg-gray-900 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap text-gray-300 border border-gray-700">
          {JSON.stringify(r.template, null, 2)}
        </pre>
      </Section>

      <Section title="Profile">
        <pre className="text-xs bg-gray-900 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap text-gray-300 border border-gray-700">
          {JSON.stringify(r.profileInfo, null, 2)}
        </pre>
      </Section>

      <Section title="Contact">
        <pre className="text-xs bg-gray-900 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap text-gray-300 border border-gray-700">
          {JSON.stringify(r.contactInfo, null, 2)}
        </pre>
      </Section>

      <Section title="Experience">
        <pre className="text-xs bg-gray-900 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap text-gray-300 border border-gray-700">
          {JSON.stringify(r.workExperience, null, 2)}
        </pre>
      </Section>

      <Section title="Education">
        <pre className="text-xs bg-gray-900 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap text-gray-300 border border-gray-700">
          {JSON.stringify(r.education, null, 2)}
        </pre>
      </Section>

      <Section title="Skills">
        <pre className="text-xs bg-gray-900 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap text-gray-300 border border-gray-700">
          {JSON.stringify(r.skills, null, 2)}
        </pre>
      </Section>

      <Section title="Projects">
        <pre className="text-xs bg-gray-900 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap text-gray-300 border border-gray-700">
          {JSON.stringify(r.projects, null, 2)}
        </pre>
      </Section>

      <Section title="Certifications & languages">
        <pre className="text-xs bg-gray-900 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap text-gray-300 border border-gray-700">
          {JSON.stringify({ certifications: r.certifications, languages: r.languages, interests: r.interests }, null, 2)}
        </pre>
      </Section>
    </div>
  );
}
