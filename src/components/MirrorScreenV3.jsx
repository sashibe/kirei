import { useState, useRef, useCallback, useEffect } from 'react';
import CameraView from './CameraView.jsx';
import Kirari from './Kirari.jsx';
import Bubble from './Bubble.jsx';
import GuideFrame from './GuideFrame.jsx';
import ScoreBadge from './ScoreBadge.jsx';
import useAutoShutter from '../hooks/useAutoShutter.js';
import useKirari from '../hooks/useKirari.js';
import useWeather from '../hooks/useWeather.js';
import useNightMode from '../hooks/useNightMode.js';
import { useFaceLandmarkerCtx } from '../contexts/FaceLandmarkerContext.jsx';
import { useT } from '../i18n/index.jsx';
import { SKIN_SCORES } from '../data/scores.js';
import { analyzeSkin, analyzeSkinWithLandmarks } from '../analysis/skinAnalyzer.js';

const STAGE = { SEARCHING: 'searching', DETECTED: 'detected', READY: 'ready', SHUTTER: 'shutter', SCANNING: 'scanning' };

// ナイトモードスタイル切替フラグ
const NIGHT_MODE_STYLE = 'vanity'; // 'vanity' | 'ring'

// 電球コンポーネント（バニティライト用）
function Bulb({ delay }) {
  return (
    <div style={{
      width: 14, height: 14,
      borderRadius: '50%',
      background: 'radial-gradient(circle at 40% 35%, #fff8e0, #f5c842 40%, #e89b10)',
      boxShadow: '0 0 6px 3px rgba(245,200,66,0.8), 0 0 16px 6px rgba(245,180,30,0.4)',
      animation: `bulbPulse 2.4s ease-in-out ${delay}s infinite`,
    }} />
  );
}

