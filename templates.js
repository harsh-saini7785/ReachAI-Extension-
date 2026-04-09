// templates.js
// A central bank for all AI templates. You can easily add or modify message prompts here.

const ReachAITemplates = {
  outreach: `Write a personalized LinkedIn DM for cold outreach.

Your message MUST:
1. Open with a hook that references something SPECIFIC from their profile (a recent post topic, a career move, a skill, their company's recent news)
2. Briefly introduce yourself and what you do
3. Clearly state WHY you're reaching out to THEM specifically (not just anyone)
4. Connect your value to their world — what's in it for them?
5. End with a low-pressure, easy-to-answer CTA (a question, not a demand)`,

  connection: `Write a LinkedIn connection request note. MUST be under 300 characters total.

Your note MUST:
1. Mention ONE specific detail from their profile that caught your eye
2. Explain in one line why connecting makes sense for both of you
3. Feel genuine and human — NOT like a template
4. NEVER use "I'd like to add you to my network" or similar generic lines`,

  comment: `Write a thoughtful LinkedIn comment on their recent post or activity.

Your comment MUST:
1. Show you actually READ and understood their post/content
2. Add genuine value — share an insight, a different perspective, or a relevant experience
3. Be specific, not generic praise like "Great post!"
4. Feel like something a thoughtful industry peer would write
5. Optionally ask a smart follow-up question to spark conversation`,

  followup: `Write a LinkedIn follow-up message for someone who hasn't replied.

Your message MUST:
1. NOT guilt-trip them or say "just following up" or "bumping this"
2. Bring a NEW angle, insight, or piece of value they'd find interesting
3. Reference something recent (their post, company news, industry trend)
4. Keep it light and give them an easy out ("No worries if the timing isn't right")
5. Feel like a natural continuation, not a desperate chase`,

  referral: `Write a customized LinkedIn DM asking for a job referral.
 
Your message MUST follow this flow:
1. Start with a professional greeting and a strong opening highlighting a specific synergy between you and them/their company.
2. State clearly that you are interested in joining their company, specifying the type of role.
3. Bridge your own skills and experience dynamically to what their company does. Use specific achievements from your profile that make you a great fit.
4. Close with a polite ask for a brief chat or referral, and provide a standard professional sign-off.

CRITICAL RULES:
- Include the sender's Resume Link if provided in the context.
- If a Job ID is provided, mention it clearly.
- Do NOT use generic fill-in-the-blank templates; write a coherent, natural message.
- Output ONLY the final message.`
};
