import { kv } from '@vercel/kv';

const KEY_LEADERBOARD_POINTS = 'leaderboard_points';

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

  if (userText.startsWith("!addscore ")) {
    try {
      const parts = userText.split(" ");
      if (parts.length !== 3) {
        await replyToLine(replyToken, "Invalid format. Use: !addscore <score> <member>");
        return res.status(200).end();
      }
      const score = parseInt(parts[1], 10);
      const member = parts[2];

      if (isNaN(score) || !member) {
        await replyToLine(replyToken, "Invalid score or member. Use: !addscore <score> <member>");
        return res.status(200).end();
      }

      await kv.zadd(KEY_LEADERBOARD_POINTS, { score, member });
      await replyToLine(replyToken, `Added ${member} with score ${score}.`);

    } catch (error) {
      console.error("KV Error on !addscore:", error);
      await replyToLine(replyToken, `An error occurred with the KV store: ${error.message}`);
    }
    return res.status(200).end();
  }

  if (userText === "!leaderboard") {
    try {
      // Hypothesize that zrange supports rev and withScores options
      const leaderboardData = await kv.zrange(KEY_LEADERBOARD_POINTS, 0, 9, {
        rev: true,
        withScores: true
      });

      let leaderboardMessage = "ポイントランキング\n";
      if (!leaderboardData || leaderboardData.length === 0) {
        leaderboardMessage += "まだランキングに誰もいません。\n";
      } else {
        for (let i = 0; i < leaderboardData.length; i += 2) {
          const member = leaderboardData[i];
          const score = leaderboardData[i + 1];
          leaderboardMessage += `${(i / 2) + 1}. ${member} : ${score}p\n`;
        }
      }
      await replyToLine(replyToken, leaderboardMessage);
    } catch (error) {
      console.error("KV Error on !leaderboard:", error);
      await replyToLine(replyToken, `An error occurred with the KV store: ${error.message}`);
    }
    return res.status(200).end();
  }

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
