import { useState } from 'react';
import { createPortal } from 'react-dom';
import Kirari from './Kirari.jsx';
import Bubble from './Bubble.jsx';
import Score from './Score.jsx';
import ProductCard from './ProductCard.jsx';
import ProductModal from './ProductModal.jsx';
import ClinicModal from './ClinicModal.jsx';
import { useT } from '../i18n/index.jsx';
import { SKIN_SCORES, DENTAL_SCORES } from '../data/scores.js';
import { SKIN_PRODUCTS, DENTAL_PRODUCTS, selectAdvice } from '../data/products.js';

function avg(scores) {
  const vals = Object.values(scores).map(v => v.score);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export default function ResultScreen({ skinScores: propSkin, dentalScores: propDental, onRestart, onDentalCheck }) {
  const { t } = useT();
  const hasSkin = propSkin !== null;
  const hasDental = propDental !== null;
  const defaultTab = hasSkin ? "skin" : "dental";
  const [tab, setTab] = useState(defaultTab);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showClinicModal, setShowClinicModal] = useState(false);

  const skinScores = propSkin || SKIN_SCORES;
  const dentalScores = propDental || DENTAL_SCORES;
  const items = tab === "skin" ? skinScores : dentalScores;
  const overallSkin = hasSkin ? avg(skinScores) : null;
  const overallDental = hasDental ? avg(dentalScores) : null;

  const generateMessage = () => {
    const scores = tab === "skin" ? (hasSkin ? skinScores : null) : (hasDental ? dentalScores : null);
    if (!scores) return t("result.no_score");
    const entries = Object.entries(scores).sort((a, b) => a[1].score - b[1].score);
    const worst = entries[0];
    const best = entries[entries.length - 1];
    const avgScore = entries.reduce((s, [, v]) => s + v.score, 0) / entries.length;

    if (avgScore >= 80) return t("result.high", { best: t(best[1].labelKey) });
    if (avgScore >= 60) return t("result.mid", { best: t(best[1].labelKey), worst: t(worst[1].labelKey) });
    return t("result.low", { worst: t(worst[1].labelKey) });
  };

  const kirariMsg = generateMessage();

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, overflowY: "auto", background: "linear-gradient(180deg, #faf5ff 0%, #fdf2f8 35%, #fff 65%, #f0fdf4 100%)" }}>
      <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, padding: "2px 20px 0" }}>{t("result.title")}</p>

      <div style={{ display: "flex", justifyContent: "center", gap: 24, padding: "16px 20px 8px" }}>
        {hasSkin && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <Score score={overallSkin} size={hasSkin && hasDental ? 90 : 110} color="#a855f7" delay={0} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#a855f7" }}>{t("result.skin_score")}</span>
          </div>
        )}
        <Kirari size={56} expression="happy" bounce />
        {hasDental && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <Score score={overallDental} size={hasSkin && hasDental ? 90 : 110} color="#22c55e" delay={200} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#22c55e" }}>{t("result.dental_label")}</span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 16px 12px" }}>
        <Kirari size={36} expression="wink" />
        <Bubble><p style={{ fontSize: 12, color: "#334155", margin: 0, lineHeight: 1.6 }}>{kirariMsg}</p></Bubble>
      </div>

      {hasSkin && hasDental && (
        <div style={{ display: "flex", margin: "0 16px 12px", background: "#f1f5f9", borderRadius: 14, padding: 3 }}>
          {[["skin", t("result.tab_skin"), "#a855f7"], ["dental", t("result.tab_dental"), "#22c55e"]].map(([key, label, color]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: "8px 0", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer",
              background: tab === key ? "#fff" : "transparent",
              color: tab === key ? color : "#94a3b8",
              boxShadow: tab === key ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
            }}>{label}</button>
          ))}
        </div>
      )}

      <div className="tab-content" key={tab}>
        <div style={{ padding: "0 16px", display: "flex", justifyContent: "center", gap: 8, marginBottom: 12 }}>
          {Object.entries(items).map(([k, v], i) => (
            <Score key={k} score={v.score} size={72} color={v.color} label={t(v.labelKey)} delay={100 + i * 200} />
          ))}
        </div>

        <div style={{ padding: "0 16px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
            <Kirari size={32} expression="sparkle" />
            <p style={{ fontSize: 12, color: "#64748b", margin: 0, paddingTop: 4 }}>
              {tab === "skin" ? t("result.advice_skin") : t("result.advice_dental")}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {selectAdvice(
              tab === "skin" ? skinScores : dentalScores,
              tab === "skin" ? SKIN_PRODUCTS : DENTAL_PRODUCTS
            ).map((p, i) => <ProductCard key={i} {...p} onClick={() => setSelectedProduct(p)} />)}
          </div>
        </div>
      </div>

      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />

      {tab === "dental" && (
        <div style={{ display: "flex", gap: 10, padding: "0 16px", marginBottom: 14 }}>
          {[
            { icon: "🦷", title: t("result.whitening_title"), desc: t("result.whitening_desc"), color: "#a855f7", btn: t("result.whitening_btn") },
            { icon: "😬", title: t("result.ortho_title"), desc: t("result.ortho_desc"), color: "#f59e0b", btn: t("result.ortho_btn") },
          ].map((item, i) => (
            <div key={i} style={{ flex: 1, background: item.color + "08", borderRadius: 16, padding: "12px 14px", border: `1px solid ${item.color}20` }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{item.icon}</div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#334155", margin: "0 0 2px" }}>{item.title}</p>
              <p style={{ fontSize: 10, color: "#64748b", margin: "0 0 8px" }}>{item.desc}</p>
              <button className="btn-primary" onClick={() => alert(t("result.detail_coming"))} style={{ width: "100%", padding: "6px 0", background: item.color, border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, color: "#fff", cursor: "pointer" }}>{item.btn}</button>
            </div>
          ))}
        </div>
      )}

      {tab === "dental" && (
        <div style={{ margin: "0 16px 12px", background: "#fff", borderRadius: 18, padding: "14px 16px", boxShadow: "0 2px 12px rgba(139,92,246,0.08)", border: "1px solid #ede9fe" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
            <Kirari size={36} expression="happy" />
            <p style={{ fontSize: 11, color: "#475569", margin: 0, lineHeight: 1.6, flex: 1 }}>{t("result.clinic_prompt")}</p>
          </div>
          <button className="btn-primary" onClick={() => setShowClinicModal(true)} style={{ width: "100%", padding: 12, background: "linear-gradient(135deg, #a855f7, #ec4899)", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 16px rgba(168,85,247,0.25)" }}>{t("result.find_clinic")}</button>
        </div>
      )}

      <ClinicModal show={showClinicModal} onClose={() => setShowClinicModal(false)} />

      <a href="https://www.youtube.com/@shichou-doctors" target="_blank" rel="noopener noreferrer" style={{ display: "flex", margin: "0 16px 12px", background: "#fff", borderRadius: 16, padding: "10px 14px", alignItems: "center", gap: 10, cursor: "pointer", boxShadow: "0 1px 6px rgba(0,0,0,0.03)", border: "1px solid #fecaca", textDecoration: "none" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #ef4444, #f87171)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, color: "#fff" }}>&#x25B6;</div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#334155", margin: 0 }}>{t("result.youtube_title")}</p>
          <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>{t("result.youtube_desc")}</p>
        </div>
      </a>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {!hasDental && onDentalCheck && (
          <button className="btn-primary" onClick={onDentalCheck} style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #22c55e, #10b981)", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 16px rgba(34,197,94,0.25)", textAlign: "center" }}>
            {t("result.dental_check_btn")}
          </button>
        )}
        {!hasSkin && onDentalCheck && (
          <button className="btn-primary" onClick={onDentalCheck} style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #a855f7, #c084fc)", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 16px rgba(168,85,247,0.25)", textAlign: "center" }}>
            {t("result.skin_check_btn")}
          </button>
        )}
        <button className="btn-secondary" onClick={onRestart} style={{ width: "100%", padding: 11, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, fontSize: 12, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>{t("result.restart")}</button>
      </div>
      <p className="disclaimer" style={{ textAlign: "center", fontSize: 10, color: "#cbd5e1", marginTop: 12, padding: "0 20px" }}>{t("result.disclaimer")}</p>
    </div>,
    document.body
  );
}
