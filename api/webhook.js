import { kv } from '@vercel/kv';

// 定数としてキー名を定義
const KEY_LEADERBOARD_POINTS = 'leaderboard_points';
const KEY_CURRENT_STOCK_PRICE = 'current_stock_price';
const PREFIX_USER_STOCKS = 'stocks:';
const PREFIX_USER_DEBT = 'debt:'; // 借金情報を保存するキーのプレフィックス
const PREFIX_ENGLISH_GAME = 'english_game:'; // 英単語ゲームの状態を保存するキーのプレフィックス
const PREFIX_RESET_CONFIRM = 'reset_confirm:'; // ポイントリセット確認用のキープレフィックス

// 英単語リスト
const easyWords = [
    { english: ["apple"], japanese: "りんご" }, { english: ["book"], japanese: "本" },
    { english: ["car", "automobile"], japanese: "車" }, { english: ["dog"], japanese: "犬" },
    { english: ["eat"], japanese: "食べる" }, { english: ["friend"], japanese: "友達" },
    { english: ["good"], japanese: "良い" }, { english: ["happy"], japanese: "幸せな" },
    { english: ["jump"], japanese: "跳ぶ" }, { english: ["water"], japanese: "水" },
    { english: ["pen"], japanese: "ペン" }, { english: ["cat"], japanese: "猫" },
    { english: ["sun"], japanese: "太陽" }, { english: ["red"], japanese: "赤い" },
    { english: ["big", "large"], japanese: "大きい" }, { english: ["small", "little"], japanese: "小さい" },
    { english: ["run"], japanese: "走る" }, { english: ["see", "look", "watch"], japanese: "見る" },
    { english: ["tree"], japanese: "木" }, { english: ["sky"], japanese: "空" },
];

