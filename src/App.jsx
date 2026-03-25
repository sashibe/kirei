import { useState, useCallback, useRef } from 'react';
import Kirari from './components/Kirari.jsx';
import MirrorScreen from './components/MirrorScreen.jsx';
import ResultScreen from './components/ResultScreen.jsx';
import colors from './styles/theme.js';

export default function App() {
  const [showResult, setShowResult] = useState(false);
  const scoresRef = useRef({ skinScores: null, dentalScores: null });

  const handleResult = useCallback(({ skinScores, dentalScores }) => {
    scoresRef.current = { skinScores, dentalScores };
    setShowResult(true);
  }, []);

  const handleRestart = useCallback(() => {
    setShowResult(false);
  }, []);

  const handleDentalCheck = useCallback(() => {
    setShowResult(false);
    // DentalScreen は MirrorScreen に統合済み
  }, []);

  const Header = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 6px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Kirari size={28} expression="happy" />
        <span style={{ fontSize: 17, fontWeight: 800, background: colors.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>KIREI</span>
      </div>
      <span style={{ fontSize: 9, color: "#c084fc", background: "#faf5ff", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>PROTOTYPE</span>
    </div>
  );

  return (
    <div style={{ maxWidth: 390, margin: "0 auto", background: colors.bg, minHeight: "100vh", fontFamily: "'Noto Sans JP', sans-serif", paddingBottom: showResult ? 32 : 0 }}>
      <Header />
      <div key={showResult ? 'result' : 'mirror'} className="screen-enter">
        {!showResult ? (
          <MirrorScreen onResult={handleResult} />
        ) : (
          <ResultScreen
            skinScores={scoresRef.current.skinScores}
            dentalScores={scoresRef.current.dentalScores}
            onRestart={handleRestart}
            onDentalCheck={handleDentalCheck}
          />
        )}
      </div>
    </div>
  );
}
