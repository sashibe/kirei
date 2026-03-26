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

  const content = (
    <>
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
    </>
  );

  return (
    <>
      <style>{`
        /* === PC: iPhoneモックアップ === */
        @media (min-width: 500px) {
          .kirei-pc-wrapper {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #f5f3f0 0%, #ebe8e4 50%, #f5f3f0 100%);
            padding: 32px 0;
          }
          .kirei-phone-bezel {
            position: relative;
            width: 390px;
            border-radius: 46px;
            background: #2c2530;
            padding: 8px;
            box-shadow: 0 0 0 1px #1a1520, 0 16px 48px rgba(0,0,0,0.25), inset 0 0 3px rgba(255,255,255,0.04);
          }
          .kirei-phone-notch {
            position: absolute; top: 8px; left: 50%; transform: translateX(-50%);
            width: 110px; height: 24px; background: #2c2530; border-radius: 0 0 16px 16px; z-index: 20;
          }
          .kirei-phone-notch::before {
            content: ''; position: absolute; top: 8px; left: 50%; transform: translateX(-50%);
            width: 8px; height: 8px; background: #1a1520; border-radius: 50%;
          }
          .kirei-phone-screen {
            border-radius: 38px; overflow: hidden; height: 844px;
            position: relative; transform: translateZ(0);
          }
          .kirei-app-container {
            height: 100%;
            overflow-y: auto;
          }
          .kirei-phone-bar {
            position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
            width: 130px; height: 4px; background: rgba(255,255,255,0.15); border-radius: 2px; z-index: 20;
          }
          /* モバイル用非表示 */
          .kirei-mobile-wrapper { display: none; }
        }

        /* === スマホ: フルスクリーン === */
        @media (max-width: 499px) {
          .kirei-pc-wrapper { display: none !important; }
          .kirei-mobile-wrapper {
            width: 100%;
            height: 100dvh;
            height: 100vh; /* dvh非対応フォールバック */
            position: fixed;
            top: 0; left: 0;
          }
          .kirei-app-container {
            width: 100%;
            height: 100%;
          }
        }
        @supports (height: 100dvh) {
          @media (max-width: 499px) {
            .kirei-mobile-wrapper { height: 100dvh; }
          }
        }
      `}</style>

      {/* PC表示: モックアップフレーム */}
      <div className="kirei-pc-wrapper">
        <div className="kirei-phone-bezel">
          <div className="kirei-phone-notch" />
          <div className="kirei-phone-screen">
            <div className="kirei-app-container" style={{
              background: colors.bg,
              fontFamily: "'Noto Sans JP', sans-serif",
              overflow: showResult ? "auto" : "hidden",
              position: "relative",
            }}>
              {content}
            </div>
          </div>
          <div className="kirei-phone-bar" />
        </div>
      </div>

      {/* モバイル表示: フルスクリーン直接描画 */}
      <div className="kirei-mobile-wrapper">
        <div className="kirei-app-container" style={{
          background: colors.bg,
          fontFamily: "'Noto Sans JP', sans-serif",
          overflow: showResult ? "auto" : "hidden",
          position: "relative",
        }}>
          {content}
        </div>
      </div>
    </>
  );
}
