import { kv } from '@vercel/kv';

// 定数としてキー名を定義
const KEY_LEADERBOARD_POINTS = 'leaderboard_points';
const KEY_CURRENT_STOCK_PRICE = 'current_stock_price';
const PREFIX_USER_STOCKS = 'stocks:';
const PREFIX_USER_DEBT = 'debt:'; // 借金情報を保存するキーのプレフィックス
const PREFIX_ENGLISH_GAME = 'english_game:'; // 英単語ゲームの状態を保存するキーのプレフィックス
const PREFIX_ENGLISH_DIFFICULTY = 'english_difficulty:'; // 英単語ゲームの難易度を保存するキーのプレフィックス

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
    { english: ["nuclear"], japanese: "核の" }, { english: ["flexible"], japanese: "柔軟な" },
    { english: ["domestic"], japanese: "国内の" }, { english: ["suspicious"], japanese: "不審な" },
    { english: ["depressed"], japanese: "意気消沈した" }, { english: ["obvious"], japanese: "明らかな" },
    { english: ["capable"], japanese: "能力がある" }, { english: ["efficient"], japanese: "有能な" },
    { english: ["application"], japanese: "応用" }, { english: ["intelligence"], japanese: "知能" },
    { english: ["welfare"], japanese: "福祉" }, { english: ["exhausted"], japanese: "疲れきった" },
    { english: ["responsible"], japanese: "責任がある" }, { english: ["artificial"], japanese: "人工の" },
    { english: ["mature"], japanese: "成熟した" }, { english: ["experiment"], japanese: "実験" },
    { english: ["conference"], japanese: "会議" }, { english: ["ruined"], japanese: "だめになった" },
    { english: ["isolated"], japanese: "孤立した" }, { english: ["specific"], japanese: "具体的な" },
    { english: ["curious"], japanese: "好奇心が強い" }, { english: ["criticize"], japanese: "批判する" },
    { english: ["inherit"], japanese: "相続する" }, { english: ["attract"], japanese: "魅了する" },
    { english: ["combine"], japanese: "結び付ける" }, { english: ["conclude"], japanese: "結論を下す" },
    { english: ["generate"], japanese: "発生させる" }, { english: ["interrupt"], japanese: "妨げる" },
    { english: ["regulation"], japanese: "規制" }, { english: ["emergency"], japanese: "緊急" },
    { english: ["practical"], japanese: "実用的な" }, { english: ["conservative"], japanese: "保守的な" },
    { english: ["complicated"], japanese: "複雑な" }, { english: ["potential"], japanese: "潜在的な" },
    { english: ["achieve"], japanese: "成し遂げる" }, { english: ["promote"], japanese: "促進する" },
    { english: ["overcome"], japanese: "克服する" }, { english: ["gradually"], japanese: "徐々に" },
    { english: ["facility"], japanese: "施設" }, { english: ["eventually"], japanese: "結局は" },
];

