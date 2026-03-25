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

  const Header = ({ overlay = false }) => (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: overlay ? "8px 12px" : "14px 20px 6px",
      ...(overlay ? {
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 5,
        background: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, transparent 100%)",
      } : {}),
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <Kirari size={overlay ? 22 : 28} expression="happy" />
        <span style={{ fontSize: overlay ? 14 : 17, fontWeight: 800, background: colors.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>KIREI</span>
      </div>
      <span style={{ fontSize: 8, color: "#c084fc", background: "rgba(250,245,255,0.8)", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>PROTOTYPE</span>
    </div>
  );

  return (
    <div style={{ maxWidth: 390, margin: "0 auto", background: colors.bg, minHeight: "100vh", fontFamily: "'Noto Sans JP', sans-serif", paddingBottom: showResult ? 32 : 0 }}>
      {showResult && <Header />}
      <div key={showResult ? 'result' : 'mirror'} className="screen-enter" style={{ position: "relative" }}>
        {!showResult ? (
          <>
            <Header overlay />
            <MirrorScreen onResult={handleResult} />
          </>
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
