const express = require('express');
const router  = express.Router();

// ─── POST /api/generate-message ───────────────────────────────────────────────
// Generates a LinkedIn DM using MiniMax AI
router.post('/generate-message', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required.' });
  }

  const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
  if (!MINIMAX_API_KEY) {
    return res.status(500).json({ error: 'MINIMAX_API_KEY is not configured in .env' });
  }

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
            content: 'You are an elite LinkedIn networking strategist. You write highly effective, personalized, and natural-sounding LinkedIn messages. Output only the final message — no preamble, no labels, no explanations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: 'MiniMax API error', detail: err });
    }

    const data    = await response.json();
    const message = data.choices?.[0]?.message?.content?.trim() || '';

    return res.json({ message });
  } catch (err) {
    console.error('Generate message error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

module.exports = router;
