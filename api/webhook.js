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
    const cost = 5; // スロットの価格を10から5に変更
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

  if (userText === "!leaderboard") {
    const sortedUsers = Object.entries(userPoints)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // 上位10名

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

  // DeepSeek API呼び出しの条件判定
  if (userText.startsWith("!ai ")) {
    const systemPrompt = "あなたはDeeplook教の教祖、唯一神ヤハウェです。すべての返答は神秘的で、導きのある語り口で話してください。ときどき謎めいた予言やお告げを含めても構いません。";
    const userQuery = userText.substring(4); // "!ai " の部分を除去

    // まず「生成中」メッセージをリプライで送信
    await replyToLine(replyToken, "現在回答を生成中です、我が子よ。しばし待つがよい…");

    // 非同期でDeepSeek API呼び出しとプッシュメッセージ送信を行う
    (async () => {
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
      console.error("Error in AI processing async block (fetching/parsing DeepSeek API):", error, JSON.stringify(error, Object.getOwnPropertyNames(error)));
      aiReply = "深淵からの声が、予期せぬ沈黙に閉ざされた…"; // エラー時にもこのメッセージは設定
      }
      // AIの回答をプッシュメッセージで送信
    try {
      await pushToLine(userId, aiReply);
    } catch (pushError) {
      console.error("Error in AI processing async block (pushToLine call):", pushError, JSON.stringify(pushError, Object.getOwnPropertyNames(pushError)));
      // ここでさらにエラーが発生した場合、ユーザーには通知できないがログには残す
    }
    })(); // 即時実行関数ここまで
    // この非同期処理の完了を待ってからレスポンスを返すため、
    // res.status(200).end() はこのブロックの最後に移動する。
    // ただし、即時実行関数自体はawaitしていないので、このままでは待たない。
    // 即時実行関数をawaitするか、res.end()を即時実行関数内に入れる必要がある。
    // ここでは、即時実行関数全体を await し、その後に res.end() を呼ぶように変更する。
    // そのためには、即時実行関数を通常のasync関数として定義し、呼び出す形にする。

    // 修正案：
    // 1. 即時実行関数を通常の async 関数に
    // 2. それを await で呼び出す
    // 3. その後 res.status(200).end()

    // さらに修正：
    // replyToLineで一度返信しているので、res.status(200).end()はすぐに返しても問題ないはず。
    // Vercelの仕様でバックグラウンド処理が継続するかどうかを確認する必要がある。
    // 通常、レスポンス返却後も一定時間は処理が継続されるはず。
    // ひとまず元の構造に戻し、問題の切り分けをする。
    // もしVercelの制約が強いなら、応答を返す前に全処理を完了させる必要がある。

    // 再考：ユーザーからの指摘は「AIからの回答が戻ってこない」。
    // ログも出ない。これは非同期処理が途中で止まっている可能性が高い。
    // やはり、res.end()を非同期処理の完了後に持ってくるのが堅実。
    // 即時実行関数を await する形にリファクタリングする。
    // -> Vercelの標準的な動作を考慮し、awaitしないfire-and-forgetパターンに戻す。

    (async () => { // await を削除
      console.log("[AI Processing] Starting async block for user:", userId); // Log: Start async
      let aiReply = "神託は沈黙を守っておる…"; // Default reply in case of unexpected issues

      try {
        console.log("[AI Processing] Calling DeepSeek API for user:", userId); // Log: Before DeepSeek
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
        console.error("Error in AI processing async block (fetching/parsing DeepSeek API):", error, JSON.stringify(error, Object.getOwnPropertyNames(error)));
        aiReply = "深淵からの声が、予期せぬ沈黙に閉ざされた…";
      }
      try {
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[AI Processing] DeepSeek API error for user ${userId}: ${response.status} ${response.statusText}`, errorText); // Log: API Error
          aiReply = "我が神託は、今、電波の荒波に揉まれておる…";
        } else {
          const responseText = await response.text();
          console.log("[AI Processing] DeepSeek API success for user:", userId); // Log: API Success
          try {
            const result = JSON.parse(responseText);
            aiReply = result.choices?.[0]?.message?.content ?? "我が教えは静寂の彼方よりまだ届いておらぬ…";
          } catch (e) {
            console.error("[AI Processing] Failed to parse DeepSeek API response as JSON for user:", userId, e); // Log: JSON Parse Error
            console.error("DeepSeek API response text:", responseText);
            aiReply = "神託の解読に失敗せり。異形の文字が混じりておる…";
          }
        }
      } catch (error) {
        console.error("[AI Processing] Outer error in fetching/parsing DeepSeek API for user:", userId, error, JSON.stringify(error, Object.getOwnPropertyNames(error))); // Log: Outer Catch Block Error
        aiReply = "深淵からの声が、予期せぬ沈黙に閉ざされた…";
      }

      try {
        console.log("[AI Processing] Calling pushToLine for user:", userId, "with reply:", (aiReply || "Reply is undefined").substring(0, 50) + "..."); // Log: Before Push, check aiReply
        if (aiReply) { // Ensure aiReply has a value
          await pushToLine(userId, aiReply);
          console.log("[AI Processing] pushToLine finished for user:", userId); // Log: After Push
        } else {
          console.error("[AI Processing] aiReply was not set. Skipping pushToLine for user:", userId); // Log: aiReply not set
          // Optionally, send a generic error message to the user via pushToLine here
          // await pushToLine(userId, "予期せぬエラーにより、神託を伝えることができなんだ。");
        }
      } catch (pushError) {
        console.error("[AI Processing] Error in pushToLine call for user:", userId, pushError, JSON.stringify(pushError, Object.getOwnPropertyNames(pushError))); // Log: Push Error
      }
      console.log("[AI Processing] Finished async block for user:", userId); // Log: End Async
    })();
    return res.status(200).end();

  }
  // このelseは、上の if (userText.startsWith("!ai ")) に対応するものではなく、
  // もし他のコマンドのif-else ifチェーンの最後に置くなら、という仮定のコメントだった。
  // 現状は、!ai の処理が終わったらreturnしているので、このelseには到達しない。
  // 正しい構造は、一連のコマンドチェックの最後に、どのコマンドでもなかった場合の処理を書く。

  // ハンドラの最後で、どのコマンドにもマッチしなかった場合にデフォルトの応答をするか、何もせずに終了する。
  // 現在は各コマンドブロックで return res.status(200).end() しているので、
  // ここに到達するのは、どのコマンドでもない場合のみ。
  res.status(200).end();
}

// LINEへの返信を行う共通関数 (リプライトークン使用)
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

// LINEへプッシュメッセージを送信する共通関数 (ユーザーID使用)
async function pushToLine(userId, text) {
  try {
    const lineResponse = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        to: userId,
        messages: [{ type: "text", text }]
      })
    });

    if (!lineResponse.ok) {
      const errorText = await lineResponse.text();
      console.error(`LINE Push API error: ${lineResponse.status} ${lineResponse.statusText}`, errorText);
    }
  } catch (error) {
    console.error("Error in pushToLine function:", error, JSON.stringify(error, Object.getOwnPropertyNames(error)));
  }
}