const normalWords = [
    // 既存の単語
    { english: ["achieve", "accomplish"], japanese: "達成する" }, { english: ["benefit", "profit"], japanese: "利益" },
    { english: ["celebrate"], japanese: "祝う" }, { english: ["decision"], japanese: "決定" },
    { english: ["effective"], japanese: "効果的な" }, { english: ["familiar"], japanese: "よく知られた" },
    { english: ["generate", "create"], japanese: "生み出す" }, { english: ["however", "but"], japanese: "しかしながら" },
    { english: ["improve"], japanese: "改善する" }, { english: ["journey", "trip"], japanese: "旅" },
    { english: ["knowledge"], japanese: "知識" }, { english: ["language"], japanese: "言語" },
    { english: ["measure"], japanese: "測る" }, { english: ["notice"], japanese: "気づく" },
    { english: ["operate"], japanese: "操作する" }, { english: ["protect"], japanese: "保護する" },
    { english: ["quality"], japanese: "品質" }, { english: ["receive", "get"], japanese: "受け取る" },
    { english: ["suggest", "propose"], japanese: "提案する" }, { english: ["technology"], japanese: "科学技術" },
    { english: ["understand"], japanese: "理解する" }, { english: ["various", "several"], japanese: "様々な" },
    { english: ["weather"], japanese: "天気" }, { english: ["yesterday"], japanese: "昨日" },
    { english: ["ability", "capability"], japanese: "能力" }, { english: ["believe"], japanese: "信じる" },
    { english: ["consider"], japanese: "考慮する" }, { english: ["develop"], japanese: "開発する" },
    { english: ["environment"], japanese: "環境" }, { english: ["foreign"], japanese: "外国の" },
    // 追加の単語
    { english: ["activity"], japanese: "活動" }, { english: ["afraid", "scared"], japanese: "恐れて" },
    { english: ["agree"], japanese: "同意する" }, { english: ["allow", "permit"], japanese: "許す" },
    { english: ["arrive", "reach"], japanese: "到着する" }, { english: ["attend"], japanese: "出席する" },
    { english: ["attention"], japanese: "注意" }, { english: ["avoid"], japanese: "避ける" },
    { english: ["beautiful", "pretty"], japanese: "美しい" }, { english: ["become"], japanese: "〜になる" },
    { english: ["borrow"], japanese: "借りる" }, { english: ["brave", "courageous"], japanese: "勇敢な" },
    { english: ["bright"], japanese: "明るい" }, { english: ["business", "work", "job"], japanese: "仕事、ビジネス" },
    { english: ["careful"], japanese: "注意深い" }, { english: ["change"], japanese: "変える、変化" },
    { english: ["cheap", "inexpensive"], japanese: "安い" }, { english: ["choose", "select", "pick"], japanese: "選ぶ" },
    { english: ["common"], japanese: "共通の、普通の" }, { english: ["compare"], japanese: "比較する" },
    { english: ["continue"], japanese: "続ける" }, { english: ["culture"], japanese: "文化" },
    { english: ["customer"], japanese: "顧客" }, { english: ["danger", "risk"], japanese: "危険" },
    { english: ["depend"], japanese: "頼る" }, { english: ["describe"], japanese: "説明する" },
    { english: ["different"], japanese: "異なる" }, { english: ["difficult", "hard"], japanese: "難しい" },
    { english: ["discover"], japanese: "発見する" }, { english: ["discuss"], japanese: "議論する" },
    { english: ["divide"], japanese: "分ける" }, { english: ["effort"], japanese: "努力" },
    { english: ["either"], japanese: "どちらか" }, { english: ["encourage"], japanese: "励ます" },
    { english: ["enough"], japanese: "十分な" }, { english: ["enter"], japanese: "入る" },
    { english: ["example", "instance"], japanese: "例" }, { english: ["excite"], japanese: "興奮させる" },
    { english: ["expect"], japanese: "期待する" }, { english: ["experience"], japanese: "経験" },
    { english: ["explain"], japanese: "説明する" }, { english: ["express"], japanese: "表現する" },
    { english: ["famous", "well-known"], japanese: "有名な" }, { english: ["favorite"], japanese: "お気に入りの" },
    { english: ["figure"], japanese: "数字、姿" }, { english: ["follow"], japanese: "従う" },
    { english: ["forest"], japanese: "森" }, { english: ["forget"], japanese: "忘れる" },
    { english: ["future"], japanese: "未来" }, { english: ["government"], japanese: "政府" },
    { english: ["guess"], japanese: "推測する" }, { english: ["history"], japanese: "歴史" },
    { english: ["hobby", "pastime"], japanese: "趣味" },
    { english: ["include"], japanese: "含む" }, { english: ["increase"], japanese: "増加する" },
    { english: ["influence", "impact"], japanese: "影響" }, { english: ["information"], japanese: "情報" },
    { english: ["interest"], japanese: "興味" }, { english: ["invite"], japanese: "招待する" },
    { english: ["island"], japanese: "島" }, { english: ["join", "participate"], japanese: "参加する" },
    { english: ["kind", "type"], japanese: "種類" }, { english: ["level"], japanese: "レベル、水準" },
    { english: ["local"], japanese: "地元の" }, { english: ["lose"], japanese: "失う" },
    { english: ["machine"], japanese: "機械" }, { english: ["matter", "issue", "problem"], japanese: "問題" },
    { english: ["memory"], japanese: "記憶" }, { english: ["million"], japanese: "百万" },
    { english: ["minute"], japanese: "分" }, { english: ["moment"], japanese: "瞬間" },
    { english: ["mountain"], japanese: "山" }, { english: ["necessary", "essential"], japanese: "必要な" },
    { english: ["neighbor"], japanese: "隣人" }, { english: ["nothing"], japanese: "何もない" },
    { english: ["office"], japanese: "事務所" }, { english: ["order"], japanese: "注文、命令" },
    { english: ["parent"], japanese: "親" }, { english: ["party"], japanese: "パーティー" },
    { english: ["pass"], japanese: "通る、合格する" }, { english: ["peace"], japanese: "平和" },
    { english: ["people"], japanese: "人々" }, { english: ["perfect"], japanese: "完璧な" },
    { english: ["plan"], japanese: "計画" }, { english: ["plant"], japanese: "植物、工場" },
    { english: ["police"], japanese: "警察" }, { english: ["popular"], japanese: "人気のある" },
    { english: ["possible"], japanese: "可能な" }, { english: ["power"], japanese: "力" },
    { english: ["prepare"], japanese: "準備する" }, { english: ["present", "gift"], japanese: "贈り物" },
    { english: ["president"], japanese: "大統領、社長" }, { english: ["price", "cost"], japanese: "価格" },
    { english: ["produce"], japanese: "生産する" },
    { english: ["promise"], japanese: "約束" }, { english: ["provide", "supply"], japanese: "提供する" },
    { english: ["purpose", "aim", "goal"], japanese: "目的" }, { english: ["question"], japanese: "質問" },
    { english: ["reason"], japanese: "理由" },
    { english: ["remember"], japanese: "思い出す" }, { english: ["report"], japanese: "報告する" },
    { english: ["result", "outcome"], japanese: "結果" }, { english: ["return", "go back"], japanese: "戻る" },
    { english: ["science"], japanese: "科学" }, { english: ["season"], japanese: "季節" },
    { english: ["second"], japanese: "秒、二番目" }, { english: ["secret"], japanese: "秘密" },
    { english: ["sense"], japanese: "感覚" }, { english: ["service"], japanese: "サービス" },
    { english: ["share"], japanese: "共有する" },
    { english: ["similar"], japanese: "似ている" }, { english: ["simple", "easy"], japanese: "簡単な" },
    { english: ["single"], japanese: "独身の、一つの" }, { english: ["situation"], japanese: "状況" },
    { english: ["skill"], japanese: "技術" }, { english: ["society"], japanese: "社会" },
    { english: ["special"], japanese: "特別な" }, { english: ["spend"], japanese: "費やす" },
    { english: ["station"], japanese: "駅" }, { english: ["stomach"], japanese: "胃" },
    { english: ["straight"], japanese: "まっすぐな" }, { english: ["strange", "weird"], japanese: "奇妙な" },
    { english: ["street", "road"], japanese: "通り" }, { english: ["strong", "powerful"], japanese: "強い" },
    { english: ["success"], japanese: "成功" }, { english: ["support"], japanese: "支援する" },
    { english: ["surprise"], japanese: "驚き" }, { english: ["system"], japanese: "システム" },
    { english: ["talent", "gift"], japanese: "才能" }, { english: ["though", "although"], japanese: "〜だけれども" },
    { english: ["thought", "idea"], japanese: "考え" }, { english: ["ticket"], japanese: "切符" },
    { english: ["tired"], japanese: "疲れた" }, { english: ["together"], japanese: "一緒に" },
    { english: ["tourist"], japanese: "観光客" }, { english: ["towel"], japanese: "タオル" },
    { english: ["traffic"], japanese: "交通" }, { english: ["travel"], japanese: "旅行する" },
    { english: ["useful", "helpful"], japanese: "役立つ" },
    { english: ["usual", "normal", "ordinary"], japanese: "いつもの" }, { english: ["vacation", "holiday"], japanese: "休暇" },
    { english: ["village"], japanese: "村" }, { english: ["visit"], japanese: "訪れる" },
    { english: ["voice"], japanese: "声" }, { english: ["welcome"], japanese: "歓迎する" },
    { english: ["whole", "entire"], japanese: "全体の" }, { english: ["without"], japanese: "〜なしで" },
    { english: ["worry", "be anxious"], japanese: "心配する" },
];

