const STATUS_STYLES = {
  searching: {
    stroke: 'rgba(255,255,255,0.5)',
    strokeDasharray: '8 6',
    fill: 'none',
    shadow: 'none',
  },
  detected: {
    stroke: '#a855f7',
    strokeDasharray: 'none',
    fill: 'rgba(168,85,247,0.04)',
    shadow: '0 0 12px rgba(168,85,247,0.3)',
  },
  ready: {
    stroke: '#22c55e',
    strokeDasharray: 'none',
    fill: 'rgba(34,197,94,0.06)',
    shadow: '0 0 20px rgba(34,197,94,0.4)',
  },
};

export default function GuideFrame({ mode = 'face', status = 'searching', confidence = 0 }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.searching;
  const isReady = status === 'ready';

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      {/* シャッターフラッシュ */}
      {isReady && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255,255,255,0.6)',
          animation: 'shutterFlash 0.3s ease-out forwards',
        }} />
      )}
      <style>{`
        @keyframes shutterFlash{from{opacity:1}to{opacity:0}}
        @keyframes guidePulse{0%,100%{opacity:0.8;transform:scale(1)}50%{opacity:1;transform:scale(1.02)}}
        @keyframes guideReady{0%{stroke-width:2}50%{stroke-width:4}100%{stroke-width:2}}
      `}</style>

      {mode === 'face' ? (
        // ===== KIREI 顔ガイド overlay =====
        // viewBox="0 0 195 346" に合わせた絶対値
        // カメラ映像の上に position:absolute で重ねる
        <svg
          style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}
          viewBox="0 0 195 346"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 顔ガイド楕円 */}
          <ellipse
            cx="97" cy="146" rx="68" ry="98"
            fill="rgba(255,255,255,0.05)"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="1.6"
            strokeDasharray="7 4"
            strokeLinecap="round"
          />
          {/* 左目 */}
          <ellipse
            cx="67" cy="134" rx="20" ry="12"
            fill="rgba(168,85,247,0.1)"
            stroke="rgba(168,85,247,0.75)"
            strokeWidth="1.2"
          />
          {/* 右目 */}
          <ellipse
            cx="127" cy="134" rx="20" ry="12"
            fill="rgba(168,85,247,0.1)"
            stroke="rgba(168,85,247,0.75)"
            strokeWidth="1.2"
          />
          {/* 眉毛ライン(左) */}
          <line
            x1="49" y1="123"
            x2="85" y2="121"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1" strokeDasharray="3 3"
          />
          {/* 眉毛ライン(右) */}
          <line
            x1="109" y1="121"
            x2="145" y2="123"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1" strokeDasharray="3 3"
          />
          {/* 鼻ガイド */}
          <ellipse
            cx="97" cy="172" rx="14" ry="10"
            fill="none"
            stroke="rgba(168,85,247,0.6)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          {/* 口ガイド弧 — 端点を目の中心に揃え、カーブを少し深めに */}
          <path
            d="M67,202 Q97,218 127,202"
            fill="none"
            stroke="rgba(168,85,247,0.75)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          {/* 左耳ライン */}
          <path
            d="M32,129 Q22,134 32,163"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* 右耳ライン */}
          <path
            d="M162,129 Q172,134 162,163"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        // 口元用: 横長角丸矩形
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{
            filter: s.shadow !== 'none' ? `drop-shadow(${s.shadow})` : 'none',
            animation: isReady ? 'guidePulse 0.6s ease-in-out' : 'none',
          }}
        >
          <rect
            x="20" y="30" width="60" height="35" rx="16" ry="16"
            fill={s.fill}
            stroke={s.stroke}
            strokeWidth={isReady ? 3 : 2}
            strokeDasharray={s.strokeDasharray}
            style={isReady ? { animation: 'guideReady 0.6s ease-in-out' } : {}}
          />
        </svg>
      )}

      {/* ステータスラベル */}
      {!isReady && (
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          background: status === 'detected' ? 'rgba(168,85,247,0.85)' : 'rgba(0,0,0,0.5)',
          borderRadius: 20,
          padding: '4px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          {status === 'searching' && (
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse 1s ease-in-out infinite' }} />
          )}
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
          <span style={{ fontSize: 10, color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {status === 'searching'
              ? (mode === 'face' ? '枠に顔を合わせてね' : '口を開けて枠に合わせてね')
              : 'そのまま…'}
          </span>
        </div>
      )}
    </div>
  );
}
