import Redis from 'ioredis';

// Vercel環境で提供されるIOREDIS_URLを使用してRedisクライアントを初期化
const redis = new Redis(process.env.IOREDIS_URL);

// 定数を定義
const KEY_LEADERBOARD_POINTS = 'leaderboard_points';
const PREFIX_USER_NAME = 'username:';

// LINEへの返信を行う共通関数
async function replyToLine(replyToken, text) {
  try {
    const response = await fetch("https://api.line.me/v2/bot/message/reply", {
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
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`LINE API error: ${response.status} ${response.statusText}`, errorText);
    }
  } catch (error) {
    console.error("Error sending reply to LINE API:", error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send("Method Not Allowed");
  }

  if (!req.body || !req.body.events || !req.body.events.length === 0) {
    return res.status(400).send("Bad Request: Missing events in body");
  }

  const event = req.body.events[0];
  if (!event || !event.replyToken || !event.message || !event.message.text) {
    return res.status(400).send("Bad Request: Invalid event structure");
  }

  const userText = event.message.text;
  const replyToken = event.replyToken;
  const userId = event.source.userId;

  try {
    if (userText === "!ping") {
      const result = await redis.ping();
      await replyToLine(replyToken, `Pong! Redis connection is successful. (Response: ${result})`);

    } else if (userText === "!work") {
      const newPoints = await redis.zincrby(KEY_LEADERBOARD_POINTS, 50, userId);
      await replyToLine(replyToken, `50ポイント獲得しました。 (現在: ${newPoints} ポイント)`);

    } else if (userText === "!point") {
      const currentPoints = await redis.zscore(KEY_LEADERBOARD_POINTS, userId) || 0;
      await replyToLine(replyToken, `現在のポイント: ${currentPoints} ポイント`);

    } else if (userText.startsWith("!register ")) {
      const username = userText.substring(10).trim();
      if (username.length < 2 || username.length > 15) {
        return await replyToLine(replyToken, "ユーザー名は2文字以上15文字以下で入力してください。");
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return await replyToLine(replyToken, "ユーザー名には、英数字とアンダースコア(_)のみ使用できます。");
      }
      const usernameKey = `${PREFIX_USER_NAME}${userId}`;
      await redis.set(usernameKey, username);
      await replyToLine(replyToken, `ユーザー名を「${username}」に設定しました。`);

    } else if (userText === "!leaderboard") {
      const leaderboardData = await redis.zrevrange(KEY_LEADERBOARD_POINTS, 0, 9, 'WITHSCORES');
      let leaderboardMessage = "ポイントランキング\n";

      if (leaderboardData.length === 0) {
        leaderboardMessage += "まだランキングに誰もいません。\n";
      } else {
        const userIds = [];
        for (let i = 0; i < leaderboardData.length; i += 2) {
          userIds.push(leaderboardData[i]);
        }

        const usernameKeys = userIds.map(uid => `${PREFIX_USER_NAME}${uid}`);
        const usernames = usernameKeys.length > 0 ? await redis.mget(usernameKeys) : [];

        for (let i = 0; i < leaderboardData.length; i += 2) {
          const memberId = leaderboardData[i];
          const score = leaderboardData[i + 1];
          const username = usernames[i / 2];
          const displayName = username || `...${memberId.slice(-4)}`;
          leaderboardMessage += `${(i / 2) + 1}. ${displayName} : ${score}p\n`;
        }
      }
      await replyToLine(replyToken, leaderboardMessage);
    }
  } catch (error) {
    console.error("Redis Error:", error);
    await replyToLine(replyToken, `An error occurred: ${error.message}`);
  }

  res.status(200).end();
}
