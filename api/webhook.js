export default async function handler(req, res) {
  if (req.method === 'POST') {
    const userMessage = req.body.events?.[0]?.message?.text || '（メッセージなし）';
    console.log('ユーザーの言葉:', userMessage);

    // AI教祖に送る処理（ここにAPI呼び出しを書く）
    const aiReply = `我は見たり…「${userMessage}」なる言葉…`;

    res.status(200).json({
      replies: [{ type: 'text', text: aiReply }]
    });
  } else {
    res.status(405).end();
  }
}
