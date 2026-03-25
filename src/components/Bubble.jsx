export default function Bubble({ children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 18, padding: "10px 14px", boxShadow: "0 2px 12px rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.1)", flex: 1, position: "relative" }}>
      <div style={{ position: "absolute", top: 14, left: -7, width: 0, height: 0, borderTop: "7px solid transparent", borderBottom: "7px solid transparent", borderRight: "7px solid #fff" }} />
      {children}
    </div>
  );
}
