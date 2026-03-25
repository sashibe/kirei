import { useState, useEffect, useRef } from 'react';
import Kirari from './Kirari.jsx';
import Bubble from './Bubble.jsx';
import CameraView from './CameraView.jsx';
import { SKIN_SCORES } from '../data/scores.js';
import { analyzeSkin } from '../analysis/skinAnalyzer.js';

export default function MirrorScreen({ onNext, onScoresReady }) {
  const [skinDone, setSkinDone] = useState(false);
  const [scores, setScores] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    setSkinDone(false);
    setScores(null);

    // 3秒後に分析実行
    const t = setTimeout(() => {
      let result = null;

      // カメラが有効ならリアル分析
      if (cameraRef.current?.isActive) {
        const frame = cameraRef.current.captureFrame();
        if (frame) {
          result = analyzeSkin(frame);
          if (!result.error) {
            setScores({
              tone: { ...SKIN_SCORES.tone, score: result.tone.score },
              pores: { ...SKIN_SCORES.pores, score: result.pores.score },
              dullness: { ...SKIN_SCORES.dullness, score: result.dullness.score },
            });
          }
        }
      }

      // カメラなし or 分析失敗時はデモスコア
      if (!result || result.error) {
        setScores(SKIN_SCORES);
      }

      setSkinDone(true);
    }, 3000);

    return () => clearTimeout(t);
  }, []);

  // スコアが確定したら親に通知
  useEffect(() => {
    if (scores && onScoresReady) {
      onScoresReady(scores);
    }
  }, [scores, onScoresReady]);

  const displayScores = scores || SKIN_SCORES;

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 20px 10px" }}>
        <Kirari size={44} expression={skinDone ? "sparkle" : "thinking"} bounce={!skinDone} />
        <Bubble>
          <p style={{ fontSize: 13, color: "#334155", margin: 0, lineHeight: 1.7 }}>
            {skinDone ? "肌チェック完了♪ 口元を映すとデンタルチェックもできるよ！" : "キラリだよ♪ お顔を映してね、肌の状態をチェックしてるよ〜"}
          </p>
        </Bubble>
      </div>

      <div style={{ margin: "0 20px", boxShadow: "0 8px 32px rgba(168,85,247,0.12)" }}>
        <CameraView ref={cameraRef} mode="face" aspectRatio="3/4">
          {!skinDone && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
              <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #e879f9, transparent)", animation: "ms 2s ease-in-out infinite", boxShadow: "0 0 12px #e879f9" }} />
              <style>{`@keyframes ms{0%,100%{top:15%}50%{top:70%}}`}</style>
            </div>
          )}
          {skinDone && (
            <div style={{ position: "absolute", top: 16, right: 16, display: "flex", flexDirection: "column", gap: 6, animation: "fadeIn 0.5s ease" }}>
              <style>{`@keyframes fadeIn{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}`}</style>
              {Object.entries(displayScores).map(([k, v], i) => (
                <div key={k} style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", borderRadius: 10, padding: "4px 10px", display: "flex", alignItems: "center", gap: 6, animationDelay: `${i * 0.15}s` }}>
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>{v.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: v.color }}>{v.score}</span>
                </div>
              ))}
            </div>
          )}
        </CameraView>
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        {skinDone ? (
          <button onClick={onNext} style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #a855f7, #ec4899)", border: "none", borderRadius: 16, fontSize: 15, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 20px rgba(168,85,247,0.3)" }}>
            口元を映してデンタルチェック →
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e879f9", animation: "pulse 1s ease-in-out infinite" }} />
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
            <span style={{ fontSize: 13, color: "#a855f7", fontWeight: 600 }}>肌を分析中...</span>
          </div>
        )}
        <p style={{ fontSize: 10, color: "#cbd5e1", margin: 0 }}>※本アプリは医療診断を行うものではありません</p>
      </div>
    </>
  );
}
