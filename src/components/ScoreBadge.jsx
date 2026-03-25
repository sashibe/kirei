import { useState, useEffect } from 'react';

const BASELINE = 70;

export default function ScoreBadge({ label, score, color, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  const [counting, setCounting] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);

  // 溜め: delay ms 後に表示開始
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  // 表示後にカウントアップ
  useEffect(() => {
    if (!visible) return;
    setCounting(true);
    let current = 0;
    const iv = setInterval(() => {
      current++;
      setDisplayScore(current);
      if (current >= score) {
        clearInterval(iv);
        setCounting(false);
      }
    }, 20);
    return () => clearInterval(iv);
  }, [visible, score]);

  const isHigh = score >= BASELINE;
  const indicator = isHigh ? "▲" : "▼";
  const indicatorColor = isHigh ? "#22c55e" : "#f97316";
  const indicatorLabel = isHigh ? "Good" : "Care";

  if (!visible) return null;

  return (
    <div style={{
      background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(8px)",
      borderRadius: 12,
      padding: "6px 12px",
      display: "flex",
      alignItems: "center",
      gap: 8,
      animation: "badgePopIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    }}>
      <style>{`@keyframes badgePopIn{from{opacity:0;transform:scale(0.6) translateX(20px)}to{opacity:1;transform:scale(1) translateX(0)}}`}</style>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500, lineHeight: 1 }}>{label}</span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginTop: 2 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{displayScore}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
            <span style={{ fontSize: 8, color: indicatorColor, lineHeight: 1 }}>{indicator}</span>
            <span style={{ fontSize: 8, fontWeight: 700, color: indicatorColor, lineHeight: 1 }}>{indicatorLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
