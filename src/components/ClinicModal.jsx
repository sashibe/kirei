import Kirari from './Kirari.jsx';
import { CLINICS } from '../data/clinics.js';

export default function ClinicModal({ show, onClose }) {
  if (!show) return null;
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "modalBg 0.2s ease" }}>
      <style>{`@keyframes modalBg{from{opacity:0}to{opacity:1}} @keyframes modalSlide{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 390, padding: "20px 20px 32px", animation: "modalSlide 0.3s ease" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e2e8f0", margin: "0 auto 16px" }} />

        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#f0fdf4", borderRadius: 14, padding: "10px 12px", marginBottom: 16 }}>
          <Kirari size={32} expression="happy" />
          <p style={{ fontSize: 11, color: "#475569", margin: 0, lineHeight: 1.6, flex: 1 }}>お近くの提携歯科だよ♪</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {CLINICS.map(clinic => (
            <div key={clinic.id} style={{ background: "#faf5ff", borderRadius: 14, padding: "12px 14px", border: "1px solid #ede9fe" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#334155", margin: "0 0 2px" }}>{clinic.name}</p>
              <p style={{ fontSize: 10, color: "#64748b", margin: "0 0 6px" }}>{clinic.area}</p>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {clinic.services.map(s => (
                  <span key={s} style={{ fontSize: 9, fontWeight: 600, color: "#a855f7", background: "#a855f715", padding: "2px 7px", borderRadius: 6 }}>{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button onClick={onClose} style={{ width: "100%", padding: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, fontSize: 12, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>閉じる</button>
      </div>
    </div>
  );
}
