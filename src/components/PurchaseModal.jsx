import { useT } from '../i18n/index.jsx';

export default function PurchaseModal({ products, onClose }) {
  const { t } = useT();
  const total = products.reduce((s, p) => s + p.price, 0);
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div style={{
        width: '100%', maxWidth: 400, margin: '0 auto',
        background: '#fff', borderRadius: '24px 24px 0 0',
        padding: '20px 16px 32px',
        maxHeight: '80vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#334155' }}>
            KIREI SELECT
          </h2>
          <button onClick={onClose} style={{
            background: '#f1f5f9', border: 'none', borderRadius: 10,
            width: 32, height: 32, fontSize: 16, cursor: 'pointer', color: '#64748b',
          }}>✕</button>
        </div>

        {products.map((p, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 0',
            borderBottom: i < products.length - 1 ? '1px solid #f1f5f9' : 'none',
          }}>
            <span style={{ fontSize: 22, width: 32, textAlign: 'center' }}>{p.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#334155', margin: 0 }}>
                {typeof p.name === 'object' ? t(p.name) : p.name}
              </p>
              <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>
                {typeof p.shade === 'object' ? t(p.shade) : p.shade}
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#a855f7', margin: '0 0 2px' }}>
                ¥{p.price.toLocaleString()}
              </p>
              <a
                href={`https://www.amazon.co.jp/s?k=${encodeURIComponent(typeof p.name === 'object' ? p.name.ja : p.name)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 9, color: '#a855f7', textDecoration: 'none' }}
              >
                {t('result.check_item')} →
              </a>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>{t('result.total')}</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#a855f7' }}>
              ¥{total.toLocaleString()}
            </span>
          </div>
          <a
            href="https://www.amazon.co.jp/s?k=スキンケア+コスメ"
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'block', width: '100%', padding: 14, boxSizing: 'border-box',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              borderRadius: 14, textAlign: 'center',
              fontSize: 14, fontWeight: 700, color: '#fff', textDecoration: 'none',
            }}
          >
            🛒 {t('result.purchase_all')}
          </a>
          <p style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', margin: '8px 0 0' }}>
            {t('result.purchase_note')}
          </p>
        </div>
      </div>
    </div>
  );
}
