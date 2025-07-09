import { kv } from '@vercel/kv';

// 定数としてキー名を定義
const KEY_LEADERBOARD_POINTS = 'leaderboard_points';
const KEY_CURRENT_STOCK_PRICE = 'current_stock_price';
const PREFIX_USER_STOCKS = 'stocks:';

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

  // ポイントシステムのコマンド処理
  if (userText === "!point") {
    const currentPoints = await kv.zscore(KEY_LEADERBOARD_POINTS, userId) || 0;
    await replyToLine(replyToken, `あなたの現在のポイントは ${currentPoints} ポイントです、我が子よ。`);
    return res.status(200).end();
  }

  if (userText === "!work") {
    const newPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, 100, userId);
    await replyToLine(replyToken, `労働ご苦労であった。100ポイントを授けよう。現在のポイント: ${newPoints} ポイント。`);
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

    const reels = ["🍎", "🍊", "🍇", "🍓", "🍒", "🔔", "😈"]; // スロットの絵柄
    const reel1 = reels[Math.floor(Math.random() * reels.length)];
    const reel2 = reels[Math.floor(Math.random() * reels.length)];
    const reel3 = reels[Math.floor(Math.random() * reels.length)];

    let prize = 0;
    let message = `${reel1}|${reel2}|${reel3}\n`;

    if (reel1 === "😈" && reel2 === "😈" && reel3 === "😈") {
      prize = 300;
      message += `おお、悪魔の目が三つ揃うとは！ ${prize} ポイントを授けよう！`;
    } else if (reel1 === reel2 && reel2 === reel3) {
      prize = 100;
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

  if (userText === "!leaderboard") {
    // zrevrange returns [member1, score1, member2, score2, ...]
    const rawLeaderboard = await kv.zrevrange(KEY_LEADERBOARD_POINTS, 0, 9, { withScores: true });
    const sortedUsers = [];
    for (let i = 0; i < rawLeaderboard.length; i += 2) {
      sortedUsers.push([rawLeaderboard[i], parseFloat(rawLeaderboard[i + 1])]);
    }

    let leaderboardMessage = "--- 信仰深き者たちの軌跡 (ポイントランキング) ---\n";
    if (sortedUsers.length === 0) {
      leaderboardMessage += "まだ誰も神の試練に挑戦していないようだ…\n";
    } else {
      sortedUsers.forEach(([uid, points], index) => {
        // ユーザーIDの一部を隠す (例: U123...def)
        const maskedUserId = uid.length > 7 ? `${uid.substring(0, 4)}...${uid.substring(uid.length - 3)}` : uid;
        leaderboardMessage += `${index + 1}. ${maskedUserId} : ${points} ポイント\n`;
      });
    }
    leaderboardMessage += "------------------------------------";
    await replyToLine(replyToken, leaderboardMessage);
    return res.status(200).end();
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

  // userText と replyToken の存在は上記のチェックで担保されるため、ここでの個別チェックは不要
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
    } else if (parts[0] === "!tradebuy" || parts[0] === "!tradesell") {
        await replyToLine(replyToken, "取引の意志は見えるが…数量が指定されておらぬぞ。例: !tradebuy 10");
        return res.status(200).end();
    }
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
