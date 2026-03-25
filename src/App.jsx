import { useState, useCallback, useRef } from 'react';
import Kirari from './components/Kirari.jsx';
import MirrorScreen from './components/MirrorScreen.jsx';
import ResultScreen from './components/ResultScreen.jsx';
import colors from './styles/theme.js';

// PC表示時のiPhoneモックアップフレーム
function PhoneFrame({ children }) {
  return (
    <>
      <style>{`
        .phone-frame {
          display: none;
        }
        @media (min-width: 500px) {
          .phone-frame {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #f5f3f0 0%, #ebe8e4 50%, #f5f3f0 100%);
            padding: 32px 0;
          }
          .phone-bezel {
            position: relative;
            width: 390px;
            border-radius: 46px;
            background: #2c2530;
            padding: 8px;
            box-shadow:
              0 0 0 1px #1a1520,
              0 16px 48px rgba(0,0,0,0.25),
              inset 0 0 3px rgba(255,255,255,0.04);
          }
          .phone-notch {
            position: absolute;
            top: 8px;
            left: 50%;
            transform: translateX(-50%);
            width: 110px;
            height: 24px;
            background: #2c2530;
            border-radius: 0 0 16px 16px;
            z-index: 20;
          }
          .phone-notch::before {
            content: '';
            position: absolute;
            top: 8px;
            left: 50%;
            transform: translateX(-50%);
            width: 8px;
            height: 8px;
            background: #1a1520;
            border-radius: 50%;
          }
          .phone-screen {
            border-radius: 38px;
            overflow: hidden;
            height: 844px;
            position: relative;
            transform: translateZ(0);
          }
          .phone-screen > div {
            height: 100%;
            overflow-y: auto;
          }
          .phone-bottom-bar {
            position: absolute;
            bottom: 16px;
            left: 50%;
            transform: translateX(-50%);
            width: 130px;
            height: 4px;
            background: rgba(255,255,255,0.15);
            border-radius: 2px;
            z-index: 20;
          }
        }
        @media (max-width: 499px) {
          .phone-bezel, .phone-notch, .phone-bottom-bar { display: none; }
          .phone-screen { min-height: 100dvh; }
        }
      `}</style>
      <div className="phone-frame">
        <div className="phone-bezel">
          <div className="phone-notch" />
          <div className="phone-screen">
            {children}
          </div>
          <div className="phone-bottom-bar" />
        </div>
      </div>
    </>
  );
}

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

  const appContent = (
    <div style={{
      width: "100%", height: "100%",
      background: colors.bg,
      fontFamily: "'Noto Sans JP', sans-serif",
      overflow: showResult ? "auto" : "hidden",
      position: "relative",
    }}>
      {showResult && <Header />}
      <div key={showResult ? 'result' : 'mirror'} className="screen-enter" style={{ position: "relative", height: showResult ? "auto" : "100%" }}>
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

  return (
    <>
      {/* PC: iPhoneモックアップ内に表示 */}
      <PhoneFrame>{appContent}</PhoneFrame>
      {/* スマホ: フルスクリーン表示 */}
      <style>{`
        @media (max-width: 499px) {
          .phone-frame { display: contents !important; }
        }
      `}</style>
    </>
  );
}
