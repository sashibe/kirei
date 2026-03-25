import { useState } from 'react';
import Kirari from './Kirari.jsx';
import Bubble from './Bubble.jsx';
import Score from './Score.jsx';
import ProductCard from './ProductCard.jsx';
import ProductModal from './ProductModal.jsx';
import { SKIN_SCORES, DENTAL_SCORES } from '../data/scores.js';
import { SKIN_ADVICE, DENTAL_ADVICE } from '../data/products.js';

function avg(scores) {
  const vals = Object.values(scores).map(v => v.score);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function generateMessage(tab, skinScores, dentalScores) {
  if (tab === "skin") {
    const best = Object.entries(skinScores).sort((a, b) => b[1].score - a[1].score)[0];
    const worst = Object.entries(skinScores).sort((a, b) => a[1].score - b[1].score)[0];
    return `${best[1].label}は良い感じ♪ ${worst[1].label}ケアをプラスするともっと良くなるかも〜`;
  }
  const worst = Object.entries(dentalScores).sort((a, b) => a[1].score - b[1].score)[0];
  return `${worst[1].label}ケアをがんばれば、もっとスコアが上がるよ〜！`;
}

export default function ResultScreen({ skinScores: propSkin, dentalScores: propDental, onRestart }) {
  const [tab, setTab] = useState("skin");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const skinScores = propSkin || SKIN_SCORES;
  const dentalScores = propDental || DENTAL_SCORES;
  const items = tab === "skin" ? skinScores : dentalScores;
  const overallSkin = avg(skinScores);
  const overallDental = avg(dentalScores);
  const kirariMsg = generateMessage(tab, skinScores, dentalScores);

  return (
    <>
      <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, padding: "2px 20px 0" }}>チェック結果</p>

      <div style={{ display: "flex", justifyContent: "center", gap: 24, padding: "16px 20px 8px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <Score score={overallSkin} size={90} color="#a855f7" delay={0} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#a855f7" }}>肌スコア</span>
        </div>
        <Kirari size={56} expression="happy" bounce />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <Score score={overallDental} size={90} color="#22c55e" delay={200} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#22c55e" }}>デンタル</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 16px 12px" }}>
        <Kirari size={36} expression="wink" />
        <Bubble><p style={{ fontSize: 12, color: "#334155", margin: 0, lineHeight: 1.6 }}>{kirariMsg}</p></Bubble>
      </div>

      <div style={{ display: "flex", margin: "0 16px 12px", background: "#f1f5f9", borderRadius: 14, padding: 3 }}>
        {[["skin", "肌診断", "#a855f7"], ["dental", "デンタル", "#22c55e"]].map(([key, label, color]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: "8px 0", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer",
            background: tab === key ? "#fff" : "transparent",
            color: tab === key ? color : "#94a3b8",
            boxShadow: tab === key ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
          }}>{label}</button>
        ))}
      </div>

      <div style={{ padding: "0 16px", display: "flex", justifyContent: "center", gap: 8, marginBottom: 12 }}>
        {Object.entries(items).map(([k, v], i) => (
          <Score key={k} score={v.score} size={72} color={v.color} label={v.label} delay={100 + i * 200} />
        ))}
      </div>

      <div style={{ padding: "0 16px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
          <Kirari size={32} expression="sparkle" />
          <p style={{ fontSize: 12, color: "#64748b", margin: 0, paddingTop: 4 }}>
            {tab === "skin" ? "あなたの肌に合ったケアグッズ♪" : "あなたの口腔スコアに合ったケア♪"}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(tab === "skin" ? SKIN_ADVICE : DENTAL_ADVICE).map((p, i) => <ProductCard key={i} {...p} onClick={() => setSelectedProduct(p)} />)}
        </div>
      </div>

      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />

      {tab === "dental" && (
        <div style={{ display: "flex", gap: 10, padding: "0 16px", marginBottom: 14 }}>
          {[
            { icon: "🦷", title: "ホワイトニング", desc: "着色スコア55→改善", color: "#a855f7", btn: "詳しく見る" },
            { icon: "😬", title: "歯列矯正", desc: "歯並びスコア62→UP", color: "#f59e0b", btn: "無料相談" },
          ].map((t, i) => (
            <div key={i} style={{ flex: 1, background: t.color + "08", borderRadius: 16, padding: "12px 14px", border: `1px solid ${t.color}20` }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{t.icon}</div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#334155", margin: "0 0 2px" }}>{t.title}</p>
              <p style={{ fontSize: 10, color: "#64748b", margin: "0 0 8px" }}>{t.desc}</p>
              <button style={{ width: "100%", padding: "6px 0", background: t.color, border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, color: "#fff", cursor: "pointer" }}>{t.btn}</button>
            </div>
          ))}
        </div>
      )}

      {tab === "dental" && (
        <div style={{ margin: "0 16px 12px", background: "#fff", borderRadius: 18, padding: "14px 16px", boxShadow: "0 2px 12px rgba(139,92,246,0.08)", border: "1px solid #ede9fe" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
            <Kirari size={36} expression="happy" />
            <p style={{ fontSize: 11, color: "#475569", margin: 0, lineHeight: 1.6, flex: 1 }}>プロに診てもらうのがいちばん！近くの提携歯科を探してみてね♪</p>
          </div>
          <button style={{ width: "100%", padding: 12, background: "linear-gradient(135deg, #a855f7, #ec4899)", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 16px rgba(168,85,247,0.25)" }}>近くの提携歯科を探す →</button>
        </div>
      )}

      <div style={{ margin: "0 16px 12px", background: "#fff", borderRadius: 16, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", boxShadow: "0 1px 6px rgba(0,0,0,0.03)", border: "1px solid #fecaca" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #ef4444, #f87171)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, color: "#fff" }}>&#x25B6;</div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#334155", margin: 0 }}>歯腸ドクターズを見る</p>
          <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>プロの診察動画をチェック！</p>
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        <button onClick={onRestart} style={{ width: "100%", padding: 11, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, fontSize: 12, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>もう一度ミラーを開く</button>
      </div>
      <p style={{ textAlign: "center", fontSize: 10, color: "#cbd5e1", marginTop: 12, padding: "0 20px" }}>※本アプリは医療診断を行うものではありません。</p>
    </>
  );
}
