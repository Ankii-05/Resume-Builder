import { useEffect, useState } from "react";

const SECTIONS = [
  { key: "contact", label: "Contact Info", max: 10 },
  { key: "keywords", label: "Keywords", max: 35 },
  { key: "experience", label: "Experience", max: 20 },
  { key: "structure", label: "Structure", max: 15 },
  { key: "formatting", label: "Formatting", max: 10 },
  { key: "skills", label: "Skills", max: 10 },
];

export default function SectionBreakdown({ breakdown }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const t = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(t);
  }, [breakdown]);

  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-6 sm:p-8 shadow-sm">
      <h3 className="text-lg font-black text-gray-900 mb-6">Section breakdown</h3>
      <ul className="space-y-4">
        {SECTIONS.map((s, idx) => {
          const raw = breakdown?.[s.key] ?? 0;
          const pct = s.max ? Math.round((raw / s.max) * 100) : 0;
          return (
            <li key={s.key}>
              <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                <span>{s.label}</span>
                <span className="text-violet-700">{pct}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-all duration-1000 ease-out"
                  style={{
                    width: ready ? `${pct}%` : "0%",
                    transitionDelay: `${idx * 80}ms`,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
