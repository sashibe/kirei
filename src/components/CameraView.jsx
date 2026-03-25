import { forwardRef, useImperativeHandle } from 'react';
import useCamera from '../hooks/useCamera.js';
import { IMG_FACE, IMG_MOUTH } from '../data/images.js';

const CameraView = forwardRef(function CameraView({ mode = "face", aspectRatio = "3/4", frozenSrc = null, children }, ref) {
  const { videoRef, isActive, error, captureFrame } = useCamera();
  const fallbackImg = mode === "face" ? IMG_FACE : IMG_MOUTH;

  useImperativeHandle(ref, () => ({
    captureFrame,
    isActive,
  }), [captureFrame, isActive]);

  return (
    <div style={{ position: "relative", borderRadius: 24, overflow: "hidden", aspectRatio, background: "#000" }}>
      {/* video は常にDOMに存在させ、srcObject の接続を維持する */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scaleX(-1)",
          display: (isActive && !frozenSrc) ? "block" : "none",
        }}
      />
      {/* 凍結画像（シャッター後の静止画） */}
      {frozenSrc && (
        <img src={frozenSrc} alt="" style={{
          width: "100%", height: "100%", objectFit: "cover",
          transform: "scaleX(-1)",
        }} />
      )}
      {/* カメラ不可時のデモ画像 */}
      {!isActive && !frozenSrc && (
        <>
          <img src={fallbackImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />
          {error && (
            <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, background: "rgba(0,0,0,0.7)", borderRadius: 10, padding: "6px 10px" }}>
              <p style={{ fontSize: 10, color: "#fbbf24", margin: 0 }}>{error}</p>
              <p style={{ fontSize: 9, color: "#94a3b8", margin: "2px 0 0" }}>デモ画像で表示中</p>
            </div>
          )}
        </>
      )}
      {children}
      <div style={{ position: "absolute", inset: 0, borderRadius: 24, border: "3px solid rgba(168,85,247,0.15)", pointerEvents: "none" }} />
    </div>
  );
});

export default CameraView;
