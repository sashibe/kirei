import { useState, useEffect, useRef, useCallback } from 'react';
import Kirari from './Kirari.jsx';
import Bubble from './Bubble.jsx';
import CameraView from './CameraView.jsx';
import ScoreBadge from './ScoreBadge.jsx';
import GuideFrame from './GuideFrame.jsx';
import useAutoShutter from '../hooks/useAutoShutter.js';
import { SKIN_SCORES } from '../data/scores.js';
import { analyzeSkin } from '../analysis/skinAnalyzer.js';

const KIRARI_MSGS = {
  searching: "キラリだよ♪ お顔を枠に合わせてね〜",
  detected: "いい感じ！そのまま動かないでね♪",
  analyzing: "肌の状態をチェックしてるよ〜",
  done: "肌チェック完了♪ 口元を映すとデンタルチェックもできるよ！",
};

export default function MirrorScreen({ onNext, onScoresReady }) {
  const [skinDone, setSkinDone] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [scores, setScores] = useState(null);
  const cameraRef = useRef(null);

  const { status, confidence } = useAutoShutter({
    captureFrame: cameraRef.current?.captureFrame,
    isActive: cameraRef.current?.isActive && !skinDone && !analyzing,
    mode: 'face',
    enabled: !skinDone && !analyzing,
  });

  // 自動シャッター発火 → 分析実行
  useEffect(() => {
    if (status !== 'ready' || skinDone || analyzing) return;
    setAnalyzing(true);

    // 少し待ってからキャプチャ（フラッシュ演出用）
    const t = setTimeout(() => {
      let result = null;
      if (cameraRef.current?.isActive) {
        const frame = cameraRef.current.captureFrame();
        if (frame) result = analyzeSkin(frame);
      }

      if (result && !result.error) {
        setScores({
          tone: { ...SKIN_SCORES.tone, score: result.tone.score },
          pores: { ...SKIN_SCORES.pores, score: result.pores.score },
          dullness: { ...SKIN_SCORES.dullness, score: result.dullness.score },
        });
      } else {
        setScores(SKIN_SCORES);
      }
      setSkinDone(true);
      setAnalyzing(false);
    }, 400);

    return () => clearTimeout(t);
  }, [status, skinDone, analyzing]);

  // カメラ不可時のフォールバック（3秒タイマー）
  useEffect(() => {
    if (cameraRef.current?.isActive || skinDone) return;
    const t = setTimeout(() => {
      setScores(SKIN_SCORES);
      setSkinDone(true);
    }, 3000);
    return () => clearTimeout(t);
  }, [skinDone]);

  // スコアが確定したら親に通知
  useEffect(() => {
    if (scores && onScoresReady) onScoresReady(scores);
  }, [scores, onScoresReady]);

  const displayScores = scores || SKIN_SCORES;
  const kirariExpression = skinDone ? "sparkle" : (analyzing ? "thinking" : (status === 'detected' ? "happy" : "thinking"));
  const kirariMsg = skinDone ? KIRARI_MSGS.done
    : analyzing ? KIRARI_MSGS.analyzing
    : KIRARI_MSGS[status] || KIRARI_MSGS.searching;

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 20px 10px" }}>
        <Kirari size={44} expression={kirariExpression} bounce={!skinDone} />
        <Bubble>
          <p style={{ fontSize: 13, color: "#334155", margin: 0, lineHeight: 1.7 }}>{kirariMsg}</p>
        </Bubble>
      </div>

      <div style={{ margin: "0 20px", boxShadow: "0 8px 32px rgba(168,85,247,0.12)" }}>
        <CameraView ref={cameraRef} mode="face" aspectRatio="3/4">
          {/* ガイドフレーム（分析中・完了時は非表示） */}
          {!skinDone && !analyzing && (
            <GuideFrame mode="face" status={status} confidence={confidence} />
          )}
          {/* 分析中のスキャンライン */}
          {analyzing && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
              <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #e879f9, transparent)", animation: "ms 1.5s ease-in-out infinite", boxShadow: "0 0 12px #e879f9" }} />
              <style>{`@keyframes ms{0%,100%{top:15%}50%{top:70%}}`}</style>
            </div>
          )}
          {/* スコアバッジ */}
          {skinDone && (
            <div style={{ position: "absolute", top: 16, right: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(displayScores).map(([k, v], i) => (
                <ScoreBadge key={k} label={v.label} score={v.score} color={v.color} delay={i * 600} />
              ))}
            </div>
          )}
        </CameraView>
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        {skinDone ? (
          <button className="btn-primary" onClick={onNext} style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #a855f7, #ec4899)", border: "none", borderRadius: 16, fontSize: 15, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 20px rgba(168,85,247,0.3)", textAlign: "center", lineHeight: 1.6 }}>
            口元を映して<br />デンタルチェック →
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: status === 'detected' ? "#a855f7" : "#e879f9", animation: "pulse 1s ease-in-out infinite" }} />
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
            <span style={{ fontSize: 13, color: "#a855f7", fontWeight: 600 }}>
              {analyzing ? "分析中..." : status === 'detected' ? "検出中..." : "顔を探しています..."}
            </span>
          </div>
        )}
        <p className="disclaimer">※本アプリは医療診断を行うものではありません</p>
      </div>
    </>
  );
}
