import { useT } from '../i18n/index.jsx';

/**
 * CartSummaryBar — 画面下部に常時固定表示されるカートサマリー
 */
export default function CartSummaryBar({ cartItems, totalPrice, makeupCount, skincareCount, onCheckout, style }) {
  const { t } = useT();

  if (!cartItems || cartItems.length === 0) return null;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(12px)',
      padding: '10px 16px',
      borderTop: '1px solid #ede9fe',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      ...style,
    }}>
      <div>
        <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>
          {makeupCount > 0 && <span>{'\uD83D\uDC84'} {makeupCount}{t('cart.items') || '\u70B9'}</span>}
          {skincareCount > 0 && <span>{'\uD83E\uDDF4'} {skincareCount}{t('cart.items') || '\u70B9'}</span>}
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#1e293b' }}>
          {'\u00A5'}{totalPrice.toLocaleString()}
        </div>
      </div>
      <button onClick={onCheckout} style={{
        background: 'linear-gradient(135deg, #a855f7, #ec4899)',
        color: '#fff', border: 'none', borderRadius: 24,
        padding: '10px 20px', fontWeight: 700, fontSize: 13,
        cursor: 'pointer', whiteSpace: 'nowrap',
        boxShadow: '0 4px 12px rgba(168,85,247,0.25)',
      }}>
        {t('cart.checkout') || '\u307E\u3068\u3081\u3066\u8CFC\u5165'}
      </button>
    </div>
  );
}
