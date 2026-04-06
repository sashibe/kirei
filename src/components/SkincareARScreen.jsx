import { useState, useEffect } from 'react';
import Kirari from './Kirari.jsx';
import Bubble from './Bubble.jsx';
import useCamera from '../hooks/useCamera.js';
import { useT } from '../i18n/index.jsx';

/**
 * スコアとスライダー値からCSSフィルター文字列を生成する
 * @param {object} skinScores  { dullness: {score}, tone: {score}, pores: {score} }
 * @param {number} t  スライダー値 0.0（今）〜 1.0（2週間後）
 * @returns {string} CSS filter 文字列
 */
function computeFilter(skinScores, t) {
  const dullness = skinScores?.dullness?.score ?? 70;
  const tone     = skinScores?.tone?.score     ?? 70;
  const pores    = skinScores?.pores?.score    ?? 70;

  // スコア連動（デモ用強調値）
  const dullnessGain   = ((100 - dullness) / 100) * 0.55;
  const saturationGain = ((100 - dullness) / 100) * 0.40;
  const contrastGain   = ((100 - tone)     / 100) * 0.25;
  const poresGain      = ((100 - pores)    / 100) * 0.20;

  // たるみ引き締め演出（固定値）
  // contrast強化 → 輪郭シャープ・フェイスラインが締まって見える
  // hue-rotate微量 → 血色感UP・若返り印象
  const liftContrast  = 0.18;
  const liftHueRotate = 5; // 度

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const t_val = sliderValue / 100;
    video.style.filter = computeFilter(skinScores, t_val);
    video.style.transition = 'filter 0.15s ease';
  }, [sliderValue, skinScores, videoRef]);

  // 自動アニメーション: 1秒待機→5秒かけて0→100
  useEffect(() => {
    if (userInteracted) return;

    const delay = setTimeout(() => {
      const interval = setInterval(() => {
        setSliderValue(v => {
          if (v >= 100) {
            clearInterval(interval);
            return 100;
          }
          return v + 1;
        });
      }, 50);

      return () => clearInterval(interval);
    }, 1000);

    return () => clearTimeout(delay);
  }, [userInteracted]);

  const sliderLabel = sliderValue === 0
    ? t('skincare_ar.label_now')
    : sliderValue === 100
      ? t('skincare_ar.label_future')
      : `${sliderValue}%`;

  return (
    <div style={{ paddingBottom: 24 }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', fontSize: 13,
        color: '#94a3b8', cursor: 'pointer',
        padding: '8px 16px', fontWeight: 600,
      }}>
        {'<'} {t('skincare_ar.back')}
      </button>

      <div style={{
        position: 'relative', margin: '0 16px 12px',
        borderRadius: 20, overflow: 'hidden',
        background: '#111',
        aspectRatio: cameraLive ? 'auto' : '3/4',
        maxHeight: '52vh',
      }}>
        <video
          ref={videoRef}
          style={{
            width: '100%', height: '100%',
            objectFit: 'contain',
            transform: 'scaleX(-1)',
            display: cameraLive ? 'block' : 'none',
          }}
          playsInline muted autoPlay
        />

        <div style={{
          position: 'absolute', top: 12, left: 12,
          background: sliderValue >= 50
            ? 'linear-gradient(135deg, rgba(168,85,247,0.85), rgba(236,72,153,0.85))'
            : 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
          borderRadius: 12, padding: '5px 12px',
          transition: 'background 0.3s ease',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', margin: 0 }}>
            {sliderLabel}
          </p>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div style={{
          background: '#fff', borderRadius: 16, padding: '12px 14px',
          boxShadow: '0 2px 8px rgba(139,92,246,0.06)',
          border: '1px solid #ede9fe',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 8,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
              {t('skincare_ar.label_now')}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#a855f7' }}>
              {t('skincare_ar.label_future')}
            </span>
          </div>
          <input
            type="range" min="0" max="100" step="1"
            value={sliderValue}
            onChange={e => {
              setUserInteracted(true);
              setSliderValue(Number(e.target.value));
            }}
            style={{ width: '100%', accentColor: '#a855f7' }}
          />
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 8,
        padding: '0 16px 10px',
      }}>
        <Kirari size={36} expression="sparkle" />
        <Bubble>
          <p style={{ fontSize: 12, color: '#334155', margin: 0, lineHeight: 1.6 }}>
            {sliderValue >= 90 ? t('skincare_ar.kirari_future')
              : sliderValue >= 70 ? t('skincare_ar.kirari_almost')
              : sliderValue >= 50 ? t('skincare_ar.kirari_week2')
              : sliderValue >= 30 ? t('skincare_ar.kirari_week1')
              : sliderValue >= 10 ? t('skincare_ar.kirari_starting')
              : t('skincare_ar.kirari_now')}
          </p>
        </Bubble>
      </div>

      <div style={{ padding: '0 16px 14px' }}>
        <div style={{
          background: '#faf5ff', borderRadius: 14,
          border: '1px solid #e9d5ff', overflow: 'hidden',
        }}>
          <button
            onClick={() => setWhyOpen(v => !v)}
            style={{
              width: '100%', padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 18, height: 18, borderRadius: '50%',
                background: '#a855f7', color: '#fff',
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>?</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#7c3aed' }}>
                {t('skincare_ar.why_title')}
              </span>
            </div>
            <span style={{
              fontSize: 11, color: '#a78bfa',
              transform: whyOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}>▼</span>
          </button>

          {whyOpen && (
            <div style={{ padding: '0 16px 14px' }}>
              <TurnoverExplanation t={t} skinScores={skinScores} />
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        <button onClick={onNext} style={{
          width: '100%', padding: 14,
          background: 'linear-gradient(135deg, #a855f7, #ec4899)',
          border: 'none', borderRadius: 14,
          fontSize: 14, fontWeight: 700, color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(168,85,247,0.25)',
        }}>
          {t('skincare_ar.cta')}
        </button>
      </div>
    </div>
  );
}

function TurnoverExplanation({ t, skinScores }) {
  const dullness = skinScores?.dullness?.score ?? 70;

  return (
    <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.8 }}>
      <p style={{ margin: '0 0 10px' }}>
        {t('skincare_ar.why_p1')}
      </p>

      <TurnoverDiagram t={t} />

      <p style={{ margin: '10px 0 10px' }}>
        {t('skincare_ar.why_p2')}
      </p>

      {dullness < 60 && (
        <div style={{
          background: 'rgba(168,85,247,0.08)',
          borderRadius: 10, padding: '8px 12px',
          border: '1px solid rgba(168,85,247,0.15)',
          marginTop: 4,
        }}>
          <p style={{ fontSize: 11, color: '#7c3aed', margin: 0, lineHeight: 1.6 }}>
            {t('skincare_ar.why_personal_dullness', { score: String(dullness) })}
          </p>
        </div>
      )}
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
