import { useState, useEffect, useRef, useCallback } from 'react';
import Kirari from './Kirari.jsx';
import Bubble from './Bubble.jsx';
import CameraView from './CameraView.jsx';
import ScoreBadge from './ScoreBadge.jsx';
import GuideFrame from './GuideFrame.jsx';
import useAutoShutter from '../hooks/useAutoShutter.js';
import useFaceLandmarker from '../hooks/useFaceLandmarker.js';
import { SKIN_SCORES, DENTAL_SCORES } from '../data/scores.js';
import { analyzeSkin, analyzeSkinWithLandmarks } from '../analysis/skinAnalyzer.js';
import { analyzeDental, analyzeDentalWithLandmarks } from '../analysis/dentalAnalyzer.js';

const MODE = { IDLE: 'idle', SKIN: 'skin', DENTAL: 'dental' };

const KIRARI_MSGS = {
  idle: "キラリだよ♪ ミラーに映してチェックしてみてね！",
  skin_searching: "お顔を枠に合わせてね〜",
  skin_detected: "いい感じ！そのまま動かないでね♪",
  skin_analyzing: "肌の状態をチェックしてるよ〜",
  skin_done: "肌チェック完了♪",
  dental_searching: "口を開けて枠に合わせてね♪",
  dental_detected: "歯と歯茎が見えてるよ！もう少し…",
  dental_analyzing: "着色チェック中♪",
  dental_done: "デンタルチェック完了♪",
  both_done: "肌もデンタルもチェック完了！結果を見てみよう♪",
};

// 演出フェーズ: searching → detected → ready → shutter → scanning → done
const STAGE = { SEARCHING: 'searching', DETECTED: 'detected', READY: 'ready', SHUTTER: 'shutter', SCANNING: 'scanning' };

