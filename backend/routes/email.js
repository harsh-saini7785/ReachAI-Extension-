const express  = require('express');
const router   = express.Router();
const path     = require('path');
const fs       = require('fs');
const nodemailer = require('nodemailer');
const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');

// ─── SES Transport via Nodemailer (AWS SDK v3 - SESv2) ────────────────────────
const sesClient = new SESv2Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const transporter = nodemailer.createTransport({
  SES: { sesClient, SendEmailCommand },
});

// ─── POST /api/generate-email ──────────────────────────────────────────────────
router.post('/generate-email', async (req, res) => {
  const {
    recipientName, recipientCompany, recipientRole,
    senderName, senderSkills, senderExperience,
    purpose, isFollowup,
  } = req.body;

  if (!recipientName && !recipientCompany) {
    return res.status(400).json({ error: 'At least one of name or company is required.' });
  }

  const greeting       = recipientName ? recipientName : 'Sir/Ma\'am';
  const companyContext = recipientCompany ? `at ${recipientCompany}` : '';

  // Resume context
  const textPath   = path.join(__dirname, '..', 'uploads', 'resume_text.txt');
  const resumeText = fs.existsSync(textPath) ? fs.readFileSync(textPath, 'utf8').slice(0, 800) : '';
  const resumeHint = resumeText ? `\n[SENDER RESUME CONTEXT]\n${resumeText}` : '';

  // Purpose-specific instructions
  const purposeInstructions = {
    job:      `- This is a job opportunity inquiry — ask if there are openings or if they can refer you\n- Mention your key skills and why you'd be a great fit\n- If resume is attached, mention it`,
    referral: `- This is a referral request — ask if they'd be willing to refer you to their company\n- Be personal and appreciative of their time\n- Mention your shared connection or admiration for their work`,
    sales:    `- This is a product/service pitch — highlight the value you bring to their specific company\n- Keep it benefit-focused, not feature-focused\n- End with a soft ask: demo or quick call`,
    network:  `- This is a pure networking email — no hard ask\n- Express genuine interest in their work or career path\n- Ask for a casual 15-min virtual coffee chat`,
    followup: `- This follows up on a previous email sent last week\n- Reference the previous email briefly\n- Add one new piece of value or context\n- Keep it light and give them an easy out`,
  };

  const purposeKey  = (purpose || 'job').toLowerCase();
  const purposeHint = purposeInstructions[purposeKey]
    || `- The purpose is: "${purpose}"\n- Write the email specifically for this purpose`;

  const prompt = isFollowup
    ? `Write a short follow-up email (max 80 words).
Recipient: ${greeting} ${companyContext}${recipientRole ? ` (${recipientRole})` : ''}
Sender: ${senderName || 'me'}, ${senderExperience || 'professional'} in ${senderSkills || 'their field'}${resumeHint}

Rules:
- Address recipient as "${greeting}"
- Reference previous email sent last week
- Add one new angle or value
- Light, non-pushy tone
- End with: "No worries if now's not a great time!"
- Output: Subject on line 1, blank line, then body. No labels.`
    : `Write a short, professional cold email (max 150 words).
Recipient: ${greeting} ${companyContext}${recipientRole ? ` (${recipientRole})` : ''}
Sender: ${senderName || 'me'}, ${senderExperience || 'professional'} in ${senderSkills || 'their field'}${resumeHint}

Purpose-specific rules:
${purposeHint}

General rules:
- Address recipient as "${greeting}"
${recipientCompany ? `- Reference ${recipientCompany} naturally` : '- Be personable and professional'}
- Warm but professional tone
- Output: Subject on line 1, blank line, then body. No labels.`;

  try {
    const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
    if (!MINIMAX_API_KEY) {
      return res.status(500).json({ error: 'MINIMAX_API_KEY is not configured in .env' });
    }

    const response = await fetch('https://api.minimaxi.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7',
        messages: [
          {
            role: 'system',
            content: 'You are an expert cold email copywriter. Write concise, professional, and highly personalised emails. Output the subject on the first line, then a blank line, then the email body. No labels or prefixes.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: 'MiniMax API error', detail: err });
    }

    const data     = await response.json();
    const fullText = data.choices?.[0]?.message?.content?.trim() || '';

    const lines   = fullText.split('\n').filter(l => l.trim() !== '');
    const subject = lines[0]?.replace(/^subject:?\s*/i, '').trim() || `Opportunity ${companyContext}`;
    const body    = lines.slice(1).join('\n').trim();

    return res.json({ subject, body });
  } catch (err) {
    console.error('Generate email error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// ─── POST /api/send-email ──────────────────────────────────────────────────────
// Sends email via Nodemailer + SES, optionally attaching resume.pdf
router.post('/send-email', async (req, res) => {
  const { toEmail, toName, subject, body } = req.body;

  if (!toEmail || !subject || !body) {
    return res.status(400).json({ error: 'toEmail, subject and body are required.' });
  }

  const fromEmail = process.env.SES_FROM_EMAIL;
  if (!fromEmail) {
    return res.status(500).json({ error: 'SES_FROM_EMAIL is not configured in .env' });
  }

  const resumePath = path.join(__dirname, '..', 'uploads', 'resume.pdf');
  const attachments = [];
  if (fs.existsSync(resumePath)) {
    attachments.push({
      filename: 'Resume.pdf',
      path:     resumePath,
      contentType: 'application/pdf',
    });
  }

  const mailOptions = {
    from:    fromEmail,
    to:      toName ? `${toName} <${toEmail}>` : toEmail,
    subject,
    text:    body,
    html:    `<pre style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap">${body.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>`,
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    const hasResume = attachments.length > 0;
    console.log(`✉️  Email sent to ${toEmail} ${hasResume ? '(+ resume attached)' : ''}`);
    return res.json({ success: true, messageId: info.messageId, resumeAttached: hasResume });
  } catch (err) {
    console.error('Send email error:', err);
    return res.status(500).json({ error: 'Failed to send email', detail: err.message, code: err.code });
  }
});

module.exports = router;
