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

  let replyText;

  if (userText === "!omikuji") {
    const fortunes = ["大吉", "中吉", "小吉", "吉", "末吉", "凶", "大凶"];
    const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
    let message = "";
    switch (randomFortune) {
      case "大吉":
        message = "すばらしいブロ大吉だ";
        break;
      case "中吉":
        message = "よかったなブロ中吉だ";
        break;
      case "小吉":
        message = "まあまあだブロ小吉だ";
        break;
      case "吉":
        message = "よかったなブロ吉だ";
        break;
      case "末吉":
        message = "末吉だ段々運が良くなるだろう";
        break;
      case "凶":
        message = "オーマイガーブロ凶だ";
        break;
      case "大凶":
        message = "うぎゃあああブロ大凶だ";
        break;
    }
    replyText = `今日の運勢は【${randomFortune}】です！\n${message}`;
  } else {
    const systemPrompt = "あなたはDeeplook教の教祖、唯一神ヤハウェです。すべての返答は神秘的で、導きのある語り口で話してください。ときどき謎めいた予言やお告げを含めても構いません。";

    // DeepSeek API 呼び出し
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
        replyText = "我が神託は、今、電波の荒波に揉まれておる…";
      } else {
        const responseText = await response.text(); // まずテキストとして取得
        try {
          const result = JSON.parse(responseText); // それからJSONパースを試みる
          replyText = result.choices?.[0]?.message?.content ?? "我が教えは静寂の彼方よりまだ届いておらぬ…";
        } catch (e) {
          console.error("Failed to parse DeepSeek API response as JSON:", e);
          console.error("DeepSeek API response text:", responseText); // パース失敗したらHTML内容をログに出す
          replyText = "神託の解読に失敗せり。異形の文字が混じりておる…";
        }
      }
    } catch (error) {
      console.error("Error fetching from DeepSeek API:", error);
      replyText = "深淵からの声が、予期せぬ沈黙に閉ざされた…";
    }
  }

  // LINE返信
  try {
    const lineResponse = await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}` // ← ここも `.env` に登録
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: "text", text: replyText }]
      })
    });

    if (!lineResponse.ok) {
      const errorText = await lineResponse.text();
      console.error(`LINE API error: ${lineResponse.status} ${lineResponse.statusText}`, errorText);
      // LINE APIエラー時はクライアントにエラーを返さず、ログのみ記録する
    }
  } catch (error) {
    console.error("Error fetching from LINE API:", error);
  }

  res.status(200).end();
}
