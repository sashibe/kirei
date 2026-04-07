/**
 * scoreHistory — Supabaseへのスコア保存・履歴取得
 * 保存失敗してもアプリは止めない（サイレント失敗）
 */
import { supabase } from './supabase.js';

export async function saveScore({ guestId, scores, personalColor, lang }) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('skin_scores')
      .insert({
        guest_id:    guestId,
        skin_tone:   scores?.tone?.score   ?? scores?.skinTone ?? 0,
        pores:       scores?.pores?.score  ?? scores?.pores ?? 0,
        dullness:    scores?.dullness?.score ?? scores?.dullness ?? 0,
        pc_season:   personalColor?.season ?? null,
        pc_tone:     personalColor?.subtypeId?.split('-')[1] ?? null,
        hour_of_day: new Date().getHours(),
        lang:        lang || 'ja',
      });
    if (error) console.warn('[scoreHistory] save failed:', error.message);
  } catch (e) {
    console.warn('[scoreHistory] save error:', e.message);
  }
}

export async function fetchScoreHistory(guestId, limit = 30) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('skin_scores')
      .select('scanned_at, skin_tone, pores, dullness, pc_season, pc_tone')
      .eq('guest_id', guestId)
      .order('scanned_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.warn('[scoreHistory] fetch failed:', error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn('[scoreHistory] fetch error:', e.message);
    return [];
  }
}
