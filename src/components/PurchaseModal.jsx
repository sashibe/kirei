import { useState } from 'react';
import { useT } from '../i18n/index.jsx';

const MUSINSA_BASE = 'https://global.musinsa.com/jp/main/beauty';

function buildMusinsaUrl(productName) {
  return `${MUSINSA_BASE}?q=${encodeURIComponent(productName)}`;
}

// 朝・夜で同一商品（name.ja が同じ）を統合する
function deduplicateProducts(products) {
  const seen = new Map(); // name.ja → index in result
  const result = [];

  for (const p of products) {
    const key = typeof p.name === 'object' ? (p.name.ja ?? '') : (p.name ?? '');
    if (seen.has(key)) {
      const existing = result[seen.get(key)];
      // 朝・夜兼用としてマーク（timingが異なる場合）
      if (existing.timing && p.timing && existing.timing !== p.timing) {
        existing.timing = 'both';
      }
      // 重複なので追加しない（価格も1個分のまま）
    } else {
      seen.set(key, result.length);
      result.push({ ...p });
    }
  }
  return result;
}

export default function PurchaseModal({ products, onClose }) {
  const { t } = useT();

  const deduped = deduplicateProducts(products);
  const [selected, setSelected] = useState(() => deduped.map(() => true));

  const toggle = (i) => setSelected(s => s.map((v, j) => j === i ? !v : v));
  const selectedProducts = deduped.filter((_, i) => selected[i]);
  const total = selectedProducts.reduce((s, p) => s + p.price, 0);
  const count = selectedProducts.length;

  // timingがある場合はセクションヘッダーを挿入する
  const hasTimings = deduped.some(p => p.timing);

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

        {hasTimings ? (
          <>
            <SectionHeader label="☀️ 朝のルーティン" />
            {deduped.map((p, i) => {
              if (p.timing === 'night') return null;
              return (
                <ProductRow key={i} p={p} i={i} selected={selected[i]} toggle={toggle} t={t} />
              );
            })}
            <SectionHeader label="🌙 夜のルーティン" />
            {deduped.map((p, i) => {
              if (p.timing === 'morning') return null;
              return (
                <ProductRow key={i} p={p} i={i} selected={selected[i]} toggle={toggle} t={t} />
              );
            })}
          </>
        ) : (
          deduped.map((p, i) => (
            <ProductRow key={i} p={p} i={i} selected={selected[i]} toggle={toggle} t={t} />
          ))
        )}

        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {t('result.total_selected', { count: String(count) })}
            </span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#a855f7' }}>
              ¥{total.toLocaleString()}
            </span>
          </div>
          <a
            href={MUSINSA_BASE}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'block', width: '100%', padding: 14, boxSizing: 'border-box',
              background: count > 0
                ? 'linear-gradient(135deg, #a855f7, #ec4899)'
                : '#cbd5e1',
              borderRadius: 14, textAlign: 'center',
              fontSize: 14, fontWeight: 700, color: '#fff', textDecoration: 'none',
              pointerEvents: count > 0 ? 'auto' : 'none',
              transition: 'background 0.2s',
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

function SectionHeader({ label }) {
  return (
    <div style={{
      fontSize: 12, fontWeight: 700, color: '#64748b',
      padding: '8px 0 4px',
      borderTop: '1px solid #f1f5f9',
      marginTop: 4,
    }}>
      {label}
    </div>
  );
}

function ProductRow({ p, i, selected, toggle, t }) {
  const productName = typeof p.name === 'object' ? p.name.ja : p.name;
  const displayName = (typeof p.name === 'object' ? t(p.name) : p.name) +
    (p.timing === 'both' ? '（朝・夜兼用）' : '');

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 0',
      borderBottom: '1px solid #f1f5f9',
      opacity: selected ? 1 : 0.45,
      transition: 'opacity 0.2s',
    }}>
      <input
        type="checkbox"
        checked={selected}
        onChange={() => toggle(i)}
        style={{
          width: 18, height: 18, accentColor: '#a855f7',
          cursor: 'pointer', flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 22, width: 28, textAlign: 'center' }}>{p.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#334155', margin: 0 }}>
          {displayName}
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
          href={buildMusinsaUrl(productName)}
          target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 9, color: '#a855f7', textDecoration: 'none' }}
        >
          {t('result.check_item')} →
        </a>
      </div>
    </div>
  );
}
