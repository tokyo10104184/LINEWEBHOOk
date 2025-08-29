import { kv } from '@vercel/kv';

const KEY_LEADERBOARD_POINTS = 'leaderboard_points';
const PREFIX_USER_NAME = 'username:';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send("Method Not Allowed");
  }

  if (!req.body || !req.body.events || req.body.events.length === 0) {
    return res.status(400).send("Bad Request: Missing events in body");
  }

  const event = req.body.events[0];
  if (!event || !event.replyToken || !event.message || !event.message.text) {
    return res.status(400).send("Bad Request: Invalid event structure");
  }

  const userText = event.message.text;
  const replyToken = event.replyToken;
  const userId = event.source.userId;

  if (userText === "!ping") {
    try {
      await kv.set('ping', 'pong', { ex: 10 });
      const result = await kv.get('ping');
      if (result === 'pong') {
        await replyToLine(replyToken, "Pong! KV connection is successful.");
      } else {
        await replyToLine(replyToken, `KV connection test failed. Expected 'pong', got '${result}'.`);
      }
    } catch (error) {
      console.error("KV Error:", error);
      await replyToLine(replyToken, `An error occurred with the KV store: ${error.message}`);
    }
    return res.status(200).end();
  }

  if (userText === "!work") {
    try {
      const newPoints = await kv.zincrby(KEY_LEADERBOARD_POINTS, 50, userId);
      await replyToLine(replyToken, `50ポイント獲得しました。 (現在: ${newPoints} ポイント)`);
    } catch (error) {
      console.error("KV Error on !work:", error);
      await replyToLine(replyToken, `An error occurred with the KV store: ${error.message}`);
    }
    return res.status(200).end();
  }

  if (userText === "!point") {
    try {
      const currentPoints = await kv.zscore(KEY_LEADERBOARD_POINTS, userId) || 0;
      await replyToLine(replyToken, `現在のポイント: ${currentPoints} ポイント`);
    } catch (error) {
      console.error("KV Error on !point:", error);
      await replyToLine(replyToken, `An error occurred with the KV store: ${error.message}`);
    }
    return res.status(200).end();
  }

  if (userText.startsWith("!register ")) {
    const username = userText.substring(10).trim();
    const usernameKey = `${PREFIX_USER_NAME}${userId}`;

    if (username.length < 2 || username.length > 15) {
      await replyToLine(replyToken, "ユーザー名は2文字以上15文字以下で入力してください。");
      return res.status(200).end();
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      await replyToLine(replyToken, "ユーザー名には、英数字とアンダースコア(_)のみ使用できます。");
      return res.status(200).end();
    }

    try {
      await kv.set(usernameKey, username);
      await replyToLine(replyToken, `ユーザー名を「${username}」に設定しました。`);
    } catch (error) {
      console.error("KV Error on !register:", error);
      await replyToLine(replyToken, `An error occurred with the KV store: ${error.message}`);
    }
    return res.status(200).end();
  }

  if (userText === "!leaderboard") {
    try {
      const leaderboardData = await kv.zrevrange(KEY_LEADERBOARD_POINTS, 0, 9, { withScores: true });
      let leaderboardMessage = "ポイントランキング\n";

      if (!leaderboardData || leaderboardData.length === 0) {
        leaderboardMessage += "まだランキングに誰もいません。\n";
      } else {
        const userIds = [];
        for (let i = 0; i < leaderboardData.length; i += 2) {
          userIds.push(leaderboardData[i]);
        }

        const usernameKeys = userIds.map(uid => `${PREFIX_USER_NAME}${uid}`);
        const usernames = usernameKeys.length > 0 ? await kv.mget(...usernameKeys) : [];

        for (let i = 0; i < leaderboardData.length; i += 2) {
          const uid = leaderboardData[i];
          const points = leaderboardData[i + 1];
          const username = usernames[i / 2];
          const displayName = username || `...${uid.slice(-4)}`;
          leaderboardMessage += `${(i / 2) + 1}. ${displayName} : ${points}p\n`;
        }
      }
      await replyToLine(replyToken, leaderboardMessage);
    } catch (error) {
      console.error("KV Error on !leaderboard:", error);
      await replyToLine(replyToken, `An error occurred with the KV store: ${error.message}`);
    }
    return res.status(200).end();
  }

  // いずれのコマンドにも一致しない場合
  res.status(200).end();
}

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
        messages: [{ type: "text", text: text }]
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
