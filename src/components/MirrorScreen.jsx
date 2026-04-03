import { useState, useEffect, useRef, useCallback } from 'react';
import Kirari from './Kirari.jsx';
import Bubble from './Bubble.jsx';
import CameraView from './CameraView.jsx';
import ScoreBadge from './ScoreBadge.jsx';
import GuideFrame from './GuideFrame.jsx';
import useAutoShutter from '../hooks/useAutoShutter.js';
import useFaceLandmarker from '../hooks/useFaceLandmarker.js';
import { SKIN_SCORES } from '../data/scores.js';
import { analyzeSkin, analyzeSkinWithLandmarks } from '../analysis/skinAnalyzer.js';

const KIRARI_MSGS = {
  idle: "キラリだよ♪ ミラーに映してチェックしてみてね！",
  searching: "お顔を枠に合わせてね〜",
  detected: "いい感じ！そのまま動かないでね♪",
  analyzing: "肌の状態をチェックしてるよ〜",
  done: "肌チェック完了♪",
};

// 演出フェーズ: searching → detected → ready → shutter → scanning → done
const STAGE = { SEARCHING: 'searching', DETECTED: 'detected', READY: 'ready', SHUTTER: 'shutter', SCANNING: 'scanning' };

export default function MirrorScreen({ onResult }) {
  const [checking, setChecking] = useState(false);
  const [stage, setStage] = useState(null);
  const [skinScores, setSkinScores] = useState(null);
  const [showScores, setShowScores] = useState(true);
  const [frozenFrame, setFrozenFrame] = useState(null);
  const cameraRef = useRef(null);
  const handledReadyRef = useRef(false);
  const checkingRef = useRef(false);
  checkingRef.current = checking;

  // MediaPipe FaceLandmarker
  const faceLandmarker = useFaceLandmarker();

  const isScanning = stage === STAGE.SCANNING;
  const shutterEnabled = checking && !isScanning && stage !== STAGE.SHUTTER;

  // videoRef を安定した参照にする
  const videoRef = useRef(null);
  Object.defineProperty(videoRef, 'current', {
    get: () => cameraRef.current?.videoEl || null,
    configurable: true,
  });

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

  // 演出フロー: フレームキャプチャ → シャッターフラッシュ → 静止画スキャン → 完了
  const runShutterSequence = useCallback(() => {
    // フレームをキャプチャして凍結
    const frame = cameraRef.current?.isActive ? cameraRef.current.captureFrame() : null;
    if (frame) {
      const canvas = document.createElement('canvas');
      canvas.width = frame.width;
      canvas.height = frame.height;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(frame, 0, 0);
      setFrozenFrame(canvas.toDataURL('image/jpeg', 0.9));
    }

    // 1. シャッターフラッシュ (300ms)
    setStage(STAGE.SHUTTER);

    setTimeout(() => {
      // 2. スキャンアニメーション (1500ms)
      setStage(STAGE.SCANNING);

      setTimeout(() => {
        // 3. スコア算出
        applyScores();
        setStage(null);
        setChecking(false);
        // 4. スコアバッジのアニメーション完了後に凍結解除
        setTimeout(() => setFrozenFrame(null), 2000);
      }, 1500);
    }, 300);
  }, [applyScores]);

  // カメラON時: autoShutterが ready → 演出開始
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

  // カメラ不可時のフォールバック（デモ演出フロー）
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

  const analyzing = stage === STAGE.SCANNING;
  const effectiveStatus = stage || (checking ? status : 'idle');

  const getKirariMsg = () => {
    if (checking && lowLight && !analyzing && stage !== STAGE.SHUTTER) {
      return "ちょっと暗いかも💡 明るい場所で試してみてね！";
    }
    if (stage === 'timeout') {
      return "お顔がうまく映ってないみたい…もう一度試してみてね！";
    }
    if (stage === STAGE.SHUTTER) return "📸 パシャ！";
    if (analyzing) return KIRARI_MSGS.analyzing;
    if (checking) return KIRARI_MSGS[effectiveStatus] || KIRARI_MSGS.searching;
    if (skinScores) return KIRARI_MSGS.done;
    return KIRARI_MSGS.idle;
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
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <CameraView ref={cameraRef} mode="face" aspectRatio="auto" frozenSrc={frozenFrame}>
        {/* === キラリ吹き出し === */}
        <div style={{ position: "absolute", top: 36, left: 8, right: 8, zIndex: 3, display: "flex", alignItems: "flex-start", gap: 6 }}>
          <Kirari size={32} expression={kirariExpression} bounce={checking} />
          <div style={{ ...glassStyle, borderRadius: 12, padding: "5px 10px", flex: 1 }}>
            <p style={{ fontSize: 11, color: "#334155", margin: 0, lineHeight: 1.4 }}>{getKirariMsg()}</p>
          </div>
        </div>

        {/* === ガイドフレーム === */}
        {checking && (stage === STAGE.SEARCHING || stage === STAGE.DETECTED || stage === STAGE.READY || (!stage && (status === 'searching' || status === 'detected'))) && (
          <GuideFrame mode="face" status={stage || status} confidence={stage ? (stage === 'searching' ? 20 : stage === 'detected' ? 60 : 100) : confidence} />
        )}

        {/* === 低照度アラート === */}
        {checking && lowLight && !analyzing && stage !== STAGE.SHUTTER && (
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            borderRadius: 16, padding: "16px 24px", maxWidth: "80%",
            animation: "lowLightFadeIn 0.4s ease-out",
          }}>
            <style>{`@keyframes lowLightFadeIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.9)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>
            <span style={{ fontSize: 28 }}>💡</span>
            <p style={{ fontSize: 13, color: "#fbbf24", fontWeight: 700, margin: 0, textAlign: "center", lineHeight: 1.5 }}>
              暗すぎます
            </p>
            <p style={{ fontSize: 11, color: "#e2e8f0", margin: 0, textAlign: "center", lineHeight: 1.5 }}>
              明るい場所に移動してね
            </p>
          </div>
        )}

        {/* === シャッターフラッシュ === */}
        {stage === STAGE.SHUTTER && (
          <div style={{ position: "absolute", inset: 0, background: "white", zIndex: 10, animation: "shutterFlash 300ms ease-out forwards" }}>
            <style>{`@keyframes shutterFlash{0%{opacity:1}100%{opacity:0}}`}</style>
          </div>
        )}

        {/* === スキャンアニメーション === */}
        {analyzing && (
          <div style={{ position: "absolute", inset: 0 }}>
            <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #e879f9, transparent)", animation: "scanLine 1.5s ease-in-out infinite", boxShadow: "0 0 12px #e879f9" }} />
            <style>{`@keyframes scanLine{0%,100%{top:15%}50%{top:70%}}`}</style>
          </div>
        )}

        {/* === スコアバッジ === */}
        {!checking && !analyzing && skinScores && showScores && (
          <div style={{ position: "absolute", top: 72, right: 12, display: "flex", flexDirection: "column", gap: 8, zIndex: 2 }}>
            {Object.entries(skinScores).map(([k, v], i) => (
              <ScoreBadge key={`skin-${k}`} label={v.label} score={v.score} color={v.color} delay={i * 600} />
            ))}
          </div>
        )}

        {/* === 下部オーバーレイ === */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 4,
          background: "linear-gradient(0deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.85) 70%, transparent 100%)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          padding: "24px 16px 12px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        }}>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>

          {checking ? (
            <>
              {/* チェック中ステータス */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {stage !== 'timeout' && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e879f9", animation: "pulse 1s ease-in-out infinite" }} />
                )}
                <span style={{ fontSize: 13, color: stage === 'timeout' ? "#ef4444" : "#a855f7", fontWeight: 600 }}>
                  {stage === 'timeout' ? "検出できませんでした" : stage === STAGE.SHUTTER ? "📸 シャッター！" : analyzing ? "分析中..." : effectiveStatus === 'ready' ? "撮影準備OK" : effectiveStatus === 'detected' ? "検出中..." : "探しています..."}
                </span>
              </div>
              {stage === 'timeout' ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-primary" onClick={startCheck} style={{ padding: "8px 20px", background: "linear-gradient(135deg, #a855f7, #c084fc)", border: "none", borderRadius: 12, fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                    もう一度
                  </button>
                  <button className="btn-secondary" onClick={() => { setStage(null); setChecking(false); }} style={{ padding: "8px 20px", background: "rgba(255,255,255,0.9)", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 12, fontWeight: 600, color: "#94a3b8", cursor: "pointer" }}>
                    やめる
                  </button>
                </div>
              ) : (
                <button className="btn-secondary" onClick={() => { setStage(null); setChecking(false); }} style={{ padding: "8px 24px", background: "rgba(255,255,255,0.9)", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 12, fontWeight: 600, color: "#94a3b8", cursor: "pointer" }}>
                  キャンセル
                </button>
              )}
            </>
          ) : (
            <>
              {/* スコア表示/非表示トグル */}
              {skinScores && (
                <button
                  onClick={() => setShowScores(s => !s)}
                  style={{
                    ...glassStyle, border: "none", borderRadius: 20, padding: "4px 14px",
                    fontSize: 10, fontWeight: 600, color: "#64748b", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 4, marginBottom: 2,
                  }}
                >
                  <span style={{ fontSize: 12 }}>{showScores ? "👁" : "👁‍🗨"}</span>
                  {showScores ? "スコア非表示" : "スコア表示"}
                </button>
              )}
              {/* 肌チェックボタン */}
              <button
                className="btn-primary"
                onClick={startCheck}
                style={{
                  width: "100%", padding: "12px 0", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer",
                  background: skinScores ? "#a855f7" : "linear-gradient(135deg, #a855f7, #c084fc)",
                  boxShadow: "0 4px 16px rgba(168,85,247,0.25)",
                  opacity: skinScores ? 0.7 : 1,
                }}
              >
                {skinScores ? "✓ もう一度チェック" : "✨ 肌チェック開始"}
              </button>
              {/* 結果を見るボタン */}
              {skinScores && (
                <button
                  className="btn-primary"
                  onClick={() => onResult({ skinScores, dentalScores: null })}
                  style={{ width: "100%", padding: 12, background: "linear-gradient(135deg, #a855f7, #ec4899)", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 20px rgba(168,85,247,0.3)" }}
                >
                  結果を見る →
                </button>
              )}
            </>
          )}
          <p style={{ fontSize: 8, color: "#94a3b8", margin: 0 }}>※本アプリは医療診断を行うものではありません</p>
        </div>
      </CameraView>
    </div>
  );
}
