# ReachAI – LinkedIn AI Outreach Chrome Extension

Generate hyper-personalized LinkedIn messages using Claude AI. Like MagicSales, but powered by Anthropic's Claude.

---

## Features

- **Personalized Outreach DMs** — Reference their job, posts, skills automatically
- **Connection Request Notes** — Under 300 chars, always genuine
- **Comment Generation** — Thoughtful comments on posts
- **Follow-up Messages** — Non-pushy, adds new angles
- **Job Referral Asks** — Professional, specific, easy to say yes to
- **Tone Control** — Professional / Friendly / Bold / Concise
- **Uses Your Profile** — Personalizes from both sides
- **Editable Output** — Tweak before sending
- **Your key stays local** — Never sent to any third party

---

## Installation (Developer Mode)

1. Open **Chrome** and go to `chrome://extensions/`
2. Enable **"Developer mode"** (top-right toggle)
3. Click **"Load unpacked"**
4. Select the `linkedin-ai-extension` folder
5. The ReachAI icon will appear in your Chrome toolbar

---

## Setup

1. Click the **ReachAI icon** in your Chrome toolbar
2. Go to the **Settings** tab
3. Enter your **Anthropic API key** (get one free at [console.anthropic.com](https://console.anthropic.com))
4. Go to the **My Profile** tab and fill in your details (name, role, company, value prop)
5. Navigate to any **LinkedIn profile**
6. Click the **ReachAI button** (bottom-right of the page)
7. Choose a message type, tone, and hit **Generate Message**

---

## How It Works

1. The extension scrapes the target LinkedIn profile (name, headline, about, experience, skills, recent posts, education)
2. Combines it with your saved profile data
3. Sends a carefully crafted prompt to Claude AI via the Anthropic API
4. Returns a personalized, human-sounding message
5. You can edit it, then copy & paste into LinkedIn

---

## File Structure

```
linkedin-ai-extension/
├── manifest.json       # Chrome extension manifest
├── content.js          # Injected into LinkedIn pages (scraping + UI panel)
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic (settings, profile storage)
├── background.js       # Service worker
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Privacy

- Your API key is stored in `chrome.storage.sync` (local to your browser/Google account)
- Profile data is scraped locally, only sent to Anthropic's API when you click Generate
- No data is ever sent to any third-party server
# ReachAI-Extension-
