import { useState, useCallback, useRef } from 'react';
import Kirari from './components/Kirari.jsx';
import LanguageSwitcher from './components/LanguageSwitcher.jsx';
import MirrorScreenLegacy from './components/MirrorScreen.jsx';
import MirrorScreenV3 from './components/MirrorScreenV3.jsx';

// V3ミラー切替フラグ（false で旧版に戻せる）
const USE_MIRROR_V3 = true;
const MirrorScreen = USE_MIRROR_V3 ? MirrorScreenV3 : MirrorScreenLegacy;
import ArTryOnScreen from './components/ArTryOnScreen.jsx';
import ResultScreen from './components/ResultScreen.jsx';
import SkincareARScreen from './components/SkincareARScreen.jsx';
import SkincareRoutineView from './components/SkincareRoutineView.jsx';
import { FaceLandmarkerProvider } from './contexts/FaceLandmarkerContext.jsx';
import useCart from './hooks/useCart.js';
import colors from './styles/theme.js';
import { useT } from './i18n/index.jsx';

// Capacitorネイティブ環境検出
const isNative = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
// ?demo=true でPROTOTYPEバッジ非表示
const isDemoMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === 'true';

// screen: 'mirror' | 'ar' | 'checkout' | 'skincare-ar' | 'skincare-routine' | 'guide'
export default function App() {
  const { t } = useT();
  const [screen, setScreen] = useState('mirror');
  const prevScreenRef = useRef('mirror');
  const scoresRef = useRef({ skinScores: null, personalColor: null });
  const capturedImageRef = useRef(null);
  const cart = useCart();

  // ミラー分析完了 → メイクならAR直行、スキンケアならSkincareAR
  const handleResult = useCallback(({ skinScores, personalColor, mode }) => {
    scoresRef.current = { skinScores, personalColor };
    if (mode === 'skincare') {
      setScreen('skincare-ar');
    } else {
      setScreen('ar');
    }
  }, []);

  // ARからチェックアウト画面へ
  const handleCheckout = useCallback(() => {
    setScreen('checkout');
  }, []);

  const handleRestart = useCallback(() => {
    setScreen('mirror');
  }, []);

  const handleOpenSkincareAR = useCallback(() => {
    setScreen('skincare-ar');
  }, []);

  // キャプチャ保存（ARから）
  const handleCapture = useCallback((dataUrl) => {
    capturedImageRef.current = dataUrl;
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
        <LanguageSwitcher size={overlay ? "small" : "normal"} />
        <span style={{ fontSize: overlay ? 14 : 17, fontWeight: 800, background: colors.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>KIREI</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {isDemoMode && <span style={{ fontSize: 8, color: "#c084fc", background: "rgba(250,245,255,0.8)", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>PROTOTYPE</span>}
        <button onClick={() => { prevScreenRef.current = screen; setScreen('guide'); }} style={{
          display: 'flex', alignItems: 'center', gap: 3,
          background: 'linear-gradient(135deg, #a855f7, #ec4899)',
          border: 'none', borderRadius: 14, padding: '4px 10px',
          fontSize: 10, fontWeight: 700, color: '#fff', cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(168,85,247,0.3)',
        }}>📖 Guide</button>
      </div>
    </div>
  );

  // ar, skincare-ar は height:"100%" + overflow:"hidden" で全画面
  const showScrollable = screen === 'checkout' || screen === 'skincare-routine';

  const content = (
    <FaceLandmarkerProvider>
      {showScrollable && <Header />}
      <div key={screen} className="screen-enter" style={{ position: "relative", height: showScrollable ? "auto" : "100%" }}>
        {screen === 'mirror' && (
          <>
            <Header overlay />
            <MirrorScreen onResult={handleResult} />
          </>
        )}
        {screen === 'ar' && (
          <ArTryOnScreen
            personalColor={scoresRef.current.personalColor}
            cart={cart}
            onCheckout={handleCheckout}
            onCapture={handleCapture}
            onBack={() => setScreen('mirror')}
          />
        )}
        {screen === 'checkout' && (
          <ResultScreen
            skinScores={scoresRef.current.skinScores}
            personalColor={scoresRef.current.personalColor}
            cart={cart}
            capturedImage={capturedImageRef.current}
            onRestart={handleRestart}
            onSkincareAR={handleOpenSkincareAR}
            onBackToAR={() => setScreen('ar')}
          />
        )}
        {screen === 'skincare-ar' && (
          <SkincareARScreen
            skinScores={scoresRef.current.skinScores}
            onNext={() => setScreen('skincare-routine')}
            onBack={() => setScreen('mirror')}
          />
        )}
        {screen === 'skincare-routine' && (
          <div style={{ padding: '12px 0' }}>
            <button onClick={() => setScreen('skincare-ar')} style={{
              background: 'none', border: 'none', fontSize: 13,
              color: '#94a3b8', cursor: 'pointer',
              padding: '0 16px 8px', fontWeight: 600,
            }}>
              {'<'} {t('skincare_ar.back_to_ar')}
            </button>
            <SkincareRoutineView
              skinScores={scoresRef.current.skinScores}
              onTryMakeup={() => setScreen('ar')}
              onRestart={handleRestart}
            />
          </div>
        )}
      </div>
    </FaceLandmarkerProvider>
  );

  return (
    <div className={isNative ? 'native-app' : ''}>
      <style>{`
        /* Capacitorネイティブ: 常にモバイル表示 */
        .native-app .kirei-pc-wrapper { display: none !important; }
        .native-app .kirei-mobile-wrapper {
          display: block !important;
          width: 100%; height: 100vh; position: fixed; top: 0; left: 0;
        }

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
          .kirei-app-container { height: 100%; overflow-y: auto; }
          .kirei-phone-bar {
            position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
            width: 130px; height: 4px; background: rgba(255,255,255,0.15); border-radius: 2px; z-index: 20;
          }
          .kirei-mobile-wrapper { display: none; }
        }

        /* === スマホ: フルスクリーン === */
        @media (max-width: 499px) {
          .kirei-pc-wrapper { display: none !important; }
          .kirei-mobile-wrapper {
            width: 100%;
            height: 100dvh;
            height: 100vh;
            position: fixed;
            top: 0; left: 0;
          }
          .kirei-app-container { width: 100%; height: 100%; }
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
              fontFamily: "'Noto Sans JP', 'Noto Sans KR', sans-serif",
              overflow: showScrollable ? "auto" : "hidden",
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
          fontFamily: "'Noto Sans JP', 'Noto Sans KR', sans-serif",
          overflow: showScrollable ? "auto" : "hidden",
          position: "relative",
        }}>
          {content}
        </div>
      </div>

      {/* 説明書オーバーレイ */}
      {screen === 'guide' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: '#fff',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px',
            borderBottom: '1px solid #e2e8f0',
            background: '#faf5ff',
            flexShrink: 0,
          }}>
            <button onClick={() => setScreen(prevScreenRef.current)} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              border: 'none', borderRadius: 10, padding: '6px 14px',
              fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer',
            }}>
              {'<'} {t("guide.back_to_app")}
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>KIREI Demo Guide</span>
          </div>
          <iframe
            src={import.meta.env.BASE_URL + 'guide/index.html'}
            style={{ flex: 1, width: '100%', border: 'none' }}
            title="KIREI Demo Guide"
          />
        </div>
      )}
    </div>
  );
}
