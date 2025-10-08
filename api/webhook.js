import Redis from 'ioredis';

const redis = new Redis(process.env.IOREDIS_URL);

// 定数としてキー名を定義
const KEY_LEADERBOARD_POINTS = 'leaderboard_points';
const KEY_CURRENT_STOCK_PRICE = 'current_stock_price';
const PREFIX_USER_STOCKS = 'stocks:';
const PREFIX_USER_ITEMS = 'items:'; // ユーザーの所持品を保存するキーのプレフィックス
const PREFIX_USER_NAME = 'username:'; // ユーザー名を保存するキーのプレフィックス
const PREFIX_USER_DEBT = 'debt:'; // 借金情報を保存するキーのプレフィックス
const PREFIX_ENGLISH_GAME = 'english_game:'; // 英単語ゲームの状態を保存するキーのプレフィックス
const PREFIX_USER_DIFFICULTY = 'eng_difficulty:'; // 英単語ゲームの難易度を保存するキーのプレフィックス

// --- 株価イベント関連の定数 ---
const KEY_STOCK_EVENT = 'stock_event'; // 株価イベントの詳細を保存するハッシュキー
const EVENT_CHANCE = 0.05; // 各リクエストでイベントが発生する確率 (5%)
const EVENT_DURATION_MINUTES = 5; // イベント期間（分）

const boomReasons = [
    "画期的な新技術が発見された！",
    "近隣諸国との間に友好条約が結ばれた！",
    "唯一神ヤハウェからの祝福があった！",
    "伝説の投資家が市場に参入した！",
    "豊穣の女神が微笑んでいる！"
];

const bustReasons = [
    "大規模なシステム障害が発生した…",
    "未知のウイルスが流行の兆しを見せている…",
    "唯一神ヤハウェの気まぐれが発動した…",
    "大口投資家が一斉に資金を引き揚げた…",
    "空から不吉な流れ星が観測された…"
];

const TITLES = {
    PREDATOR: "ヤハウェ・プレデター",
    MASTER: "ヤハウェ・マスター",
    DIAMOND: "ヤハウェ・ダイヤ",
    PLATINUM: "ヤハウェ・プラチナ",
    GOLD: "ヤハウェ・ゴールド",
    SILVER: "ヤハウェ・シルバー",
    BRONZE: "ヤハウェ・ブロンズ",
    NO_TITLE: "石ころ"
};

const TITLE_THRESHOLDS = {
    [TITLES.MASTER]: 100000,
    [TITLES.DIAMOND]: 50000,
    [TITLES.PLATINUM]: 25000,
    [TITLES.GOLD]: 10000,
    [TITLES.SILVER]: 5000,
    [TITLES.BRONZE]: 1000,
};

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
    { english: ["nuclear"], japanese: "核の、原子力の" },
    { english: ["flexible"], japanese: "柔軟な" },
    { english: ["domestic"], japanese: "国内の、家庭の" },
    { english: ["suspicious"], japanese: "不審な" },
    { english: ["depressed"], japanese: "意気消沈した" },
    { english: ["obvious"], japanese: "明らかな" },
    { english: ["capable"], japanese: "能力がある" },
    { english: ["efficient"], japanese: "有能な、効率のよい" },
    { english: ["application"], japanese: "応用、申し込み" },
    { english: ["intelligence"], japanese: "知能" },
    { english: ["impatience"], japanese: "いらだち、あせり" },
    { english: ["welfare"], japanese: "福祉" },
    { english: ["exhausted"], japanese: "疲れきった" },
    { english: ["responsible"], japanese: "責任がある" },
    { english: ["artificial"], japanese: "人工の" },
    { english: ["mature"], japanese: "成熟した" },
    { english: ["experiment"], japanese: "実験" },
    { english: ["conference"], japanese: "会議" },
    { english: ["reservation"], japanese: "予約" },
    { english: ["appointment"], japanese: "約束、予約" },
    { english: ["spill"], japanese: "こぼす" },
    { english: ["similar"], japanese: "類似した" },
    { english: ["opposed"], japanese: "反対した" },
    { english: ["superior"], japanese: "優れた" },
    { english: ["suitable"], japanese: "適した" },
    { english: ["exercise"], japanese: "運動" },
    { english: ["education"], japanese: "教育" },
    { english: ["business"], japanese: "商売" },
    { english: ["ruined"], japanese: "だめになった" },
    { english: ["isolated"], japanese: "孤立した" },
    { english: ["extended"], japanese: "延長された" },
    { english: ["starved"], japanese: "非常に空腹な" },
    { english: ["normal"], japanese: "普通の" },
    { english: ["specific"], japanese: "具体的な、特定の" },
    { english: ["curious"], japanese: "好奇心が強い" },
    { english: ["neat"], japanese: "きちんとした" },
    { english: ["deliver"], japanese: "配達する" },
    { english: ["identify"], japanese: "特定する" },
    { english: ["criticize"], japanese: "批判する" },
    { english: ["inform"], japanese: "知らせる" },
    { english: ["observe"], japanese: "観察する" },
    { english: ["defend"], japanese: "守る" },
    { english: ["blame"], japanese: "責める" },
    { english: ["experience"], japanese: "経験する" },
    { english: ["exact"], japanese: "正確な、まさにその" },
    { english: ["present"], japanese: "贈る、提出する" },
    { english: ["inherit"], japanese: "相続する" },
    { english: ["attract"], japanese: "魅惑する、引き寄せる" },
    { english: ["delicate"], japanese: "繊細な" },
    { english: ["combine"], japanese: "結び付ける" },
    { english: ["conclude"], japanese: "結論を下す" },
    { english: ["generate"], japanese: "発生させる" },
    { english: ["interrupt"], japanese: "妨げる" },
    { english: ["regulation"], japanese: "規制" },
    { english: ["emergency"], japanese: "緊急" },
    { english: ["farewell"], japanese: "別れ" },
    { english: ["mammal"], japanese: "ほ乳動物" },
    { english: ["public"], japanese: "公共の" },
    { english: ["private"], japanese: "私的な" },
    { english: ["site"], japanese: "現場、サイト" },
    { english: ["attempt"], japanese: "試み" },
    { english: ["practical"], japanese: "実際的な、現実的な" },
    { english: ["conservative"], japanese: "保守的な" },
    { english: ["stressful"], japanese: "ストレスのたまる" },
    { english: ["helpful"], japanese: "役に立つ" },
    { english: ["memory"], japanese: "記憶力" },
    { english: ["transplant"], japanese: "移植" },
    { english: ["politics"], japanese: "政治" },
    { english: ["economy"], japanese: "経済" },
    { english: ["employee"], japanese: "従業員" },
    { english: ["emotionally"], japanese: "感情的に" },
    { english: ["drastically"], japanese: "徹底的に" },
    { english: ["initially"], japanese: "最初に" },
    { english: ["fortunately"], japanese: "幸いにも" },
    { english: ["background"], japanese: "背景" },
    { english: ["content"], japanese: "内容" },
    { english: ["complicated"], japanese: "複雑な" },
    { english: ["potential"], japanese: "潜在的な" },
    { english: ["vague"], japanese: "あいまいな" },
    { english: ["achieve"], japanese: "成し遂げる" },
    { english: ["promote"], japanese: "促進する" },
    { english: ["overcome"], japanese: "克服する" },
    { english: ["involve"], japanese: "伴う、必要とする" },
    { english: ["indirectly"], japanese: "間接的に" },
    { english: ["currently"], japanese: "現在のところ" },
    { english: ["immediately"], japanese: "ただちに" },
    { english: ["completely"], japanese: "完全に" },
    { english: ["personal"], japanese: "個人的な" },
    { english: ["casual"], japanese: "ふだんの、カジュアルな" },
    { english: ["serious"], japanese: "重大な、まじめな" },
    { english: ["distinction"], japanese: "区別" },
    { english: ["applause"], japanese: "拍手" },
    { english: ["invention"], japanese: "発明" },
    { english: ["volume"], japanese: "巻、音量" },
    { english: ["gradually"], japanese: "徐々に" },
    { english: ["efficiently"], japanese: "能率的に" },
    { english: ["especially"], japanese: "特に" },
    { english: ["precisely"], japanese: "正確に" },
    { english: ["connect"], japanese: "つながる" }
];