export default function MirrorScreen({ onResult }) {
  const [mode, setMode] = useState(MODE.IDLE);
  const [stage, setStage] = useState(null); // 演出ステージ
  const [skinScores, setSkinScores] = useState(null);
  const [dentalScores, setDentalScores] = useState(null);
  const [showScores, setShowScores] = useState(true);
  const [lastCheck, setLastCheck] = useState(null);
  const [frozenFrame, setFrozenFrame] = useState(null);
  const cameraRef = useRef(null);
  const handledReadyRef = useRef(false);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // MediaPipe FaceLandmarker
  const faceLandmarker = useFaceLandmarker();

  const shutterMode = mode === MODE.SKIN ? 'face' : mode === MODE.DENTAL ? 'mouth' : 'face';
  const isScanning = stage === STAGE.SCANNING;
  const shutterEnabled = (mode === MODE.SKIN || mode === MODE.DENTAL) && !isScanning && stage !== STAGE.SHUTTER;

  const { status, confidence, lastLandmarks, reset: resetShutter } = useAutoShutter({
    cameraRef,
    videoRef: { get current() { return cameraRef.current?.videoEl || null; } },
    faceLandmarker,
    mode: shutterMode,
    enabled: shutterEnabled,
  });

  // スコアをセットする共通関数（ランドマークがあれば使う）
  const landmarksRef = useRef(null);
  // lastLandmarks を ref に同期（コールバック内で最新値を使うため）
  useEffect(() => { landmarksRef.current = lastLandmarks; }, [lastLandmarks]);

  const applyScores = useCallback(() => {
    const currentMode = modeRef.current;
    const frame = cameraRef.current?.isActive ? cameraRef.current.captureFrame() : null;
    const lm = landmarksRef.current;

    if (currentMode === MODE.SKIN) {
      let result = null;
      try {
        result = frame
          ? (lm ? analyzeSkinWithLandmarks(frame, lm) : analyzeSkin(frame))
          : null;
      } catch { /* */ }
      setSkinScores((result && !result.error) ? {
        tone: { ...SKIN_SCORES.tone, score: result.tone.score },
        pores: { ...SKIN_SCORES.pores, score: result.pores.score },
        dullness: { ...SKIN_SCORES.dullness, score: result.dullness.score },
      } : SKIN_SCORES);
    } else if (currentMode === MODE.DENTAL) {
      let result = null;
      try {
        result = frame
          ? (lm ? analyzeDentalWithLandmarks(frame, lm) : analyzeDental(frame))
          : null;
      } catch { /* */ }
      setDentalScores((result && !result.error) ? {
        gums: { ...DENTAL_SCORES.gums, score: result.gums.score },
        alignment: { ...DENTAL_SCORES.alignment, score: result.alignment.score },
        staining: { ...DENTAL_SCORES.staining, score: result.staining.score },
      } : DENTAL_SCORES);
    }
  }, []);

  // 演出フロー: フレームキャプチャ → シャッターフラッシュ → 静止画スキャン → 完了
  const runShutterSequence = useCallback(() => {
    const currentMode = modeRef.current;

    // 0. シャッター直前にフレームをキャプチャして凍結
    const frame = cameraRef.current?.isActive ? cameraRef.current.captureFrame() : null;
    if (frame) {
      // canvasからdataURLを生成して凍結
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
      // 2. 静止画上でスキャンアニメーション (1500ms)
      setStage(STAGE.SCANNING);

      setTimeout(() => {
        // 3. スコア算出 & IDLE移行（凍結はまだ維持）
        try { applyScores(); } catch { /* */ }
        setLastCheck(currentMode);
        setStage(null);
        setMode(MODE.IDLE);
        // 4. スコアバッジのアニメーション完了後に凍結解除
        // delay: 0, 600, 1200ms + アニメ300ms + 余裕500ms = 約2000ms
        setTimeout(() => setFrozenFrame(null), 2000);
      }, 1500);
    }, 300);
  }, [applyScores]);

  // カメラON時: autoShutterが ready → 演出開始、timeout → リトライ促し
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
    if (mode === MODE.IDLE) return;
    let cancelled = false;
    const currentMode = mode;

    const t0 = setTimeout(() => {
      if (cancelled || cameraRef.current?.isActive) return;

      // デモ: 検出演出
      setStage(STAGE.SEARCHING);
      setTimeout(() => { if (!cancelled) setStage(STAGE.DETECTED); }, 1000);
      setTimeout(() => { if (!cancelled) setStage(STAGE.READY); }, 2000);
      // シャッター
      setTimeout(() => { if (!cancelled) setStage(STAGE.SHUTTER); }, 2400);
      // スキャン
      setTimeout(() => { if (!cancelled) setStage(STAGE.SCANNING); }, 2700);
      // 完了
      setTimeout(() => {
        if (cancelled) return;
        if (currentMode === MODE.SKIN) setSkinScores(SKIN_SCORES);
        else if (currentMode === MODE.DENTAL) setDentalScores(DENTAL_SCORES);
        setLastCheck(currentMode);
        setStage(null);
        setMode(MODE.IDLE);
      }, 4200);
    }, 500);

    return () => { cancelled = true; clearTimeout(t0); };
  }, [mode]);

  const startCheck = useCallback((checkMode) => {
    resetShutter();
    handledReadyRef.current = false;
    setFrozenFrame(null);
    setStage(STAGE.SEARCHING);
    if (checkMode === MODE.SKIN) setSkinScores(null);
    if (checkMode === MODE.DENTAL) setDentalScores(null);
    setMode(checkMode);
  }, [resetShutter]);

  const hasAnyScore = skinScores || dentalScores;
  const isChecking = mode !== MODE.IDLE;
  const analyzing = stage === STAGE.SCANNING;
  // カメラON時はautoShutterのstatus、デモ時はstageを表示用に使う
  const effectiveStatus = stage || (isChecking ? status : 'idle');

  const getKirariMsg = () => {
    if (stage === 'timeout') {
      return mode === MODE.DENTAL
        ? "口元がうまく映ってないみたい…もう一度試してみてね！"
        : "お顔がうまく映ってないみたい…もう一度試して��てね！";
    }
    if (stage === STAGE.SHUTTER) return "📸 パシャ！";
    if (analyzing) {
      const prefix = mode === MODE.DENTAL ? 'dental' : 'skin';
      return KIRARI_MSGS[`${prefix}_analyzing`];
    }
    if (mode === MODE.SKIN) return KIRARI_MSGS[`skin_${effectiveStatus}`] || KIRARI_MSGS.skin_searching;
    if (mode === MODE.DENTAL) return KIRARI_MSGS[`dental_${effectiveStatus}`] || KIRARI_MSGS.dental_searching;
    if (skinScores && dentalScores) return KIRARI_MSGS.both_done;
    if (skinScores) return KIRARI_MSGS.skin_done;
    if (dentalScores) return KIRARI_MSGS.dental_done;
    return KIRARI_MSGS.idle;
  };

  const kirariExpression = (analyzing || stage === STAGE.SHUTTER) ? "thinking"
    : isChecking ? (effectiveStatus === 'detected' || effectiveStatus === 'ready' ? "happy" : "thinking")
    : hasAnyScore ? "sparkle" : "happy";
  const displayMode = isChecking ? mode : (lastCheck || MODE.SKIN);
  const cameraMode = displayMode === MODE.DENTAL ? "mouth" : "face";
  // オーバーレイボタンの共通スタイル
  const glassStyle = {
    background: "rgba(255,255,255,0.88)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <CameraView ref={cameraRef} mode={cameraMode} aspectRatio="auto" frozenSrc={frozenFrame}>
        {/* === キラリ吹き出し === */}
        <div style={{ position: "absolute", top: 36, left: 8, right: 8, zIndex: 3, display: "flex", alignItems: "flex-start", gap: 6 }}>
          <Kirari size={32} expression={kirariExpression} bounce={isChecking} />
          <div style={{ ...glassStyle, borderRadius: 12, padding: "5px 10px", flex: 1 }}>
            <p style={{ fontSize: 11, color: "#334155", margin: 0, lineHeight: 1.4 }}>{getKirariMsg()}</p>
          </div>
        </div>

        {/* === ガイドフレーム === */}
        {isChecking && (stage === STAGE.SEARCHING || stage === STAGE.DETECTED || stage === STAGE.READY || (!stage && (status === 'searching' || status === 'detected'))) && (
          <GuideFrame mode={shutterMode} status={stage || status} confidence={stage ? (stage === 'searching' ? 20 : stage === 'detected' ? 60 : 100) : confidence} />
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
            <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${mode === MODE.DENTAL ? '#22c55e' : '#e879f9'}, transparent)`, animation: "scanLine 1.5s ease-in-out infinite", boxShadow: `0 0 12px ${mode === MODE.DENTAL ? '#22c55e' : '#e879f9'}` }} />
            <style>{`@keyframes scanLine{0%,100%{top:15%}50%{top:70%}}`}</style>
          </div>
        )}

        {/* === スコアバッジ === */}
        {!isChecking && !analyzing && hasAnyScore && showScores && (
          <div style={{ position: "absolute", top: 72, right: 12, display: "flex", flexDirection: "column", gap: 8, zIndex: 2 }}>
            {lastCheck === MODE.SKIN && skinScores && Object.entries(skinScores).map(([k, v], i) => (
              <ScoreBadge key={`skin-${k}`} label={v.label} score={v.score} color={v.color} delay={i * 600} />
            ))}
            {lastCheck === MODE.DENTAL && dentalScores && Object.entries(dentalScores).map(([k, v], i) => (
              <ScoreBadge key={`dental-${k}`} label={v.label} score={v.score} color={v.color} delay={i * 600} />
            ))}
          </div>
        )}

        {/* === 下部オーバーレイ（ボタンエリア） === */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 4,
          background: "linear-gradient(0deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.85) 70%, transparent 100%)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          padding: "24px 16px 12px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        }}>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>

          {isChecking ? (
            <>
              {/* チェック中ステータス */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {stage !== 'timeout' && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: mode === MODE.DENTAL ? "#22c55e" : "#e879f9", animation: "pulse 1s ease-in-out infinite" }} />
                )}
                <span style={{ fontSize: 13, color: stage === 'timeout' ? "#ef4444" : (mode === MODE.DENTAL ? "#22c55e" : "#a855f7"), fontWeight: 600 }}>
                  {stage === 'timeout' ? "検出できませんでした" : stage === STAGE.SHUTTER ? "📸 シャッター！" : analyzing ? "分析中..." : effectiveStatus === 'ready' ? "撮影準備OK" : effectiveStatus === 'detected' ? "検出中..." : "探しています..."}
                </span>
              </div>
              {stage === 'timeout' ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-primary" onClick={() => startCheck(mode)} style={{ padding: "8px 20px", background: "linear-gradient(135deg, #a855f7, #c084fc)", border: "none", borderRadius: 12, fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                    もう一度
                  </button>
                  <button className="btn-secondary" onClick={() => { setStage(null); setMode(MODE.IDLE); }} style={{ padding: "8px 20px", background: "rgba(255,255,255,0.9)", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 12, fontWeight: 600, color: "#94a3b8", cursor: "pointer" }}>
                    やめる
                  </button>
                </div>
              ) : (
                <button className="btn-secondary" onClick={() => { setStage(null); setMode(MODE.IDLE); }} style={{ padding: "8px 24px", background: "rgba(255,255,255,0.9)", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 12, fontWeight: 600, color: "#94a3b8", cursor: "pointer" }}>
                  キャンセル
                </button>
              )}
            </>
          ) : (
            <>
              {/* スコア表示/非表示トグル */}
              {hasAnyScore && (
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
              {/* チェックボタン */}
              <div style={{ display: "flex", gap: 10, width: "100%" }}>
                <button
                  className="btn-primary"
                  onClick={() => startCheck(MODE.SKIN)}
                  style={{
                    flex: 1, padding: "12px 0", border: "none", borderRadius: 14, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer",
                    background: skinScores ? "#a855f7" : "linear-gradient(135deg, #a855f7, #c084fc)",
                    boxShadow: "0 4px 16px rgba(168,85,247,0.25)",
                    opacity: skinScores ? 0.7 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  }}
                >
                  <span>{skinScores ? "✓" : "✨"}</span>肌
                </button>
                <button
                  className="btn-primary"
                  onClick={() => startCheck(MODE.DENTAL)}
                  style={{
                    flex: 1, padding: "12px 0", border: "none", borderRadius: 14, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer",
                    background: dentalScores ? "#22c55e" : "linear-gradient(135deg, #22c55e, #4ade80)",
                    boxShadow: "0 4px 16px rgba(34,197,94,0.25)",
                    opacity: dentalScores ? 0.7 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  }}
                >
                  <span>{dentalScores ? "✓" : "🦷"}</span>デンタル
                </button>
              </div>
              {/* 結果を見るボタン */}
              {hasAnyScore && (
                <button
                  className="btn-primary"
                  onClick={() => onResult({ skinScores, dentalScores })}
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
