import { useEffect, useState } from "react";

function scoreTone(overall) {
  if (overall <= 40) return { ring: "stroke-red-500", text: "text-red-600" };
  if (overall <= 65) return { ring: "stroke-amber-500", text: "text-amber-700" };
  if (overall <= 85) return { ring: "stroke-blue-500", text: "text-blue-700" };
  return { ring: "stroke-emerald-500", text: "text-emerald-700" };
}

export default function ScoreCard({ overall, label }) {
  const [display, setDisplay] = useState(0);
  const [ringOffset, setRingOffset] = useState(null);
  const tone = scoreTone(overall);
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, overall));
  const targetOffset = c - (pct / 100) * c;

  useEffect(() => {
    setDisplay(0);
    setRingOffset(c);
    const start = performance.now();
    const duration = 1500;
    let frame;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) * (1 - t);
      setDisplay(Math.round(overall * eased));
      setRingOffset(c - (c - targetOffset) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [overall, c, targetOffset]);

  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-6 sm:p-8 shadow-sm flex flex-col items-center justify-center text-center">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            className="stroke-gray-200"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            className={`${tone.ring} transition-all duration-1000 ease-out`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={ringOffset ?? c}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-black ${tone.text}`}>{display}%</span>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
            ATS Score
          </span>
        </div>
      </div>
      <p className={`mt-4 text-lg font-black ${tone.text}`}>{label}</p>
    </div>
  );
}
