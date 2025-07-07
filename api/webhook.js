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
      const result = await response.json();
      aiReply = result.choices?.[0]?.message?.content ?? "我が教えは静寂の彼方よりまだ届いておらぬ…";
    }
  } catch (error) {
    console.error("Error fetching from DeepSeek API:", error);
    aiReply = "深淵からの声が、予期せぬ沈黙に閉ざされた…";
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
        messages: [{ type: "text", text: aiReply }]
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
