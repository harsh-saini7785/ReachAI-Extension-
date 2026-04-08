require('dotenv').config();
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;

async function run() {
  try {
    const response = await fetch('https://api.minimaxi.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-Text-01',
        messages: [
          {
            role: 'system',
            content: 'You are an elite LinkedIn networking strategist.',
          },
          {
            role: 'user',
            content: 'Write a short message.',
          },
        ],
        temperature: 0.8,
      }),
    });

    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Body:", text);
  } catch (err) {
    console.error(err);
  }
}

run();
