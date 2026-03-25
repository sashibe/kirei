import { useState, useEffect, useRef, useCallback } from 'react';
import Kirari from './Kirari.jsx';
import Bubble from './Bubble.jsx';
import CameraView from './CameraView.jsx';
import ScoreBadge from './ScoreBadge.jsx';
import GuideFrame from './GuideFrame.jsx';
import useAutoShutter from '../hooks/useAutoShutter.js';
import { SKIN_SCORES, DENTAL_SCORES } from '../data/scores.js';
import { analyzeSkin } from '../analysis/skinAnalyzer.js';
import { analyzeDental } from '../analysis/dentalAnalyzer.js';

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
  const cameraRef = useRef(null);
  const handledReadyRef = useRef(false);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const shutterMode = mode === MODE.SKIN ? 'face' : mode === MODE.DENTAL ? 'mouth' : 'face';
  const isScanning = stage === STAGE.SCANNING;
  const shutterEnabled = (mode === MODE.SKIN || mode === MODE.DENTAL) && !isScanning && stage !== STAGE.SHUTTER;

  const { status, confidence, reset: resetShutter } = useAutoShutter({
    cameraRef,
    mode: shutterMode,
    enabled: shutterEnabled,
  });

  // スコアをセットする共通関数
  const applyScores = useCallback(() => {
    const currentMode = modeRef.current;
    const frame = cameraRef.current?.isActive ? cameraRef.current.captureFrame() : null;

    if (currentMode === MODE.SKIN) {
      let result = null;
      try { result = frame ? analyzeSkin(frame) : null; } catch { /* */ }
      setSkinScores((result && !result.error) ? {
        tone: { ...SKIN_SCORES.tone, score: result.tone.score },
        pores: { ...SKIN_SCORES.pores, score: result.pores.score },
        dullness: { ...SKIN_SCORES.dullness, score: result.dullness.score },
      } : SKIN_SCORES);
    } else if (currentMode === MODE.DENTAL) {
      let result = null;
      try { result = frame ? analyzeDental(frame) : null; } catch { /* */ }
      setDentalScores((result && !result.error) ? {
        gums: { ...DENTAL_SCORES.gums, score: result.gums.score },
        alignment: { ...DENTAL_SCORES.alignment, score: result.alignment.score },
        staining: { ...DENTAL_SCORES.staining, score: result.staining.score },
      } : DENTAL_SCORES);
    }
  }, []);

  // 演出フロー: シャッター → スキャン → 完了
  const runShutterSequence = useCallback(() => {
    const currentMode = modeRef.current;

    // 1. シャッターフラッシュ (300ms)
    setStage(STAGE.SHUTTER);

    setTimeout(() => {
      // 2. スキャンアニメーション (1500ms)
      setStage(STAGE.SCANNING);

      setTimeout(() => {
        // 3. スコア算出 & 完了
        try { applyScores(); } catch { /* */ }
        setLastCheck(currentMode);
        setStage(null);
        setMode(MODE.IDLE);
      }, 1500);
    }, 300);
  }, [applyScores]);

  // カメラON時: autoShutterが ready → 演出開始
  useEffect(() => {
    if (status === 'ready' && !handledReadyRef.current) {
      handledReadyRef.current = true;
      runShutterSequence();
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
  const aspectRatio = "3/4";

  return (
    <>
      <div style={{ position: "relative", boxShadow: "0 8px 32px rgba(168,85,247,0.12)" }}>
        <CameraView ref={cameraRef} mode={cameraMode} aspectRatio={aspectRatio}>
          {/* キラリ吹き出し（カメラ内オーバーレイ） */}
          <div style={{ position: "absolute", top: 8, left: 8, right: 8, zIndex: 3, display: "flex", alignItems: "flex-start", gap: 6 }}>
            <Kirari size={36} expression={kirariExpression} bounce={isChecking} />
            <div style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(8px)", borderRadius: 14, padding: "6px 10px", flex: 1 }}>
              <p style={{ fontSize: 11, color: "#334155", margin: 0, lineHeight: 1.5 }}>{getKirariMsg()}</p>
            </div>
          </div>
          {/* ガイドフレーム（検出フェーズ中のみ表示） */}
          {isChecking && (stage === STAGE.SEARCHING || stage === STAGE.DETECTED || stage === STAGE.READY || (!stage && (status === 'searching' || status === 'detected'))) && (
            <GuideFrame mode={shutterMode} status={stage || status} confidence={stage ? (stage === 'searching' ? 20 : stage === 'detected' ? 60 : 100) : confidence} />
          )}
          {/* シャッターフラッシュ */}
          {stage === STAGE.SHUTTER && (
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              background: "white", zIndex: 10,
              animation: "shutterFlash 300ms ease-out forwards",
            }}>
              <style>{`@keyframes shutterFlash{0%{opacity:1}100%{opacity:0}}`}</style>
            </div>
          )}
          {/* スキャンアニメーション */}
          {analyzing && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
              <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${mode === MODE.DENTAL ? '#22c55e' : '#e879f9'}, transparent)`, animation: "scanLine 1.5s ease-in-out infinite", boxShadow: `0 0 12px ${mode === MODE.DENTAL ? '#22c55e' : '#e879f9'}` }} />
              <style>{`@keyframes scanLine{0%,100%{top:15%}50%{top:70%}}`}</style>
            </div>
          )}
          {/* スコアバッジ（IDLE時、スコアあり） */}
          {!isChecking && !analyzing && hasAnyScore && (
            <>
              <button
                onClick={() => setShowScores(s => !s)}
                style={{
                  position: "absolute", top: 12, left: 12, zIndex: 2,
                  background: "rgba(255,255,255,0.85)", backdropFilter: "blur(6px)",
                  border: "none", borderRadius: 20, padding: "5px 12px",
                  fontSize: 10, fontWeight: 600, color: "#64748b", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                <span style={{ fontSize: 12 }}>{showScores ? "👁" : "👁‍🗨"}</span>
                {showScores ? "スコア非表示" : "スコア表示"}
              </button>
              {showScores && lastCheck === MODE.SKIN && skinScores && (
                <div style={{ position: "absolute", top: 16, right: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.entries(skinScores).map(([k, v], i) => (
                    <ScoreBadge key={`skin-${k}`} label={v.label} score={v.score} color={v.color} delay={i * 600} />
                  ))}
                </div>
              )}
              {showScores && lastCheck === MODE.DENTAL && dentalScores && (
                <div style={{ position: "absolute", top: 16, right: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.entries(dentalScores).map(([k, v], i) => (
                    <ScoreBadge key={`dental-${k}`} label={v.label} score={v.score} color={v.color} delay={i * 600} />
                  ))}
                </div>
              )}
            </>
          )}
          {/* チェック中ラベル */}
          {isChecking && (
            <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(255,255,255,0.9)", borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: mode === MODE.DENTAL ? "#22c55e" : "#a855f7", fontWeight: 600 }}>
                {mode === MODE.DENTAL ? "DENTAL CHECK" : "SKIN CHECK"}
              </span>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>LIVE</span>
            </div>
          )}
        </CameraView>
      </div>

      {/* アクションエリア */}
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        {isChecking ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: mode === MODE.DENTAL ? "#22c55e" : "#e879f9", animation: "pulse 1s ease-in-out infinite" }} />
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
              <span style={{ fontSize: 13, color: mode === MODE.DENTAL ? "#22c55e" : "#a855f7", fontWeight: 600 }}>
                {stage === STAGE.SHUTTER ? "📸 シャッター！" : analyzing ? "分析中..." : effectiveStatus === 'ready' ? "撮影準備OK" : effectiveStatus === 'detected' ? "検出中..." : "探しています..."}
              </span>
            </div>
            <button className="btn-secondary" onClick={() => setMode(MODE.IDLE)} style={{ padding: "8px 24px", background: "transparent", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 12, fontWeight: 600, color: "#94a3b8", cursor: "pointer" }}>
              キャンセル
            </button>
          </>
        ) : (
          <>
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
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5, whiteSpace: "nowrap",
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
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5, whiteSpace: "nowrap",
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
                style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #a855f7, #ec4899)", border: "none", borderRadius: 16, fontSize: 15, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 20px rgba(168,85,247,0.3)" }}
              >
                結果を見る →
              </button>
            )}
          </>
        )}
        <p className="disclaimer">※本アプリは医療診断を行うものではありません</p>
      </div>
    </>
  );
}
