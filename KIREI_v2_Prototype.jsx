import { useState, useEffect, useRef } from "react";

// ─── ASSETS ───
const IMG_FACE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzNjAiIGhlaWdodD0iNDgwIiB2aWV3Qm94PSIwIDAgMzYwIDQ4MCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImJnIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmZGYyZjgiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZWRlOWZlIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJza2luIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmZGU4ZDgiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZjVkMGIwIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJoYWlyIiB4MT0iMCIgeTE9IjAiIHgyPSIwLjMiIHkyPSIxIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzViM2ExYSIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMzZDI1MTAiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIzNjAiIGhlaWdodD0iNDgwIiBmaWxsPSJ1cmwoI2JnKSIvPgogIDwhLS0gTmVjayAtLT4KICA8cmVjdCB4PSIxNDgiIHk9IjMxMCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjgwIiByeD0iMjAiIGZpbGw9InVybCgjc2tpbikiLz4KICA8IS0tIFNob3VsZGVycyAtLT4KICA8ZWxsaXBzZSBjeD0iMTgwIiBjeT0iNDIwIiByeD0iMTQwIiByeT0iNzAiIGZpbGw9IiNlOGQwZTgiLz4KICA8IS0tIFRvcCAtLT4KICA8cmVjdCB4PSI4MCIgeT0iMzcwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjExMCIgcng9IjEwIiBmaWxsPSIjZThkMGU4Ii8+CiAgPCEtLSBGYWNlIC0tPgogIDxlbGxpcHNlIGN4PSIxODAiIGN5PSIyMjAiIHJ4PSI5NSIgcnk9IjEyMCIgZmlsbD0idXJsKCNza2luKSIvPgogIDwhLS0gSGFpciBiYWNrIC0tPgogIDxlbGxpcHNlIGN4PSIxODAiIGN5PSIxNTAiIHJ4PSIxMDUiIHJ5PSI5MCIgZmlsbD0idXJsKCNoYWlyKSIvPgogIDwhLS0gSGFpciBiYW5ncyAtLT4KICA8cGF0aCBkPSJNODUgMTcwIFE5MCAxMDAgMTgwIDkwIFEyNzAgMTAwIDI3NSAxNzAgUTI2MCAxMzAgMTgwIDEyMCBRMTAwIDEzMCA4NSAxNzBaIiBmaWxsPSJ1cmwoI2hhaXIpIi8+CiAgPCEtLSBIYWlyIHNpZGVzIC0tPgogIDxwYXRoIGQ9Ik04NSAxNzAgUTc1IDIyMCA4MCAzMDAgUTg1IDI1MCA5NSAyMDBaIiBmaWxsPSJ1cmwoI2hhaXIpIiBvcGFjaXR5PSIwLjkiLz4KICA8cGF0aCBkPSJNMjc1IDE3MCBRMjg1IDIyMCAyODAgMzAwIFEyNzUgMjUwIDI2NSAyMDBaIiBmaWxsPSJ1cmwoI2hhaXIpIiBvcGFjaXR5PSIwLjkiLz4KICA8IS0tIEV5ZXMgLS0+CiAgPGVsbGlwc2UgY3g9IjE0OCIgY3k9IjIyMCIgcng9IjE0IiByeT0iOSIgZmlsbD0iI2ZmZiIvPgogIDxlbGxpcHNlIGN4PSIyMTIiIGN5PSIyMjAiIHJ4PSIxNCIgcnk9IjkiIGZpbGw9IiNmZmYiLz4KICA8Y2lyY2xlIGN4PSIxNTAiIGN5PSIyMjAiIHI9IjciIGZpbGw9IiM0YTM1MjAiLz4KICA8Y2lyY2xlIGN4PSIyMTQiIGN5PSIyMjAiIHI9IjciIGZpbGw9IiM0YTM1MjAiLz4KICA8Y2lyY2xlIGN4PSIxNTIiIGN5PSIyMTgiIHI9IjIuNSIgZmlsbD0iI2ZmZiIvPgogIDxjaXJjbGUgY3g9IjIxNiIgY3k9IjIxOCIgcj0iMi41IiBmaWxsPSIjZmZmIi8+CiAgPCEtLSBFeWVicm93cyAtLT4KICA8cGF0aCBkPSJNMTI4IDIwMCBRMTQ4IDE5MiAxNjggMTk4IiBzdHJva2U9IiM1YjNhMWEiIHN0cm9rZS13aWR0aD0iMi41IiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICA8cGF0aCBkPSJNMTkyIDE5OCBRMjEyIDE5MiAyMzIgMjAwIiBzdHJva2U9IiM1YjNhMWEiIHN0cm9rZS13aWR0aD0iMi41IiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICA8IS0tIE5vc2UgLS0+CiAgPHBhdGggZD0iTTE4MCAyMzUgUTE3NSAyNTggMTcwIDI2MiBRMTc4IDI2NiAxOTAgMjYyIFExODUgMjU4IDE4MCAyMzUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2Q0YTg4YSIgc3Ryb2tlLXdpZHRoPSIxLjIiLz4KICA8IS0tIExpcHMgLS0+CiAgPHBhdGggZD0iTTE1OCAyODUgUTE2OCAyNzggMTgwIDI4MCBRMTkyIDI3OCAyMDIgMjg1IiBzdHJva2U9IiNlMDcwNzAiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPHBhdGggZD0iTTE1OCAyODUgUTE2OCAyOTUgMTgwIDI5NyBRMTkyIDI5NSAyMDIgMjg1IiBzdHJva2U9IiNlMDcwNzAiIHN0cm9rZS13aWR0aD0iMS41IiBmaWxsPSIjZjBhMGEwIiBvcGFjaXR5PSIwLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogIDwhLS0gQ2hlZWsgYmx1c2ggLS0+CiAgPGVsbGlwc2UgY3g9IjEyNSIgY3k9IjI1NSIgcng9IjIwIiByeT0iMTIiIGZpbGw9IiNmNWIwYjAiIG9wYWNpdHk9IjAuMjUiLz4KICA8ZWxsaXBzZSBjeD0iMjM1IiBjeT0iMjU1IiByeD0iMjAiIHJ5PSIxMiIgZmlsbD0iI2Y1YjBiMCIgb3BhY2l0eT0iMC4yNSIvPgogIDwhLS0gRXllbGFzaGVzIC0tPgogIDxwYXRoIGQ9Ik0xMzIgMjE0IFExMjggMjEwIDEyNiAyMDYiIHN0cm9rZT0iIzNkMjUxMCIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICA8cGF0aCBkPSJNMjI4IDIxNCBRMjMyIDIxMCAyMzQgMjA2IiBzdHJva2U9IiMzZDI1MTAiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPg==";