export default function MirrorScreenV3({ onResult }) {
  const { t } = useT();
  const [checking, setChecking] = useState(false);
  const [stage, setStage] = useState(null);
  const [skinScores, setSkinScores] = useState(null);
  const [showScores, setShowScores] = useState(true);
  const [frozenFrame, setFrozenFrame] = useState(null);
  const [ripple, setRipple] = useState(null); // { x, y } for tap ripple
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem('kirei_launched'));
  const cameraRef = useRef(null);
  const handledReadyRef = useRef(false);
  const checkingRef = useRef(false);
  checkingRef.current = checking;

  const faceLandmarker = useFaceLandmarkerCtx();

  // 天気データ取得（Step 3）
  const weather = useWeather();

  // キラリ アンビエント出現（Step 2 + 天気連動 Step 3）
  const kirariAmbient = useKirari({ weather, isChecking: checking });

  const isScanning = stage === STAGE.SCANNING;
  const shutterEnabled = checking && !isScanning && stage !== STAGE.SHUTTER;

  const videoRef = useRef(null);
  Object.defineProperty(videoRef, 'current', {
    get: () => cameraRef.current?.videoEl || null,
    configurable: true,
  });

  // ナイトモード検知（Step 5）
  const isNight = useNightMode(videoRef);

  const { status, confidence, lastLandmarks, lowLight, reset: resetShutter } = useAutoShutter({
    cameraRef,
    videoRef,
    faceLandmarker,
    mode: 'face',
    enabled: shutterEnabled,
  });

  const landmarksRef = useRef(null);
  useEffect(() => { landmarksRef.current = lastLandmarks; }, [lastLandmarks]);

  const applyScores = useCallback(() => {
    const frame = cameraRef.current?.isActive ? cameraRef.current.captureFrame() : null;
    const lm = landmarksRef.current;
    let result = null;
    try {
      result = frame
        ? (lm ? analyzeSkinWithLandmarks(frame, lm) : analyzeSkin(frame))
        : null;
    } catch { /* */ }
    const scores = (result && !result.error) ? {
      tone: { ...SKIN_SCORES.tone, score: result.tone.score },
      pores: { ...SKIN_SCORES.pores, score: result.pores.score },
      dullness: { ...SKIN_SCORES.dullness, score: result.dullness.score },
    } : SKIN_SCORES;
    setSkinScores(scores);
    return scores;
  }, []);

  const runShutterSequence = useCallback(() => {
    const frame = cameraRef.current?.isActive ? cameraRef.current.captureFrame() : null;
    if (frame) {
      const canvas = document.createElement('canvas');
      canvas.width = frame.width;
      canvas.height = frame.height;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(frame, 0, 0);
      setFrozenFrame(canvas.toDataURL('image/jpeg', 0.9));
    }
    setStage(STAGE.SHUTTER);
    setTimeout(() => {
      setStage(STAGE.SCANNING);
      setTimeout(() => {
        applyScores();
        setStage(null);
        setChecking(false);
        setTimeout(() => setFrozenFrame(null), 2000);
      }, 1500);
    }, 300);
  }, [applyScores]);

  useEffect(() => {
    if (status === 'ready' && !handledReadyRef.current) {
      handledReadyRef.current = true;
      runShutterSequence();
    }
    if (status === 'timeout' && !handledReadyRef.current) {
      handledReadyRef.current = true;
      setStage('timeout');
    }
  }, [status, runShutterSequence]);

  // Demo fallback (no camera)
  useEffect(() => {
    if (!checking) return;
    let cancelled = false;
    const t0 = setTimeout(() => {
      if (cancelled || cameraRef.current?.isActive) return;
      setStage(STAGE.SEARCHING);
      setTimeout(() => { if (!cancelled) setStage(STAGE.DETECTED); }, 1000);
      setTimeout(() => { if (!cancelled) setStage(STAGE.READY); }, 2000);
      setTimeout(() => { if (!cancelled) setStage(STAGE.SHUTTER); }, 2400);
      setTimeout(() => { if (!cancelled) setStage(STAGE.SCANNING); }, 2700);
      setTimeout(() => {
        if (cancelled) return;
        setSkinScores(SKIN_SCORES);
        setStage(null);
        setChecking(false);
      }, 4200);
    }, 500);
    return () => { cancelled = true; clearTimeout(t0); };
  }, [checking]);

  const startCheck = useCallback(() => {
    resetShutter();
    handledReadyRef.current = false;
    setFrozenFrame(null);
    setStage(STAGE.SEARCHING);
    setSkinScores(null);
    setChecking(true);
  }, [resetShutter]);

  // --- V3: Tap to start analysis ---
  const handleTap = useCallback((e) => {
    // Ignore taps on buttons or interactive elements
    if (e.target.closest('button') || e.target.closest('a')) return;

    // 初回チュートリアル表示中はタップを無視
    if (showTutorial) return;

    // Don't start if already checking
    if (checking) return;

    // Show ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipple({ x, y, key: Date.now() });

    // Start analysis
    startCheck();
  }, [checking, startCheck, showTutorial]);

  // チュートリアルをタップで消す（overlay内のクリック用）
  const dismissTutorial = useCallback(() => {
    setShowTutorial(false);
    localStorage.setItem('kirei_launched', '1');
  }, []);

  // チュートリアル自動消去（6秒後）
  useEffect(() => {
    if (!showTutorial) return;
    const timer = setTimeout(() => {
      setShowTutorial(false);
      localStorage.setItem('kirei_launched', '1');
    }, 6000);
    return () => clearTimeout(timer);
  }, [showTutorial]);

  // Clear ripple after animation
  useEffect(() => {
    if (!ripple) return;
    const timer = setTimeout(() => setRipple(null), 800);
    return () => clearTimeout(timer);
  }, [ripple]);

  const analyzing = stage === STAGE.SCANNING;
  const effectiveStatus = stage || (checking ? status : 'idle');

  const getKirariMsg = () => {
    if (checking && lowLight && !analyzing && stage !== STAGE.SHUTTER) {
      return t("kirari.low_light");
    }
    if (stage === 'timeout') return t("kirari.timeout_face");
    if (stage === STAGE.SHUTTER) return t("kirari.shutter");
    if (analyzing) return t("kirari.skin_analyzing");
    if (checking) return t(`kirari.skin_${effectiveStatus}`) || t("kirari.skin_searching");
    if (skinScores) return t("kirari.skin_done");
    return null;
  };

  const kirariExpression = (analyzing || stage === STAGE.SHUTTER) ? "thinking"
    : checking ? (effectiveStatus === 'detected' || effectiveStatus === 'ready' ? "happy" : "thinking")
    : skinScores ? "sparkle" : "happy";

  const glassStyle = {
    background: "rgba(255,255,255,0.88)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  };

  return (
    <div
      style={{ position: "relative", width: "100%", height: "100%", cursor: checking ? "default" : "pointer" }}
      onClick={handleTap}
    >
      {/* Ripple animation styles */}
      <style>{`
        @keyframes mirrorRipple {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
        }
        @keyframes kirariV3FadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes kirariV3FadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(8px); }
        }
        @keyframes tutorialRipple {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.6; }
          50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.3; }
          100% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.6; }
        }
        @keyframes tutorialFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bulbPulse {
          0%, 100% { opacity: 0.8; filter: brightness(1); }
          50% { opacity: 1; filter: brightness(1.2); }
        }
        @keyframes nightFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes shutterFlash{0%{opacity:1}100%{opacity:0}}
        @keyframes scanLine{0%,100%{top:15%}50%{top:70%}}
        @keyframes lowLightFadeIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.9)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
      `}</style>

      <CameraView ref={cameraRef} mode="face" aspectRatio="auto" frozenSrc={frozenFrame}>
        {/* === Tap ripple effect === */}
        {ripple && (
          <div
            key={ripple.key}
            style={{
              position: "absolute",
              left: ripple.x,
              top: ripple.y,
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)",
              transform: "translate(-50%, -50%) scale(0)",
              animation: "mirrorRipple 0.8s ease-out forwards",
              pointerEvents: "none",
              zIndex: 6,
            }}
          />
        )}

        {/* === ナイトモード: バニティライト（案A） === */}
        {isNight && NIGHT_MODE_STYLE === 'vanity' && (
          <>
            {/* 上部電球バー */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: 32, zIndex: 12,
              background: 'rgba(0,0,0,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-around',
              padding: '0 12px',
              animation: 'nightFadeIn 0.6s ease-out',
            }}>
              {[...Array(7)].map((_, i) => <Bulb key={`t${i}`} delay={i * 0.3} />)}
            </div>
            {/* 下部電球バー */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: 32, zIndex: 12,
              background: 'rgba(0,0,0,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-around',
              padding: '0 12px',
              animation: 'nightFadeIn 0.6s ease-out',
            }}>
              {[...Array(7)].map((_, i) => <Bulb key={`b${i}`} delay={i * 0.3 + 0.15} />)}
            </div>
          </>
        )}

        {/* === 初回チュートリアルオーバーレイ === */}
        {showTutorial && (
          <div
            onClick={(e) => { e.stopPropagation(); dismissTutorial(); }}
            style={{
              position: "absolute", inset: 0, zIndex: 20,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.45)",
              animation: "tutorialFadeIn 0.6s ease-out",
              cursor: "pointer",
            }}
          >
            {/* 波紋アニメーション */}
            <div style={{
              width: 100, height: 100, borderRadius: "50%",
              border: "3px solid rgba(168,85,247,0.5)",
              animation: "tutorialRipple 1.5s ease-in-out infinite",
              marginBottom: 24,
            }} />
            {/* キラリ + セリフ */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: 16, padding: "10px 16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}>
              <Kirari size={36} expression="sparkle" />
              <p style={{ fontSize: 13, color: "#334155", margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                タップすると今日の肌を<br />チェックするよ♪
              </p>
            </div>
          </div>
        )}

        {/* === Kirari ambient (V3: appears briefly at bottom-right) === */}
        {!checking && !skinScores && kirariAmbient.visible && kirariAmbient.message && (
          <div
            style={{
              position: "absolute", bottom: 72, right: 12, zIndex: 5,
              display: "flex", alignItems: "flex-end", gap: 6,
              animation: "kirariV3FadeIn 0.4s ease-out",
              maxWidth: "80%",
            }}
            onClick={(e) => { e.stopPropagation(); kirariAmbient.dismiss(); }}
          >
            <div style={{
              ...glassStyle,
              borderRadius: 14,
              padding: "8px 12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            }}>
              <p style={{ fontSize: 12, color: "#334155", margin: 0, lineHeight: 1.5 }}>
                {kirariAmbient.message}
              </p>
            </div>
            <Kirari size={32} expression="happy" />
          </div>
        )}

        {/* === Kirari (during check or with scores — top bar) === */}
        {(checking || skinScores) && getKirariMsg() && (
          <div style={{
            position: "absolute", top: 36, left: 8, right: 8, zIndex: 3,
            display: "flex", alignItems: "flex-start", gap: 6,
            animation: "kirariV3FadeIn 0.4s ease-out",
          }}>
            <Kirari size={32} expression={kirariExpression} bounce={checking} />
            <div style={{ ...glassStyle, borderRadius: 12, padding: "5px 10px", flex: 1 }}>
              <p style={{ fontSize: 11, color: "#334155", margin: 0, lineHeight: 1.4 }}>{getKirariMsg()}</p>
            </div>
          </div>
        )}

        {/* === Guide frame === */}
        {checking && (stage === STAGE.SEARCHING || stage === STAGE.DETECTED || stage === STAGE.READY || (!stage && (status === 'searching' || status === 'detected'))) && (
          <GuideFrame mode="face" status={stage || status} confidence={stage ? (stage === 'searching' ? 20 : stage === 'detected' ? 60 : 100) : confidence} />
        )}

        {/* === Low light alert === */}
        {checking && lowLight && !analyzing && stage !== STAGE.SHUTTER && (
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            borderRadius: 16, padding: "16px 24px", maxWidth: "80%",
            animation: "lowLightFadeIn 0.4s ease-out",
          }}>
            <span style={{ fontSize: 28 }}>💡</span>
            <p style={{ fontSize: 13, color: "#fbbf24", fontWeight: 700, margin: 0, textAlign: "center", lineHeight: 1.5 }}>
              {t("mirror.too_dark")}
            </p>
            <p style={{ fontSize: 11, color: "#e2e8f0", margin: 0, textAlign: "center", lineHeight: 1.5 }}>
              {t("mirror.move_bright")}
            </p>
          </div>
        )}

        {/* === Shutter flash === */}
        {stage === STAGE.SHUTTER && (
          <div style={{ position: "absolute", inset: 0, background: "white", zIndex: 10, animation: "shutterFlash 300ms ease-out forwards" }} />
        )}

        {/* === Scan animation === */}
        {analyzing && (
          <div style={{ position: "absolute", inset: 0 }}>
            <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #e879f9, transparent)", animation: "scanLine 1.5s ease-in-out infinite", boxShadow: "0 0 12px #e879f9" }} />
          </div>
        )}

        {/* === Score badges === */}
        {!checking && !analyzing && skinScores && showScores && (
          <div style={{ position: "absolute", top: 72, right: 12, display: "flex", flexDirection: "column", gap: 8, zIndex: 2 }}>
            {Object.entries(skinScores).map(([k, v], i) => (
              <ScoreBadge key={`skin-${k}`} label={t(v.labelKey)} score={v.score} color={v.color} delay={i * 600} />
            ))}
          </div>
        )}

        {/* === Bottom overlay (V3: minimal, no start button) === */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 4,
          background: checking || skinScores
            ? "linear-gradient(0deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.85) 70%, transparent 100%)"
            : "transparent",
          backdropFilter: (checking || skinScores) ? "blur(8px)" : "none",
          WebkitBackdropFilter: (checking || skinScores) ? "blur(8px)" : "none",
          padding: (checking || skinScores) ? "24px 16px 12px" : "0",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          transition: "all 0.3s ease",
        }}>
          {checking ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {stage !== 'timeout' && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e879f9", animation: "pulse 1s ease-in-out infinite" }} />
                )}
                <span style={{ fontSize: 13, color: stage === 'timeout' ? "#ef4444" : "#a855f7", fontWeight: 600 }}>
                  {stage === 'timeout' ? t("mirror.not_detected") : stage === STAGE.SHUTTER ? t("mirror.shutter") : analyzing ? t("mirror.analyzing") : effectiveStatus === 'ready' ? t("mirror.capture_ready") : effectiveStatus === 'detected' ? t("mirror.detecting") : t("mirror.searching")}
                </span>
              </div>
              {stage === 'timeout' ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-primary" onClick={startCheck} style={{ padding: "8px 20px", background: "linear-gradient(135deg, #a855f7, #c084fc)", border: "none", borderRadius: 12, fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                    {t("mirror.retry")}
                  </button>
                  <button className="btn-secondary" onClick={() => { setStage(null); setChecking(false); }} style={{ padding: "8px 20px", background: "rgba(255,255,255,0.9)", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 12, fontWeight: 600, color: "#94a3b8", cursor: "pointer" }}>
                    {t("mirror.quit")}
                  </button>
                </div>
              ) : (
                <button className="btn-secondary" onClick={() => { setStage(null); setChecking(false); }} style={{ padding: "8px 24px", background: "rgba(255,255,255,0.9)", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 12, fontWeight: 600, color: "#94a3b8", cursor: "pointer" }}>
                  {t("mirror.cancel")}
                </button>
              )}
            </>
          ) : skinScores ? (
            <>
              <button
                onClick={() => setShowScores(s => !s)}
                style={{
                  ...glassStyle, border: "none", borderRadius: 20, padding: "4px 14px",
                  fontSize: 10, fontWeight: 600, color: "#64748b", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4, marginBottom: 2,
                }}
              >
                <span style={{ fontSize: 12 }}>{showScores ? "👁" : "👁‍🗨"}</span>
                {showScores ? t("mirror.hide_scores") : t("mirror.show_scores")}
              </button>
              <button
                className="btn-primary"
                onClick={startCheck}
                style={{
                  width: "100%", padding: "12px 0", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer",
                  background: "#a855f7", opacity: 0.7,
                  boxShadow: "0 4px 16px rgba(168,85,247,0.25)",
                }}
              >
                {t("mirror.recheck")}
              </button>
              <button
                className="btn-primary"
                onClick={() => onResult({ skinScores, dentalScores: null })}
                style={{ width: "100%", padding: 12, background: "linear-gradient(135deg, #a855f7, #ec4899)", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 20px rgba(168,85,247,0.3)" }}
              >
                {t("mirror.view_result")}
              </button>
              <p style={{ fontSize: 8, color: "#94a3b8", margin: 0 }}>{t("mirror.disclaimer")}</p>
            </>
          ) : null}
        </div>
      </CameraView>
    </div>
  );
}
