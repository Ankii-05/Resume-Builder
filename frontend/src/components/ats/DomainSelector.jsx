export default function DomainSelector({ domain, onDomainChange, domains = [] }) {
  if (!domains.length) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-bold text-gray-800">Target job domain</p>
        <p className="text-sm text-gray-500">Loading domains…</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-gray-800">Target job domain</p>
      <div className="flex flex-wrap gap-2">
        {domains.map((d) => {
          const active = domain === d.slug;
          return (
            <button
              key={d.slug}
              type="button"
              onClick={() => onDomainChange(d.slug)}
              className={`text-xs sm:text-[13px] font-semibold px-3 py-1.5 rounded-full border transition-all duration-200 ${
                active
                  ? "border-violet-500 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-200"
                  : "border-violet-100 bg-white text-violet-800 hover:border-violet-300 hover:bg-violet-50"
              }`}
            >
              {d.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