// ─── DATA ───
const SKIN = {
  tone: { score: 72, label: "肌トーン", color: "#e879f9", bg: "#fdf4ff" },
  pores: { score: 68, label: "毛穴", color: "#a78bfa", bg: "#f5f3ff" },
  dullness: { score: 81, label: "くすみ", color: "#2dd4bf", bg: "#f0fdfa" },
  moisture: { score: 75, label: "水分", color: "#38bdf8", bg: "#f0f9ff" },
};

const PERSONAL_COLORS = {
  spring: { label: "スプリング", sub: "イエベ春", color: "#f59e0b", bg: "#fffbeb", desc: "明るくクリアな色が似合う" },
  summer: { label: "サマー", sub: "ブルベ夏", color: "#94a3b8", bg: "#f1f5f9", desc: "くすみのあるソフトな色が似合う" },
  autumn: { label: "オータム", sub: "イエベ秋", color: "#d97706", bg: "#fef3c7", desc: "深みのあるリッチな色が似合う" },
  winter: { label: "ウィンター", sub: "ブルベ冬", color: "#6366f1", bg: "#eef2ff", desc: "はっきりとしたコントラストの効いた色が似合う" },
};

const MAKEUP_LOOKS = [
  {
    id: "glow",
    name: "ツヤ肌ブルームルック",
    desc: "血色感のあるコーラルピンクで自然なツヤを演出",
    reason: "くすみスコアが良好なので、ツヤ肌が映えます",
    lip: "#e8607c",
    cheek: "rgba(232,96,124,0.25)",
    eyeshadow: "rgba(232,150,120,0.2)",
    products: [
      { emoji: "💄", name: "シアーグロウリップ", shade: "コーラルピンク", price: 2480 },
      { emoji: "🌸", name: "ブルームチーク", shade: "ピーチ", price: 1980 },
    ],
  },
  {
    id: "matte",
    name: "セミマット知的ルック",
    desc: "毛穴カバーしつつ品のあるマット仕上げ",
    reason: "毛穴スコアを考慮し、カバー力のあるセミマットで",
    lip: "#c05070",
    cheek: "rgba(192,80,112,0.2)",
    eyeshadow: "rgba(160,100,140,0.25)",
    products: [
      { emoji: "💄", name: "ベルベットリップ", shade: "ローズブラウン", price: 2680 },
      { emoji: "🧴", name: "ポアレスベース", shade: "ナチュラル", price: 3280 },
    ],
  },
  {
    id: "warm",
    name: "ウォームヌードルック",
    desc: "イエベ春に映えるウォームトーンの抜け感メイク",
    reason: "パーソナルカラーに合わせたウォームパレット",
    lip: "#d4826a",
    cheek: "rgba(212,130,106,0.22)",
    eyeshadow: "rgba(200,150,100,0.2)",
    products: [
      { emoji: "💄", name: "ヌードティントリップ", shade: "テラコッタ", price: 2280 },
      { emoji: "✨", name: "ゴールドグロウシャドウ", shade: "アンバー", price: 2180 },
    ],
  },
];

const WEATHER = { temp: 18, humidity: 62, uv: 3, condition: "くもり時々晴れ", icon: "⛅" };

