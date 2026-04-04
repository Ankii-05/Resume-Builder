import { useEffect, useState } from "react";
import { dashboardStyles } from "../../assets/dummystyle";

const MESSAGES = [
  "Parsing your resume...",
  "Checking keyword density...",
  "Analyzing section structure...",
  "Calculating ATS compatibility...",
  "Generating personalized suggestions...",
];

export default function AnalysisLoader() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setI((n) => (n + 1) % MESSAGES.length);
    }, 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-white to-violet-50 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className={dashboardStyles.spinner} />
        <p className="text-sm font-semibold text-violet-800 animate-pulse">
          {MESSAGES[i]}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-40 rounded-xl bg-gray-100/80 animate-pulse border border-violet-50" />
        <div className="h-40 rounded-xl bg-gray-100/80 animate-pulse border border-violet-50" />
        <div className="h-24 rounded-xl bg-gray-100/80 animate-pulse border border-violet-50 md:col-span-2" />
      </div>
    </div>
  );
}