const hardWords = [
    // 既存の単語
    { english: "abundant", japanese: "豊富な" }, { english: "controversial", japanese: "論争の的となる" },
    { english: "demonstrate", japanese: "実証する" }, { english: "exaggerate", japanese: "誇張する" },
    { english: "fundamental", japanese: "基本的な" }, { english: "sophisticated", japanese: "洗練された" },
    { english: "simultaneously", japanese: "同時に" }, { english: "reluctant", japanese: "気が進まない" },
    { english: "profound", japanese: "深遠な" }, { english: "perspective", japanese: "視点" },
    { english: "inevitable", japanese: "避けられない" }, { english: "implement", japanese: "実行する" },
    { english: "hypothesis", japanese: "仮説" }, { english: "gregarious", japanese: "社交的な" },
    { english: "fluctuate", japanese: "変動する" }, { english: "eloquent", japanese: "雄弁な" },
    { english: "distinguish", japanese: "見分ける" }, { english: "conscientious", japanese: "誠実な" },
    { english: "benevolent", japanese: "慈悲深い" }, { english: "anticipate", japanese: "予期する" },
    { english: "vulnerable", japanese: "脆弱な" }, { english: "ubiquitous", japanese: "どこにでもある" },
    { english: "tentative", japanese: "仮の" }, { english: "substantial", japanese: "かなりの" },
    { english: "spontaneous", japanese: "自発的な" }, { english: "scrutinize", japanese: "精査する" },
    // 追加の単語
    { english: "accommodate", japanese: "収容する、適応させる" }, { english: "accumulate", japanese: "蓄積する" },
    { english: "accurate", japanese: "正確な" }, { english: "acquire", japanese: "習得する" },
    { english: "adequate", japanese: "十分な、適切な" }, { english: "adjacent", japanese: "隣接した" },
    { english: "advocate", japanese: "主張する、支持者" }, { english: "aesthetic", japanese: "美的な" },
    { english: "affluent", japanese: "裕福な" }, { english: "aggregate", japanese: "総計、集合体" },
    { english: "allocate", japanese: "割り当てる" }, { english: "ambiguous", japanese: "曖昧な" },
    { english: "amend", japanese: "修正する" }, { english: "analogy", japanese: "類推" },
    { english: "anonymous", japanese: "匿名の" }, { english: "apparatus", japanese: "装置" },
    { english: "arbitrary", japanese: "任意の、独断的な" }, { english: "articulate", japanese: "明瞭に話す" },
    { english: "assert", japanese: "断言する" }, { english: "attribute", japanese: "属性、〜のせいにする" },
    { english: "authentic", japanese: "本物の" }, { english: "bias", japanese: "偏見" },
    { english: "catastrophe", japanese: "大災害" }, { english: "coincide", japanese: "同時に起こる" },
    { english: "collaborate", japanese: "協力する" }, { english: "coherent", japanese: "一貫した" },
    { english: "compatible", japanese: "互換性のある" }, { english: "compel", japanese: "強いる" },
    { english: "compensate", japanese: "補償する" }, { english: "competent", japanese: "有能な" },
    { english: "complement", japanese: "補完するもの" }, { english: "comprehensive", japanese: "包括的な" },
    { english: "conceive", japanese: "思いつく" }, { english: "condemn", japanese: "非難する" },
    { english: "confront", japanese: "直面する" }, { english: "consensus", japanese: "合意" },
    { english: "consecutive", japanese: "連続的な" }, { english: "consolidate", japanese: "統合する" },
    { english: "constitute", japanese: "構成する" }, { english: "contemplate", japanese: "熟考する" },
    { "english": "contradict", "japanese": "矛盾する" }, { "english": "convene", "japanese": "召集する" },
    { "english": "correlate", "japanese": "相関させる" }, { "english": "credibility", "japanese": "信頼性" },
    { "english": "criterion", "japanese": "基準" }, { "english": "cultivate", "japanese": "育成する" },
    { "english": "cumulative", "japanese": "累積的な" }, { "english": "cynical", "japanese": "皮肉な" },
    { "english": "debris", "japanese": "破片、がれき" }, { "english": "deceive", "japanese": "だます" },
    { "english": "deduce", "japanese": "推論する" }, { "english": "deficiency", "japanese": "欠乏" },
    { "english": "deliberate", "japanese": "意図的な、慎重な" }, { "english": "depict", "japanese": "描く" },
    { "english": "deprive", "japanese": "奪う" }, { "english": "derive", "japanese": "由来する" },
    { "english": "deteriorate", "japanese": "悪化する" }, { "english": "deviate", "japanese": "逸脱する" },
    { "english": "devise", "japanese": "考案する" }, { "english": "differentiate", "japanese": "区別する" },
    { "english": "dilemma", "japanese": "ジレンマ" }, { "english": "diligent", "japanese": "勤勉な" },
    { "english": "discourse", "japanese": "談話、講演" }, { "english": "discrepancy", "japanese": "不一致" },
    { "english": "disperse", "japanese": "分散させる" }, { "english": "disrupt", "japanese": "混乱させる" },
    { "english": "dissipate", "japanese": "消散させる" }, { "english": "divert", "japanese": "そらす" },
    { "english": "doctrine", "japanese": "教義" }, { "english": "domain", "japanese": "領域" },
    { "english": "dubious", "japanese": "疑わしい" }, { "english": "eccentric", "japanese": "風変わりな" },
    { "english": "elaborate", "japanese": "詳しく述べる、精巧な" }, { "english": "eligible", "japanese": "資格のある" },
    { "english": "embody", "japanese": "具体化する" }, { "english": "embrace", "japanese": "受け入れる" },
    { "english": "emerge", "japanese": "現れる" }, { "english": "empirical", "japanese": "経験的な" },
    { "english": "encompass", "japanese": "含む" }, { "english": "endorse", "japanese": "支持する" },
    { "english": "enhance", "japanese": "高める" }, { "english": "enormous", "japanese": "巨大な" },
    { "english": "entity", "japanese": "実体" }, { "english": "entrepreneur", "japanese": "起業家" },
    { "english": "equilibrium", "japanese": "均衡" }, { "english": "eradicate", "japanese": "根絶する" },
    { "english": "erroneous", "japanese": "誤った" }, { "english": "escalate", "japanese": "段階的に拡大する" },
    { "english": "evaluate", "japanese": "評価する" }, { "english": "evoke", "japanese": "呼び起こす" },
    { "english": "exploit", "japanese": "開発する、搾取する" }, { "english": "explicit", "japanese": "明確な" },
    { "english": "facilitate", "japanese": "促進する" }, { "english": "feasible", "japanese": "実行可能な" },
    { "english": "finite", "japanese": "有限の" }, { "english": "flaw", "japanese": "欠陥" },
    { "english": "foster", "japanese": "育成する" }, { "english": "franchise", "japanese": "フランチャイズ" },
    { "english": "fraud", "japanese": "詐欺" }, { "english": "futile", "japanese": "無駄な" },
    { "english": "generic", "japanese": "一般的な" }, { "english": "genuine", "japanese": "本物の" },
    { "english": "graphical", "japanese": "図式の" }, { "english": "gravity", "japanese": "重力、重大さ" },
    { "english": "heritage", "japanese": "遺産" }, { "english": "hierarchy", "japanese": "階層" },
    { "english": "homogeneous", "japanese": "均質の" }, { "english": "ideology", "japanese": "イデオロギー" },
    { "english": "immerse", "japanese": "浸す" }, { "english": "imminent", "japanese": "差し迫った" },
    { "english": "impair", "japanese": "損なう" }, { "english": "impartial", "japanese": "公平な" },
    { "english": "impede", "japanese": "妨げる" }, { "english": "imperative", "japanese": "必須の" },
    { "english": "implicit", "japanese": "暗黙の" }, { "english": "impose", "japanese": "課す" },
    { "english": "inadequate", "japanese": "不十分な" }, { "english": "incessant", "japanese": "絶え間ない" },
    { "english": "inclined", "japanese": "〜する傾向がある" }, { "english": "incompatible", "japanese": "互換性のない" },
    { "english": "incorporate", "japanese": "組み込む" }, { "english": "indigenous", "japanese": "固有の" },
    { "english": "induce", "japanese": "誘発する" }, { "english": "infer", "japanese": "推測する" },
    { "english": "inherent", "japanese": "固有の" }, { "english": "inhibit", "japanese": "抑制する" },
    { "english": "initiate", "japanese": "始める" }, { "english": "innovative", "japanese": "革新的な" },
    { "english": "insatiable", "japanese": "飽くことのない" }, { "english": "insight", "japanese": "洞察" },
    { "english": "integral", "japanese": "不可欠な" }, { "english": "integrate", "japanese": "統合する" },
    { "english": "integrity", "japanese": "誠実さ" }, { "english": "interim", "japanese": "中間の" },
    { "english": "intervene", "japanese": "介入する" }, { "english": "intricate", "japanese": "複雑な" },
    { "english": "intrinsic", "japanese": "本来備わっている" }, { "english": "invoke", "japanese": "呼び起こす、発動する" },
    { "english": "irrelevant", "japanese": "無関係な" }, { "english": "jeopardy", "japanese": "危険" },
    { "english": "judicial", "japanese": "司法の" }, { "english": "jurisdiction", "japanese": "司法権" },
    { "english": "justify", "japanese": "正当化する" }, { "english": "latent", "japanese": "潜在的な" },
    { "english": "lavish", "japanese": "気前の良い" }, { "english": "legacy", "japanese": "遺産" },
    { "english": "legitimate", "japanese": "正当な" }, { "english": "leverage", "japanese": "てこ、影響力" },
    { "english": "linguistic", "japanese": "言語の" }, { "english": "lucrative", "japanese": "儲かる" },
    { "english": "magnify", "japanese": "拡大する" }, { "english": "magnitude", "japanese": "大きさ、重要性" },
    { "english": "mainstream", "japanese": "主流" }, { "english": "malicious", "japanese": "悪意のある" },
    { "english": "manipulate", "japanese": "操作する" }, { "english": "marginal", "japanese": "わずかな" },
    { "english": "mediate", "japanese": "仲介する" }, { "english": "metaphor", "japanese": "比喩" },
    { "english": "meticulous", "japanese": "細心な" }, { "english": "migrate", "japanese": "移住する" },
    { "english": "milestone", "japanese": "画期的な出来事" }, { "english": "minute", "japanese": "微小な" },
    { "english": "miscellaneous", "japanese": "雑多な" }, { "english": "momentum", "japanese": "勢い" },
    { "english": "monotonous", "japanese": "単調な" }, { "english": "mutual", "japanese": "相互の" },
    { "english": "narrative", "japanese": "物語" }, { "english": "negligible", "japanese": "無視できるほどの" },
    { "english": "notion", "japanese": "概念" }, { "english": "notorious", "japanese": "悪名高い" },
    { "english": "novel", "japanese": "斬新な" }, { "english": "nurture", "japanese": "育む" },
    { "english": "obsolete", "japanese": "時代遅れの" }, { "english": "obstinate", "japanese": "頑固な" },
    { "english": "offset", "japanese": "相殺する" }, { "english": "omit", "japanese": "省略する" },
    { "english": "omnipotent", "japanese": "全能の" }, { "english": "onset", "japanese": "始まり" },
    { "english": "optimal", "japanese": "最適な" }, { "english": "orient", "japanese": "向ける" },
    { "english": "paradigm", "japanese": "パラダイム" }, { "english": "paradox", "japanese": "逆説" },
    { "english": "parameter", "japanese": "媒介変数" }, { "english": "paramount", "japanese": "最高の" },
    { "english": "partial", "japanese": "部分的な" }, { "english": "perceive", "japanese": "知覚する" },
    { "english": "perennial", "japanese": "長続きする" }, { "english": "peripheral", "japanese": "周辺の" },
    { "english": "perpetuate", "japanese": "永続させる" }, { "english": "plausible", "japanese": "もっともらしい" },
    { "english": "ponder", "japanese": "熟考する" }, { "english": "postulate", "japanese": "仮定する" },
    { "english": "pragmatic", "japanese": "実用的な" }, { "english": "precedent", "japanese": "前例" },
    { "english": "preclude", "japanese": "排除する" }, { "english": "predecessor", "japanese": "前任者" },
    { "english": "predominantly", "japanese": "主に" }, { "english": "preliminary", "japanese": "予備の" },
    { "english": "premise", "japanese": "前提" }, { "english": "prevail", "japanese": "普及している" },
    { "english": "pristine", "japanese": "新品同様の" }, { "english": "proficient", "japanese": "熟達した" },
    { "english": "prohibit", "japanese": "禁止する" }, { "english": "prolific", "japanese": "多作の" },
    { "english": "prolong", "japanese": "延長する" }, { "english": "prompt", "japanese": "促す" },
    { "english": "prone", "japanese": "傾向がある" }, { "english": "propagate", "japanese": "繁殖させる" },
    { "english": "protocol", "japanese": "議定書" }, { "english": "proxy", "japanese": "代理" },
    { "english": "qualitative", "japanese": "質的な" }, { "english": "quantitative", "japanese": "量的な" },
    { "english": "quota", "japanese": "割り当て" }, { "english": "radical", "japanese": "根本的な" },
    { "english": "rationale", "japanese": "理論的根拠" }, { "english": "reciprocal", "japanese": "相互の" },
    { "english": "reconcile", "japanese": "和解させる" }, { "english": "redundant", "japanese": "余分な" },
    { "english": "refute", "japanese": "反論する" }, { "english": "reimburse", "japanese": "払い戻す" },
    { "english": "reinforce", "japanese": "強化する" }, { "english": "relegate", "japanese": "格下げする" },
    { "english": "remedy", "japanese": "治療法" }, { "english": "render", "japanese": "〜にする" },
    { "english": "replicate", "japanese": "複製する" }, { "english": "repress", "japanese": "抑制する" },
    { "english": "reputable", "japanese": "評判の良い" }, { "english": "rescind", "japanese": "取り消す" },
    { "english": "residual", "japanese": "残りの" }, { "english": "resilient", "japanese": "回復力のある" },
    { "english": "respectively", "japanese": "それぞれ" }, { "english": "resurgence", "japanese": "復活" },
    { "english": "retain", "japanese": "保持する" }, { "english": "retaliate", "japanese": "報復する" },
    { "english": "retrieve", "japanese": "取り戻す" }, { "english": "retrospect", "japanese": "回顧" },
    { "english": "revenue", "japanese": "歳入" }, { "english": "revise", "japanese": "修正する" },
    { "english": "robust", "japanese": "頑健な" }, { "english": "rustic", "japanese": "素朴な" },
    { "english": "sanction", "japanese": "制裁" }, { "english": "saturate", "japanese": "飽和させる" },
    { "english": "savvy", "japanese": "精通している" }, { "english": "scenario", "japanese": "シナリオ" },
    { "english": "scope", "japanese": "範囲" }, { "english": "sector", "japanese": "部門" },
    { "english": "sedentary", "japanese": "座りがちの" }, { "english": "segment", "japanese": "部分" },
    { "english": "sequentially", "japanese": "連続的に" }, { "english": "sever", "japanese": "切断する" },
    { "english": "skeptical", "japanese": "懐疑的な" }, { "english": "soar", "japanese": "急上昇する" },
    { "english": "solely", "japanese": "単に" }, { "english": "solidarity", "japanese": "連帯" },
    { "english": "spawn", "japanese": "生み出す" }, { "english": "speculate", "japanese": "推測する" },
    { "english": "stagnant", "japanese": "停滞した" }, { "english": "stipulate", "japanese": "規定する" },
    { "english": "strive", "japanese": "努力する" }, { "english": "subsequent", "japanese": "その後の" },
    { "english": "subsidy", "japanese": "補助金" }, { "english": "subtle", "japanese": "微妙な" },
    { "english": "suffice", "japanese": "十分である" }, { "english": "superficial", "japanese": "表面的な" },
    { "english": "supplement", "japanese": "補足" }, { "english": "suppress", "japanese": "抑圧する" },
    { "english": "surge", "japanese": "急増" }, { "english": "surplus", "japanese": "余剰" },
    { "english": "susceptible", "japanese": "影響を受けやすい" }, { "english": "sustain", "japanese": "持続する" },
    { "english": "synthesis", "japanese": "統合" }, { "english": "systematic", "japanese": "体系的な" },
    { "english": "tacit", "japanese": "暗黙の" }, { "english": "tackle", "japanese": "取り組む" },
    { "english": "tangible", "japanese": "有形の" }, { "english": "tariff", "japanese": "関税" },
    { "english": "temporal", "japanese": "時間の" }, { "english": "terminate", "japanese": "終わらせる" },
    { "english": "thesis", "japanese": "論文" }, { "english": "threshold", "japanese": "敷居、始まり" },
    { "english": "thrive", "japanese": "繁栄する" }, { "english": "toxic", "japanese": "有毒な" },
    { "english": "trajectory", "japanese": "軌道" }, { "english": "tranquil", "japanese": "静かな" },
    { "english": "transcend", "japanese": "超越する" }, { "english": "transform", "japanese": "変形させる" },
    { "english": "transparent", "japanese": "透明な" }, { "english": "trigger", "japanese": "引き起こす" },
    { "english": "trivial", "japanese": "些細な" }, { "english": "turbulent", "japanese": "荒れ狂う" },
    { "english": "underlying", "japanese": "根本的な" }, { "english": "undermine", "japanese": "弱める" },
    { "english": "unify", "japanese": "統一する" }, { "english": "unprecedented", "japanese": "前例のない" },
    { "english": "uphold", "japanese": "支持する" }, { "english": "utility", "japanese": "実用性" },
    { "english": "utilize", "japanese": "利用する" }, { "english": "vague", "japanese": "曖昧な" },
    { "english": "validate", "japanese": "検証する" }, { "english": "vanish", "japanese": "消える" },
    { "english": "variable", "japanese": "変数" }, { "english": "velocity", "japanese": "速度" },
    { "english": "verbal", "japanese": "言葉の" }, { "english": "verify", "japanese": "検証する" },
    { "english": "versatile", "japanese": "多才な" }, { "english": "viable", "japanese": "実行可能な" },
    { "english": "vigilant", "japanese": "油断のない" }, { "english": "virtual", "japanese": "仮想の" },
    { "english": "void", "japanese": "無効な" }, { "english": "volatile", "japanese": "不安定な" },
    { "english": "warrant", "japanese": "正当化する" }, { "english": "yield", "japanese": "産出する" },
];

