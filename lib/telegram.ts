// Sends a Telegram message as the ORBITAL bot from the web server (e.g.
// when an admin marks a trade done), using the same bot token as
// bot/index.ts. Failures are logged, never thrown: a status change must
// not be undone because a notification could not go out.
export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error(`[telegram] sendMessage to ${chatId} failed: ${res.status}`);
    return res.ok;
  } catch (e) {
    console.error(`[telegram] sendMessage to ${chatId} failed:`, e instanceof Error ? e.message : e);
    return false;
  }
}
