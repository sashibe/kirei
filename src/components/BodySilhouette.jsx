function partJa(item) {
  return typeof item.part === 'object' ? item.part.ja : item.part;
}

export default function BodySilhouette({ items }) {
  const topColor = items.find(i => {
    const p = partJa(i);
    return p === 'トップス' || p === 'ワンピース';
  })?.color || '#f0e8e0';

  const outerColor = items.find(i => {
    const p = partJa(i);
    return p === 'アウター' || p === 'カーディガン';
  })?.color;

  const bottomColor = items.find(i => partJa(i) === 'ボトムス')?.color || '#d0c8c0';
  const shoeColor = items.find(i => partJa(i) === 'シューズ')?.color || '#c0b0a0';
  const bagColor = items.find(i => {
    const p = partJa(i);
    return p === 'バッグ' || p === 'アクセサリー';
  })?.color;

  return (
    <svg viewBox="0 0 200 340" style={{ width: '55%', height: '70%' }}>
      {/* Head */}
      <ellipse cx="100" cy="-10" rx="28" ry="30" fill="#f5d0b0"/>
      {/* Neck */}
      <rect x="88" y="0" width="24" height="30" rx="8" fill="#f5d0b0"/>
      {/* Top */}
      <path d="M60 30 Q60 20 88 18 L112 18 Q140 20 140 30 L145 120 Q145 135 130 140 L70 140 Q55 135 55 120 Z"
        fill={topColor}/>
      {/* Arms */}
      <path d="M55 35 Q40 40 35 60 L30 110 Q28 118 35 120 L42 118 L50 60 Z" fill="#f5d0b0" opacity="0.9"/>
      <path d="M145 35 Q160 40 165 60 L170 110 Q172 118 165 120 L158 118 L150 60 Z" fill="#f5d0b0" opacity="0.9"/>
      {/* Outer */}
      {outerColor && (
        <>
          <path d="M55 30 Q40 35 35 50 L30 110 Q30 120 40 122 L55 120 L55 30Z" fill={outerColor} opacity="0.85"/>
          <path d="M145 30 Q160 35 165 50 L170 110 Q170 120 160 122 L145 120 L145 30Z" fill={outerColor} opacity="0.85"/>
          <path d="M55 30 L65 30 L65 140 L55 120Z" fill={outerColor} opacity="0.5"/>
          <path d="M145 30 L135 30 L135 140 L145 120Z" fill={outerColor} opacity="0.5"/>
        </>
      )}
      {/* Bottom */}
      <path d="M65 140 L55 250 Q55 260 70 260 L90 260 L100 145 L110 260 L130 260 Q145 260 145 250 L135 140 Z"
        fill={bottomColor}/>
      {/* Legs */}
      <rect x="78" y="260" width="16" height="50" rx="6" fill="#f5d0b0"/>
      <rect x="106" y="260" width="16" height="50" rx="6" fill="#f5d0b0"/>
      {/* Shoes */}
      <ellipse cx="86" cy="314" rx="14" ry="8" fill={shoeColor}/>
      <ellipse cx="114" cy="314" rx="14" ry="8" fill={shoeColor}/>
      {/* Bag */}
      {bagColor && (
        <>
          <rect x="148" y="100" width="22" height="28" rx="4" fill={bagColor} stroke="#ccc" strokeWidth="0.5"/>
          <path d="M152 100 Q159 88 166 100" fill="none" stroke={bagColor} strokeWidth="2"/>
        </>
      )}
    </svg>
  );
}
