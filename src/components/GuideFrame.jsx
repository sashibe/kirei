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
        // 顔用: 簡易フェイスシルエット（目・鼻・口・耳）
        <svg
          width="68%"
          height="75%"
          viewBox="-5 0 110 120"
          preserveAspectRatio="none"
          style={{
            filter: s.shadow !== 'none' ? `drop-shadow(${s.shadow})` : 'none',
            animation: isReady ? 'guidePulse 0.6s ease-in-out' : 'none',
          }}
        >
          <g
            fill="none"
            stroke={s.stroke}
            strokeWidth={isReady ? 2.5 : 1.8}
            strokeDasharray={s.strokeDasharray}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={isReady ? { animation: 'guideReady 0.6s ease-in-out' } : {}}
          >
            {/* 顔の輪郭 */}
            <ellipse cx="50" cy="55" rx="35" ry="42" fill={s.fill} />
            {/* 左耳 */}
            <path d="M15,48 Q9,44 10,55 Q11,64 16,62" />
            {/* 右耳 */}
            <path d="M85,48 Q91,44 90,55 Q89,64 84,62" />
            {/* 左目 */}
            <path d="M30,46 Q37,40 44,46 Q37,50 30,46" strokeWidth={isReady ? 2 : 1.4} />
            <circle cx="37" cy="46" r="2" fill={s.stroke} stroke="none" />
            {/* 右目 */}
            <path d="M56,46 Q63,40 70,46 Q63,50 56,46" strokeWidth={isReady ? 2 : 1.4} />
            <circle cx="63" cy="46" r="2" fill={s.stroke} stroke="none" />
            {/* 眉（左） */}
            <path d="M28,37 Q37,31 46,37" strokeWidth={isReady ? 1.8 : 1.2} />
            {/* 眉（右） */}
            <path d="M54,37 Q63,31 72,37" strokeWidth={isReady ? 1.8 : 1.2} />
            {/* 鼻 */}
            <path d="M50,50 Q49,58 46,64 Q50,66 54,64 Q51,58 50,50" strokeWidth={isReady ? 1.5 : 1} fill="none" />
            {/* 口 */}
            <path d="M38,76 Q44,82 50,80 Q56,82 62,76" strokeWidth={isReady ? 1.8 : 1.2} />
          </g>
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
