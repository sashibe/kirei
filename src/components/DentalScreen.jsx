import { useState, useEffect, useRef } from 'react';
import Kirari from './Kirari.jsx';
import Bubble from './Bubble.jsx';
import CameraView from './CameraView.jsx';
import { analyzeDental } from '../analysis/dentalAnalyzer.js';
import { DENTAL_SCORES } from '../data/scores.js';

export default function DentalScreen({ onComplete }) {
  const [dentalProg, setDentalProg] = useState(0);
  const cameraRef = useRef(null);
  const analyzedRef = useRef(false);

  useEffect(() => {
    setDentalProg(0);
    analyzedRef.current = false;

    const iv = setInterval(() => {
      setDentalProg(p => {
        if (p >= 100) {
          clearInterval(iv);

          // 100%到達時に分析を実行
          if (!analyzedRef.current) {
            analyzedRef.current = true;
            let result = null;

            if (cameraRef.current?.isActive) {
              const frame = cameraRef.current.captureFrame();
              if (frame) {
                result = analyzeDental(frame);
              }
            }

            // カメラなし or 分析失敗時はデモスコア
            const scores = (result && !result.error) ? {
              gums: { ...DENTAL_SCORES.gums, score: result.gums.score },
              alignment: { ...DENTAL_SCORES.alignment, score: result.alignment.score },
              staining: { ...DENTAL_SCORES.staining, score: result.staining.score },
            } : DENTAL_SCORES;

            setTimeout(() => onComplete(scores), 500);
          }

          return 100;
        }
        return p + 1;
      });
    }, 35);

    return () => clearInterval(iv);
  }, [onComplete]);

  const msgs = ["口元を検出したよ！", "歯茎の色を見てるよ〜", "着色チェック中♪", "もう少しで完了！"];
  const mi = Math.min(3, Math.floor(dentalProg / 25));

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 20px 10px" }}>
        <Kirari size={44} expression="thinking" bounce />
        <Bubble><p style={{ fontSize: 13, color: "#334155", margin: 0 }}>{msgs[mi]}</p></Bubble>
      </div>

      <div style={{ margin: "0 20px", boxShadow: "0 8px 32px rgba(168,85,247,0.12)" }}>
        <CameraView ref={cameraRef} mode="mouth" aspectRatio="4/3">
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
            {dentalProg < 95 && <div style={{ position: "absolute", left: 0, right: 0, height: 3, background: "linear-gradient(90deg, transparent, #a855f7, transparent)", animation: "ds 1.8s ease-in-out infinite", boxShadow: "0 0 16px #a855f7" }} />}
            <style>{`@keyframes ds{0%,100%{top:10%}50%{top:85%}}`}</style>
          </div>
          {dentalProg > 25 && <div style={{ position: "absolute", top: "20%", left: "18%", width: "64%", height: "60%", border: "2px solid rgba(168,85,247,0.5)", borderRadius: 40, background: "rgba(168,85,247,0.06)", opacity: Math.min(1, (dentalProg - 25) / 20) }} />}
          <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(255,255,255,0.9)", borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#a855f7", fontWeight: 600 }}>DENTAL CHECK</span>
            <span style={{ fontSize: 10, color: "#94a3b8" }}>AUTO</span>
          </div>
        </CameraView>
      </div>

      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ background: "#f1f5f9", borderRadius: 10, height: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 10, width: `${dentalProg}%`, background: "linear-gradient(90deg, #a855f7, #ec4899)", transition: "width 0.08s" }} />
        </div>
        <p style={{ fontSize: 12, color: "#94a3b8", margin: "8px 0 0", textAlign: "center" }}>
          肌チェック ✓ ・ デンタルチェック {dentalProg < 100 ? `${dentalProg}%` : "✓"}
        </p>
      </div>
    </>
  );
}
