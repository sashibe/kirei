import Kirari from './Kirari.jsx';

export default function ProductModal({ product, onClose }) {
  if (!product) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "modalBg 0.2s ease" }}>
      <style>{`@keyframes modalBg{from{opacity:0}to{opacity:1}} @keyframes modalSlide{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 390, padding: "20px 20px 32px", animation: "modalSlide 0.3s ease" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e2e8f0", margin: "0 auto 16px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: product.tagColor + "10", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{product.emoji}</div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>{product.name}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: product.tagColor, background: product.tagColor + "15", padding: "2px 7px", borderRadius: 6 }}>{product.tag}</span>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{product.brand}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 12 }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: "#1e293b" }}>¥{product.price.toLocaleString()}</span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>(税込)</span>
          {product.size && <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>{product.size}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#faf5ff", borderRadius: 14, padding: "10px 12px", marginBottom: 14 }}>
          <Kirari size={32} expression="sparkle" />
          <p style={{ fontSize: 11, color: "#475569", margin: 0, lineHeight: 1.6, flex: 1 }}>{product.kirpicomment}</p>
        </div>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>おすすめポイント</p>
          {product.features.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 4 }}>
              <span style={{ color: product.tagColor, fontSize: 12, marginTop: 1, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 11, color: "#475569", lineHeight: 1.5 }}>{f}</span>
            </div>
          ))}
        </div>
        <button style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #a855f7, #ec4899)", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 16px rgba(168,85,247,0.25)", marginBottom: 8 }}>購入ページを開く</button>
        <button onClick={onClose} style={{ width: "100%", padding: 10, background: "transparent", border: "none", fontSize: 12, color: "#94a3b8", cursor: "pointer" }}>閉じる</button>
      </div>
    </div>
  );
}