const COORD_ITEMS = {
  glow: [
    { part: "トップス", name: "シアーリブニット", shade: "アイボリー", price: 4980, color: "#faf5ef", y: "34%" },
    { part: "カーディガン", name: "ライトカーデ", shade: "ラベンダー", price: 5480, color: "#e9d5ff", y: "36%" },
    { part: "ボトムス", name: "フレアスカート", shade: "ダスティローズ", price: 6280, color: "#f5d0d6", y: "58%" },
    { part: "バッグ", name: "ミニショルダー", shade: "ベージュ", price: 4280, color: "#e8dcc8", y: "55%" },
    { part: "シューズ", name: "ポインテッドフラット", shade: "ヌードピンク", price: 5980, color: "#f0d0c0", y: "82%" },
  ],
  matte: [
    { part: "トップス", name: "タートルネックリブ", shade: "グレージュ", price: 4580, color: "#d6d0c8", y: "34%" },
    { part: "アウター", name: "テーラードジャケット", shade: "チャコール", price: 9800, color: "#5a5a5a", y: "36%" },
    { part: "ボトムス", name: "テーパードパンツ", shade: "ネイビー", price: 6980, color: "#2c3e5a", y: "58%" },
    { part: "バッグ", name: "レザートート", shade: "ブラック", price: 7800, color: "#333", y: "55%" },
    { part: "シューズ", name: "ローファー", shade: "ダークブラウン", price: 6480, color: "#5a3a20", y: "82%" },
  ],
  warm: [
    { part: "トップス", name: "Vネックブラウス", shade: "テラコッタ", price: 4780, color: "#c87858", y: "34%" },
    { part: "カーディガン", name: "ケーブルカーデ", shade: "キャメル", price: 6280, color: "#c8a060", y: "36%" },
    { part: "ボトムス", name: "ワイドデニム", shade: "ライトブルー", price: 5980, color: "#a0b8d0", y: "58%" },
    { part: "バッグ", name: "かごバッグ", shade: "ナチュラル", price: 3980, color: "#d4b896", y: "55%" },
    { part: "シューズ", name: "スエードブーティ", shade: "キャメル", price: 7280, color: "#b08050", y: "82%" },
  ],
};

// ─── SCREENS ───
const SC = { MIRROR: 0, SUGGEST: 1, TRYON: 2, RESULT: 3 };

