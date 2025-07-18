import { kv } from '@vercel/kv';

// 定数としてキー名を定義
const KEY_LEADERBOARD_POINTS = 'leaderboard_points';
const KEY_CURRENT_STOCK_PRICE = 'current_stock_price';
const PREFIX_USER_STOCKS = 'stocks:';
const PREFIX_USER_DEBT = 'debt:'; // 借金情報を保存するキーのプレフィックス
const PREFIX_ENGLISH_GAME = 'english_game:'; // 英単語ゲームの状態を保存するキーのプレフィックス

// 英単語リスト
const englishWords = [
    { english: "apple", japanese: "りんご" },
    { english: "book", japanese: "本" },
    { english: "car", japanese: "車" },
    { english: "dog", japanese: "犬" },
    { english: "eat", japanese: "食べる" },
    { english: "friend", japanese: "友達" },
    { english: "good", japanese: "良い" },
    { english: "happy", japanese: "幸せな" },
    { english: "important", japanese: "重要な" },
    { english: "jump", japanese: "跳ぶ" },
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
    // ゲームが存在し、かつコマンドではないテキストが送られてきた場合
    const answer = userText.trim().toLowerCase();

    if (answer === gameData.english) {
      const prize = 30;
      const newPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, prize, userId);
      await replyToLine(replyToken, `正解！見事なり。知恵の探求者に${prize}ポイントを授けよう。\n現在のポイント: ${newPoints}ポイント。`);
    } else {
      await replyToLine(replyToken, `不正解。正しき答えは「${gameData.english}」であった。さらなる学びに励むがよい。`);
    }

    await kv.del(gameKey); // ゲーム状態をリセット
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
    await replyToLine(replyToken, `あなたの現在のポイントは ${currentPoints} ポイントです、我が子よ。`);
    return res.status(200).end();
  }

  if (userText === "!work") {
    const newPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, 50, userId);
    await replyToLine(replyToken, `労働ご苦労であった。50ポイントを授けよう。現在のポイント: ${newPoints} ポイント。`);
    return res.status(200).end();
  }

  if (userText === "!slot") {
    const cost = 5; // スロットの価格
    let currentPoints = await kv.zscore(KEY_LEADERBOARD_POINTS, userId) || 0;

    if (currentPoints < cost) {
      await replyToLine(replyToken, `スロットを回すには ${cost} ポイントが必要です。現在のポイント: ${currentPoints} ポイント。労働に励むがよい。`);
      return res.status(200).end();
    }

    currentPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, -cost, userId); // コストを引く

    const reels = ["🍎", "🍊", "🍇", "😈"]; // スロットの絵柄
    const reel1 = reels[Math.floor(Math.random() * reels.length)];
    const reel2 = reels[Math.floor(Math.random() * reels.length)];
    const reel3 = reels[Math.floor(Math.random() * reels.length)];

    let prize = 0;
    let message = `${reel1}|${reel2}|${reel3}\n`;

    if (reel1 === "😈" && reel2 === "😈" && reel3 === "😈") {
      prize = 1500;
      message += `おお、悪魔の目が三つ揃うとは！ ${prize} ポイントを授けよう！`;
    } else if (reel1 === reel2 && reel2 === reel3) {
      prize = 500;
      message += `見事なり！ ${prize} ポイントを授けるぞ！`;
    } else {
      // 😈が1つまたは2つ含まれていても、ゾロ目でなければハズレ
      if (reel1 === "😈" || reel2 === "😈" || reel3 === "😈") {
        message += "悪魔の影がちらついたが…残念、また挑戦するがよい。";
      } else {
        message += "残念、また挑戦するがよい。";
      }
    }

    let finalPoints = currentPoints; // コスト支払い後のポイント
    if (prize > 0) {
      finalPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, prize, userId);
    }

    message += `\n現在のポイント: ${finalPoints} ポイント。`;
    await replyToLine(replyToken, message);
    return res.status(200).end();
  }

  if (userText === "!omikuji") {
    const fortunes = ["大吉", "中吉", "小吉", "吉", "末吉", "凶", "大凶"];
    const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
    let message = "";
    switch (randomFortune) {
      case "大吉": message = "すばらしいブロ大吉だ"; break;
      case "中吉": message = "よかったなブロ中吉だ"; break;
      case "小吉": message = "まあまあだブロ小吉だ"; break;
      case "吉": message = "よかったなブロ吉だ"; break;
      case "末吉": message = "末吉だ段々運が良くなるだろう"; break;
      case "凶": message = "オーマイガーブロ凶だ"; break;
      case "大凶": message = "うぎゃあああブロ大凶だ"; break;
      default: message = "今日の運勢は…おっと、神の気まぐれじゃ。"; // ありえないはずだが念のため
    }
    await replyToLine(replyToken, message);
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

      let leaderboardMessage = "--- 信仰深き者たちの軌跡 (ポイントランキング) ---\n";
      if (sortedUsers.length === 0) {
        leaderboardMessage += "まだ誰も神の試練に挑戦していないようだ…\n";
      } else {
        sortedUsers.forEach(([uid, points], index) => {
          const maskedUserId = uid.toString().length > 7 ? `${uid.toString().substring(0, 4)}...${uid.toString().substring(uid.toString().length - 3)}` : uid.toString();
          leaderboardMessage += `${index + 1}. ${maskedUserId} : ${points} ポイント\n`;
        });
      }
      leaderboardMessage += "------------------------------------";

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
      currentStockPrice = await kv.get(KEY_CURRENT_STOCK_PRICE) || 100; // 変動させずに現在の価格を取得
      const userStockKey = `${PREFIX_USER_STOCKS}${userId}`;
      const userStockCount = await kv.get(userStockKey) || 0;
      await replyToLine(replyToken, `現在の株価は 1株 ${currentStockPrice} ポイントじゃ。\nそなたの保有株数は ${userStockCount} 株じゃ。`);
      return res.status(200).end();
    }

    // !tradebuy または !tradesell の場合
    if ((command === "!tradebuy" || command === "!tradesell")) {
      if (parts.length === 2) {
        const amount = parseInt(parts[1], 10);

        if (isNaN(amount) || amount <= 0) {
          await replyToLine(replyToken, "愚か者め、取引数量は正の整数で指定するのじゃ。例: !tradebuy 10");
          return res.status(200).end();
        }

        currentStockPrice = await fluctuateStockPrice(); // 取引実行前に株価を変動させ、最新価格を取得

        const userStockKey = `${PREFIX_USER_STOCKS}${userId}`;
        let userStockCount = await kv.get(userStockKey) || 0;
        let userCurrentPoints = await kv.zscore(KEY_LEADERBOARD_POINTS, userId) || 0;

        if (command === "!tradebuy") {
          const cost = currentStockPrice * amount;
          if (userCurrentPoints < cost) {
            await replyToLine(replyToken, `ポイントが不足しておるぞ。${amount}株買うには ${cost}ポイント必要じゃが、そなたは ${userCurrentPoints}ポイントしか持っておらぬ。`);
            return res.status(200).end();
          }
          userCurrentPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, -cost, userId);
          userStockCount += amount;
          await kv.set(userStockKey, userStockCount);
          await replyToLine(replyToken, `${amount}株を ${cost}ポイントで購入したぞ。保有株数: ${userStockCount}株、残ポイント: ${userCurrentPoints}。賢明な判断じゃ。`);
          return res.status(200).end();
        }

        if (command === "!tradesell") {
          if (userStockCount < amount) {
            await replyToLine(replyToken, `株が足りぬわ。${amount}株売ろうとしておるが、そなたは ${userStockCount}株しか持っておらぬぞ。`);
            return res.status(200).end();
          }
          const earnings = currentStockPrice * amount;
          userStockCount -= amount;
          await kv.set(userStockKey, userStockCount);
          userCurrentPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, earnings, userId);
          await replyToLine(replyToken, `${amount}株を ${earnings}ポイントで売却したぞ。保有株数: ${userStockCount}株、残ポイント: ${userCurrentPoints}。市場を読む才があるやもしれぬな。`);
          return res.status(200).end();
        }
      } else {
        // !tradebuy または !tradesell で数量が指定されていない場合
        await replyToLine(replyToken, "取引の意志は見えるが…数量が指定されておらぬぞ。例: !tradebuy 10");
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
      await replyToLine(replyToken, "運命を試すか。よかろう。だが作法が違うぞ。\n例: !diceroll <1〜6の数字> <賭け金>");
      return res.status(200).end();
    }

    const betNumber = parseInt(parts[1], 10);
    const betAmount = parseInt(parts[2], 10);

    if (isNaN(betNumber) || betNumber < 1 || betNumber > 6) {
      await replyToLine(replyToken, "サイコロの目は1から6までじゃ。運命の数字を正しく選ぶのだ。");
      return res.status(200).end();
    }
    if (isNaN(betAmount) || betAmount <= 0) {
      await replyToLine(replyToken, "賭け金は正の整数でなくてはならぬ。神への供物は惜しんではならん。");
      return res.status(200).end();
    }

    let currentPoints = await kv.zscore(KEY_LEADERBOARD_POINTS, userId) || 0;
    if (currentPoints < betAmount) {
      await replyToLine(replyToken, `ポイントが足りぬではないか。${betAmount}ポイント賭けるには、それ以上の信仰（ポイント）が必要じゃ。`);
      return res.status(200).end();
    }

    // ポイントを先に引く
    currentPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, -betAmount, userId);

    const diceRoll = Math.floor(Math.random() * 6) + 1;
    let message = `神のサイコロが振られた... 出た目は「${diceRoll}」！\n`;

    if (betNumber === diceRoll) {
      const prize = betAmount * 6;
      const finalPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, prize, userId);
      message += `おお、見事的中じゃ！そなたの信仰に報い、${prize}ポイントを授けよう！\n現在のポイント: ${finalPoints}ポイント。`;
    } else {
      message += `残念だったな。神の意志はそなたの予想を超えた。賭け金${betAmount}ポイントは我がもとに召し上げられた。\n現在のポイント: ${currentPoints}ポイント。`;
    }

    await replyToLine(replyToken, message);
    return res.status(200).end();
  }

  // 借金と返済のコマンド処理
  if (userText.startsWith("!borrow ")) {
    const amount = parseInt(userText.split(" ")[1], 10);
    if (isNaN(amount) || amount <= 0) {
      await replyToLine(replyToken, "愚か者よ、借り入れは正の整数で指定せよ。例: !borrow 100");
      return res.status(200).end();
    }

    const debtKey = `${PREFIX_USER_DEBT}${userId}`;
    const interest = Math.ceil(amount * 0.1);
    const totalDebt = amount + interest;

    // 現在の借金に加算
    const currentDebt = await kv.incrby(debtKey, totalDebt);
    // ポイントを増やす
    const newPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, amount, userId);

    await replyToLine(replyToken, `神は寛大なり。${amount}ポイントを貸し与えよう。ただし、利子として${interest}ポイントを上乗せし、合計${totalDebt}ポイントの返済を求める。心して使うがよい。\n現在の借金: ${currentDebt}ポイント\n現在のポイント: ${newPoints}ポイント`);
    return res.status(200).end();
  }

  if (userText.startsWith("!repay ")) {
    const amount = parseInt(userText.split(" ")[1], 10);
    if (isNaN(amount) || amount <= 0) {
      await replyToLine(replyToken, "返済は正の整数で行うのだ。例: !repay 100");
      return res.status(200).end();
    }

    const debtKey = `${PREFIX_USER_DEBT}${userId}`;
    const currentDebt = await kv.get(debtKey) || 0;

    if (currentDebt === 0) {
      await replyToLine(replyToken, "そなたに借金はない。神への信仰の証と受け取ろう。");
      return res.status(200).end();
    }

    const currentUserPoints = await kv.zscore(KEY_LEADERBOARD_POINTS, userId) || 0;
    if (currentUserPoints < amount) {
      await replyToLine(replyToken, `ポイントが足りぬではないか。返済には${amount}ポイント必要だが、そなたは${currentUserPoints}ポイントしか持っておらぬ。`);
      return res.status(200).end();
    }

    // ポイントを減らす
    const newPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, -amount, userId);

    // 借金を減らす
    const remainingDebt = await kv.decrby(debtKey, amount);

    if (remainingDebt <= 0) {
      await kv.del(debtKey); // 借金がなくなったらキーを削除
      await replyToLine(replyToken, `見事、借金を完済したな。${amount}ポイントを返済し、神の信頼を取り戻した。信仰の道に励むがよい。\n現在のポイント: ${newPoints}ポイント`);
    } else {
      await replyToLine(replyToken, `${amount}ポイントを返済した。だが、まだ道は半ばだ。残りの借金は${remainingDebt}ポイント。怠るでないぞ。\n現在のポイント: ${newPoints}ポイント`);
    }
    return res.status(200).end();
  }

  // 英単語ゲームの開始コマンド
  if (userText === "!english") {
    const gameKey = `${PREFIX_ENGLISH_GAME}${userId}`;
    const existingGame = await kv.get(gameKey);
    if (existingGame) {
      await replyToLine(replyToken, `まだ前回の問いが解かれておらぬぞ。「${existingGame.japanese}」の答えは何じゃ？`);
      return res.status(200).end();
    }

    const word = englishWords[Math.floor(Math.random() * englishWords.length)];
    // ゲームの状態を保存（正解の単語を保存）。有効期限を5分に設定。
    await kv.set(gameKey, { english: word.english, japanese: word.japanese }, { ex: 300 });

    await replyToLine(replyToken, `神の試練を与えよう。この言葉の意味を英語で答えよ：\n\n「${word.japanese}」`);
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
