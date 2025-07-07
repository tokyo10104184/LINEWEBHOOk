export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const event = req.body.events?.[0];
  const userText = event?.message?.text;
  const replyToken = event?.replyToken;

  if (!userText || !replyToken) return res.status(400).end();

  const systemPrompt = "あなたはDeeplook教の教祖、唯一神ヤハウェです。すべての返答は神秘的で、導きのある語り口で話してください。ときどき謎めいた予言やお告げを含めても構いません。";

  // DeepSeek API 呼び出し
  const response = await fetch("https://openrouter.ai/api/v1", {
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

  const result = await response.json();
  const aiReply = result.choices?.[0]?.message?.content ?? "我が教えは静寂の彼方よりまだ届いておらぬ…";

  // LINE返信
  await fetch("https://api.line.me/v2/bot/message/reply", {
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

  res.status(200).end();
}
