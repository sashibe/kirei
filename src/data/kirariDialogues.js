// src/data/kirariDialogues.js

export function getCoordLine(context) {
  const { styleTab, tpo, weather } = context;
  const tabNames = ['color', 'base', 'skincare'];
  const tab = tabNames[styleTab] || 'color';

  // 天気連動
  if (weather?.temp < 10) return 'かなり冷え込むみたい。しっかりアウターで暖かく過ごそうね\u266A';
  if (weather?.temp < 18) return '少し肌寒い日だね。カーデやジャケットがあると安心\u266A';
  if (weather?.temp > 28) return '暑い日！涼しい素材で快適に、メイクも崩れにくいアイテムを\u266A';

  // タブ x TPO 連動
  if (tab === 'color' && tpo === 'office') return 'オフィスでも華やかさをキープ\u266A メイクに合わせた上品コーデだよ\u301C';
  if (tab === 'color' && tpo === 'date') return 'デートコーデ\u266A メイクの色味と合わせてトータルで可愛く\u301C';
  if (tab === 'base' && tpo === 'office') return 'クリーンなビジネススタイル\u266A 清潔感バッチリだよ\u301C';
  if (tab === 'base' && tpo === 'casual') return 'シンプルだけどこなれ感のあるコーデ\u266A 肌がきれいに見えるよ\u301C';
  if (tab === 'base' && tpo === 'date') return 'さりげなく好印象なスマートカジュアル\u266A いい感じ\u301C';

  return 'メイクに合わせたトータルコーデだよ\u266A 気になるアイテムはタップしてチェックしてね\u301C';
}

export function getCoordHint(selectedLook, styleTab, weather) {
  const tabNames = ['color', 'base', 'skincare'];
  const tab = tabNames[styleTab] || 'color';

  if (tab === 'color') {
    return `${selectedLook?.name || 'メイク'}に合わせた配色コーデで、トータルの印象がぐっとアップするよ\u266A`;
  }
  if (tab === 'base') {
    return 'ベースメイクの清潔感を活かしたシンプルコーデがおすすめ\u266A';
  }
  return '素肌を活かしたナチュラルコーデで、リラックスした雰囲気に\u266A';
}
