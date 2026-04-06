import { useState, useEffect } from 'react';
import Kirari from './Kirari.jsx';
import useCamera from '../hooks/useCamera.js';
import { useT } from '../i18n/index.jsx';

/**
 * Compute CSS filter from skin scores and slider value
 */
function computeFilter(skinScores, t) {
  const dullness = skinScores?.dullness?.score ?? 70;
  const tone     = skinScores?.tone?.score     ?? 70;
  const pores    = skinScores?.pores?.score    ?? 70;

  const dullnessGain   = ((100 - dullness) / 100) * 0.55;
  const saturationGain = ((100 - dullness) / 100) * 0.40;
  const contrastGain   = ((100 - tone)     / 100) * 0.25;
  const poresGain      = ((100 - pores)    / 100) * 0.20;

  const liftContrast  = 0.18;
  const liftHueRotate = 5;

  const brightness = 1 + (dullnessGain + poresGain) * t;
  const contrast   = 1 + (contrastGain + liftContrast) * t;
  const saturate   = 1 + saturationGain * t;
  const hue        = liftHueRotate * t;

  return [
    `brightness(${brightness.toFixed(3)})`,
    `contrast(${contrast.toFixed(3)})`,
    `saturate(${saturate.toFixed(3)})`,
    `hue-rotate(${hue.toFixed(1)}deg)`,
  ].join(' ');
}

