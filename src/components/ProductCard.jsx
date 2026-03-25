export default function ProductCard({ emoji, name, reason, tag, tagColor, onClick }) {
  return (
    <div onClick={onClick} style={{ background: "#fff", borderRadius: 14, padding: "10px 12px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", minWidth: 200, flexShrink: 0, transition: "box-shadow 0.15s" }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 1 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>{name}</span>
          {tag && <span style={{ fontSize: 8, fontWeight: 700, color: tagColor, background: tagColor + "15", padding: "1px 5px", borderRadius: 5 }}>{tag}</span>}
        </div>
        <p style={{ fontSize: 10, color: "#94a3b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{reason}</p>
      </div>
      <span style={{ fontSize: 14, color: "#cbd5e1", flexShrink: 0 }}>›</span>
    </div>
  );
}
