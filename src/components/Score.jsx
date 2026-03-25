import { useState, useEffect } from 'react';

export default function Score({ score, size = 80, color = "#a78bfa", label, delay = 0 }) {
  const [cur, setCur] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      let s = 0;
      const iv = setInterval(() => {
        s++;
        setCur(s);
        if (s >= score) clearInterval(iv);
      }, 18);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [score, delay]);

  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const o = c - (cur / 100) * c;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={c} strokeDashoffset={o} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.08s" }} />
      </svg>
      <div style={{ position: "relative", marginTop: -size + 2, height: size, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.3, fontWeight: 800, color }}>{cur}</span>
      </div>
      {label && <span style={{ fontSize: 10, color: "#64748b", marginTop: 1, fontWeight: 600 }}>{label}</span>}
    </div>
  );
}
