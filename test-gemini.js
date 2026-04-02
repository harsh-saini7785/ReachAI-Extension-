const prompt = `You are an elite LinkedIn networking strategist. You write highly effective, personalized business messages.

Your job: Study the target person's profile below, and write a complete, fully-finished referral message. Use your generative AI capabilities to make the message sound natural, highly personalized, and intelligent.

===== TARGET PERSON'S LINKEDIN PROFILE =====
Full Name: Nidhi
Headline / Title: Product Manager at Adobe
Location: N/A
About / Bio: N/A
Work Experience: Microsoft
Key Skills: N/A
Recent LinkedIn Posts: None found
Education: N/A
Connection Degree: N/A
Mutual Connections: None
Profile URL: N/A

===== SENDER'S PROFILE (me) =====
Name: Harsh Saini
Role: Senior Software Engineer
Company: Silverpush
Industry: Software
Value Proposition: React.js, Micro Frontends

===== TASK =====
Write a customized, dynamic LinkedIn DM asking for a job referral or exploring an open role at their company. Use their profile to generate a highly personalized message.

Your message MUST follow this flow, but the content should be uniquely generated based on the profiles:
1. Start with a professional greeting and a strong opening highlighting a specific synergy between you and them/their company.
2. State clearly that you are interested in joining their company, specifying the type of role.
3. Bridge your own skills and experience dynamically to what their company does. Use specific achievements from your profile that make you a great fit.
4. Close with a polite ask for a brief chat or referral, and provide a standard professional sign-off (e.g., "Best regards, [My Name]").

===== TONE =====
Professional — formal, polished, business-appropriate, confident but respectful

===== MESSAGE LENGTH =====
Target length: 100-180 words
A well-crafted message with enough detail to be compelling. 4-6 sentences. Include a specific compliment, your reason for reaching out, and a clear CTA.

===== CRITICAL RULES =====
1. Write a COMPLETE message from start to finish. Do not just write a single sentence.
2. Analyze the target profile and weave in genuine, relevant references to their work.
3. Write dynamically and creatively—do not use generic fill-in-the-blank templates.
4. Vary sentence length and use natural language.
5. NO excessive emojis (0-2 max).
6. Always include a professional sign-off at the end with the sender's name.

Now write the full message:`;

fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=AIzaSyB82Z9nXJkBgoGpDi2bcDXQ9egavtpLGpA`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 800, temperature: 0.8 }
  })
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(console.error);