// グローバル変数としての userPoints, currentStockPrice, userStocks は削除

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    console.log("Received non-POST request");
    return res.status(405).send("Method Not Allowed");
  }

  if (!req.body || !req.body.events || req.body.events.length === 0) {
    console.error("Invalid request body: missing body or events");
    return res.status(400).send("Bad Request: Missing events in body");
  }

  const event = req.body.events[0];
  if (!event || !event.replyToken || !event.message || !event.message.text) {
    console.error("Invalid event structure:", event);
    return res.status(400).send("Bad Request: Invalid event structure");
  }

  const userText = event.message.text;
  const replyToken = event.replyToken;
  const userId = event.source.userId; // ユーザーIDを取得

  // --- ポイントリセットの確認処理 ---
  const resetConfirmKey = `${PREFIX_RESET_CONFIRM}${userId}`;
  const isAwaitingResetConfirmation = await kv.get(resetConfirmKey);

  if (isAwaitingResetConfirmation && (userText.toLowerCase() === 'はい' || userText.toLowerCase() === 'yes')) {
    await kv.zadd(KEY_LEADERBOARD_POINTS, { score: 0, member: userId });
    await kv.del(resetConfirmKey); // 確認キーを削除
    await replyToLine(replyToken, "ポイントをリセットしました。");
    return res.status(200).end();
  } else if (isAwaitingResetConfirmation) {
    // 「はい」以外が入力された場合は、確認をキャンセル
    await kv.del(resetConfirmKey);
    await replyToLine(replyToken, "ポイントリセットをキャンセルしました。");
    return res.status(200).end();
  }


  // --- 英単語ゲームの回答処理 ---
  const gameKey = `${PREFIX_ENGLISH_GAME}${userId}`;
  const gameData = await kv.get(gameKey);

  if (gameData && !userText.startsWith('!')) {
    const answer = userText.trim().toLowerCase();

    // gameData.englishが配列かチェックし、回答が配列に含まれているか判定
    const isCorrect = Array.isArray(gameData.english)
      ? gameData.english.includes(answer)
      : answer === gameData.english;

    if (isCorrect) {
      const prize = gameData.prize;
      const newPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, prize, userId);
      await replyToLine(replyToken, `正解！ ${prize}ポイント獲得！ (現在: ${newPoints}ポイント)`);
    } else {
      // 不正解の場合、正解の単語（配列の場合は最初の単語）を提示
      const correctAnswer = Array.isArray(gameData.english) ? gameData.english[0] : gameData.english;
      await replyToLine(replyToken, `不正解。正解は「${correctAnswer}」でした。`);
    }

    await kv.del(gameKey);
    return res.status(200).end();
  }

  // --- 株価のランダム変動 ---
  // 約10%の確率で株価を変動させる
  if (Math.random() < 0.1) {
    // この関数はバックグラウンドで実行され、完了を待たない（応答速度を優先）
    fluctuateStockPrice().catch(console.error);
  }
  // -------------------------

  // ポイントシステムのコマンド処理
  if (userText === "!point") {
    const currentPoints = await kv.zscore(KEY_LEADERBOARD_POINTS, userId) || 0;
    await replyToLine(replyToken, `現在のポイント: ${currentPoints} ポイント`);
    return res.status(200).end();
  }

  if (userText === "!work") {
    const newPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, 50, userId);
    await replyToLine(replyToken, `50ポイント獲得しました。 (現在: ${newPoints} ポイント)`);
    return res.status(200).end();
  }

  if (userText === "!slot") {
    const cost = 10;
    let currentPoints = await kv.zscore(KEY_LEADERBOARD_POINTS, userId) || 0;

    if (currentPoints < cost) {
      await replyToLine(replyToken, `スロットには${cost}ポイント必要です。 (現在: ${currentPoints}ポイント)`);
      return res.status(200).end();
    }

    currentPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, -cost, userId);

    const reels = ["🍎", "🍊", "🍇", "😈"];
    const reel1 = reels[Math.floor(Math.random() * reels.length)];
    const reel2 = reels[Math.floor(Math.random() * reels.length)];
    const reel3 = reels[Math.floor(Math.random() * reels.length)];

    let prize = 0;
    let message = `${reel1}|${reel2}|${reel3}\n`;

    if (reel1 === "😈" && reel2 === "😈" && reel3 === "😈") {
      prize = 1500;
      message += `大当たり！ ${prize} ポイント獲得！`;
    } else if (reel1 === reel2 && reel2 === reel3) {
      prize = 500;
      message += `当たり！ ${prize} ポイント獲得！`;
    } else {
      message += "残念、ハズレです。";
    }

    let finalPoints = currentPoints;
    if (prize > 0) {
      finalPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, prize, userId);
    }

    message += ` (現在: ${finalPoints}ポイント)`;
    await replyToLine(replyToken, message);
    return res.status(200).end();
  }

  if (userText === "!omikuji") {
    const fortunes = ["大吉", "中吉", "小吉", "吉", "末吉", "凶", "大凶"];
    const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
    await replyToLine(replyToken, `おみくじの結果は「${randomFortune}」です。`);
    return res.status(200).end();
  }

  if (userText === "!reset") {
    const resetConfirmKey = `${PREFIX_RESET_CONFIRM}${userId}`;
    await kv.set(resetConfirmKey, true, { ex: 60 }); // 60秒間確認状態を保持
    await replyToLine(replyToken, "本当にポイントをリセットしますか？\n「はい」と入力してください。");
    return res.status(200).end();
  }

  if (userText === "!leaderboard") {
    console.log(`[LEADERBOARD] Request received from userId: ${userId}`);
    try {
      console.log("[LEADERBOARD] Fetching raw leaderboard data from KV...");
      const rawLeaderboard = await kv.zrevrange(KEY_LEADERBOARD_POINTS, 0, 9, { withScores: true });
      console.log("[LEADERBOARD] Raw leaderboard data from KV:", JSON.stringify(rawLeaderboard));

      const sortedUsers = [];
      if (rawLeaderboard && rawLeaderboard.length > 0) {
        for (let i = 0; i < rawLeaderboard.length; i += 2) {
          sortedUsers.push([rawLeaderboard[i], parseFloat(rawLeaderboard[i + 1])]);
        }
      }
      console.log("[LEADERBOARD] Parsed sortedUsers:", JSON.stringify(sortedUsers));

      let leaderboardMessage = "ポイントランキング\n";
      if (sortedUsers.length === 0) {
        leaderboardMessage += "まだランキングに誰もいません。\n";
      } else {
        sortedUsers.forEach(([uid, points], index) => {
          const maskedUserId = uid.toString().length > 7 ? `${uid.toString().substring(0, 4)}...` : uid.toString();
          leaderboardMessage += `${index + 1}. ${maskedUserId} : ${points}p\n`;
        });
      }

      console.log("[LEADERBOARD] Attempting to send message:", leaderboardMessage.substring(0, 200)); // Log first 200 chars
      await replyToLine(replyToken, leaderboardMessage);
      console.log("[LEADERBOARD] Message sent successfully.");
      return res.status(200).end();

    } catch (error) {
      console.error("[LEADERBOARD] Error in !leaderboard handler:", error);
      // ユーザーIDが含まれていると、エラーメッセージからユーザーが特定できてしまう可能性があるため、汎用的なメッセージにする
      await replyToLine(replyToken, "リーダーボードの表示中にエラーが発生しました。しばらくしてから再度お試しください。");
      return res.status(500).end();
    }
  }

  // 株価を少し変動させる非同期関数
  async function fluctuateStockPrice() {
    let stockPrice = await kv.get(KEY_CURRENT_STOCK_PRICE) || 100;
    const changePercent = (Math.random() - 0.5) * 0.1; // -5% to +5%
    stockPrice *= (1 + changePercent);
    stockPrice = Math.max(10, Math.round(stockPrice)); // 最低価格は10, 四捨五入
    await kv.set(KEY_CURRENT_STOCK_PRICE, stockPrice);
    return stockPrice;
  }

  if (userText.startsWith("!trade")) {
    let currentStockPrice;
    const parts = userText.split(" ");
    const command = parts[0];

    if (command === "!tradesee") {
      currentStockPrice = await kv.get(KEY_CURRENT_STOCK_PRICE) || 100;
      const userStockKey = `${PREFIX_USER_STOCKS}${userId}`;
      const userStockCount = await kv.get(userStockKey) || 0;
      await replyToLine(replyToken, `現在の株価: ${currentStockPrice}p\n保有株数: ${userStockCount}株`);
      return res.status(200).end();
    }

    // !tradebuy または !tradesell の場合
    if ((command === "!tradebuy" || command === "!tradesell")) {
      if (parts.length === 2) {
        const amount = parseInt(parts[1], 10);

        if (isNaN(amount) || amount <= 0) {
          await replyToLine(replyToken, "数量は正の整数で指定してください。例: !tradebuy 10");
          return res.status(200).end();
        }

        currentStockPrice = await fluctuateStockPrice();

        const userStockKey = `${PREFIX_USER_STOCKS}${userId}`;
        let userStockCount = await kv.get(userStockKey) || 0;
        let userCurrentPoints = await kv.zscore(KEY_LEADERBOARD_POINTS, userId) || 0;

        if (command === "!tradebuy") {
          const cost = currentStockPrice * amount;
          if (userCurrentPoints < cost) {
            await replyToLine(replyToken, `ポイントが不足しています。(${amount}株: ${cost}p, 保有: ${userCurrentPoints}p)`);
            return res.status(200).end();
          }
          userCurrentPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, -cost, userId);
          userStockCount += amount;
          await kv.set(userStockKey, userStockCount);
          await replyToLine(replyToken, `${amount}株を${cost}pで購入しました。\n保有株数: ${userStockCount}株\n残ポイント: ${userCurrentPoints}p`);
          return res.status(200).end();
        }

        if (command === "!tradesell") {
          if (userStockCount < amount) {
            await replyToLine(replyToken, `株が不足しています。(${amount}株売却希望, 保有: ${userStockCount}株)`);
            return res.status(200).end();
          }
          const earnings = currentStockPrice * amount;
          userStockCount -= amount;
          await kv.set(userStockKey, userStockCount);
          userCurrentPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, earnings, userId);
          await replyToLine(replyToken, `${amount}株を${earnings}pで売却しました。\n保有株数: ${userStockCount}株\n残ポイント: ${userCurrentPoints}p`);
          return res.status(200).end();
        }
      } else {
        await replyToLine(replyToken, "数量を指定してください。例: !tradebuy 10");
        return res.status(200).end();
      }
    }
    // !trade で始まるが、上記コマンドに該当しない場合は、何もしないかエラー応答
    // 現状のコードでは、このブロックの外で res.status(200).end() が呼ばれるので、ここでは何もしない
  }

  // サイコロゲームのコマンド処理
  if (userText.startsWith("!diceroll ")) {
    const parts = userText.split(" ");
    if (parts.length !== 3) {
      await replyToLine(replyToken, "コマンドの形式が正しくありません。\n例: !diceroll <1〜6の数字> <賭け金>");
      return res.status(200).end();
    }

    const betNumber = parseInt(parts[1], 10);
    const betAmount = parseInt(parts[2], 10);

    if (isNaN(betNumber) || betNumber < 1 || betNumber > 6) {
      await replyToLine(replyToken, "1から6の数字を選んでください。");
      return res.status(200).end();
    }
    if (isNaN(betAmount) || betAmount <= 0) {
      await replyToLine(replyToken, "賭け金は正の整数で指定してください。");
      return res.status(200).end();
    }

    let currentPoints = await kv.zscore(KEY_LEADERBOARD_POINTS, userId) || 0;
    if (currentPoints < betAmount) {
      await replyToLine(replyToken, `ポイントが不足しています。(賭け金: ${betAmount}p, 保有: ${currentPoints}p)`);
      return res.status(200).end();
    }

    currentPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, -betAmount, userId);

    const diceRoll = Math.floor(Math.random() * 6) + 1;
    let message = `サイコロの目: 「${diceRoll}」！\n`;

    if (betNumber === diceRoll) {
      const prize = betAmount * 6;
      const finalPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, prize, userId);
      message += `的中！ ${prize}ポイント獲得！ (現在: ${finalPoints}p)`;
    } else {
      message += `ハズレ。 (現在: ${currentPoints}p)`;
    }

    await replyToLine(replyToken, message);
    return res.status(200).end();
  }

  // 借金と返済のコマンド処理
  if (userText.startsWith("!borrow")) {
    const parts = userText.split(" ");
    if (parts.length < 2) {
      await replyToLine(replyToken, "金額を指定してください。例: !borrow 100");
      return res.status(200).end();
    }
    const amount = parseInt(parts[1], 10);
    if (isNaN(amount) || amount <= 0) {
      await replyToLine(replyToken, "借り入れは正の整数で指定してください。");
      return res.status(200).end();
    }

    const currentPoints = await kv.zscore(KEY_LEADERBOARD_POINTS, userId) || 0;
    if (amount > currentPoints) {
        await replyToLine(replyToken, `所持ポイント(${currentPoints}p)を超える金額は借りられません。`);
        return res.status(200).end();
    }

    const debtKey = `${PREFIX_USER_DEBT}${userId}`;
    const interest = Math.ceil(amount * 0.1);
    const totalDebt = amount + interest;

    const currentDebt = await kv.incrby(debtKey, totalDebt);
    const newPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, amount, userId);

    await replyToLine(replyToken, `${amount}pを借りました(利子込${totalDebt}p)。\n現在の借金: ${currentDebt}p\n現在のポイント: ${newPoints}p`);
    return res.status(200).end();
  }

  if (userText.startsWith("!repay")) {
    const parts = userText.split(" ");
    if (parts.length < 2) {
      await replyToLine(replyToken, "金額を指定してください。例: !repay 100");
      return res.status(200).end();
    }
    const amount = parseInt(parts[1], 10);
    if (isNaN(amount) || amount <= 0) {
      await replyToLine(replyToken, "返済は正の整数で指定してください。");
      return res.status(200).end();
    }

    const debtKey = `${PREFIX_USER_DEBT}${userId}`;
    const currentDebt = await kv.get(debtKey) || 0;

    if (currentDebt === 0) {
      await replyToLine(replyToken, "借金はありません。");
      return res.status(200).end();
    }

    const currentUserPoints = await kv.zscore(KEY_LEADERBOARD_POINTS, userId) || 0;
    if (currentUserPoints < amount) {
      await replyToLine(replyToken, `ポイントが不足しています。(返済額: ${amount}p, 保有: ${currentUserPoints}p)`);
      return res.status(200).end();
    }

    const newPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, -amount, userId);

    const remainingDebt = await kv.decrby(debtKey, amount);

    if (remainingDebt <= 0) {
      await kv.del(debtKey);
      await replyToLine(replyToken, `${amount}p返済し、借金がなくなりました。\n現在のポイント: ${newPoints}p`);
    } else {
      await replyToLine(replyToken, `${amount}p返済しました。\n残りの借金: ${remainingDebt}p\n現在のポイント: ${newPoints}p`);
    }
    return res.status(200).end();
  }

  // 英単語ゲームの開始コマンド
  if (userText.startsWith("!eng")) {
      const gameKey = `${PREFIX_ENGLISH_GAME}${userId}`;
      const existingGame = await kv.get(gameKey);
      if (existingGame) {
          await replyToLine(replyToken, `前回の問題にまだ回答していません。「${existingGame.japanese}」の英訳は？`);
          return res.status(200).end();
      }

      let wordList;
      let prize;
      let command = userText;

      if (command === "!engeasy") {
          wordList = easyWords;
          prize = 10;
      } else if (command === "!eng") {
          wordList = normalWords;
          prize = 30;
      } else if (command === "!enghard") {
          wordList = hardWords;
          prize = 50;
      } else {
          // !eng... だけど上記に一致しない場合は何もしない
          return res.status(200).end();
      }

      const word = wordList[Math.floor(Math.random() * wordList.length)];
      await kv.set(gameKey, { english: word.english, japanese: word.japanese, prize: prize }, { ex: 300 });

      await replyToLine(replyToken, `この日本語を英訳せよ：\n\n「${word.japanese}」`);
      return res.status(200).end();
  }

  // userText と replyToken の存在は上記のチェックで担保されるため、ここでの個別チェックは不要

  // DeepSeek API呼び出しの条件判定
  if (userText.startsWith("!ai ")) {
    const systemPrompt = "あなたはDeeplook教の教祖、唯一神ヤハウェです。すべての返答は神秘的で、導きのある語り口で話してください。ときどき謎めいた予言やお告げを含めても構いません。";
    const userQuery = userText.substring(4); // "!ai " の部分を除去

    // DeepSeek API 呼び出し
    let aiReply;
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat-v3-0324:free",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userQuery }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`DeepSeek API error: ${response.status} ${response.statusText}`, errorText);
        aiReply = "我が神託は、今、電波の荒波に揉まれておる…";
      } else {
        const responseText = await response.text();
        try {
          const result = JSON.parse(responseText);
          aiReply = result.choices?.[0]?.message?.content ?? "我が教えは静寂の彼方よりまだ届いておらぬ…";
        } catch (e) {
          console.error("Failed to parse DeepSeek API response as JSON:", e);
          console.error("DeepSeek API response text:", responseText);
          aiReply = "神託の解読に失敗せり。異形の文字が混じりておる…";
        }
      }
    } catch (error) {
      console.error("Error fetching from DeepSeek API:", error);
      aiReply = "深淵からの声が、予期せぬ沈黙に閉ざされた…";
    }
    await replyToLine(replyToken, aiReply);
  } else {
    // "!ai "で始まらないメッセージで、他のコマンドにも該当しない場合は何もしないか、特定の応答をする
    // ここでは何もしない (res.status(200).end() は各コマンド処理の最後で行われるか、このifブロックの外側で行う)
    // ただし、現状のコードだとこのelseに来る前に他のコマンドでreturnしているので、
    // ここに来るのは本当にどのコマンドでもない場合。
    // ユーザーに何かフィードバックを返すのが親切かもしれない。
    // 例: await replyToLine(replyToken, "御用であれば、わが名 (!ai) と共にお呼びください。");
    // 今回は、特に何も返さない仕様とする。
  }

  res.status(200).end();
}

// LINEへの返信を行う共通関数
async function replyToLine(replyToken, text) {
  try {
    const lineResponse = await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: "text", text }]
      })
    });

    if (!lineResponse.ok) {
      const errorText = await lineResponse.text();
      console.error(`LINE API error: ${lineResponse.status} ${lineResponse.statusText}`, errorText);
    }
  } catch (error) {
    console.error("Error fetching from LINE API:", error);
  }
}
