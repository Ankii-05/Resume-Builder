import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import UploadZone from "../components/ats/UploadZone";
import DomainSelector from "../components/ats/DomainSelector";
import ScoreCard from "../components/ats/ScoreCard";
import SectionBreakdown from "../components/ats/SectionBreakdown";
import KeywordCloud from "../components/ats/KeywordCloud";
import SuggestionList from "../components/ats/SuggestionList";
import AnalysisLoader from "../components/ats/AnalysisLoader";
import { dashboardStyles } from "../assets/dummystyle";
import { BASE_URL, API_PATHS } from "../utils/apiPaths";
import { BUILTIN_ATS_DOMAINS } from "../utils/builtinAtsDomains";

function apiUrl(path) {
  const base = BASE_URL.replace(/\/?$/, "");
  return `${base}${path}`;
}

function mergeDomains(apiRows) {
  const bySlug = new Map();
  for (const d of BUILTIN_ATS_DOMAINS) {
    bySlug.set(d.slug, { slug: d.slug, label: d.label });
  }
  for (const row of apiRows || []) {
    if (row?.slug && row?.name) {
      bySlug.set(row.slug, { slug: row.slug, label: row.name });
    }
  }
  return Array.from(bySlug.values()).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
}

export default function ATSChecker() {
  const [file, setFile] = useState(null);
  const [domain, setDomain] = useState("software_engineer");
  const [domains, setDomains] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadHint, setUploadHint] = useState(null);
  const [results, setResults] = useState(null);
  const [resultsKey, setResultsKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl(API_PATHS.ATS.DOMAINS), {
          credentials: "include",
        });
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        const merged = mergeDomains(body.domains);
        setDomains(merged);
      } catch {
        if (!cancelled) setDomains(mergeDomains([]));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (domains.length && !domains.some((d) => d.slug === domain)) {
      setDomain(domains[0].slug);
    }
  }, [domains, domain]);

  const domainList = useMemo(() => domains, [domains]);

  const analyzeResume = async () => {
    setUploadHint(null);
    setError(null);
    if (!file) {
      setUploadHint("Please choose a resume file first.");
      return;
    }
    if (!domain) {
      setUploadHint("Please select a job domain.");
      return;
    }

    setIsLoading(true);
    setResults(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("domain", domain);

    try {
      const headers = {};
      const token = localStorage.getItem("token");
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(apiUrl(API_PATHS.ATS.CHECK), {
        method: "POST",
        body: formData,
        headers,
        credentials: "include",
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || "Analysis failed");
      }

      if (!payload.success || !payload.data) {
        throw new Error(payload.message || "Unexpected response");
      }

      setResults(payload.data);
      setResultsKey((k) => k + 1);
      setTimeout(() => {
        document.getElementById("ats-results")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      <Navbar />
      <div className={`${dashboardStyles.container} max-w-6xl`}>
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-violet-700 mb-4">
            <Link to="/dashboard" className="hover:text-fuchsia-600 transition-colors">
              ← Dashboard
            </Link>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
            ATS Resume Checker
          </h1>
          <p className="mt-2 text-gray-600 font-medium max-w-2xl">
            See how your resume scores against Applicant Tracking Systems for your
            target role — with keywords, structure, and fixes you can apply today.
          </p>
        </div>

        <div className="rounded-2xl border border-violet-100 bg-white/90 backdrop-blur-sm shadow-sm p-6 sm:p-8 mb-8">
          <p className="text-xs font-black uppercase tracking-wide text-violet-600 mb-4">
            Step 1 — Upload & domain
          </p>
          <UploadZone
            file={file}
            onFileChange={setFile}
            dragOver={dragOver}
            setDragOver={setDragOver}
            error={uploadHint}
            setLocalError={setUploadHint}
          />
          <div className="mt-6">
            <DomainSelector
              domain={domain}
              onDomainChange={setDomain}
              domains={domainList}
            />
          </div>
          {error && (
            <p className="mt-4 text-sm font-medium text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
              {error}
            </p>
          )}
          <button
            type="button"
            disabled={isLoading}
            onClick={analyzeResume}
            className={`mt-6 group relative w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-2xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-violet-200 disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing…
                </>
              ) : (
                "Analyze resume"
              )}
            </span>
          </button>
        </div>

        {isLoading && <AnalysisLoader />}

        {results && !isLoading && (
          <div id="ats-results" className="space-y-6 pb-12" key={resultsKey}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ScoreCard overall={results.overall} label={results.label} />
              <SectionBreakdown breakdown={results.breakdown} />
            </div>
            <KeywordCloud
              matchedKeywords={results.matchedKeywords}
              missingKeywords={results.missingKeywords}
            />
            <SuggestionList
              suggestions={results.suggestions}
              quickWins={results.quickWins}
            />
          </div>
        )}
      </div>
    </div>
  );
}
