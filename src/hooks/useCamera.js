import { useState, useEffect, useRef, useCallback } from 'react';

export default function useCamera({ enabled = true, facingMode = "user" } = {}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }

    let cancelled = false;

    async function start() {
      try {
        setError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setIsActive(true);
      } catch (err) {
        if (!cancelled) {
          setError(err.name === 'NotAllowedError'
            ? 'カメラへのアクセスが許可されていません'
            : err.name === 'NotFoundError'
              ? 'カメラが見つかりません'
              : `カメラエラー: ${err.message}`
          );
          setIsActive(false);
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      stop();
    };
  }, [enabled, facingMode, stop]);

  // Canvas にフレームをキャプチャ（分析用）
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isActive) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }, [isActive]);

  return { videoRef, isActive, error, stop, captureFrame };
}
