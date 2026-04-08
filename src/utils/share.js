/**
 * share.js — スクリーンショット撮影 + シェア/保存ユーティリティ
 */

/**
 * video + canvas を合成してdataURLを返す
 */
export function captureFrame(videoEl, canvasEl) {
  if (!videoEl) return null;
  const c = document.createElement('canvas');
  c.width = videoEl.videoWidth || 640;
  c.height = videoEl.videoHeight || 480;
  const ctx = c.getContext('2d');
  ctx.save(); ctx.translate(c.width, 0); ctx.scale(-1, 1);
  ctx.drawImage(videoEl, 0, 0, c.width, c.height);
  ctx.restore();
  if (canvasEl) {
    ctx.save(); ctx.translate(c.width, 0); ctx.scale(-1, 1);
    ctx.drawImage(canvasEl, 0, 0, c.width, c.height);
    ctx.restore();
  }
  return c.toDataURL('image/jpeg', 0.92);
}

/**
 * dataURL → Blob変換
 */
function dataURLtoBlob(dataURL) {
  const [header, base64] = dataURL.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/**
 * Web Share APIでシェア（非対応ならダウンロード保存にフォールバック）
 */
export async function shareImage(dataURL, title = 'KIREI') {
  const blob = dataURLtoBlob(dataURL);
  const file = new File([blob], 'kirei-makeup.jpg', { type: 'image/jpeg' });

  // Web Share API（モバイル対応）
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title,
        text: 'KIREI - AI Beauty Mirror',
        files: [file],
      });
      return 'shared';
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelled';
    }
  }

  // フォールバック: ダウンロード保存
  return saveImage(dataURL);
}

/**
 * 画像をダウンロード保存
 */
export function saveImage(dataURL) {
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = `kirei-${Date.now()}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return 'saved';
}
