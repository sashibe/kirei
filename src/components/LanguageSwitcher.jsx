import { useT, LANGUAGES } from '../i18n/index.jsx';

export default function LanguageSwitcher({ size = 'normal' }) {
  const { lang, setLang } = useT();
  const isSmall = size === 'small';

  return (
    <div style={{
      display: 'flex',
      gap: 2,
      background: 'rgba(168,85,247,0.08)',
      borderRadius: 10,
      padding: 2,
    }}>
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          style={{
            border: 'none',
            borderRadius: 8,
            padding: isSmall ? '6px 8px' : '7px 10px',
            fontSize: isSmall ? 11 : 12,
            minWidth: isSmall ? 36 : 40,
            minHeight: isSmall ? 32 : 36,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: "'Noto Sans JP', 'Noto Sans KR', sans-serif",
            ...(lang === code ? {
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              color: '#fff',
              boxShadow: '0 1px 4px rgba(168,85,247,0.3)',
            } : {
              background: 'rgba(168,85,247,0.12)',
              color: '#7c3aed',
            }),
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
