import { useState, useEffect, useRef, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export default function useFaceLandmarker() {
  const [ready, setReady] = useState(false);
  const detectorRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
        );
        if (cancelled) return;

        detectorRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.75,
          minFacePresenceConfidence: 0.75,
          minTrackingConfidence: 0.5,
        });

        if (!cancelled) setReady(true);
      } catch (e) {
        console.warn('FaceLandmarker init failed, falling back to heuristic:', e);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // videoEl: HTMLVideoElement, timestamp: performance.now()
  // 戻り値: { landmarks, faceBox } | null
  const detect = useCallback((videoEl, timestamp) => {
    if (!detectorRef.current || !ready || !videoEl) return null;
    try {
      const result = detectorRef.current.detectForVideo(videoEl, timestamp);
      if (!result.faceLandmarks?.length) return null;

      const lms = result.faceLandmarks[0]; // 478点

      // バウンディングボックスを計算（0-1正規化）
      const xs = lms.map(p => p.x);
      const ys = lms.map(p => p.y);
      const faceBox = {
        x: Math.min(...xs),
        y: Math.min(...ys),
        w: Math.max(...xs) - Math.min(...xs),
        h: Math.max(...ys) - Math.min(...ys),
      };

      return { landmarks: lms, faceBox };
    } catch {
      return null;
    }
  }, [ready]);

  return { ready, detect };
}
