const PRIORITY_STYLES = {
  HIGH: "border-l-red-500 bg-red-50/50",
  MEDIUM: "border-l-amber-500 bg-amber-50/40",
  LOW: "border-l-emerald-500 bg-emerald-50/30",
};

const PRIORITY_LABEL = {
  HIGH: "text-red-700",
  MEDIUM: "text-amber-800",
  LOW: "text-emerald-800",
};

export default function SuggestionList({ suggestions, quickWins }) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      <h3 className="text-lg font-black text-gray-900">Quick wins</h3>
      <ol className="list-decimal list-inside space-y-2 text-sm font-medium text-gray-800">
        {(quickWins || []).map((q, i) => (
          <li key={i} className="pl-1">
            {q}
          </li>
        ))}
      </ol>

      <h3 className="text-lg font-black text-gray-900 pt-2">Actionable suggestions</h3>
      <ul className="space-y-3">
        {(suggestions || []).map((s, i) => (
          <li
            key={i}
            className={`rounded-xl border border-violet-100 pl-4 pr-4 py-3 border-l-4 shadow-sm animate-fade-in ${PRIORITY_STYLES[s.priority] || PRIORITY_STYLES.MEDIUM}`}
            style={{ animationDelay: `${100 + i * 100}ms` }}
          >
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[10px] font-black uppercase tracking-wide ${PRIORITY_LABEL[s.priority] || "text-gray-600"}`}>
                {s.priority}
              </span>
              <span className="text-xs font-bold text-violet-700">{s.section}</span>
              <span className="text-xs font-semibold text-fuchsia-700 ml-auto">{s.impact}</span>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">{s.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