// ─── SHARED COMPONENTS ───
function Kirari({ size = 48, expression = "happy", bounce = false }) {
  const faces = {
    happy: <><ellipse cx="17" cy="19" rx="1.8" ry="2.2" fill="#4a235a"/><ellipse cx="27" cy="19" rx="1.8" ry="2.2" fill="#4a235a"/><circle cx="18.2" cy="18.2" r=".6" fill="#fff"/><circle cx="28.2" cy="18.2" r=".6" fill="#fff"/><path d="M19 25 Q22 30 25 25" stroke="#4a235a" strokeWidth="1.5" fill="none" strokeLinecap="round"/></>,
    thinking: <><ellipse cx="17" cy="19" rx="1.8" ry="2" fill="#4a235a"/><ellipse cx="27" cy="19" rx="1.8" ry="2" fill="#4a235a"/><circle cx="25" cy="26" r="2" fill="#4a235a"/></>,
    sparkle: <><ellipse cx="17" cy="19" rx="1.8" ry="2.2" fill="#4a235a"/><ellipse cx="27" cy="19" rx="1.8" ry="2.2" fill="#4a235a"/><circle cx="18.2" cy="18.2" r=".6" fill="#fff"/><circle cx="28.2" cy="18.2" r=".6" fill="#fff"/><path d="M19 25 Q22 30 25 25" stroke="#4a235a" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M32 10 L34 8 M34 12 L36 10" stroke="#f59e0b" strokeWidth=".8" strokeLinecap="round"/></>,
    wink: <><ellipse cx="17" cy="19" rx="1.8" ry="2.2" fill="#4a235a"/><circle cx="18.2" cy="18.2" r=".6" fill="#fff"/><path d="M24 19 Q27 17 30 19" stroke="#4a235a" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M19 25 Q22 30 25 25" stroke="#4a235a" strokeWidth="1.5" fill="none" strokeLinecap="round"/></>,
  };
  return (
    <div style={{ width: size, height: size, flexShrink: 0, animation: bounce ? "kb 1s ease-in-out infinite" : "none" }}>
      <style>{`@keyframes kb{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
      <svg viewBox="0 0 44 44" width={size} height={size}>
        <defs>
          <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e9d5ff"/><stop offset="100%" stopColor="#d8b4fe"/></linearGradient>
          <linearGradient id="wg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="rgba(255,255,255,0.6)"/><stop offset="100%" stopColor="rgba(200,220,255,0.3)"/></linearGradient>
        </defs>
        <ellipse cx="8" cy="14" rx="7" ry="10" fill="url(#wg)" stroke="#c4b5fd" strokeWidth=".5" transform="rotate(-15 8 14)"/>
        <ellipse cx="36" cy="14" rx="7" ry="10" fill="url(#wg)" stroke="#c4b5fd" strokeWidth=".5" transform="rotate(15 36 14)"/>
        <path d="M15 24 Q14 36 12 40 Q18 38 22 38 Q26 38 32 40 Q30 36 29 24 Z" fill="url(#fg)" stroke="#c084fc" strokeWidth=".6"/>
        <circle cx="22" cy="16" r="10" fill="#fef3c7" stroke="#fbbf24" strokeWidth=".3"/>
        <path d="M12 14 Q12 5 22 5 Q32 5 32 14 Q30 10 22 9 Q14 10 12 14 Z" fill="#c084fc"/>
        <polygon points="23,4 24,6.5 26.5,6.5 24.5,8 25.2,10.5 23,9 20.8,10.5 21.5,8 19.5,6.5 22,6.5" fill="#fbbf24" stroke="#f59e0b" strokeWidth=".3"/>
        <circle cx="14" cy="22" r="2.5" fill="rgba(251,191,36,0.2)"/>
        <circle cx="30" cy="22" r="2.5" fill="rgba(251,191,36,0.2)"/>
        {faces[expression]}
        <line x1="10" y1="22" x2="6" y2="28" stroke="#d4a853" strokeWidth="1" strokeLinecap="round"/>
        <ellipse cx="5" cy="30" rx="3" ry="3.5" fill="#e0e7ff" stroke="#d4a853" strokeWidth=".8"/>
      </svg>
    </div>
  );
}

function Bubble({ children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 18, padding: "10px 14px", boxShadow: "0 2px 12px rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.1)", flex: 1, position: "relative" }}>
      <div style={{ position: "absolute", top: 14, left: -7, width: 0, height: 0, borderTop: "7px solid transparent", borderBottom: "7px solid transparent", borderRight: "7px solid #fff" }}/>
      {children}
    </div>
  );
}

function Score({ score, size = 80, color = "#a78bfa", label, delay = 0 }) {
  const [cur, setCur] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let s = 0;
      const iv = setInterval(() => { s++; setCur(s); if (s >= score) clearInterval(iv); }, 18);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [score, delay]);
  const r = (size - 8) / 2, c = 2 * Math.PI * r, o = c - (cur / 100) * c;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="6"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={c} strokeDashoffset={o} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.05s" }}/>
      </svg>
      <span style={{ position: "relative", top: -size/2 - 6, fontSize: 20, fontWeight: 800, color }}>{cur}</span>
      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginTop: -size/2 + 8 }}>{label}</span>
    </div>
  );
}

// ─── MAIN APP ───
export default function KIREIv2() {
  const [screen, setScreen] = useState(SC.MIRROR);
  const [skinDone, setSkinDone] = useState(false);
  const [pcDone, setPcDone] = useState(false);
  const [selectedLook, setSelectedLook] = useState(null);
  const [lipColor, setLipColor] = useState(null);
  const [cheekColor, setCheekColor] = useState(null);
  const [intensity, setIntensity] = useState(70);
  const [showBefore, setShowBefore] = useState(false);
  const [showCoord, setShowCoord] = useState(false);
  const pcType = "spring"; // simulated result

  // Auto skin analysis
  useEffect(() => {
    if (screen === SC.MIRROR && !skinDone) {
      const t = setTimeout(() => setSkinDone(true), 3200);
      return () => clearTimeout(t);
    }
  }, [screen, skinDone]);

  // Auto personal color after skin
  useEffect(() => {
    if (skinDone && !pcDone) {
      const t = setTimeout(() => setPcDone(true), 1800);
      return () => clearTimeout(t);
    }
  }, [skinDone, pcDone]);

  const pc = PERSONAL_COLORS[pcType];
  const overallSkin = Math.round(Object.values(SKIN).reduce((a, s) => a + s.score, 0) / Object.keys(SKIN).length);

  // ─── SCREEN 1: MIRROR ───
  if (screen === SC.MIRROR) {
    return (
      <div style={{ maxWidth: 400, margin: "0 auto", fontFamily: "'Noto Sans JP', sans-serif", background: "linear-gradient(180deg, #faf5ff 0%, #fdf2f8 50%, #fff 100%)", minHeight: "100vh", paddingBottom: 20 }}>
        {/* Header */}
        <div style={{ padding: "16px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, background: "linear-gradient(135deg, #a855f7, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>KIREI</h1>
            <p style={{ fontSize: 10, color: "#94a3b8", margin: 0, letterSpacing: 2 }}>AI BEAUTY MIRROR</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", borderRadius: 12, padding: "6px 10px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <span style={{ fontSize: 16 }}>{WEATHER.icon}</span>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#334155", margin: 0 }}>{WEATHER.temp}℃</p>
              <p style={{ fontSize: 9, color: "#94a3b8", margin: 0 }}>UV{WEATHER.uv} 湿度{WEATHER.humidity}%</p>
            </div>
          </div>
        </div>

        {/* Kirari */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "12px 16px" }}>
          <Kirari size={44} expression={pcDone ? "sparkle" : skinDone ? "wink" : "thinking"} bounce={!skinDone}/>
          <Bubble>
            <p style={{ fontSize: 13, color: "#334155", margin: 0, lineHeight: 1.7 }}>
              {pcDone
                ? "肌チェック＆カラー判定完了♪ 今日の肌にぴったりのメイクを提案するね〜"
                : skinDone
                  ? "肌チェック完了！パーソナルカラーを判定してるよ〜"
                  : "キラリだよ♪ お顔を映してね、肌の状態をチェックしてるよ〜"}
            </p>
          </Bubble>
        </div>

        {/* Camera view */}
        <div style={{ margin: "0 20px", position: "relative", borderRadius: 24, overflow: "hidden", aspectRatio: "3/4", background: "#000", boxShadow: "0 8px 32px rgba(168,85,247,0.12)" }}>
          <img src={IMG_FACE} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }}/>
          {/* Scan line */}
          {!skinDone && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
              <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #e879f9, transparent)", animation: "ms 2s ease-in-out infinite", boxShadow: "0 0 12px #e879f9" }}/>
              <style>{`@keyframes ms{0%,100%{top:15%}50%{top:70%}}`}</style>
            </div>
          )}
          {/* Score badges */}
          {skinDone && (
            <div style={{ position: "absolute", top: 16, right: 16, display: "flex", flexDirection: "column", gap: 6, animation: "fadeIn 0.5s ease" }}>
              <style>{`@keyframes fadeIn{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}`}</style>
              {Object.entries(SKIN).map(([k, v], i) => (
                <div key={k} style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", borderRadius: 10, padding: "4px 10px", display: "flex", alignItems: "center", gap: 6, animationDelay: `${i * 0.15}s` }}>
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>{v.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: v.color }}>{v.score}</span>
                </div>
              ))}
            </div>
          )}
          {/* Personal color badge */}
          {pcDone && (
            <div style={{ position: "absolute", bottom: 16, left: 16, background: pc.bg, border: `2px solid ${pc.color}`, borderRadius: 14, padding: "6px 14px", animation: "fadeIn 0.6s ease" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: pc.color, margin: 0 }}>{pc.label}</p>
              <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{pc.sub} — {pc.desc}</p>
            </div>
          )}
          <div style={{ position: "absolute", inset: 0, borderRadius: 24, border: "3px solid rgba(168,85,247,0.15)", pointerEvents: "none" }}/>
        </div>

        {/* CTA */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          {pcDone ? (
            <button onClick={() => setScreen(SC.SUGGEST)} style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #a855f7, #ec4899)", border: "none", borderRadius: 16, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 16px rgba(168,85,247,0.3)" }}>
              メイク提案を見る →
            </button>
          ) : (
            <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
              {skinDone ? "パーソナルカラーを判定中..." : "肌を分析中..."}
            </p>
          )}
        </div>
        <p style={{ textAlign: "center", fontSize: 10, color: "#cbd5e1", padding: "0 20px" }}>※本アプリは医療診断を行うものではありません。パーソナルカラーは傾向を示す参考情報です。</p>
      </div>
    );
  }

  // ─── SCREEN 2: MAKEUP SUGGESTION ───
  if (screen === SC.SUGGEST) {
    return (
      <div style={{ maxWidth: 400, margin: "0 auto", fontFamily: "'Noto Sans JP', sans-serif", background: "linear-gradient(180deg, #faf5ff 0%, #fdf2f8 50%, #fff 100%)", minHeight: "100vh", paddingBottom: 20 }}>
        <div style={{ padding: "16px 20px 0" }}>
          <button onClick={() => setScreen(SC.MIRROR)} style={{ background: "none", border: "none", fontSize: 13, color: "#a855f7", fontWeight: 600, cursor: "pointer", padding: 0 }}>← ミラーに戻る</button>
        </div>

        {/* Today's condition summary */}
        <div style={{ margin: "12px 16px", background: "#fff", borderRadius: 18, padding: "14px 16px", boxShadow: "0 2px 12px rgba(139,92,246,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#334155", margin: 0 }}>今日の肌コンディション</h2>
            <div style={{ background: pc.bg, borderRadius: 8, padding: "3px 8px" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: pc.color }}>{pc.label}</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 8 }}>
            {Object.entries(SKIN).map(([k, v]) => (
              <Score key={k} score={v.score} size={56} color={v.color} label={v.label} delay={0}/>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, background: "#fef3c7", color: "#d97706", borderRadius: 6, padding: "3px 8px" }}>💡 毛穴ケアを意識したベースがおすすめ</span>
            <span style={{ fontSize: 10, background: "#e0f2fe", color: "#0284c7", borderRadius: 6, padding: "3px 8px" }}>{WEATHER.icon} UV{WEATHER.uv} 日焼け止めOK</span>
          </div>
        </div>

        {/* Kirari suggestion */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 16px" }}>
          <Kirari size={36} expression="sparkle"/>
          <Bubble>
            <p style={{ fontSize: 12, color: "#334155", margin: 0, lineHeight: 1.6 }}>
              今日はちょっと毛穴が気になるかも。でもくすみスコアは優秀！ツヤ肌で血色感をプラスしてみない？
            </p>
          </Bubble>
        </div>

        {/* Makeup look cards */}
        <div style={{ padding: "8px 16px" }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#334155", margin: "0 0 10px" }}>おすすめメイクルック</h3>
          {MAKEUP_LOOKS.map((look, i) => (
            <div key={look.id} style={{ background: "#fff", borderRadius: 18, padding: "14px 16px", marginBottom: 10, boxShadow: "0 2px 8px rgba(139,92,246,0.06)", border: "1px solid #f1f5f9", cursor: "pointer" }}
              onClick={() => { setSelectedLook(look); setLipColor(look.lip); setCheekColor(look.cheek); setScreen(SC.TRYON); }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "#334155", margin: "0 0 4px" }}>{look.name}</h4>
                  <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 6px", lineHeight: 1.5 }}>{look.desc}</p>
                  <p style={{ fontSize: 10, color: "#a855f7", margin: 0 }}>💡 {look.reason}</p>
                </div>
                {/* Color swatches */}
                <div style={{ display: "flex", gap: 4, marginLeft: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: look.lip, border: "2px solid #fff", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }} title="リップ"/>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: look.cheek, border: "2px solid #fff", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }} title="チーク"/>
                </div>
              </div>
              <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#ec4899", cursor: "pointer" }}>試してみる →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── SCREEN 3: AR TRY-ON (Simulated) ───
  if (screen === SC.TRYON) {
    const look = selectedLook || MAKEUP_LOOKS[0];
    const alpha = intensity / 100;
    return (
      <div style={{ maxWidth: 400, margin: "0 auto", fontFamily: "'Noto Sans JP', sans-serif", background: "#000", minHeight: "100vh", position: "relative" }}>
        {/* Camera with AR overlay */}
        <div style={{ position: "relative", width: "100%", aspectRatio: "3/4" }}>
          <img src={IMG_FACE} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
          {/* Simulated lip overlay */}
          {!showBefore && (
            <>
              <div style={{
                position: "absolute", bottom: "28%", left: "38%", width: "24%", height: "8%",
                borderRadius: "50%", background: lipColor, opacity: alpha * 0.6,
                mixBlendMode: "multiply", filter: "blur(3px)",
                transition: "all 0.3s ease",
              }}/>
              {/* Simulated cheek L */}
              <div style={{
                position: "absolute", top: "45%", left: "18%", width: "18%", height: "14%",
                borderRadius: "50%", background: cheekColor, opacity: alpha * 0.5,
                mixBlendMode: "multiply", filter: "blur(8px)",
                transition: "all 0.3s ease",
              }}/>
              {/* Simulated cheek R */}
              <div style={{
                position: "absolute", top: "45%", right: "18%", width: "18%", height: "14%",
                borderRadius: "50%", background: cheekColor, opacity: alpha * 0.5,
                mixBlendMode: "multiply", filter: "blur(8px)",
                transition: "all 0.3s ease",
              }}/>
              {/* Simulated eyeshadow */}
              <div style={{
                position: "absolute", top: "30%", left: "25%", width: "16%", height: "6%",
                borderRadius: "50%", background: look.eyeshadow, opacity: alpha * 0.7,
                mixBlendMode: "overlay", filter: "blur(5px)",
                transition: "all 0.3s ease",
              }}/>
              <div style={{
                position: "absolute", top: "30%", right: "25%", width: "16%", height: "6%",
                borderRadius: "50%", background: look.eyeshadow, opacity: alpha * 0.7,
                mixBlendMode: "overlay", filter: "blur(5px)",
                transition: "all 0.3s ease",
              }}/>
            </>
          )}
          {/* Before/After label */}
          {showBefore && (
            <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.6)", borderRadius: 8, padding: "4px 12px" }}>
              <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>BEFORE</span>
            </div>
          )}
        </div>

        {/* Control panel */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(16px)", borderRadius: "24px 24px 0 0", padding: "16px 20px 28px" }}>
          {/* Look name */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>{look.name}</h3>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: 0 }}>{look.desc}</p>
            </div>
            <Kirari size={32} expression="wink"/>
          </div>

          {/* Color palette */}
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "0 0 6px" }}>リップカラー</p>
            <div style={{ display: "flex", gap: 8 }}>
              {["#e8607c", "#c05070", "#d4826a", "#b85050", "#cf6080", "#e07070"].map(c => (
                <div key={c} onClick={() => setLipColor(c)} style={{
                  width: 32, height: 32, borderRadius: "50%", background: c, cursor: "pointer",
                  border: lipColor === c ? "3px solid #fff" : "2px solid rgba(255,255,255,0.3)",
                  boxShadow: lipColor === c ? "0 0 12px rgba(255,255,255,0.3)" : "none",
                  transition: "all 0.2s",
                }}/>
              ))}
            </div>
          </div>

          {/* Intensity slider */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: 0 }}>濃さ</p>
              <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{intensity}%</span>
            </div>
            <input type="range" min="0" max="100" value={intensity} onChange={e => setIntensity(Number(e.target.value))}
              style={{ width: "100%", marginTop: 4, accentColor: "#ec4899" }}/>
          </div>

          {/* Before/After + Confirm */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onPointerDown={() => setShowBefore(true)}
              onPointerUp={() => setShowBefore(false)}
              onPointerLeave={() => setShowBefore(false)}
              style={{ flex: 1, padding: 12, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 14, fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
              👆 長押しでBefore
            </button>
            <button onClick={() => setScreen(SC.RESULT)} style={{ flex: 1, padding: 12, background: "linear-gradient(135deg, #a855f7, #ec4899)", border: "none", borderRadius: 14, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
              このメイクで決定 ✓
            </button>
          </div>

          {/* Back */}
          <button onClick={() => setScreen(SC.SUGGEST)} style={{ width: "100%", marginTop: 8, padding: 8, background: "none", border: "none", fontSize: 12, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
            ← ルック選択に戻る
          </button>
        </div>
      </div>
    );
  }

  // ─── SCREEN 4: RESULTS ───
  const look = selectedLook || MAKEUP_LOOKS[0];
  return (
    <div style={{ maxWidth: 400, margin: "0 auto", fontFamily: "'Noto Sans JP', sans-serif", background: "linear-gradient(180deg, #faf5ff 0%, #fdf2f8 50%, #fff 100%)", minHeight: "100vh", paddingBottom: 24 }}>
      <div style={{ padding: "16px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, background: "linear-gradient(135deg, #a855f7, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Today's Result</h1>
        <div style={{ background: pc.bg, borderRadius: 8, padding: "3px 8px" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: pc.color }}>{pc.label}</span>
        </div>
      </div>

      {/* Kirari summary */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "12px 16px" }}>
        <Kirari size={40} expression="happy"/>
        <Bubble>
          <p style={{ fontSize: 12, color: "#334155", margin: 0, lineHeight: 1.6 }}>
            今日のメイク、ばっちり決まったね♪ {look.name}で血色感もアップしてるよ〜！
          </p>
        </Bubble>
      </div>

      {/* Skin scores */}
      <div style={{ margin: "0 16px 12px", background: "#fff", borderRadius: 18, padding: "14px 16px", boxShadow: "0 2px 12px rgba(139,92,246,0.08)" }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#334155", margin: "0 0 10px" }}>肌スコア</h3>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {Object.entries(SKIN).map(([k, v]) => (
            <Score key={k} score={v.score} size={60} color={v.color} label={v.label}/>
          ))}
        </div>
      </div>

      {/* Selected look */}
      <div style={{ margin: "0 16px 12px", background: "#fff", borderRadius: 18, padding: "14px 16px", boxShadow: "0 2px 12px rgba(139,92,246,0.08)" }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#334155", margin: "0 0 8px" }}>選んだメイクルック</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 4 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: lipColor || look.lip, border: "2px solid #fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}/>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: cheekColor || look.cheek, border: "2px solid #fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}/>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#334155", margin: 0 }}>{look.name}</p>
            <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>{look.desc}</p>
          </div>
        </div>
      </div>

      {/* Product recommendations */}
      <div style={{ margin: "0 16px 12px" }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#334155", margin: "0 0 10px" }}>おすすめアイテム</h3>
        {look.products.map((p, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "12px 14px", marginBottom: 8, boxShadow: "0 1px 6px rgba(0,0,0,0.03)", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>{p.emoji}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#334155", margin: 0 }}>{p.name}</p>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{p.shade}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#ec4899", margin: 0 }}>¥{p.price.toLocaleString()}</p>
              <span style={{ fontSize: 10, color: "#a855f7" }}>KIREI SELECT</span>
            </div>
          </div>
        ))}
      </div>

      {/* Weather-based outfit hint */}
      <div style={{ margin: "0 16px 12px", background: "linear-gradient(135deg, #fffbeb, #fef3c7)", borderRadius: 18, padding: "14px 16px", border: "1px solid #fde68a" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
          <Kirari size={32} expression="sparkle"/>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#92400e", margin: "0 0 4px" }}>{WEATHER.icon} 今日のコーデヒント</p>
            <p style={{ fontSize: 11, color: "#78350f", margin: 0, lineHeight: 1.6 }}>
              {look.id === "warm" ? "テラコッタリップにはベージュ系のニットが映えるよ♪ " : "コーラルメイクにはアイボリーのトップスが好相性♪ "}
              今日は{WEATHER.temp}℃でちょっと肌寒いから、薄手のカーディガンを足すと安心〜
            </p>
          </div>
        </div>
        <button onClick={() => setShowCoord(true)} style={{ width: "100%", padding: 12, background: "linear-gradient(135deg, #f59e0b, #f97316)", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(245,158,11,0.3)" }}>
          👗 おすすめコーデを見る →
        </button>
      </div>

      {/* ── COORDINATE OVERLAY ── */}
      {showCoord && (() => {
        const items = COORD_ITEMS[look.id] || COORD_ITEMS.glow;
        const alpha = intensity / 100;
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", overflowY: "auto" }}>
            <div style={{ maxWidth: 400, margin: "0 auto", minHeight: "100vh", background: "linear-gradient(180deg, #faf5ff, #fff)", position: "relative" }}>
              {/* Header */}
              <div style={{ padding: "14px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, background: "linear-gradient(135deg, #f59e0b, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Today's Total Look</h2>
                <button onClick={() => setShowCoord(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 10, width: 32, height: 32, fontSize: 16, cursor: "pointer", color: "#64748b" }}>✕</button>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 16px" }}>
                <Kirari size={32} expression="wink"/>
                <Bubble>
                  <p style={{ fontSize: 11, color: "#334155", margin: 0, lineHeight: 1.5 }}>メイクに合わせたトータルコーデだよ♪ 気になるアイテムはタップしてチェックしてね〜</p>
                </Bubble>
              </div>

              {/* Full body composite */}
              <div style={{ margin: "0 16px", position: "relative", background: "linear-gradient(180deg, #fdf2f8, #f5f3ff)", borderRadius: 20, overflow: "hidden", aspectRatio: "3/5", border: "1px solid #ede9fe" }}>
                {/* Face with AR makeup at top */}
                <div style={{ position: "absolute", top: "3%", left: "50%", transform: "translateX(-50%)", width: "40%", aspectRatio: "3/4", borderRadius: "50% 50% 45% 45%", overflow: "hidden" }}>
                  <img src={IMG_FACE} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                  {/* AR lip */}
                  <div style={{ position: "absolute", bottom: "28%", left: "38%", width: "24%", height: "8%", borderRadius: "50%", background: lipColor || look.lip, opacity: alpha * 0.6, mixBlendMode: "multiply", filter: "blur(2px)" }}/>
                  {/* AR cheeks */}
                  <div style={{ position: "absolute", top: "45%", left: "15%", width: "20%", height: "14%", borderRadius: "50%", background: cheekColor || look.cheek, opacity: alpha * 0.5, mixBlendMode: "multiply", filter: "blur(6px)" }}/>
                  <div style={{ position: "absolute", top: "45%", right: "15%", width: "20%", height: "14%", borderRadius: "50%", background: cheekColor || look.cheek, opacity: alpha * 0.5, mixBlendMode: "multiply", filter: "blur(6px)" }}/>
                </div>

                {/* Body silhouette (SVG) */}
                <svg viewBox="0 0 200 340" style={{ position: "absolute", top: "25%", left: "50%", transform: "translateX(-50%)", width: "55%", height: "70%" }}>
                  {/* Neck */}
                  <rect x="88" y="0" width="24" height="30" rx="8" fill="#f5d0b0"/>
                  {/* Torso - top */}
                  <path d="M60 30 Q60 20 88 18 L112 18 Q140 20 140 30 L145 120 Q145 135 130 140 L70 140 Q55 135 55 120 Z" fill={items[0]?.color || "#faf5ef"}/>
                  {/* Cardigan/Jacket overlay */}
                  {items[1] && (
                    <>
                      <path d="M55 30 Q40 35 35 50 L30 110 Q30 120 40 122 L55 120 L55 30Z" fill={items[1].color} opacity="0.85"/>
                      <path d="M145 30 Q160 35 165 50 L170 110 Q170 120 160 122 L145 120 L145 30Z" fill={items[1].color} opacity="0.85"/>
                      <path d="M55 30 L65 30 L65 140 L55 120Z" fill={items[1].color} opacity="0.5"/>
                      <path d="M145 30 L135 30 L135 140 L145 120Z" fill={items[1].color} opacity="0.5"/>
                    </>
                  )}
                  {/* Skirt/Pants */}
                  <path d="M65 140 L55 250 Q55 260 70 260 L90 260 L100 145 L110 260 L130 260 Q145 260 145 250 L135 140 Z" fill={items[2]?.color || "#f5d0d6"}/>
                  {/* Legs */}
                  <rect x="78" y="260" width="16" height="50" rx="6" fill="#f5d0b0"/>
                  <rect x="106" y="260" width="16" height="50" rx="6" fill="#f5d0b0"/>
                  {/* Shoes */}
                  <ellipse cx="86" cy="314" rx="14" ry="8" fill={items[4]?.color || "#f0d0c0"}/>
                  <ellipse cx="114" cy="314" rx="14" ry="8" fill={items[4]?.color || "#f0d0c0"}/>
                  {/* Bag */}
                  <rect x="148" y="100" width="22" height="28" rx="4" fill={items[3]?.color || "#e8dcc8"} stroke="#ccc" strokeWidth="0.5"/>
                  <path d="M152 100 Q159 88 166 100" fill="none" stroke={items[3]?.color || "#e8dcc8"} strokeWidth="2"/>
                </svg>

                {/* Item labels - left side */}
                {items.map((item, i) => (
                  <div key={i} style={{
                    position: "absolute", top: item.y, ...(i % 2 === 0 ? { left: 8 } : { right: 8 }),
                    background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)",
                    borderRadius: 10, padding: "4px 8px", maxWidth: "35%",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)",
                  }}>
                    <p style={{ fontSize: 9, fontWeight: 600, color: "#a855f7", margin: 0 }}>{item.part}</p>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "#334155", margin: 0 }}>{item.name}</p>
                  </div>
                ))}
              </div>

              {/* Fashion items for purchase */}
              <div style={{ padding: "14px 16px 0" }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#334155", margin: "0 0 10px" }}>コーデアイテム</h3>
                {items.map((item, i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "10px 12px", marginBottom: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.03)", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: item.color, border: "1px solid rgba(0,0,0,0.06)", flexShrink: 0 }}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#334155", margin: 0 }}>{item.name}</p>
                      <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>{item.shade}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", margin: "0 0 2px" }}>¥{item.price.toLocaleString()}</p>
                      <span style={{ fontSize: 9, background: "linear-gradient(135deg, #f59e0b, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 600 }}>KIREI SELECT</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total + CTA */}
              <div style={{ padding: "8px 16px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "0 4px" }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>コーデ合計（{items.length}点）</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#334155" }}>¥{items.reduce((a, i) => a + i.price, 0).toLocaleString()}</span>
                </div>
                <button style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #f59e0b, #ec4899)", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 16px rgba(236,72,153,0.3)", marginBottom: 8 }}>
                  🛒 まとめて購入する
                </button>
                <button onClick={() => setShowCoord(false)} style={{ width: "100%", padding: 10, background: "none", border: "1px solid #e2e8f0", borderRadius: 14, fontSize: 12, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>
                  結果画面に戻る
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SNS Share */}
      <div style={{ margin: "0 16px 12px", display: "flex", gap: 8 }}>
        <button style={{ flex: 1, padding: 11, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, fontSize: 12, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>📸 ビフォーアフターを保存</button>
        <button style={{ flex: 1, padding: 11, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, fontSize: 12, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>📤 シェアする</button>
      </div>

      {/* Restart */}
      <div style={{ padding: "0 16px" }}>
        <button onClick={() => { setScreen(SC.MIRROR); setSkinDone(false); setPcDone(false); setSelectedLook(null); }} style={{ width: "100%", padding: 12, background: "linear-gradient(135deg, #a855f7, #ec4899)", border: "none", borderRadius: 14, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
          もう一度ミラーを開く
        </button>
      </div>
      <p style={{ textAlign: "center", fontSize: 10, color: "#cbd5e1", marginTop: 12, padding: "0 20px" }}>※本アプリは医療診断を行うものではありません。パーソナルカラーは傾向を示す参考情報です。</p>
    </div>
  );
}
