// src/utils/logger.js

const SESSION_KEY = 'kirei_session_log';
const LAST_CHECK_KEY = 'kirei_last_check';
const TOTAL_CHECKS_KEY = 'kirei_total_checks';
const PREV_SCORE_KEY = 'kirei_prev_score';

export function logEvent(eventName, payload = {}) {
  const entry = {
    event: eventName,
    ts: Date.now(),
    ...payload,
  };

  const log = JSON.parse(localStorage.getItem(SESSION_KEY) || '[]');
  log.push(entry);
  localStorage.setItem(SESSION_KEY, JSON.stringify(log.slice(-200)));

  if (eventName === 'check_complete') {
    localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
    const prev = parseInt(localStorage.getItem(TOTAL_CHECKS_KEY) || '0');
    localStorage.setItem(TOTAL_CHECKS_KEY, String(prev + 1));

    if (payload.score_overall != null) {
      localStorage.setItem(PREV_SCORE_KEY, String(payload.score_overall));
    }
  }
}

export function getHoursSinceLastCheck() {
  const last = localStorage.getItem(LAST_CHECK_KEY);
  if (!last) return null;
  return (Date.now() - parseInt(last)) / 3600000;
}

export function getTotalChecks() {
  return parseInt(localStorage.getItem(TOTAL_CHECKS_KEY) || '0');
}

export function getPrevScore() {
  const v = localStorage.getItem(PREV_SCORE_KEY);
  return v != null ? parseInt(v) : null;
}
