/**
 * watermark.js — シェア画像に KIREI ロゴウォーターマークを追加
 */
export function addWatermark(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  const logoSize = Math.round(w * 0.08);
  ctx.save();
  ctx.font = `300 ${logoSize}px 'Cormorant Garamond', serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 1;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('KIREI', w - 12, h - 12);
  ctx.restore();
  return canvas;
}
