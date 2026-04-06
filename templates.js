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

  referral: `You MUST use one of the following templates exactly. Replace [Name] with the Target Person's Name, and logically replace [My Skills] and [My Experience] using the Sender's 'Value Proposition':

Template 1: "Hi [Name], I came across your profile and wanted to reach out. I’m currently exploring frontend opportunities and would really appreciate your support. I have [My Experience] with [My Skills]. If possible, could you please refer me for a suitable role? Happy to share my resume. Thanks!"

Template 2: "Hi [Name], I’ve been following your work and really admire your experience. I’m currently looking for new opportunities and have [My Experience] building scalable UI applications using [My Skills]. I’d really appreciate it if you could consider referring me. Thanks for your time!"

Template 3: "Hi [Name], hope you’re doing well! Since we’re connected here, I wanted to reach out. I’m currently exploring new roles and believe my experience with [My Skills] aligns well with strong engineering teams. Would you be open to referring me? I’d truly appreciate your support."

Template 4: "Hi [Name], I’m currently looking for opportunities and wanted to reach out. I have [My Experience] building scalable applications using [My Skills], and recently worked on improving performance and creating reusable component systems. If you feel my profile is a good fit, I’d be grateful if you could refer me. Thanks!"

Template 5: "Hey [Name], hope you’re doing great! I wanted to quickly reach out as I’m exploring new opportunities. I’ve been working with [My Skills] for [My Experience] and would really appreciate it if you could help me with a referral. Let me know if you need any details. Thanks!"

CRITICAL FOCUS: 
- Choose one template that best fits the Tone.
- Replace [Name] with the target's extracted Name.
- Replace [My Skills] and [My Experience] intelligently using the Sender's 'Value Proposition'. If their exact years of experience aren't provided, use a generic natural phrase like 'extensive experience' or 'a strong background'.
- Do NOT hallucinate or add any company names to the template.
- Output ONLY the filled template, with no extra text.`
};
