/**
 * CartSummaryBar — カート固定バー（ARトライオン下部）
 */
export default function CartSummaryBar({ items, totalPrice, onCheckout }) {
  if (!items || items.length === 0) return null;

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(168,85,247,0.12)',
      padding: '8px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      zIndex: 100,
    }}>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>
          {'\uD83D\uDED2'} {items.length}{'\u70B9'}
        </span>
        <span style={{ fontSize: 13, color: '#a855f7', fontWeight: 700, marginLeft: 8 }}>
          {'\u00A5'}{totalPrice.toLocaleString()}
        </span>
      </div>
      <button onClick={onCheckout} style={{
        background: 'linear-gradient(135deg, #a855f7, #ec4899)',
        color: '#fff', border: 'none', borderRadius: 20,
        padding: '8px 16px', fontSize: 12, fontWeight: 700,
        cursor: 'pointer', whiteSpace: 'nowrap',
      }}>
        {'\u5546\u54C1\u8CFC\u5165\u3078 \u2192'}
      </button>
    </div>
  );
}
