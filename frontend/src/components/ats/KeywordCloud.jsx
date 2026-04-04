export default function KeywordCloud({ matchedKeywords, missingKeywords }) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      <h3 className="text-lg font-black text-gray-900">Keywords</h3>
      <div>
        <p className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-2">
          <span aria-hidden>✅</span> Matched
        </p>
        <div className="flex flex-wrap gap-2">
          {(matchedKeywords || []).map((k, i) => (
            <span
              key={`m-${k}-${i}`}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {k}
            </span>
          ))}
          {!(matchedKeywords || []).length && (
            <span className="text-sm text-gray-500">No direct matches yet.</span>
          )}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-2">
          <span aria-hidden>⚠️</span> Missing (high value)
        </p>
        <div className="flex flex-wrap gap-2">
          {(missingKeywords || []).map((k, i) => (
            <span
              key={`x-${k}-${i}`}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-100 animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {k}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
