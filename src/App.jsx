import { useState, useCallback, useRef } from 'react';
import Kirari from './components/Kirari.jsx';
import MirrorScreen from './components/MirrorScreen.jsx';
import DentalScreen from './components/DentalScreen.jsx';
import ResultScreen from './components/ResultScreen.jsx';
import colors from './styles/theme.js';

const SC = { MIRROR: 0, DENTAL: 1, RESULT: 2 };

export default function App() {
  const [screen, setScreen] = useState(SC.MIRROR);
  const skinScoresRef = useRef(null);
  const dentalScoresRef = useRef(null);

  const handleSkinScores = useCallback((scores) => {
    skinScoresRef.current = scores;
  }, []);

  const handleDentalComplete = useCallback((scores) => {
    dentalScoresRef.current = scores;
    setScreen(SC.RESULT);
  }, []);

  const handleRestart = useCallback(() => {
    skinScoresRef.current = null;
    dentalScoresRef.current = null;
    setScreen(SC.MIRROR);
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
    <div style={{ maxWidth: 390, margin: "0 auto", background: colors.bg, minHeight: "100vh", fontFamily: "'Noto Sans JP', sans-serif", paddingBottom: screen === SC.RESULT ? 32 : 0 }}>
      <Header />
      <div key={screen} className="screen-enter">
        {screen === SC.MIRROR && (
          <MirrorScreen
            onNext={() => setScreen(SC.DENTAL)}
            onScoresReady={handleSkinScores}
          />
        )}
        {screen === SC.DENTAL && (
          <DentalScreen onComplete={handleDentalComplete} />
        )}
        {screen === SC.RESULT && (
          <ResultScreen
            skinScores={skinScoresRef.current}
            dentalScores={dentalScoresRef.current}
            onRestart={handleRestart}
          />
        )}
      </div>
    </div>
  );
}
