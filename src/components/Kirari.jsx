export default function Kirari({ size = 48, expression = "happy", bounce = false }) {
  const faces = {
    happy: (
      <>
        <ellipse cx="17" cy="19" rx="1.8" ry="2.2" fill="#4a235a" />
        <ellipse cx="27" cy="19" rx="1.8" ry="2.2" fill="#4a235a" />
        <circle cx="18.2" cy="18.2" r=".6" fill="#fff" />
        <circle cx="28.2" cy="18.2" r=".6" fill="#fff" />
        <path d="M19 25 Q22 30 25 25" stroke="#4a235a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </>
    ),
    thinking: (
      <>
        <ellipse cx="17" cy="19" rx="1.8" ry="2" fill="#4a235a" />
        <ellipse cx="27" cy="19" rx="1.8" ry="2" fill="#4a235a" />
        <circle cx="25" cy="26" r="2" fill="#4a235a" />
      </>
    ),
    sparkle: (
      <>
        <ellipse cx="17" cy="19" rx="1.8" ry="2.2" fill="#4a235a" />
        <ellipse cx="27" cy="19" rx="1.8" ry="2.2" fill="#4a235a" />
        <circle cx="18.2" cy="18.2" r=".6" fill="#fff" />
        <circle cx="28.2" cy="18.2" r=".6" fill="#fff" />
        <path d="M19 25 Q22 30 25 25" stroke="#4a235a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M32 10 L34 8 M34 12 L36 10" stroke="#f59e0b" strokeWidth=".8" strokeLinecap="round" />
      </>
    ),
    wink: (
      <>
        <ellipse cx="17" cy="19" rx="1.8" ry="2.2" fill="#4a235a" />
        <circle cx="18.2" cy="18.2" r=".6" fill="#fff" />
        <path d="M24 19 Q27 17 30 19" stroke="#4a235a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M19 25 Q22 30 25 25" stroke="#4a235a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </>
    ),
  };

  return (
    <div style={{ width: size, height: size, flexShrink: 0, animation: bounce ? "kb 1s ease-in-out infinite" : "none" }}>
      <style>{`@keyframes kb{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
      <svg viewBox="0 0 44 44" width={size} height={size}>
        <defs>
          <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e9d5ff" />
            <stop offset="100%" stopColor="#d8b4fe" />
          </linearGradient>
          <linearGradient id="wg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
            <stop offset="100%" stopColor="rgba(200,220,255,0.3)" />
          </linearGradient>
        </defs>
        <ellipse cx="8" cy="14" rx="7" ry="10" fill="url(#wg)" stroke="#c4b5fd" strokeWidth=".5" transform="rotate(-15 8 14)" />
        <ellipse cx="36" cy="14" rx="7" ry="10" fill="url(#wg)" stroke="#c4b5fd" strokeWidth=".5" transform="rotate(15 36 14)" />
        <path d="M15 24 Q14 36 12 40 Q18 38 22 38 Q26 38 32 40 Q30 36 29 24 Z" fill="url(#fg)" stroke="#c084fc" strokeWidth=".6" />
        <circle cx="22" cy="16" r="10" fill="#fef3c7" stroke="#fbbf24" strokeWidth=".3" />
        <path d="M12 14 Q12 5 22 5 Q32 5 32 14 Q30 10 22 9 Q14 10 12 14 Z" fill="#c084fc" />
        <path d="M12 14 Q11 18 13 20" fill="#a855f7" stroke="none" />
        <polygon points="23,4 24,6.5 26.5,6.5 24.5,8 25.2,10.5 23,9 20.8,10.5 21.5,8 19.5,6.5 22,6.5" fill="#fbbf24" stroke="#f59e0b" strokeWidth=".3" />
        <circle cx="14" cy="22" r="2.5" fill="rgba(251,191,36,0.2)" />
        <circle cx="30" cy="22" r="2.5" fill="rgba(251,191,36,0.2)" />
        {faces[expression]}
        <line x1="10" y1="22" x2="6" y2="28" stroke="#d4a853" strokeWidth="1" strokeLinecap="round" />
        <ellipse cx="5" cy="30" rx="3" ry="3.5" fill="#e0e7ff" stroke="#d4a853" strokeWidth=".8" />
      </svg>
    </div>
  );
}