const expertWords = [
    { english: ["coincidence"], japanese: "偶然の一致" }, { english: ["adolescence"], japanese: "青年期" },
    { english: ["evasion"], japanese: "回避" }, { english: ["sincerity"], japanese: "誠実さ" },
    { english: ["ensure"], japanese: "確実にする" }, { english: ["resume"], japanese: "再開する" },
    { english: ["confine"], japanese: "閉じ込める" }, { english: ["insufficient"], japanese: "不十分な" },
    { english: ["irresistible"], japanese: "抵抗できない" }, { english: ["inappropriate"], japanese: "不適切な" },
    { english: ["triumph"], japanese: "勝利" }, { english: ["strategy"], japanese: "戦略" },
    { english: ["hazard"], japanese: "危険" }, { english: ["subsidize"], japanese: "助成金を払う" },
    { english: ["diagnose"], japanese: "診断する" }, { english: ["enhance"], japanese: "高める" },
    { english: ["revolt"], japanese: "反抗する" }, { english: ["meditate"], japanese: "瞑想する" },
    { english: ["filthy"], japanese: "汚れた" }, { english: ["voluntary"], japanese: "自発的な" },
    { english: ["miscellaneous"], japanese: "種々雑多な" }, { english: ["harsh"], japanese: "厳しい" },
    { english: ["amicable"], japanese: "友好的な" }, { english: ["fragile"], japanese: "こわれやすい" },
    { english: ["sober"], japanese: "しらふの" }, { english: ["rigid"], japanese: "厳しい" },
    { english: ["outrageous"], japanese: "とんでもない" }, { english: ["eloquent"], japanese: "雄弁な" },
    { english: ["infectious"], japanese: "伝染性の" }, { english: ["designation"], japanese: "指定" },
    { english: ["resolution"], japanese: "解明" }, { english: ["accusation"], japanese: "非難" },
    { english: ["coherence"], japanese: "一貫性" }, { english: ["testimony"], japanese: "証言" },
    { english: ["rebellion"], japanese: "反乱" }, { english: ["provoke"], japanese: "引き起こす" },
    { english: ["allocate"], japanese: "割り当てる" }, { english: ["exemption"], japanese: "免除" },
    { english: ["reputation"], japanese: "評判" }, { english: ["renovation"], japanese: "刷新" },
    { english: ["distinguished"], japanese: "優れた" }, { english: ["surrender"], japanese: "降伏する" },
    { english: ["fabricate"], japanese: "でっち上げる" }, { english: ["penetrate"], japanese: "貫通する" },
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

  // --- 英単語ゲームヘルパー関数 ---
  async function startEnglishGame(difficulty) {
    const gameKey = `${PREFIX_ENGLISH_GAME}${userId}`;
    const existingGame = await kv.get(gameKey);
    if (existingGame) {
        await replyToLine(replyToken, `前回の問題にまだ回答していません。「${existingGame.japanese}」の英訳は？`);
        return;
    }

    let wordList, prize;
    if (difficulty === 'easy') {
        wordList = easyWords; prize = 10;
    } else if (difficulty === 'normal') {
        wordList = normalWords; prize = 30;
    } else if (difficulty === 'hard') {
        wordList = hardWords; prize = 50;
    } else { // expert
        wordList = expertWords; prize = 80;
    }

    const word = wordList[Math.floor(Math.random() * wordList.length)];
    await kv.set(gameKey, { english: word.english, japanese: word.japanese, prize: prize, difficulty: difficulty }, { ex: 300 });

    await replyToLine(replyToken, `[${difficulty}] この日本語を英訳せよ：\n\n「${word.japanese}」`);
  }
  // --------------------------------

  // --- 英単語ゲームの回答処理 ---
  const gameKey = `${PREFIX_ENGLISH_GAME}${userId}`;
  const gameData = await kv.get(gameKey);

  if (gameData && !userText.startsWith('!')) {
    const answer = userText.trim().toLowerCase();

    // gameData.englishが配列かチェックし、回答が配列に含まれているか判定
    const isCorrect = Array.isArray(gameData.english)
      ? gameData.english.includes(answer)
      : answer === gameData.english;

    let replyMessage;
    if (isCorrect) {
      const prize = gameData.prize;
      const newPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, prize, userId);
      replyMessage = `正解！ ${prize}ポイント獲得！ (現在: ${newPoints}ポイント)`;
    } else {
      // 不正解の場合、正解の単語（配列の場合は最初の単語）を提示
      const correctAnswer = Array.isArray(gameData.english) ? gameData.english[0] : gameData.english;
      replyMessage = `不正解。正解は「${correctAnswer}」でした。`;
    }

    await kv.del(gameKey);

    // Quick Replyを定義
    const quickReply = {
      items: [
        {
          type: "action",
          action: {
            type: "message",
            label: "もう一度挑戦する",
            text: "!eng"
          }
        },
        {
          type: "action",
          action: {
            type: "message",
            label: "難易度を上げる",
            text: "!enghigh"
          }
        },
        {
          type: "action",
          action: {
            type: "message",
            label: "難易度を下げる",
            text: "!englow"
          }
        }
      ]
    };

    await replyToLine(replyToken, replyMessage, quickReply);
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

  if (userText === "!help") {
    const helpMessage = `【コマンド一覧】
!help: このメッセージを表示
!point: 現在のポイントを表示
!work: 50ポイント獲得
!slot: スロットを回す (10p)
!gacha <low/mid/high> [回数]: ガチャを引く
!items: アイテム一覧
!omikuji: おみくじを引く
!leaderboard: ランキング表示
!tradesee: 株価と保有株数を表示
!tradebuy <数量>: 株の購入
!tradesell <数量>: 株の売却
!diceroll <1-6> <賭け金>: サイコロゲーム
!borrow <金額>: 借金 (利子10%)
!repay <金額>: 返済
!eng: 現在の難易度で英単語クイズに挑戦
!englow: 難易度を下げて挑戦 (easy/normal/hard/expert)
!enghigh: 難易度を上げて挑戦 (easy/normal/hard/expert)
!ai <メッセージ>: AIと会話`;
    await replyToLine(replyToken, helpMessage);
    return res.status(200).end();
  }

  if (userText === "!work") {
    const newPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, 50, userId);
    await replyToLine(replyToken, `50ポイント獲得しました。 (現在: ${newPoints} ポイント)`, {
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

  if (userText === "!gacha") {
    const cost = 100;
    let currentPoints = await kv.zscore(KEY_LEADERBOARD_POINTS, userId) || 0;

    if (currentPoints < cost) {
      await replyToLine(replyToken, `ガチャには${cost}ポイント必要です。 (現在: ${currentPoints}ポイント)`);
      return res.status(200).end();
    }

    currentPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, -cost, userId);

    const gachaItems = [
        { name: "伝説の剣", rarity: "UR", weight: 1 },
        { name: "英雄の盾", rarity: "SSR", weight: 4 },
        { name: "賢者の石", rarity: "SSR", weight: 5 },
        { name: "ポーション", rarity: "R", weight: 30 },
        { name: "ただの石ころ", rarity: "N", weight: 60 }
    ];

    const totalWeight = gachaItems.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedItem;

    for (const item of gachaItems) {
        random -= item.weight;
        if (random < 0) {
            selectedItem = item;
            break;
        }
    }

    // ポイントバックの可能性
    let prize = 0;
    if (selectedItem.rarity === "UR") prize = 10000;
    if (selectedItem.rarity === "SSR") prize = 1000;
    if (selectedItem.rarity === "R") prize = 50;

    let message = `ガチャを引いた！\n\n【${selectedItem.rarity}】 ${selectedItem.name} を手に入れた！`;
    if (prize > 0) {
        currentPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, prize, userId);
        message += `\nさらに ${prize} ポイント獲得！`;
    }

    message += ` (現在: ${currentPoints}ポイント)`;

    await replyToLine(replyToken, message, {
        items: [{
            type: "action",
            action: { type: "message", label: "もう一回引く", text: "!gacha" }
        }]
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

  if (userText === "!leaderboard") {
    console.log(`[LEADERBOARD] Request received from userId: ${userId}`);
    try {
      console.log("[LEADERBOARD] Fetching raw leaderboard data from KV...");
      // @vercel/kv v3+ は { score: number, member: string } の配列を返す
      const leaderboardData = await kv.zrevrange(KEY_LEADERBOARD_POINTS, 0, 9, { withScores: true });
      console.log("[LEADERBOARD] Leaderboard data from KV:", JSON.stringify(leaderboardData));

      let leaderboardMessage = "ポイントランキング\n";
      if (!leaderboardData || leaderboardData.length === 0) {
        leaderboardMessage += "まだランキングに誰もいません。\n";
      } else {
        leaderboardData.forEach((entry, index) => {
          const uid = entry.member;
          const points = entry.score;
          // ユーザーIDをマスクする処理はそのまま
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

  // 英単語ゲームの難易度変更・開始コマンド
  if (userText === "!englow" || userText === "!enghigh") {
    const difficultyKey = `${PREFIX_ENGLISH_DIFFICULTY}${userId}`;
    const currentDifficulty = await kv.get(difficultyKey) || 'normal';
    let newDifficulty;

    if (userText === "!englow") {
      if (currentDifficulty === 'expert') newDifficulty = 'hard';
      else if (currentDifficulty === 'hard') newDifficulty = 'normal';
      else if (currentDifficulty === 'normal') newDifficulty = 'easy';
      else { // easy
        await replyToLine(replyToken, `現在の難易度は 'easy' で、すでに最低です。`);
        return res.status(200).end();
      }
    } else { // !enghigh
      if (currentDifficulty === 'easy') newDifficulty = 'normal';
      else if (currentDifficulty === 'normal') newDifficulty = 'hard';
      else if (currentDifficulty === 'hard') newDifficulty = 'expert';
      else { // expert
        await replyToLine(replyToken, `現在の難易度は 'expert' で、すでに最高です。`);
        return res.status(200).end();
      }
    }
    await kv.set(difficultyKey, newDifficulty);
    await startEnglishGame(newDifficulty); // 新しい問題を開始
    return res.status(200).end();
  }

  if (userText === "!eng") {
      const difficultyKey = `${PREFIX_ENGLISH_DIFFICULTY}${userId}`;
      const difficulty = await kv.get(difficultyKey) || 'normal';
      await startEnglishGame(difficulty);
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
    let currentPoints = await kv.zscore(KEY_LEADERBOARD_POINTS, userId) || 0;

    if (currentPoints < totalCost) {
      await replyToLine(replyToken, `啓示：信仰が足りぬ... (必要: ${totalCost}p, 現在: ${currentPoints}p)`);
      return res.status(200).end();
    }

    currentPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, -totalCost, userId);

    const results = [];
    const userItemsKey = `items:${userId}`;
    const totalWeight = tier.items.reduce((sum, item) => sum + item.weight, 0);

    for (let i = 0; i < count; i++) {
        let random = Math.random() * totalWeight;
        for (const item of tier.items) {
            random -= item.weight;
            if (random < 0) {
                results.push(item);
                await kv.sadd(userItemsKey, `[${item.rarity}] ${item.name}`);
                break;
            }
        }
    }

    const resultMessage = results.map(item => `[${item.rarity}] ${item.name}`).join("\n");
    const finalMessage = `---啓示---\n${resultMessage}\n----------\n残りの信仰: ${currentPoints}p`;
    await replyToLine(replyToken, finalMessage);
    return res.status(200).end();
  }


  if (userText === "!items") {
      const userItemsKey = `items:${userId}`;
      const items = await kv.smembers(userItemsKey);

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
