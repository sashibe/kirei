import { useState, useEffect, useRef } from 'react';
import Kirari from './Kirari.jsx';
import Bubble from './Bubble.jsx';
import CameraView from './CameraView.jsx';
import GuideFrame from './GuideFrame.jsx';
import useAutoShutter from '../hooks/useAutoShutter.js';
import { useT } from '../i18n/index.jsx';
import { analyzeDental } from '../analysis/dentalAnalyzer.js';
import { DENTAL_SCORES } from '../data/scores.js';

export default function DentalScreen({ onComplete }) {
  const { t } = useT();
  const [analyzing, setAnalyzing] = useState(false);
  const [done, setDone] = useState(false);
  const cameraRef = useRef(null);

  const { status, confidence } = useAutoShutter({
    captureFrame: cameraRef.current?.captureFrame,
    isActive: cameraRef.current?.isActive && !done && !analyzing,
    mode: 'mouth',
    enabled: !done && !analyzing,
  });

  // 自動シャッター発火 → 分析実行
  useEffect(() => {
    if (status !== 'ready' || done || analyzing) return;
    setAnalyzing(true);

    const timer = setTimeout(() => {
      let result = null;
      if (cameraRef.current?.isActive) {
        const frame = cameraRef.current.captureFrame();
        if (frame) result = analyzeDental(frame);
      }

      const scores = (result && !result.error) ? {
        gums: { ...DENTAL_SCORES.gums, score: result.gums.score },
        alignment: { ...DENTAL_SCORES.alignment, score: result.alignment.score },
        staining: { ...DENTAL_SCORES.staining, score: result.staining.score },
      } : DENTAL_SCORES;

      setDone(true);
      setAnalyzing(false);
      setTimeout(() => onComplete(scores), 500);
    }, 400);

    return () => clearTimeout(timer);
  }, [status, done, analyzing, onComplete]);

  // カメラ不可時のフォールバック（従来のプログレスバー動作）
  const [fallbackProg, setFallbackProg] = useState(0);
  const isFallback = !cameraRef.current?.isActive;

  useEffect(() => {
    if (!isFallback || done) return;
    const iv = setInterval(() => {
      setFallbackProg(p => {
        if (p >= 100) {
          clearInterval(iv);
          setTimeout(() => onComplete(DENTAL_SCORES), 500);
          return 100;
        }
        return p + 1;
      });
    }, 35);
    return () => clearInterval(iv);
  }, [isFallback, done, onComplete]);

  const fallbackMsgs = [t("dental.fallback_1"), t("dental.fallback_2"), t("dental.fallback_3"), t("dental.fallback_4")];
  const kirariMsg = done ? t("kirari.dental_done")
    : analyzing ? t("kirari.dental_analyzing")
    : isFallback ? fallbackMsgs[Math.min(3, Math.floor(fallbackProg / 25))]
    : t(`kirari.dental_${status}`) || t("kirari.dental_searching");

  const progressValue = isFallback ? fallbackProg : (confidence * 1.2);

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 20px 10px" }}>
        <Kirari size={44} expression={done ? "sparkle" : "thinking"} bounce={!done} />
        <Bubble><p style={{ fontSize: 13, color: "#334155", margin: 0 }}>{kirariMsg}</p></Bubble>
      </div>

      <div style={{ margin: "0 20px", boxShadow: "0 8px 32px rgba(168,85,247,0.12)" }}>
        <CameraView ref={cameraRef} mode="mouth" aspectRatio="4/3">
          {/* ガイドフレーム */}
          {!done && !analyzing && !isFallback && (
            <GuideFrame mode="mouth" status={status} confidence={confidence} />
          )}
          {/* 分析中 or フォールバック時のスキャンライン */}
          {(analyzing || (isFallback && fallbackProg < 95)) && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, right: 0, height: 3, background: "linear-gradient(90deg, transparent, #a855f7, transparent)", animation: "ds 1.8s ease-in-out infinite", boxShadow: "0 0 16px #a855f7" }} />
              <style>{`@keyframes ds{0%,100%{top:10%}50%{top:85%}}`}</style>
            </div>
          )}
          <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(255,255,255,0.9)", borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#a855f7", fontWeight: 600 }}>DENTAL CHECK</span>
            <span style={{ fontSize: 10, color: "#94a3b8" }}>{isFallback ? "AUTO" : "LIVE"}</span>
          </div>
        </CameraView>
      </div>

      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ background: "#f1f5f9", borderRadius: 10, height: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 10, width: `${Math.min(100, progressValue)}%`, background: "linear-gradient(90deg, #a855f7, #ec4899)", transition: "width 0.2s" }} />
        </div>
        <p style={{ fontSize: 12, color: "#94a3b8", margin: "8px 0 0", textAlign: "center" }}>
          {t("dental.progress_skin")} ・ {t("dental.progress_dental")} {done ? "✓" : analyzing ? t("mirror.analyzing") : `${Math.min(100, Math.round(progressValue))}%`}
        </p>
      </div>
    </>
  );
}
