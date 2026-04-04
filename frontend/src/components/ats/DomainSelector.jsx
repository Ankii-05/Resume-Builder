const DOMAINS = [
  { key: "software_engineer", label: "Software Engineer" },
  { key: "data_scientist", label: "Data Scientist" },
  { key: "product_manager", label: "Product Manager" },
  { key: "marketing", label: "Marketing" },
  { key: "finance", label: "Finance" },
  { key: "ui_ux_designer", label: "UI/UX Designer" },
  { key: "devops", label: "DevOps / Cloud" },
  { key: "custom", label: "Custom" },
];

export default function DomainSelector({ domain, onDomainChange, customLabel, onCustomLabelChange }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-gray-800">Target job domain</p>
      <div className="flex flex-wrap gap-2">
        {DOMAINS.map((d) => {
          const active = domain === d.key;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => onDomainChange(d.key)}
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
      {domain === "custom" && (
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">
            Describe your target role
          </label>
          <input
            type="text"
            value={customLabel}
            onChange={(e) => onCustomLabelChange(e.target.value)}
            placeholder="e.g. Game Developer, Nurse Practitioner"
            className="form-input w-full"
          />
        </div>
      )}
    </div>
  );
}
