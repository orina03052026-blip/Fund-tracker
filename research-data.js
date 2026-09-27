// オリナ証券チーム(stock-team)のチェック結果スナップショット。
// stock-teamのチェック日ごとにClaudeがこのファイルを手動更新してpushする(自動連携なし)。
// 参照専用データであり、資金管理・投資ターゲットの記録(localStorage)とは独立。
const RESEARCH_SNAPSHOT = {
  checkedAt: "2026-09-27",
  nextCheck: "2026-10-04",
  holdings: [
    { ticker: "8035", name: "東京エレクトロン", signal: "決算またぎ要注意", entry: 54020, current: 53110, unit: "円", pct: -1.68, flag: null, note: "アナリスト目標73,114円との乖離+37%。決算は10月下旬予定" },
    { ticker: "SPCX", name: "SpaceX", signal: "跳ねそう(強気継続)", entry: 139.65, current: 152.71, unit: "$", pct: 9.36, flag: null, note: "✅的中(9/5確定)。時価総額2兆ドル規模で上昇基調" },
    { ticker: "9331107A", name: "キャピタル世界株式ファンド", signal: "様子見(積立継続)", entry: 41854, current: 41436, unit: "円", pct: -1.00, flag: null, note: "判定対象外・分散された土台資産" },
  ],
  candidates: [
    { ticker: "ALAB", name: "Astera Labs", signal: "跳ねそう(強気加速)", entry: 303.40, current: 364.62, unit: "$", pct: 20.18, flag: "profit", broker: "PayPay証券: 取扱なし(2026-09-27確認)", note: "初の利確ライン(+15%)突破・オーナー判断待ち。実口座では購入不可" },
    { ticker: "6981", name: "村田製作所", signal: "様子見(テーマ次第)", entry: 7205, current: 8022, unit: "円", pct: 11.34, flag: null, note: "AIサーバー向けコンデンサでデータセンターテーマ堅調" },
    { ticker: "ETN", name: "Eaton", signal: "様子見(利確一巡待ち)", entry: 431.33, current: 439.98, unit: "$", pct: 2.01, flag: null, note: "電源インフラ本命、上値は他候補より限定的" },
    { ticker: "7013", name: "IHI", signal: "要警戒(急落中)", entry: 2867, current: 2797, unit: "円", pct: -2.44, flag: null, note: "✅的中(9/5確定)。急落からほぼ発行時水準まで回復" },
    { ticker: "VRT", name: "Vertiv", signal: "跳ねそう(強気)", entry: 256.00, current: 253.28, unit: "$", pct: -1.06, flag: null, note: "✅的中(9/5確定)。データセンター電源インフラの本命格" },
    { ticker: "MRVL", name: "Marvell", signal: "決算またぎ要注意", entry: 272.05, current: 261.94, unit: "$", pct: -3.72, flag: null, note: "判定対象外・決算またぎで評価が割れている" },
    { ticker: "AVGO", name: "Broadcom", signal: "跳ねそう(強気継続)", entry: 365.80, current: 352.81, unit: "$", pct: -3.55, flag: null, note: "レンジ内(9/5確定)。AIインフラ半導体の本命格" },
    { ticker: "4204", name: "積水化学工業", signal: "跳ねそう(反発基調)", entry: 2631, current: 2525, unit: "円", pct: -4.03, flag: null, note: "❌外れ(9/5確定)。ペロブスカイト太陽電池の国策テーマ" },
    { ticker: "6954", name: "ファナック", signal: "様子見(部材調達懸念のオーバーハング)", entry: 6435, current: 5985, unit: "円", pct: -6.99, flag: "exit", note: "損切りラインを脱出。再開シグナルの確認日2026-10-13" },
    { ticker: "6506", name: "安川電機", signal: "様子見(ロボットテーマ地合い悪化)", entry: 5255, current: 4480, unit: "円", pct: -14.75, flag: "loss", note: "損切り検討・オーナー判断待ち。再開シグナルの確認日2026-10-13" },
  ],
};