export default function SkincareARScreen({ skinScores, onNext, onBack }) {
  const { t } = useT();
  const [sliderValue, setSliderValue] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const { videoRef, isActive, error: cameraError } = useCamera({ enabled: true });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlaying = () => setVideoPlaying(true);
    if (video.readyState >= 2) { onPlaying(); return; }
    video.addEventListener('loadeddata', onPlaying);
    return () => video.removeEventListener('loadeddata', onPlaying);
  }, [isActive, videoRef]);

  const cameraLive = isActive && !cameraError && videoPlaying;

  // Apply CSS filter to video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const t_val = sliderValue / 100;
    video.style.filter = computeFilter(skinScores, t_val);
    video.style.transition = 'filter 0.15s ease';
  }, [sliderValue, skinScores, videoRef]);

  // Auto-animation: 1s delay, then 5s to slide 0->100
  useEffect(() => {
    if (userInteracted) return;
    const delay = setTimeout(() => {
      const interval = setInterval(() => {
        setSliderValue(v => {
          if (v >= 100) { clearInterval(interval); return 100; }
          return v + 1;
        });
      }, 50);
      return () => clearInterval(interval);
    }, 1000);
    return () => clearTimeout(delay);
  }, [userInteracted]);

  const skinScore = skinScores
    ? Math.round(Object.values(skinScores).reduce((s, v) => s + v.score, 0) / Object.values(skinScores).length)
    : '--';

  const kirariMessage = sliderValue >= 90 ? t('skincare_ar.kirari_future')
    : sliderValue >= 70 ? t('skincare_ar.kirari_almost')
    : sliderValue >= 50 ? t('skincare_ar.kirari_week2')
    : sliderValue >= 30 ? t('skincare_ar.kirari_week1')
    : sliderValue >= 10 ? t('skincare_ar.kirari_starting')
    : t('skincare_ar.kirari_now');

  return (
    <div style={{
      position: 'absolute', inset: 0,
      width: '100%', height: '100%',
      background: '#000', overflow: 'hidden',
      zIndex: 100,
    }}>

      {/* Camera full-screen with filter */}
      <video
        ref={videoRef}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
          display: cameraLive ? 'block' : 'none',
        }}
        playsInline muted autoPlay
      />

      {/* Placeholder when camera not live */}
      {!cameraLive && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(180deg, #1a1025 0%, #0f0a1a 100%)',
        }}>
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{'\uD83D\uDCF7'}</div>
            <p style={{ fontSize: 13 }}>Loading camera...</p>
          </div>
        </div>
      )}

      {/* Top-left: Skin score badge */}
      <div style={{
        position: 'absolute',
        top: 'max(env(safe-area-inset-top, 0px), 12px)', left: 16,
        background: 'rgba(168,85,247,0.85)', backdropFilter: 'blur(8px)',
        borderRadius: 20, padding: '4px 14px',
        color: '#fff', fontSize: 13, fontWeight: 700,
        zIndex: 2,
      }}>
        {t('skincare_ar.skin_score') || '\u808C\u30B9\u30B3\u30A2'} {skinScore}
      </div>

      {/* Back button */}
      <button onClick={onBack} style={{
        position: 'absolute',
        top: 'calc(max(env(safe-area-inset-top, 0px), 12px) + 40px)', left: 16,
        background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
        border: 'none', borderRadius: 20, color: '#fff',
        padding: '6px 14px', fontSize: 13, cursor: 'pointer',
        fontWeight: 600, zIndex: 2,
      }}>
        {'\u2190'} {t('skincare_ar.back')}
      </button>

      {/* Bottom gradient overlay with slider + kirari */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
        padding: '60px 20px 0',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 120px)',
        zIndex: 2, pointerEvents: 'none',
      }}>
        {/* Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, pointerEvents: 'auto' }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, whiteSpace: 'nowrap', fontWeight: 600 }}>
            {t('skincare_ar.label_now')}
          </span>
          <input
            type="range" min={0} max={100} value={sliderValue}
            onChange={e => {
              setUserInteracted(true);
              setSliderValue(Number(e.target.value));
            }}
            style={{ flex: 1, accentColor: '#a855f7' }}
          />
          <span style={{ color: '#a855f7', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
            {t('skincare_ar.label_future')}
          </span>
        </div>

        {/* Kirari compact */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Kirari size={28} expression="sparkle" />
          <span style={{ color: '#fff', fontSize: 13, lineHeight: 1.5 }}>{kirariMessage}</span>
        </div>
      </div>

      {/* Bottom bar: FAQ + CTA */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)',
        borderRadius: '20px 20px 0 0',
        borderTop: '1px solid rgba(255,255,255,0.4)',
        padding: '12px 16px',
        zIndex: 3,
      }}>
        {/* Why 2 weeks? accordion */}
        <button
          onClick={() => setWhyOpen(v => !v)}
          style={{
            width: '100%', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', background: 'none', border: 'none',
            fontSize: 13, color: '#a855f7', fontWeight: 600, cursor: 'pointer',
            marginBottom: whyOpen ? 8 : 10, padding: '4px 0',
          }}
        >
          <span>{'\u2753'} {t('skincare_ar.why_title')}</span>
          <span style={{
            transform: whyOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}>{'\u25BC'}</span>
        </button>
        {whyOpen && (
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 6px', lineHeight: 1.6 }}>
              {t('skincare_ar.why_p1')}
            </p>
            <TurnoverDiagram t={t} />
            <p style={{ fontSize: 12, color: '#64748b', margin: '6px 0 0', lineHeight: 1.6 }}>
              {t('skincare_ar.why_p2')}
            </p>
          </div>
        )}

        {/* CTA */}
        <button onClick={onNext} style={{
          width: '100%',
          background: 'linear-gradient(135deg, #a855f7, #ec4899)',
          color: '#fff', border: 'none', borderRadius: 28,
          padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(168,85,247,0.25)',
          whiteSpace: 'nowrap',
        }}>
          {t('skincare_ar.cta')}
        </button>
      </div>
    </div>
  );
}

function TurnoverDiagram({ t }) {
  return (
    <svg viewBox="0 0 280 70" style={{ width: '100%', height: 'auto', margin: '4px 0' }}>
      <line x1="20" y1="35" x2="260" y2="35" stroke="#e2e8f0" strokeWidth="2"/>
      <circle cx="20" cy="35" r="5" fill="#a855f7"/>
      <text x="20" y="55" textAnchor="middle" fontSize="9" fill="#64748b">0{t('skincare_ar.day')}</text>
      <circle cx="140" cy="35" r="6" fill="#ec4899"/>
      <line x1="140" y1="12" x2="140" y2="29" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="3,2"/>
      <text x="140" y="10" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ec4899">
        {t('skincare_ar.two_weeks')}
      </text>
      <text x="140" y="55" textAnchor="middle" fontSize="9" fill="#64748b">14{t('skincare_ar.day')}</text>
      <circle cx="260" cy="35" r="5" fill="#a855f7"/>
      <text x="260" y="55" textAnchor="middle" fontSize="9" fill="#64748b">28{t('skincare_ar.day')}</text>
      <text x="140" y="68" textAnchor="middle" fontSize="8" fill="#94a3b8">
        {t('skincare_ar.turnover_label')}
      </text>
    </svg>
  );
}