const expertWords = [
    // 既存の単語
    { english: ["abundant"], japanese: "豊富な" }, { english: ["controversial"], japanese: "論争の的となる" },
    { english: ["demonstrate"], japanese: "実証する" }, { english: ["exaggerate"], japanese: "誇張する" },
    { english: ["fundamental"], japanese: "基本的な" }, { english: ["sophisticated"], japanese: "洗練された" },
    { english: ["simultaneously"], japanese: "同時に" }, { english: ["reluctant"], japanese: "気が進まない" },
    { english: ["profound"], japanese: "深遠な" }, { english: ["perspective"], japanese: "視点" },
    { english: ["inevitable"], japanese: "避けられない" }, { english: ["implement"], japanese: "実行する" },
    { english: ["hypothesis"], japanese: "仮説" }, { english: ["gregarious"], japanese: "社交的な" },
    { english: ["fluctuate"], japanese: "変動する" }, { english: ["eloquent"], japanese: "雄弁な" },
    { english: ["distinguish"], japanese: "見分ける" }, { english: ["conscientious"], japanese: "誠実な" },
    { english: ["benevolent"], japanese: "慈悲深い" }, { english: ["anticipate"], japanese: "予期する" },
    { english: ["vulnerable"], japanese: "脆弱な" }, { english: ["ubiquitous"], japanese: "どこにでもある" },
    { english: ["tentative"], japanese: "仮の" }, { english: ["substantial"], japanese: "かなりの" },
    { english: ["spontaneous"], japanese: "自発的な" }, { english: ["scrutinize"], japanese: "精査する" },
    // 追加の単語
    { english: ["accommodate"], japanese: "収容する、適応させる" }, { english: ["accumulate"], japanese: "蓄積する" },
    { english: ["accurate"], japanese: "正確な" }, { english: ["acquire"], japanese: "習得する" },
    { english: ["adequate"], japanese: "十分な、適切な" }, { english: ["adjacent"], japanese: "隣接した" },
    { english: ["advocate"], japanese: "主張する、支持者" }, { english: ["aesthetic"], japanese: "美的な" },
    { english: ["affluent"], japanese: "裕福な" }, { english: ["aggregate"], japanese: "総計、集合体" },
    { english: ["allocate"], japanese: "割り当てる" }, { english: ["ambiguous"], japanese: "曖昧な" },
    { english: ["amend"], japanese: "修正する" }, { english: ["analogy"], japanese: "類推" },
    { english: ["anonymous"], japanese: "匿名の" }, { english: ["apparatus"], japanese: "装置" },
    { english: ["arbitrary"], japanese: "任意の、独断的な" }, { english: ["articulate"], japanese: "明瞭に話す" },
    { english: ["assert"], japanese: "断言する" }, { english: ["attribute"], japanese: "属性、〜のせいにする" },
    { english: ["authentic"], japanese: "本物の" }, { english: ["bias"], japanese: "偏見" },
    { english: ["catastrophe"], japanese: "大災害" }, { english: ["coincide"], japanese: "同時に起こる" },
    { english: ["collaborate"], japanese: "協力する" }, { english: ["coherent"], japanese: "一貫した" },
    { english: ["compatible"], japanese: "互換性のある" }, { english: ["compel"], japanese: "強いる" },
    { english: ["compensate"], japanese: "補償する" }, { english: ["competent"], japanese: "有能な" },
    { english: ["complement"], japanese: "補完するもの" }, { english: ["comprehensive"], japanese: "包括的な" },
    { english: ["conceive"], japanese: "思いつく" }, { english: ["condemn"], japanese: "非難する" },
    { english: ["confront"], japanese: "直面する" }, { english: ["consensus"], japanese: "合意" },
    { english: ["consecutive"], japanese: "連続的な" }, { english: ["consolidate"], japanese: "統合する" },
    { english: ["constitute"], japanese: "構成する" }, { english: ["contemplate"], japanese: "熟考する" },
    { english: ["contradict"], japanese: "矛盾する" }, { english: ["convene"], japanese: "召集する" },
    { english: ["correlate"], japanese: "相関させる" }, { english: ["credibility"], japanese: "信頼性" },
    { english: ["criterion"], japanese: "基準" }, { english: ["cultivate"], japanese: "育成する" },
    { english: ["cumulative"], japanese: "累積的な" }, { english: ["cynical"], japanese: "皮肉な" },
    { english: ["debris"], japanese: "破片、がれき" }, { english: ["deceive"], japanese: "だます" },
    { english: ["deduce"], japanese: "推論する" }, { english: ["deficiency"], japanese: "欠乏" },
    { english: ["deliberate"], japanese: "意図的な、慎重な" }, { english: ["depict"], japanese: "描く" },
    { english: ["deprive"], japanese: "奪う" }, { english: ["derive"], japanese: "由来する" },
    { english: ["deteriorate"], japanese: "悪化する" }, { english: ["deviate"], japanese: "逸脱する" },
    { english: ["devise"], japanese: "考案する" }, { english: ["differentiate"], japanese: "区別する" },
    { english: ["dilemma"], japanese: "ジレンマ" }, { english: ["diligent"], japanese: "勤勉な" },
    { english: ["discourse"], japanese: "談話、講演" }, { english: ["discrepancy"], japanese: "不一致" },
    { english: ["disperse"], japanese: "分散させる" }, { english: ["disrupt"], japanese: "混乱させる" },
    { english: ["dissipate"], japanese: "消散させる" }, { english: ["divert"], japanese: "そらす" },
    { english: ["doctrine"], japanese: "教義" }, { english: ["domain"], japanese: "領域" },
    { english: ["dubious"], japanese: "疑わしい" }, { english: ["eccentric"], japanese: "風変わりな" },
    { english: ["elaborate"], japanese: "詳しく述べる、精巧な" }, { english: ["eligible"], japanese: "資格のある" },
    { english: ["embody"], japanese: "具体化する" }, { english: ["embrace"], japanese: "受け入れる" },
    { english: ["emerge"], japanese: "現れる" }, { english: ["empirical"], japanese: "経験的な" },
    { english: ["encompass"], japanese: "含む" }, { english: ["endorse"], japanese: "支持する" },
    { english: ["enhance"], japanese: "高める" }, { english: ["enormous"], japanese: "巨大な" },
    { english: ["entity"], japanese: "実体" }, { english: ["entrepreneur"], japanese: "起業家" },
    { english: ["equilibrium"], japanese: "均衡" }, { english: ["eradicate"], japanese: "根絶する" },
    { english: ["erroneous"], japanese: "誤った" }, { english: ["escalate"], japanese: "段階的に拡大する" },
    { english: ["evaluate"], japanese: "評価する" }, { english: ["evoke"], japanese: "呼び起こす" },
    { english: ["exploit"], japanese: "開発する、搾取する" }, { english: ["explicit"], japanese: "明確な" },
    { english: ["facilitate"], japanese: "促進する" }, { english: ["feasible"], japanese: "実行可能な" },
    { english: ["finite"], japanese: "有限の" }, { english: ["flaw"], japanese: "欠陥" },
    { english: ["foster"], japanese: "育成する" }, { english: ["franchise"], japanese: "フランチャイズ" },
    { english: ["fraud"], japanese: "詐欺" }, { english: ["futile"], japanese: "無駄な" },
    { english: ["generic"], japanese: "一般的な" }, { english: ["genuine"], japanese: "本物の" },
    { english: ["graphical"], japanese: "図式の" }, { english: ["gravity"], japanese: "重力、重大さ" },
    { english: ["heritage"], japanese: "遺産" }, { english: ["hierarchy"], japanese: "階層" },
    { english: ["homogeneous"], japanese: "均質の" }, { english: ["ideology"], japanese: "イデオロギー" },
    { english: ["immerse"], japanese: "浸す" }, { english: ["imminent"], japanese: "差し迫った" },
    { english: ["impair"], japanese: "損なう" }, { english: ["impartial"], japanese: "公平な" },
    { english: ["impede"], japanese: "妨げる" }, { english: ["imperative"], japanese: "必須の" },
    { english: ["implicit"], japanese: "暗黙の" }, { english: ["impose"], japanese: "課す" },
    { english: ["inadequate"], japanese: "不十分な" }, { english: ["incessant"], japanese: "絶え間ない" },
    { english: ["inclined"], japanese: "〜する傾向がある" }, { english: ["incompatible"], japanese: "互換性のない" },
    { english: ["incorporate"], japanese: "組み込む" }, { english: ["indigenous"], japanese: "固有の" },
    { english: ["induce"], japanese: "誘発する" }, { english: ["infer"], japanese: "推測する" },
    { english: ["inherent"], japanese: "固有の" }, { english: ["inhibit"], japanese: "抑制する" },
    { english: ["initiate"], japanese: "始める" }, { english: ["innovative"], japanese: "革新的な" },
    { english: ["insatiable"], japanese: "飽くことのない" }, { english: ["insight"], japanese: "洞察" },
    { english: ["integral"], japanese: "不可欠な" }, { english: ["integrate"], japanese: "統合する" },
    { english: ["integrity"], japanese: "誠実さ" }, { english: ["interim"], japanese: "中間の" },
    { english: ["intervene"], japanese: "介入する" }, { english: ["intricate"], japanese: "複雑な" },
    { english: ["intrinsic"], japanese: "本来備わっている" }, { english: ["invoke"], japanese: "呼び起こす、発動する" },
    { english: ["irrelevant"], japanese: "無関係な" }, { english: ["jeopardy"], japanese: "危険" },
    { english: ["judicial"], japanese: "司法の" }, { english: ["jurisdiction"], japanese: "司法権" },
    { english: ["justify"], japanese: "正当化する" }, { english: ["latent"], japanese: "潜在的な" },
    { english: ["lavish"], japanese: "気前の良い" }, { english: ["legacy"], japanese: "遺産" },
    { english: ["legitimate"], japanese: "正当な" }, { english: ["leverage"], japanese: "てこ、影響力" },
    { english: ["linguistic"], japanese: "言語の" }, { english: ["lucrative"], japanese: "儲かる" },
    { english: ["magnify"], japanese: "拡大する" }, { english: ["magnitude"], japanese: "大きさ、重要性" },
    { english: ["mainstream"], japanese: "主流" }, { english: ["malicious"], japanese: "悪意のある" },
    { english: ["manipulate"], japanese: "操作する" }, { english: ["marginal"], japanese: "わずかな" },
    { english: ["mediate"], japanese: "仲介する" }, { english: ["metaphor"], japanese: "比喩" },
    { english: ["meticulous"], japanese: "細心な" }, { english: ["migrate"], japanese: "移住する" },
    { english: ["milestone"], japanese: "画期的な出来事" }, { english: ["minute"], japanese: "微小な" },
    { english: ["miscellaneous"], japanese: "雑多な" }, { english: ["momentum"], japanese: "勢い" },
    { english: ["monotonous"], japanese: "単調な" }, { english: ["mutual"], japanese: "相互の" },
    { english: ["narrative"], japanese: "物語" }, { english: ["negligible"], japanese: "無視できるほどの" },
    { english: ["notion"], japanese: "概念" }, { english: ["notorious"], japanese: "悪名高い" },
    { english: ["novel"], japanese: "斬新な" }, { english: ["nurture"], japanese: "育む" },
    { english: ["obsolete"], japanese: "時代遅れの" }, { english: ["obstinate"], japanese: "頑固な" },
    { english: ["offset"], japanese: "相殺する" }, { english: ["omit"], japanese: "省略する" },
    { english: ["omnipotent"], japanese: "全能の" }, { english: ["onset"], japanese: "始まり" },
    { english: ["optimal"], japanese: "最適な" }, { english: ["orient"], japanese: "向ける" },
    { english: ["paradigm"], japanese: "パラダイム" }, { english: ["paradox"], japanese: "逆説" },
    { english: ["parameter"], japanese: "媒介変数" }, { english: ["paramount"], japanese: "最高の" },
    { english: ["partial"], japanese: "部分的な" }, { english: ["perceive"], japanese: "知覚する" },
    { english: ["perennial"], japanese: "長続きする" }, { english: ["peripheral"], japanese: "周辺の" },
    { english: ["perpetuate"], japanese: "永続させる" }, { english: ["plausible"], japanese: "もっともらしい" },
    { english: ["ponder"], japanese: "熟考する" }, { english: ["postulate"], japanese: "仮定する" },
    { english: ["pragmatic"], japanese: "実用的な" }, { english: ["precedent"], japanese: "前例" },
    { english: ["preclude"], japanese: "排除する" }, { english: ["predecessor"], japanese: "前任者" },
    { english: ["predominantly"], japanese: "主に" }, { english: ["preliminary"], japanese: "予備の" },
    { english: ["premise"], japanese: "前提" }, { english: ["prevail"], japanese: "普及している" },
    { english: ["pristine"], japanese: "新品同様の" }, { english: ["proficient"], japanese: "熟達した" },
    { english: ["prohibit"], japanese: "禁止する" }, { english: ["prolific"], japanese: "多作の" },
    { english: ["prolong"], japanese: "延長する" }, { english: ["prompt"], japanese: "促す" },
    { english: ["prone"], japanese: "傾向がある" }, { english: ["propagate"], japanese: "繁殖させる" },
    { english: ["protocol"], japanese: "議定書" }, { english: ["proxy"], japanese: "代理" },
    { english: ["qualitative"], japanese: "質的な" }, { english: ["quantitative"], japanese: "量的な" },
    { english: ["quota"], japanese: "割り当て" }, { english: ["radical"], japanese: "根本的な" },
    { english: ["rationale"], japanese: "理論的根拠" }, { english: ["reciprocal"], japanese: "相互の" },
    { english: ["reconcile"], japanese: "和解させる" }, { english: ["redundant"], japanese: "余分な" },
    { english: ["refute"], japanese: "反論する" }, { english: ["reimburse"], japanese: "払い戻す" },
    { english: ["reinforce"], japanese: "強化する" }, { english: ["relegate"], japanese: "格下げする" },
    { english: ["remedy"], japanese: "治療法" }, { english: ["render"], japanese: "〜にする" },
    { english: ["replicate"], japanese: "複製する" }, { english: ["repress"], japanese: "抑制する" },
    { english: ["reputable"], japanese: "評判の良い" }, { english: ["rescind"], japanese: "取り消す" },
    { english: ["residual"], japanese: "残りの" }, { english: ["resilient"], japanese: "回復力のある" },
    { english: ["respectively"], japanese: "それぞれ" }, { english: ["resurgence"], japanese: "復活" },
    { english: ["retain"], japanese: "保持する" }, { english: ["retaliate"], japanese: "報復する" },
    { english: ["retrieve"], japanese: "取り戻す" }, { english: ["retrospect"], japanese: "回顧" },
    { english: ["revenue"], japanese: "歳入" }, { english: ["revise"], japanese: "修正する" },
    { english: ["robust"], japanese: "頑健な" }, { english: ["rustic"], japanese: "素朴な" },
    { english: ["sanction"], japanese: "制裁" }, { english: ["saturate"], japanese: "飽和させる" },
    { english: ["savvy"], japanese: "精通している" }, { english: ["scenario"], japanese: "シナリオ" },
    { english: ["scope"], japanese: "範囲" }, { english: ["sector"], japanese: "部門" },
    { english: ["sedentary"], japanese: "座りがちの" }, { english: ["segment"], japanese: "部分" },
    { english: ["sequentially"], japanese: "連続的に" }, { english: ["sever"], japanese: "切断する" },
    { english: ["skeptical"], japanese: "懐疑的な" }, { english: ["soar"], japanese: "急上昇する" },
    { english: ["solely"], japanese: "単に" }, { english: ["solidarity"], japanese: "連帯" },
    { english: ["spawn"], japanese: "生み出す" }, { english: ["speculate"], japanese: "推測する" },
    { english: ["stagnant"], japanese: "停滞した" }, { english: ["stipulate"], japanese: "規定する" },
    { english: ["strive"], japanese: "努力する" }, { english: ["subsequent"], japanese: "その後の" },
    { english: ["subsidy"], japanese: "補助金" }, { english: ["subtle"], japanese: "微妙な" },
    { english: ["suffice"], japanese: "十分である" }, { english: ["superficial"], japanese: "表面的な" },
    { english: ["supplement"], japanese: "補足" }, { english: ["suppress"], japanese: "抑圧する" },
    { english: ["surge"], japanese: "急増" }, { english: ["surplus"], japanese: "余剰" },
    { english: ["susceptible"], japanese: "影響を受けやすい" }, { english: ["sustain"], japanese: "持続する" },
    { english: ["synthesis"], japanese: "統合" }, { english: ["systematic"], japanese: "体系的な" },
    { english: ["tacit"], japanese: "暗黙の" }, { english: ["tackle"], japanese: "取り組む" },
    { english: ["tangible"], japanese: "有形の" }, { english: ["tariff"], japanese: "関税" },
    { english: ["temporal"], japanese: "時間の" }, { english: ["terminate"], japanese: "終わらせる" },
    { english: ["thesis"], japanese: "論文" }, { english: ["threshold"], japanese: "敷居、始まり" },
    { english: ["thrive"], japanese: "繁栄する" }, { english: ["toxic"], japanese: "有毒な" },
    { english: ["trajectory"], japanese: "軌道" }, { english: ["tranquil"], japanese: "静かな" },
    { english: ["transcend"], japanese: "超越する" }, { english: ["transform"], japanese: "変形させる" },
    { english: ["transparent"], japanese: "透明な" }, { english: ["trigger"], japanese: "引き起こす" },
    { english: ["trivial"], japanese: "些細な" }, { english: ["turbulent"], japanese: "荒れ狂う" },
    { english: ["underlying"], japanese: "根本的な" }, { english: ["undermine"], japanese: "弱める" },
    { english: ["unify"], japanese: "統一する" }, { english: ["unprecedented"], japanese: "前例のない" },
    { english: ["uphold"], japanese: "支持する" }, { english: ["utility"], japanese: "実用性" },
    { english: ["utilize"], japanese: "利用する" }, { english: ["vague"], japanese: "曖昧な" },
    { english: ["validate"], japanese: "検証する" }, { english: ["vanish"], japanese: "消える" },
    { english: ["variable"], japanese: "変数" }, { english: ["velocity"], japanese: "速度" },
    { english: ["verbal"], japanese: "言葉の" }, { english: ["verify"], japanese: "検証する" },
    { english: ["versatile"], japanese: "多才な" }, { english: ["viable"], japanese: "実行可能な" },
    { english: ["vigilant"], japanese: "油断のない" }, { english: ["virtual"], japanese: "仮想の" },
    { english: ["void"], japanese: "無効な" }, { english: ["volatile"], japanese: "不安定な" },
    { english: ["warrant"], japanese: "正当化する" }, { english: ["yield"], japanese: "産出する" },
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

  // --- 英単語ゲームの回答処理 ---
  const gameKey = `${PREFIX_ENGLISH_GAME}${userId}`;
  const gameDataJSON = await redis.get(gameKey);

  if (gameDataJSON && !userText.startsWith('!')) {
    const gameData = JSON.parse(gameDataJSON);
    const answer = userText.trim().toLowerCase();

    // gameData.englishが配列かチェックし、回答が配列に含まれているか判定
    const isCorrect = Array.isArray(gameData.english)
      ? gameData.english.includes(answer)
      : answer === gameData.english;

    let replyMessage;
    if (isCorrect) {
      const prize = gameData.prize;
      const oldPoints = parseFloat(await redis.zscore(KEY_LEADERBOARD_POINTS, userId)) || 0;
      const newPoints = await redis.zincrby(KEY_LEADERBOARD_POINTS, prize, userId);
      replyMessage = `正解！ ${prize}YP獲得！ (現在: ${newPoints}YP)`;

      const promotionMessage = await checkPromotion(userId, oldPoints, newPoints);
      if (promotionMessage) {
          replyMessage += `\n\n${promotionMessage}`;
      }
    } else {
      // 不正解の場合、正解の単語（配列の場合は最初の単語）を提示
      const correctAnswer = Array.isArray(gameData.english) ? gameData.english[0] : gameData.english;
      replyMessage = `不正解。正解は「${correctAnswer}」でした。`;
    }

    await redis.del(gameKey);

    // Quick Replyを定義
    const quickReply = {
      items: [
        { type: "action", action: { type: "message", label: "もう一度挑戦する", text: "!eng" } },
        { type: "action", action: { type: "message", label: "難易度を上げる", text: "!enghigh" } },
        { type: "action", action: { type: "message", label: "難易度を下げる", text: "!englow" } },
        { type: "action", action: { type: "message", label: "メニューに戻る", text: "!others_quiz" } }
      ]
    };

    await replyToLine(replyToken, replyMessage, quickReply);
    return res.status(200).end();
  }

  // --- 株価イベント管理 ---
  // バックグラウンドでイベントの開始/終了/通常変動を管理
  manageStockMarket().catch(console.error);
  // -------------------------

  // ポイントシステムのコマンド処理
  if (userText === "!point") {
    const currentPoints = parseFloat(await redis.zscore(KEY_LEADERBOARD_POINTS, userId)) || 0;
    await replyToLine(replyToken, `現在のYP: ${currentPoints} YP`);
    return res.status(200).end();
  }

  if (userText === "!work") {
    const oldPoints = parseFloat(await redis.zscore(KEY_LEADERBOARD_POINTS, userId)) || 0;
    const newPoints = await redis.zincrby(KEY_LEADERBOARD_POINTS, 50, userId);
    let replyMessage = `50YP獲得しました。 (現在: ${newPoints} YP)`;

    const promotionMessage = await checkPromotion(userId, oldPoints, newPoints);
    if (promotionMessage) {
        replyMessage += `\n\n${promotionMessage}`;
    }

    await replyToLine(replyToken, replyMessage, {
      items: [
        {
          type: "action",
          action: {
            type: "message",
            label: "もう一回働く",
            text: "!work"
          }
        }
      ]
    });
    return res.status(200).end();
  }

  if (userText === "!janken") {
    await replyToLine(replyToken, "じゃんけん...", {
      items: [
        { type: "action", action: { type: "message", label: "グー✊", text: "!janken_play goo" } },
        { type: "action", action: { type: "message", label: "チョキ✌️", text: "!janken_play choki" } },
        { type: "action", action: { type: "message", label: "パー✋", text: "!janken_play paa" } },
      ]
    });
    return res.status(200).end();
  }

  if (userText.startsWith("!janken_play ")) {
    const userChoice = userText.split(" ")[1];
    const choices = ["goo", "choki", "paa"];
    const choiceMap = { goo: "グー✊", choki: "チョキ✌️", paa: "パー✋" };

    if (!choices.includes(userChoice)) {
      await replyToLine(replyToken, "それは神の定めた手にはない。");
      return res.status(200).end();
    }

    const botChoice = choices[Math.floor(Math.random() * choices.length)];
    let resultMessage;

    if (userChoice === botChoice) {
      resultMessage = "あいこだ。もう一度！";
    } else if (
      (userChoice === "goo" && botChoice === "choki") ||
      (userChoice === "choki" && botChoice === "paa") ||
      (userChoice === "paa" && botChoice === "goo")
    ) {
      // ユーザーの勝利、ポイント獲得
      const prize = 20;
      const oldPoints = parseFloat(await redis.zscore(KEY_LEADERBOARD_POINTS, userId)) || 0;
      const newPoints = await redis.zincrby(KEY_LEADERBOARD_POINTS, prize, userId);
      resultMessage = `汝の勝ちだ。${prize}YPくれてやろう。\n(現在: ${newPoints}YP)`;

      const promotionMessage = await checkPromotion(userId, oldPoints, newPoints);
      if (promotionMessage) {
          resultMessage += `\n\n${promotionMessage}`;
      }
    } else {
      resultMessage = "我が勝ちだ。";
    }

    const fullMessage = `我は「${choiceMap[botChoice]}」を出した。\n${resultMessage}`;

    await replyToLine(replyToken, fullMessage, {
      items: [
        { type: "action", action: { type: "message", label: "もう一回", text: "!janken" } },
        { type: "action", action: { type: "message", label: "戻る", text: "!others_game" } }
      ]
    });
    return res.status(200).end();
  }

  if (userText === "!slot") {
    const cost = 10;
    let currentPoints = parseFloat(await redis.zscore(KEY_LEADERBOARD_POINTS, userId)) || 0;

    if (currentPoints < cost) {
      await replyToLine(replyToken, `スロットには${cost}YP必要です。 (現在: ${currentPoints}YP)`);
      return res.status(200).end();
    }

    currentPoints = await redis.zincrby(KEY_LEADERBOARD_POINTS, -cost, userId);

    const reels = ["🍎", "🍊", "🍇", "😈"];
    const reel1 = reels[Math.floor(Math.random() * reels.length)];
    const reel2 = reels[Math.floor(Math.random() * reels.length)];
    const reel3 = reels[Math.floor(Math.random() * reels.length)];

    let prize = 0;
    let message = `${reel1}|${reel2}|${reel3}\n`;

    if (reel1 === "😈" && reel2 === "😈" && reel3 === "😈") {
      prize = 1500;
      message += `大当たり！ ${prize} YP獲得！`;
    } else if (reel1 === reel2 && reel2 === reel3) {
      prize = 500;
      message += `当たり！ ${prize} YP獲得！`;
    } else {
      message += "残念、ハズレです。";
    }

    let finalPoints = currentPoints;
    if (prize > 0) {
        const oldPoints = finalPoints; // This is the point count after deduction but before winning
        finalPoints = await redis.zincrby(KEY_LEADERBOARD_POINTS, prize, userId);
        const promotionMessage = await checkPromotion(userId, oldPoints, finalPoints);
        if (promotionMessage) {
            message += `\n\n${promotionMessage}`;
        }
    }

    message += ` (現在: ${finalPoints}YP)`;
    await replyToLine(replyToken, message, {
      items: [
        {
          type: "action",
          action: {
            type: "message",
            label: "もう一回引く",
            text: "!slot"
          }
        }
      ]
    });
    return res.status(200).end();
  }


  if (userText === "!omikuji") {
    const fortunes = {
        "大吉": "天の啓示が下った。汝の道は光に満ち溢れておる。進むがよい、我が子よ。",
        "中吉": "悪くない運命の流れだ。小さな喜びが、やがて大河となるであろう。",
        "小吉": "足元をよく見よ。ささやかな幸運が、汝のすぐそばに隠されておる。",
        "吉": "平穏な日々が続くだろう。神の恵みに感謝し、徳を積むのだ。",
        "末吉": "今は雌伏の時。だが、希望の種は汝の心に蒔かれた。いずれ芽吹くであろう。",
        "凶": "試練の時が来たようだ。だが、この苦難を乗り越えた時、汝はより強く、賢くなるであろう。",
        "大凶": "暗雲が立ち込めておる…。だが、夜が最も深い時こそ、夜明けは近い。祈りを捧げ、時を待つのだ。"
    };
    const fortuneKeys = Object.keys(fortunes);
    const randomFortuneKey = fortuneKeys[Math.floor(Math.random() * fortuneKeys.length)];
    const message = `神託を授けよう…\n\n【${randomFortuneKey}】\n${fortunes[randomFortuneKey]}`;

    await replyToLine(replyToken, message, {
      items: [
        {
          type: "action",
          action: {
            type: "message",
            label: "もう一度神託を",
            text: "!omikuji"
          }
        }
      ]
    });
    return res.status(200).end();
  }

  // --- Others Panel Commands ---
  if (userText === "!others") {
    await replyToLine(replyToken, "何か御用かな？", {
      items: [
        { type: "action", action: { type: "message", label: "クイズ", text: "!others_quiz" } },
        { type: "action", action: { type: "message", label: "ゲーム", text: "!others_game" } },
        { type: "action", action: { type: "message", label: "ヤハウェ (AI)", text: "!others_ai_info" } },
      ]
    });
    return res.status(200).end();
  }

  // Sub-menu: Quiz
  if (userText === "!others_quiz") {
    await replyToLine(replyToken, "知識を試すがよい。", {
      items: [
        { type: "action", action: { type: "message", label: "英単語", text: "!eng" } },
        { type: "action", action: { type: "message", label: "戻る", text: "!others" } },
      ]
    });
    return res.status(200).end();
  }

  // Sub-menu: Game
  if (userText === "!others_game") {
    await replyToLine(replyToken, "運命と戯れるがよい。", {
      items: [
        { type: "action", action: { type: "message", label: "じゃんけん", text: "!janken" } },
        { type: "action", action: { type: "message", label: "戻る", text: "!others" } },
      ]
    });
    return res.status(200).end();
  }

  // Info: AI
  if (userText === "!others_ai_info") {
    await replyToLine(replyToken, "我と話すには「!ai <メッセージ>」と入力するのだ。\n(神託には500YPが必要となる)", {
      items: [
        { type: "action", action: { type: "message", label: "戻る", text: "!others" } },
      ]
    });
    return res.status(200).end();
  }

  // --- 英単語ゲーム難易度変更コマンド ---
  const difficultyLevels = ['easy', 'normal', 'hard', 'expert'];

  if (userText === "!eng_status") {
    const difficultyKey = `${PREFIX_USER_DIFFICULTY}${userId}`;
    const currentDifficulty = await redis.get(difficultyKey) || 'normal';
    await replyToLine(replyToken, `現在の難易度は「${currentDifficulty}」です。`, {
        items: [{ type: "action", action: { type: "message", label: "戻る", text: "!others_quiz" } }]
    });
    return res.status(200).end();
  }

  if (userText === "!enghigh" || userText === "!englow") {
    const direction = userText === "!enghigh" ? 1 : -1;
    const difficultyKey = `${PREFIX_USER_DIFFICULTY}${userId}`;
    const currentDifficulty = await redis.get(difficultyKey) || 'normal';
    const currentIndex = difficultyLevels.indexOf(currentDifficulty);
    let newIndex = currentIndex + direction;

    if (newIndex < 0) newIndex = 0;
    if (newIndex >= difficultyLevels.length) newIndex = difficultyLevels.length - 1;

    const newDifficulty = difficultyLevels[newIndex];

    if (newDifficulty === currentDifficulty) {
        await replyToLine(replyToken, `難易度は既に上限または下限です。\n(現在: ${currentDifficulty})`, {
            items: [{ type: "action", action: { type: "message", label: "戻る", text: "!others_quiz" } }]
        });
    } else {
        await redis.set(difficultyKey, newDifficulty);
        const message = `難易度を「${newDifficulty}」に変更しました。`;
        await startEnglishGame(userId, replyToken, message);
    }
    return res.status(200).end();
  }


  if (userText === "!title") {
      const userPoints = parseFloat(await redis.zscore(KEY_LEADERBOARD_POINTS, userId)) || 0;
      const userTitle = await getCurrentTitle(userId, userPoints);
      await replyToLine(replyToken, `汝の現在の称号は [${userTitle}] じゃ。`);
      return res.status(200).end();
  }

  if (userText === "!leaderboard") {
    const leaderboardData = await redis.zrevrange(KEY_LEADERBOARD_POINTS, 0, 9, 'WITHSCORES');
    let leaderboardMessage = "YPランキング\n";

    if (leaderboardData.length === 0) {
      leaderboardMessage += "まだランキングに誰もいません。\n";
    } else {
      const userIds = [];
      for (let i = 0; i < leaderboardData.length; i += 2) {
        userIds.push(leaderboardData[i]);
      }

      const usernameKeys = userIds.map(uid => `${PREFIX_USER_NAME}${uid}`);
      const usernames = usernameKeys.length > 0 ? await redis.mget(usernameKeys) : [];
      const top3 = await redis.zrevrange(KEY_LEADERBOARD_POINTS, 0, 2);

      for (let i = 0; i < leaderboardData.length; i += 2) {
        const memberId = leaderboardData[i];
        const score = leaderboardData[i + 1];
        const username = usernames[i / 2];
        const displayName = username || `...${memberId.slice(-4)}`;

        let title = getTitleForPoints(score);
        if (title === TITLES.MASTER && top3.includes(memberId)) {
            title = `✨${TITLES.PREDATOR}✨`;
        }

        leaderboardMessage += `${(i / 2) + 1}. [${title}] ${displayName} : ${score}YP\n`;
      }
    }
    await replyToLine(replyToken, leaderboardMessage);
    return res.status(200).end();
  }

  if (userText === "!leaderboard_invest") {
    let cursor = '0';
    const userStocks = [];

    do {
      const [newCursor, keys] = await redis.scan(cursor, 'MATCH', `${PREFIX_USER_STOCKS}*`, 'COUNT', 100);
      cursor = newCursor;

      if (keys.length > 0) {
        const stockCounts = await redis.mget(keys);
        const userIds = keys.map(key => key.substring(PREFIX_USER_STOCKS.length));
        const usernameKeys = userIds.map(uid => `${PREFIX_USER_NAME}${uid}`);
        const usernames = usernameKeys.length > 0 ? await redis.mget(usernameKeys) : [];

        for (let i = 0; i < userIds.length; i++) {
          const stockCount = parseInt(stockCounts[i], 10);
          if (stockCount > 0) {
            userStocks.push({
              userId: userIds[i],
              username: usernames[i] || `...${userIds[i].slice(-4)}`,
              stocks: stockCount
            });
          }
        }
      }
    } while (cursor !== '0');

    userStocks.sort((a, b) => b.stocks - a.stocks);

    let leaderboardMessage = "保有株数ランキング\n";
    if (userStocks.length === 0) {
      leaderboardMessage += "まだ誰も株を保有していません。\n";
    } else {
      const top10 = userStocks.slice(0, 10);
      for (let i = 0; i < top10.length; i++) {
        const user = top10[i];
        leaderboardMessage += `${i + 1}. ${user.username} : ${user.stocks}株\n`;
      }
    }
    await replyToLine(replyToken, leaderboardMessage);
    return res.status(200).end();
  }

  if (userText === "!help") {
    const helpMessage = `
ヤハウェポイントを沢山ためて、億万長者になり、景品をゲットするのじゃ
--- コマンド一覧 ---
!point - YP確認
!work - 働く (50YP)
!janken - じゃんけん
!slot - スロット (10YP)
!gacha low/mid/high [回数] - ガチャ
!omikuji - おみくじ
!eng - 英単語ゲーム
!leaderboard - ランキング
!register [名前] - 名前登録
!reset - データリセット
!items - 所持品確認
!ai [文] - AIと話す (500YP)

--- 経済コマンド (!economy) ---
!tradesee - 株価確認
!tradebuy [数量] - 株購入
!tradesell [数量] - 株売却
!diceroll [1-6] [賭け金] - サイコロ
!borrow [金額] - 借金
!repay [金額] - 返済

!others - その他メニュー
    `;
    await replyToLine(replyToken, helpMessage.trim());
    return res.status(200).end();
  }

  if (userText === "!reset") {
    await replyToLine(replyToken, "本当にすべてのデータをリセットしますか？この操作は取り消せません。", {
      items: [
        {
          type: "action",
          action: {
            type: "message",
            label: "はい、リセットします",
            text: "!reset_confirm"
          }
        }
      ]
    });
    return res.status(200).end();
  }

  if (userText === "!reset_confirm") {
    const keysToDelete = [
      `${PREFIX_USER_STOCKS}${userId}`,
      `${PREFIX_USER_DEBT}${userId}`,
      `${PREFIX_USER_ITEMS}${userId}`,
      `${PREFIX_USER_DIFFICULTY}${userId}`,
      `${PREFIX_ENGLISH_GAME}${userId}`,
      `${PREFIX_USER_NAME}${userId}`
    ];

    // ZREMはソート済みセットからメンバーを削除
    await redis.zrem(KEY_LEADERBOARD_POINTS, userId);
    // DELは通常のキーを削除
    if (keysToDelete.length > 0) {
        await redis.del(keysToDelete);
    }

    await replyToLine(replyToken, "すべてのデータをリセットしました。");
    return res.status(200).end();
  }

  if (userText.startsWith("!register ")) {
    const username = userText.split(' ')[1];
    if (!username || username.length < 2 || username.length > 15) {
      await replyToLine(replyToken, "ユーザー名は2文字以上15文字以下で入力してください。");
      return res.status(200).end();
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      await replyToLine(replyToken, "ユーザー名には、英数字とアンダースコア(_)のみ使用できます。");
      return res.status(200).end();
    }
    await redis.set(`${PREFIX_USER_NAME}${userId}`, username);
    await replyToLine(replyToken, `ユーザー名を「${username}」に設定しました。`);
    return res.status(200).end();
  }

  // --- 経済パネルコマンド ---
  if (userText === "!economy") {
    await replyToLine(replyToken, "御用は何かな？", {
      items: [
        { type: "action", action: { type: "message", label: "稼ぐ", text: "!economy_earn" } },
        { type: "action", action: { type: "message", label: "遊ぶ", text: "!economy_play" } },
        { type: "action", action: { type: "message", label: "投資", text: "!economy_invest" } },
        { type: "action", action: { type: "message", label: "資産", text: "!economy_assets" } },
        { type: "action", action: { type: "message", label: "借金", text: "!economy_debt" } },
      ]
    });
    return res.status(200).end();
  }
  // 第2階層：稼ぐ
  if (userText === "!economy_earn") {
    await replyToLine(replyToken, "労働は尊いぞ。", {
      items: [
        { type: "action", action: { type: "message", label: "働く", text: "!work" } },
        { type: "action", action: { type: "message", label: "戻る", text: "!economy" } },
      ]
    });
    return res.status(200).end();
  }
  // 第2階層：遊ぶ
  if (userText === "!economy_play") {
    await replyToLine(replyToken, "運命を試すがよい。", {
      items: [
        { type: "action", action: { type: "message", label: "スロット", text: "!slot" } },
        { type: "action", action: { type: "message", label: "ガチャ", text: "!economy_gacha" } },
        { type: "action", action: { type: "message", label: "おみくじ", text: "!omikuji" } },
        { type: "action", action: { type: "message", label: "サイコロ", text: "!economy_dice_info" } },
        { type: "action", action: { type: "message", label: "戻る", text: "!economy" } },
      ]
    });
    return res.status(200).end();
  }
  // 第3階層：ガチャ
  if (userText === "!economy_gacha") {
    await replyToLine(replyToken, "どの祭壇に祈りを捧げる？", {
        items: [
            { type: "action", action: { type: "message", label: "低級ガチャ(100YP)", text: "!gacha low" } },
            { type: "action", action: { type: "message", label: "中級ガチャ(500YP)", text: "!gacha mid" } },
            { type: "action", action: { type: "message", label: "高級ガチャ(5000YP)", text: "!gacha high" } },
            { type: "action", action: { type: "message", label: "戻る", text: "!economy_play" } },
        ]
    });
    return res.status(200).end();
  }
  // ガイド：サイコロ
  if (userText === "!economy_dice_info") {
    await replyToLine(replyToken, "「!diceroll <1〜6の数字> <賭け金>」で勝負！", {
      items: [ { type: "action", action: { type: "message", label: "戻る", text: "!economy_play" } } ]
    });
    return res.status(200).end();
  }
  // 第2階層：投資
  if (userText === "!economy_invest") {
    await replyToLine(replyToken, "富は勇者のもとに集う。", {
      items: [
        { type: "action", action: { type: "message", label: "株価を見る", text: "!tradesee" } },
        { type: "action", action: { type: "message", label: "株を買う", text: "!economy_buy_info" } },
        { type: "action", action: { type: "message", label: "株を売る", text: "!economy_sell_info" } },
        { type: "action", action: { type: "message", label: "ランキング(保有株数)", text: "!leaderboard_invest" } },
        { type: "action", action: { type: "message", label: "戻る", text: "!economy" } },
      ]
    });
    return res.status(200).end();
  }
  // ガイド：株を買う
  if (userText === "!economy_buy_info") {
    await replyToLine(replyToken, "「!tradebuy <数量>」で購入できるぞ。", {
      items: [ { type: "action", action: { type: "message", label: "戻る", text: "!economy_invest" } } ]
    });
    return res.status(200).end();
  }
  // ガイド：株を売る
  if (userText === "!economy_sell_info") {
    await replyToLine(replyToken, "「!tradesell <数量>」で売却なされよ。", {
      items: [ { type: "action", action: { type: "message", label: "戻る", text: "!economy_invest" } } ]
    });
    return res.status(200).end();
  }
  // 第2階層：資産
  if (userText === "!economy_assets") {
    await replyToLine(replyToken, "汝の富を確認せよ。", {
      items: [
        { type: "action", action: { type: "message", label: "ポイント確認", text: "!point" } },
        { type: "action", action: { type: "message", label: "持ち物確認", text: "!items" } },
        { type: "action", action: { type: "message", label: "ランキング", text: "!leaderboard" } },
        { type: "action", action: { type: "message", label: "戻る", text: "!economy" } },
      ]
    });
    return res.status(200).end();
  }
  // 第2階層：借金
  if (userText === "!economy_debt") {
    await replyToLine(replyToken, "神は、時に試練を与える...", {
      items: [
        { type: "action", action: { type: "message", label: "借りる", text: "!economy_borrow_info" } },
        { type: "action", action: { type: "message", label: "返す", text: "!economy_repay_info" } },
        { type: "action", action: { type: "message", label: "戻る", text: "!economy" } },
      ]
    });
    return res.status(200).end();
  }
  // ガイド：借りる
  if (userText === "!economy_borrow_info") {
    await replyToLine(replyToken, "「!borrow <金額>」で借りるがよい。利子を忘れるな。", {
      items: [ { type: "action", action: { type: "message", label: "戻る", text: "!economy_debt" } } ]
    });
    return res.status(200).end();
  }
  // ガイド：返す
  if (userText === "!economy_repay_info") {
    await replyToLine(replyToken, "「!repay <金額>」で返済せよ。信義は大事だ。", {
      items: [ { type: "action", action: { type: "message", label: "戻る", text: "!economy_debt" } } ]
    });
    return res.status(200).end();
  }
  // -------------------------

  // 株価イベントと価格変動を管理する統合関数
  async function manageStockMarket() {
    const now = Date.now();
    let event = await redis.hgetall(KEY_STOCK_EVENT);

    // 1. イベントが終了しているか確認
    if (event && event.expiresAt && now >= parseInt(event.expiresAt, 10)) {
        const basePrice = parseInt(event.basePrice, 10);
        // 基準価格に少しのランダム性を加えて戻す
        const finalPrice = Math.max(10, Math.round(basePrice * (1 + (Math.random() - 0.5) * 0.1)));
        await redis.set(KEY_CURRENT_STOCK_PRICE, finalPrice);
        await redis.del(KEY_STOCK_EVENT);
        event = null; // イベント情報をクリア
    }

    // 2. イベント中でなければ、確率で新規イベントを開始
    if (!event || !event.type) {
        if (Math.random() < EVENT_CHANCE) {
            const currentPrice = parseInt(await redis.get(KEY_CURRENT_STOCK_PRICE)) || 100;
            const type = Math.random() < 0.5 ? 'boom' : 'bust';
            const reason = type === 'boom'
                ? boomReasons[Math.floor(Math.random() * boomReasons.length)]
                : bustReasons[Math.floor(Math.random() * bustReasons.length)];

            const newEvent = {
                type,
                reason,
                basePrice: currentPrice.toString(),
                startedAt: now.toString(),
                expiresAt: (now + EVENT_DURATION_MINUTES * 60 * 1000).toString(),
            };
            await redis.hmset(KEY_STOCK_EVENT, newEvent);
            event = newEvent; // このリクエストから新イベントを適用
        } else {
            // 3. イベントがない場合は、通常の微小な価格変動
            let stockPrice = parseInt(await redis.get(KEY_CURRENT_STOCK_PRICE)) || 100;
            const changePercent = (Math.random() - 0.5) * 0.02; // 通常変動は±1%に抑制
            stockPrice = Math.max(10, Math.round(stockPrice * (1 + changePercent)));
            await redis.set(KEY_CURRENT_STOCK_PRICE, stockPrice);
            return; // 通常変動後は処理終了
        }
    }

    // 4. イベントが有効な場合（既存または新規）、価格を大きく変動させる
    if (event && event.type) {
        let stockPrice = parseInt(await redis.get(KEY_CURRENT_STOCK_PRICE)) || 100;
        // 急騰時は+10%〜+30%、急落時は-10%〜-30%の範囲で変動
        const changePercent = event.type === 'boom' ? (0.1 + Math.random() * 0.2) : (-0.1 - Math.random() * 0.2);
        stockPrice = Math.max(10, Math.round(stockPrice * (1 + changePercent)));
        await redis.set(KEY_CURRENT_STOCK_PRICE, stockPrice);
    }
  }

  if (userText.startsWith("!trade")) {
    let currentStockPrice;
    const parts = userText.split(" ");
    const command = parts[0];

    if (command === "!tradesee") {
      const event = await redis.hgetall(KEY_STOCK_EVENT);
      let eventMessage = "";
      if (event && event.type) {
          const status = event.type === 'boom' ? '📈 急騰中！' : '📉 急落中！';
          eventMessage = `\n\n--- 緊急速報 ---\n${status}\n理由: ${event.reason}`;
      }

      currentStockPrice = parseInt(await redis.get(KEY_CURRENT_STOCK_PRICE)) || 100;
      const userStockKey = `${PREFIX_USER_STOCKS}${userId}`;
      const userStockCount = parseInt(await redis.get(userStockKey)) || 0;
      await replyToLine(replyToken, `現在の株価: ${currentStockPrice}YP\n保有株数: ${userStockCount}株${eventMessage}`, {
        items: [
          { type: "action", action: { type: "message", label: "戻る", text: "!economy_invest" } }
        ]
      });
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

        currentStockPrice = parseInt(await redis.get(KEY_CURRENT_STOCK_PRICE)) || 100;

        const userStockKey = `${PREFIX_USER_STOCKS}${userId}`;
        let userStockCount = parseInt(await redis.get(userStockKey)) || 0;
        let userCurrentPoints = parseFloat(await redis.zscore(KEY_LEADERBOARD_POINTS, userId)) || 0;

        if (command === "!tradebuy") {
          const cost = currentStockPrice * amount;
          if (userCurrentPoints < cost) {
            await replyToLine(replyToken, `YPが不足しています。(${amount}株: ${cost}YP, 保有: ${userCurrentPoints}YP)`);
            return res.status(200).end();
          }
          userCurrentPoints = await redis.zincrby(KEY_LEADERBOARD_POINTS, -cost, userId);
          userStockCount = await redis.incrby(userStockKey, amount);
          await replyToLine(replyToken, `${amount}株を${cost}YPで購入しました。\n保有株数: ${userStockCount}株\n残YP: ${userCurrentPoints}YP`);
          return res.status(200).end();
        }

        if (command === "!tradesell") {
          if (userStockCount < amount) {
            await replyToLine(replyToken, `株が不足しています。(${amount}株売却希望, 保有: ${userStockCount}株)`);
            return res.status(200).end();
          }
          const earnings = currentStockPrice * amount;
          userStockCount = await redis.decrby(userStockKey, amount);
          const oldPoints = userCurrentPoints;
          userCurrentPoints = await redis.zincrby(KEY_LEADERBOARD_POINTS, earnings, userId);

          let replyMessage = `${amount}株を${earnings}YPで売却しました。\n保有株数: ${userStockCount}株\n残YP: ${userCurrentPoints}YP`;
          const promotionMessage = await checkPromotion(userId, oldPoints, userCurrentPoints);
          if (promotionMessage) {
              replyMessage += `\n\n${promotionMessage}`;
          }
          await replyToLine(replyToken, replyMessage);
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

    let currentPoints = parseFloat(await redis.zscore(KEY_LEADERBOARD_POINTS, userId)) || 0;
    if (currentPoints < betAmount) {
      await replyToLine(replyToken, `YPが不足しています。(賭け金: ${betAmount}YP, 保有: ${currentPoints}YP)`);
      return res.status(200).end();
    }

    currentPoints = await redis.zincrby(KEY_LEADERBOARD_POINTS, -betAmount, userId);

    const diceRoll = Math.floor(Math.random() * 6) + 1;
    let message = `サイコロの目: 「${diceRoll}」！\n`;

    if (betNumber === diceRoll) {
      const prize = betAmount * 10;
      const oldPoints = currentPoints;
      const finalPoints = await redis.zincrby(KEY_LEADERBOARD_POINTS, prize, userId);
      message += `的中！ ${prize}YP獲得！ (現在: ${finalPoints}YP)`;

      const promotionMessage = await checkPromotion(userId, oldPoints, finalPoints);
      if (promotionMessage) {
          message += `\n\n${promotionMessage}`;
      }
    } else {
      message += `ハズレ。 (現在: ${currentPoints}YP)`;
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

    const debtKey = `${PREFIX_USER_DEBT}${userId}`;
    const interest = Math.ceil(amount * 0.1);
    const totalDebt = amount + interest;

    const currentDebt = await redis.incrby(debtKey, totalDebt);
    const oldPoints = parseFloat(await redis.zscore(KEY_LEADERBOARD_POINTS, userId)) || 0;
    const newPoints = await redis.zincrby(KEY_LEADERBOARD_POINTS, amount, userId);

    let replyMessage = `${amount}YPを借りました(利子込${totalDebt}YP)。\n現在の借金: ${currentDebt}YP\n現在のYP: ${newPoints}YP`;
    const promotionMessage = await checkPromotion(userId, oldPoints, newPoints);
    if (promotionMessage) {
        replyMessage += `\n\n${promotionMessage}`;
    }
    await replyToLine(replyToken, replyMessage);
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
    const currentDebt = parseInt(await redis.get(debtKey)) || 0;

    if (currentDebt === 0) {
      await replyToLine(replyToken, "借金はありません。");
      return res.status(200).end();
    }

    const currentUserPoints = parseFloat(await redis.zscore(KEY_LEADERBOARD_POINTS, userId)) || 0;
    if (currentUserPoints < amount) {
      await replyToLine(replyToken, `YPが不足しています。(返済額: ${amount}YP, 保有: ${currentUserPoints}YP)`);
      return res.status(200).end();
    }

    const repayAmount = Math.min(amount, currentDebt);
    const newPoints = await redis.zincrby(KEY_LEADERBOARD_POINTS, -repayAmount, userId);
    const remainingDebt = await redis.decrby(debtKey, repayAmount);

    if (remainingDebt <= 0) {
      await redis.del(debtKey);
      await replyToLine(replyToken, `${repayAmount}YP返済し、借金がなくなりました。\n現在のYP: ${newPoints}YP`);
    } else {
      await replyToLine(replyToken, `${repayAmount}YP返済しました。\n残りの借金: ${remainingDebt}YP\n現在のYP: ${newPoints}YP`);
    }
    return res.status(200).end();
  }

  // 英単語ゲームの開始コマンド
  if (userText === "!eng") {
    await startEnglishGame(userId, replyToken);
    return res.status(200).end();
  }
  // --- ガチャ機能 ---
  const gachaTiers = {
    low: {
      cost: 100,
      items: [
        { rarity: "N", name: "砂漠の石", weight: 70 },
        { rarity: "R", name: "オアシスの水", weight: 25 },
        { rarity: "SR", name: "マナの欠片", weight: 5 },
      ]
    },
    mid: {
      cost: 500,
      items: [
        { rarity: "R", name: "聖なるハーブ", weight: 60 },
        { rarity: "SR", name: "天使の羽根", weight: 35 },
        { rarity: "SSR", name: "聖杯", weight: 5 },
      ]
    },
    high: {
      cost: 5000,
      items: [
        { rarity: "SR", name: "賢者の石", weight: 70 },
        { rarity: "SSR", name: "契約の箱", weight: 25 },
        { rarity: "UR", name: "生命の樹の枝", weight: 5 },
      ]
    }
  };

  if (userText.startsWith("!gacha")) {
    const parts = userText.split(" ");
    const tierName = parts[1]; // low, mid, high
    const count = parts.length > 2 ? parseInt(parts[2], 10) : 1;

    if (!gachaTiers[tierName] || isNaN(count) || count <= 0 || count > 10) {
      await replyToLine(replyToken, "啓示：gacha (low/mid/high) (回数)");
      return res.status(200).end();
    }

    const tier = gachaTiers[tierName];
    const totalCost = tier.cost * count;
    let currentPoints = parseFloat(await redis.zscore(KEY_LEADERBOARD_POINTS, userId)) || 0;

    if (currentPoints < totalCost) {
      await replyToLine(replyToken, `啓示：信仰が足りぬ... (必要: ${totalCost}YP, 現在: ${currentPoints}YP)`);
      return res.status(200).end();
    }

    currentPoints = await redis.zincrby(KEY_LEADERBOARD_POINTS, -totalCost, userId);

    const results = [];
    const userItemsKey = `${PREFIX_USER_ITEMS}${userId}`;
    const totalWeight = tier.items.reduce((sum, item) => sum + item.weight, 0);

    for (let i = 0; i < count; i++) {
        let random = Math.random() * totalWeight;
        for (const item of tier.items) {
            random -= item.weight;
            if (random < 0) {
                results.push(item);
                await redis.sadd(userItemsKey, `[${item.rarity}] ${item.name}`);
                break;
            }
        }
    }

    const resultMessage = results.map(item => `[${item.rarity}] ${item.name}`).join("\n");
    const finalMessage = `---啓示---\n${resultMessage}\n----------\n残りの信仰: ${currentPoints}YP`;
    await replyToLine(replyToken, finalMessage);
    return res.status(200).end();
  }


  if (userText === "!items") {
      const userItemsKey = `${PREFIX_USER_ITEMS}${userId}`;
      const items = await redis.smembers(userItemsKey);

      if (!items || items.length === 0) {
          await replyToLine(replyToken, "汝、まだ何も持たざる者なり。");
          return res.status(200).end();
      }

      const message = "---啓示：汝の持ち物---\n- " + items.sort().join("\n- ");
      await replyToLine(replyToken, message);
      return res.status(200).end();
  }
  // -----------------

  // userText と replyToken の存在は上記のチェックで担保されるため、ここでの個別チェックは不要

  // DeepSeek API呼び出しの条件判定
  if (userText.startsWith("!ai ")) {
    const cost = 500;
    const currentPoints = parseFloat(await redis.zscore(KEY_LEADERBOARD_POINTS, userId)) || 0;

    if (currentPoints < cost) {
      await replyToLine(replyToken, `神託には${cost}YPの信仰が必要だ。\n(現在: ${currentPoints}YP)`);
      return res.status(200).end();
    }

    await redis.zincrby(KEY_LEADERBOARD_POINTS, -cost, userId);

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
    await replyToLine(replyToken, `(500YPを消費した)\n${aiReply}`, {
        items: [
            { type: "action", action: { type: "message", label: "戻る", text: "!others" } }
        ]
    });
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

// --- Title System Helper Functions ---

function getTitleForPoints(points) {
    if (points >= TITLE_THRESHOLDS[TITLES.MASTER]) return TITLES.MASTER;
    if (points >= TITLE_THRESHOLDS[TITLES.DIAMOND]) return TITLES.DIAMOND;
    if (points >= TITLE_THRESHOLDS[TITLES.PLATINUM]) return TITLES.PLATINUM;
    if (points >= TITLE_THRESHOLDS[TITLES.GOLD]) return TITLES.GOLD;
    if (points >= TITLE_THRESHOLDS[TITLES.SILVER]) return TITLES.SILVER;
    if (points >= TITLE_THRESHOLDS[TITLES.BRONZE]) return TITLES.BRONZE;
    return TITLES.NO_TITLE;
}

async function checkPromotion(userId, oldPoints, newPoints) {
    const oldTitle = getTitleForPoints(oldPoints);
    const newTitle = getTitleForPoints(newPoints);

    if (oldTitle !== newTitle) {
        if (newTitle === TITLES.MASTER) {
            const top3 = await redis.zrevrange(KEY_LEADERBOARD_POINTS, 0, 2);
            if (top3.includes(userId)) {
                return `🎉🎉🎉 TITLE UP! 🎉🎉🎉\nおめでとう！汝は神の領域、[${TITLES.PREDATOR}]に到達した！`;
            }
        }
        return `🎉 TITLE UP! 🎉\nおめでとう！称号が [${newTitle}] に上がったぞ！`;
    }
    return null;
}

async function getCurrentTitle(userId, points) {
    let title = getTitleForPoints(points);
    if (title === TITLES.MASTER) {
        const top3 = await redis.zrevrange(KEY_LEADERBOARD_POINTS, 0, 2);
        if (top3.includes(userId)) {
            title = TITLES.PREDATOR;
        }
    }
    return title;
}

// 英単語ゲームを開始する共通関数
async function startEnglishGame(userId, replyToken, precedingMessage = "") {
    const gameKey = `${PREFIX_ENGLISH_GAME}${userId}`;
    const existingGameJSON = await redis.get(gameKey);
    if (existingGameJSON) {
        const existingGame = JSON.parse(existingGameJSON);
        await replyToLine(replyToken, `前回の問題にまだ回答していません。「${existingGame.japanese}」の英訳は？`);
        return;
    }

    const difficultyKey = `${PREFIX_USER_DIFFICULTY}${userId}`;
    const difficulty = await redis.get(difficultyKey) || 'normal';

    const difficulties = {
        easy: { list: easyWords, prize: 10 },
        normal: { list: normalWords, prize: 30 },
        hard: { list: hardWords, prize: 50 },
        expert: { list: expertWords, prize: 100 }
    };

    const selectedDifficulty = difficulties[difficulty];
    const wordList = selectedDifficulty.list;
    const prize = selectedDifficulty.prize;

    const word = wordList[Math.floor(Math.random() * wordList.length)];
    const gameData = { english: word.english, japanese: word.japanese, prize: prize, difficulty: difficulty };
    await redis.set(gameKey, JSON.stringify(gameData), 'EX', 300);

    const question = `[${difficulty}] この日本語を英訳せよ：\n\n「${word.japanese}」`;
    const fullMessage = precedingMessage ? `${precedingMessage}\n\n${question}` : question;

    await replyToLine(replyToken, fullMessage);
}

// LINEへの返信を行う共通関数
async function replyToLine(replyToken, text, quickReply = null) {
  try {
    const messages = [{
      type: "text",
      text: text
    }];

    if (quickReply) {
      messages[0].quickReply = quickReply;
    }

    const lineResponse = await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        replyToken,
        messages: messages
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
