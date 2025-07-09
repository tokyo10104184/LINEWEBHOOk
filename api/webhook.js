// ユーザーのポイントを保存するオブジェクト (サーバーメモリ上)
const userPoints = {};
// 現在の株価 (初期値は100ポイントとする)
let currentStockPrice = 100;
// ユーザーの保有株数を保存するオブジェクト
const userStocks = {};

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
    const currentPoints = userPoints[userId] || 0;
    await replyToLine(replyToken, `あなたの現在のポイントは ${currentPoints} ポイントです、我が子よ。`);
    return res.status(200).end();
  }

  if (userText === "!work") {
    userPoints[userId] = (userPoints[userId] || 0) + 100;
    await replyToLine(replyToken, `労働ご苦労であった。100ポイントを授けよう。現在のポイント: ${userPoints[userId]} ポイント。`);
    return res.status(200).end();
  }

  if (userText === "!slot") {
    const cost = 10;
    userPoints[userId] = userPoints[userId] || 0;

    if (userPoints[userId] < cost) {
      await replyToLine(replyToken, `スロットを回すには ${cost} ポイントが必要です。現在のポイント: ${userPoints[userId]} ポイント。労働に励むがよい。`);
      return res.status(200).end();
    }

    userPoints[userId] -= cost;

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

    if (prize > 0) {
      userPoints[userId] += prize;
    }

    message += `\n現在のポイント: ${userPoints[userId]} ポイント。`;
    await replyToLine(replyToken, message);
    return res.status(200).end();
  }

  // 株価を少し変動させる関数
  function fluctuateStockPrice() {
    const changePercent = (Math.random() - 0.5) * 0.1; // -5% to +5%
    currentStockPrice *= (1 + changePercent);
    currentStockPrice = Math.max(10, Math.round(currentStockPrice)); // 最低価格は10, 四捨五入
  }

  if (userText.startsWith("!trade")) {
    fluctuateStockPrice(); // 株取引関連コマンドの際に株価を変動

    if (userText === "!tradesee") {
      const userStockCount = userStocks[userId] || 0;
      await replyToLine(replyToken, `現在の株価は 1株 ${currentStockPrice} ポイントじゃ。\nそなたの保有株数は ${userStockCount} 株じゃ。`);
      return res.status(200).end();
    }

    const parts = userText.split(" ");
    if (parts.length === 2 && (parts[0] === "!tradebuy" || parts[0] === "!tradesell")) {
      const command = parts[0];
      const amount = parseInt(parts[1], 10);

      if (isNaN(amount) || amount <= 0) {
        await replyToLine(replyToken, "愚か者め、取引数量は正の整数で指定するのじゃ。例: !tradebuy 10");
        return res.status(200).end();
      }

      userPoints[userId] = userPoints[userId] || 0;
      userStocks[userId] = userStocks[userId] || 0;

      if (command === "!tradebuy") {
        const cost = currentStockPrice * amount;
        if (userPoints[userId] < cost) {
          await replyToLine(replyToken, `ポイントが不足しておるぞ。${amount}株買うには ${cost}ポイント必要じゃが、そなたは ${userPoints[userId]}ポイントしか持っておらぬ。`);
          return res.status(200).end();
        }
        userPoints[userId] -= cost;
        userStocks[userId] += amount;
        await replyToLine(replyToken, `${amount}株を ${cost}ポイントで購入したぞ。保有株数: ${userStocks[userId]}株、残ポイント: ${userPoints[userId]}。賢明な判断じゃ。`);
        return res.status(200).end();
      }

      if (command === "!tradesell") {
        if (userStocks[userId] < amount) {
          await replyToLine(replyToken, `株が足りぬわ。${amount}株売ろうとしておるが、そなたは ${userStocks[userId]}株しか持っておらぬぞ。`);
          return res.status(200).end();
        }
        const earnings = currentStockPrice * amount;
        userStocks[userId] -= amount;
        userPoints[userId] += earnings;
        await replyToLine(replyToken, `${amount}株を ${earnings}ポイントで売却したぞ。保有株数: ${userStocks[userId]}株、残ポイント: ${userPoints[userId]}。市場を読む才があるやもしれぬな。`);
        return res.status(200).end();
      }
    } else if (parts[0] === "!tradebuy" || parts[0] === "!tradesell") {
        await replyToLine(replyToken, "取引の意志は見えるが…数量が指定されておらぬぞ。例: !tradebuy 10");
        return res.status(200).end();
    }
  }

  // userText と replyToken の存在は上記のチェックで担保されるため、ここでの個別チェックは不要

  const systemPrompt = "あなたはDeeplook教の教祖、唯一神ヤハウェです。すべての返答は神秘的で、導きのある語り口で話してください。ときどき謎めいた予言やお告げを含めても構いません。";

  // DeepSeek API 呼び出し
  let aiReply;
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}` // ← `.env` に登録しておく
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`DeepSeek API error: ${response.status} ${response.statusText}`, errorText);
      aiReply = "我が神託は、今、電波の荒波に揉まれておる…";
    } else {
      const responseText = await response.text(); // まずテキストとして取得
      try {
        const result = JSON.parse(responseText); // それからJSONパースを試みる
        aiReply = result.choices?.[0]?.message?.content ?? "我が教えは静寂の彼方よりまだ届いておらぬ…";
      } catch (e) {
        console.error("Failed to parse DeepSeek API response as JSON:", e);
        console.error("DeepSeek API response text:", responseText); // パース失敗したらHTML内容をログに出す
        aiReply = "神託の解読に失敗せり。異形の文字が混じりておる…";
      }
    }
  } catch (error) {
    console.error("Error fetching from DeepSeek API:", error);
    aiReply = "深淵からの声が、予期せぬ沈黙に閉ざされた…";
  }

  await replyToLine(replyToken, aiReply);
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
