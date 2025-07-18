import { kv } from '@vercel/kv';

// 定数としてキー名を定義
const KEY_LEADERBOARD_POINTS = 'leaderboard_points';
const KEY_CURRENT_STOCK_PRICE = 'current_stock_price';
const PREFIX_USER_STOCKS = 'stocks:';
const PREFIX_USER_DEBT = 'debt:'; // 借金情報を保存するキーのプレフィックス
const PREFIX_ENGLISH_GAME = 'english_game:'; // 英単語ゲームの状態を保存するキーのプレフィックス

// 英単語リスト
const easyWords = [
    { english: "apple", japanese: "りんご" }, { english: "book", japanese: "本" },
    { english: "car", japanese: "車" }, { english: "dog", japanese: "犬" },
    { english: "eat", japanese: "食べる" }, { english: "friend", japanese: "友達" },
    { english: "good", japanese: "良い" }, { english: "happy", japanese: "幸せな" },
    { english: "jump", japanese: "跳ぶ" }, { english: "water", japanese: "水" },
    { english: "pen", japanese: "ペン" }, { english: "cat", japanese: "猫" },
    { english: "sun", japanese: "太陽" }, { english: "red", japanese: "赤い" },
    { english: "big", japanese: "大きい" }, { english: "small", japanese: "小さい" },
    { english: "run", japanese: "走る" }, { english: "see", japanese: "見る" },
    { english: "tree", japanese: "木" }, { english: "sky", japanese: "空" },
];

const normalWords = [
    { english: "achieve", japanese: "達成する" }, { english: "benefit", japanese: "利益" },
    { english: "celebrate", japanese: "祝う" }, { english: "decision", japanese: "決定" },
    { english: "effective", japanese: "効果的な" }, { english: "familiar", japanese: "よく知られた" },
    { english: "generate", japanese: "生み出す" }, { english: "however", japanese: "しかしながら" },
    { english: "improve", japanese: "改善する" }, { english: "journey", japanese: "旅" },
    { english: "knowledge", japanese: "知識" }, { english: "language", japanese: "言語" },
    { english: "measure", japanese: "測る" }, { english: "notice", japanese: "気づく" },
    { english: "operate", japanese: "操作する" }, { english: "protect", japanese: "保護する" },
    { english: "quality", japanese: "品質" }, { english: "receive", japanese: "受け取る" },
    { english: "suggest", japanese: "提案する" }, { english: "technology", japanese: "科学技術" },
    { english: "understand", japanese: "理解する" }, { english: "various", japanese: "様々な" },
    { english: "weather", japanese: "天気" }, { english: "yesterday", japanese: "昨日" },
    { english: "ability", japanese: "能力" }, { english: "believe", japanese: "信じる" },
    { english: "consider", japanese: "考慮する" }, { english: "develop", japanese: "開発する" },
    { english: "environment", japanese: "環境" }, { english: "foreign", japanese: "外国の" },
];

const hardWords = [
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
  const gameData = await kv.get(gameKey);

  if (gameData && !userText.startsWith('!')) {
    const answer = userText.trim().toLowerCase();

    if (answer === gameData.english) {
      const prize = gameData.prize;
      const newPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, prize, userId);
      await replyToLine(replyToken, `正解！ ${prize}ポイント獲得！ (現在: ${newPoints}ポイント)`);
    } else {
      await replyToLine(replyToken, `不正解。正解は「${gameData.english}」でした。`);
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
