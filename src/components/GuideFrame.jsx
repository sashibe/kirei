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
          width="72%"
          height="70%"
          viewBox="-5 -5 110 130"
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
            <ellipse cx="50" cy="58" rx="42" ry="45" fill={s.fill} />
            {/* 左耳 */}
            <path d="M8,56 Q1,52 2,64 Q3,73 9,70" />
            {/* 右耳 */}
            <path d="M92,56 Q99,52 98,64 Q97,73 91,70" />
            {/* 左目 */}
            <path d="M31,63 Q37,57 43,63 Q37,67 31,63" strokeWidth={isReady ? 2 : 1.4} />
            <circle cx="37" cy="63" r="2" fill={s.stroke} stroke="none" />
            {/* 右目 */}
            <path d="M57,63 Q63,57 69,63 Q63,67 57,63" strokeWidth={isReady ? 2 : 1.4} />
            <circle cx="63" cy="63" r="2" fill={s.stroke} stroke="none" />
            {/* 眉（左） */}
            <path d="M29,54 Q37,48 45,54" strokeWidth={isReady ? 1.8 : 1.2} />
            {/* 眉（右） */}
            <path d="M55,54 Q63,48 71,54" strokeWidth={isReady ? 1.8 : 1.2} />
            {/* 鼻 */}
            <path d="M50,67 L48,79 Q50,82 52,79 Z" strokeWidth={isReady ? 1.5 : 1} fill="none" />
            {/* 口 */}
            <path d="M39,89 Q44,94 50,93 Q56,94 61,89" strokeWidth={isReady ? 1.8 : 1.2} />
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
