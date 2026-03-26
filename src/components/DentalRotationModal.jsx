// DentalRotationModal.jsx
// デンタルチェック横向き誘導モーダル
import { useEffect, useState } from 'react';

const DentalRotationModal = ({ onReady, onSkip }) => {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    // ① Android: APIで自動ロック試行
    if (screen.orientation?.lock) {
      screen.orientation.lock('landscape').catch(() => {
        // iOS Safari は失敗するので何もしない
      });
    }
    // ② リサイズで横向きを検知
    const check = () => {
      const landscape = window.innerWidth > window.innerHeight;
      setIsLandscape(landscape);
      if (landscape) onReady();
    };
    window.addEventListener('resize', check);
    check();
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isLandscape) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg, #faf5ff 0%, #fdf2f8 40%, #fff 100%)',
      padding: '24px 20px',
      fontFamily: "'Noto Sans JP', sans-serif",
    }}>

      {/* キラリ */}
      <div style={{
        fontSize: 48,
        animation: 'bounce 1.5s ease-in-out infinite',
        marginBottom: 16,
      }}>
        🧚
      </div>

      {/* 回転アイコン（スマホ→横向き） */}
      <svg width="96" height="96" viewBox="0 0 96 96" fill="none" style={{ marginBottom: 20 }}>
        <rect
          x="28" y="16" width="40" height="64" rx="8"
          stroke="#a855f7" strokeWidth="3" fill="rgba(168,85,247,0.08)"
          style={{ transformOrigin: '48px 48px', animation: 'rotPh 2s ease-in-out infinite' }}
        />
        <path
          d="M72,48 A24,24 0 0,1 48,72"
          stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" fill="none"
        />
        <path
          d="M48,72 L52,65 M48,72 L42,68"
          stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round"
        />
      </svg>

      {/* メインメッセージ */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <p style={{
          fontSize: 20, fontWeight: 700, margin: '0 0 8px',
          background: 'linear-gradient(135deg, #a855f7, #ec4899)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          スマホを横向きにしてね！
        </p>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
          口元をしっかり映すために<br />
          横向きにするときれいに撮れるよ♪
        </p>
      </div>

      {/* 画面ロック注意 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(168,85,247,0.06)', borderRadius: 12, padding: '12px 16px',
        marginBottom: 12, maxWidth: 300, width: '100%',
      }}>
        {/* 鍵アイコン */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
          <rect x="4" y="9" width="12" height="9" rx="2" stroke="#a855f7" strokeWidth="1.5" />
          <path d="M7,9 V6 A3,3 0 0,1 13,6 V9" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <circle cx="10" cy="13.5" r="1.5" fill="#a855f7" />
        </svg>
        <span style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
          画面ロック中の場合はコントロールセンターで解除してね
        </span>
      </div>

      {/* コントロールセンターヒント */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 28, opacity: 0.6,
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8,2 L8,8" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M5,5 L8,2 L11,5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <span style={{ fontSize: 10, color: '#94a3b8' }}>
          上からスワイプ →「回転ロック」アイコンをタップ
        </span>
      </div>

      {/* スキップボタン */}
      <button
        onClick={onSkip}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 12, color: '#94a3b8', textDecoration: 'underline',
          padding: '8px 16px',
          fontFamily: "'Noto Sans JP', sans-serif",
        }}
      >
        スキップ（画質が下がる場合があります）
      </button>

      {/* アニメーション定義 */}
      <style>{`
        @keyframes bounce {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-6px); }
        }
        @keyframes rotPh {
          0%       { transform: rotate(0deg); }
          50%,100% { transform: rotate(-90deg); }
        }
      `}</style>
    </div>
  );
};

export default DentalRotationModal;
