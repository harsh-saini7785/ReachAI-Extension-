// ReachAI Content Script
// Scrapes LinkedIn profile data and injects AI button into the page

(function () {
  'use strict';

  let floatingBtn = null;
  let panel = null;
  let lastUrl = location.href;

  // ─── Profile Scraper ───────────────────────────────────────────────────────

  function scrapeTargetProfile() {
    const profile = {};

    // 1. Scrape the entire top Intro card (Contains Name, Headline, Location, Company Badge)
    const introCard = document.querySelector('.ph5.pb5, .pv-top-card');
    profile.rawIntro = introCard ? introCard.innerText.trim() : '';

    // 2. Scrape the Experience section (Contains job history, current role, current company)
    const expCard = document.querySelector('#experience')?.closest('section');
    profile.rawExperience = expCard ? expCard.innerText.trim().slice(0, 1500) : '';

    // 3. Fallback: Grab the page title which usually contains 'Name - Role - Company'
    profile.pageTitle = document.title;

    // 4. Targeted Company Scrape: Find the specific text element within the badge (e.g. Alfa Electronics)
    // We look for any button/badge in the intro section that contains an image (logo)
    const badge = (introCard || document).querySelector('.pv-text-details__right-panel [role="button"], .pv-text-details__right-panel button, [role="button"][style*="min-width"], button[aria-label*="Current company"]');
    let extractedCompany = '';
    if (badge) {
      // Find the deepest text-bearing element (often a p, span, or a nested div)
      const textEl = badge.querySelector('p, span, div div div') || badge;
      extractedCompany = textEl.innerText.trim().split('\n')[0].trim();
    }
    profile.explicitCompanyBadge = extractedCompany;

    // 5. Intelligent Role Search: Match the badge company to the role in Experience
    let explicitRole = '';
    if (extractedCompany) {
      const expItems = document.querySelectorAll('.pvs-list__item--line-separated, .experience-item, .pv-position-entity');
      for (const item of expItems) {
        if (item.innerText.toLowerCase().includes(extractedCompany.toLowerCase())) {
          // The first <p> or <span> in these lists is almost always the Job Title
          const roleEl = item.querySelector('p, span, [class*="title"]');
          if (roleEl) {
            explicitRole = roleEl.innerText.trim().split('\n')[0];
            break;
          }
        }
      }
    }
    profile.explicitRole = explicitRole;

    // Optional but needed for UI tracking
    profile.profileUrl = window.location.href;
    profile.isProfilePage = /linkedin\.com\/in\//.test(window.location.href);

    console.log("profile", profile);

    return profile;
  }

  // ─── Floating Button ───────────────────────────────────────────────────────

  function createFloatingButton() {
    if (floatingBtn) floatingBtn.remove();

    floatingBtn = document.createElement('div');
    floatingBtn.id = 'reachai-fab';
    floatingBtn.innerHTML = `
      <div class="reachai-fab-inner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white" stroke="white" stroke-width="1.5"/>
        </svg>
        <span>ReachAI</span>
      </div>
    `;

    floatingBtn.addEventListener('click', togglePanel);
    document.body.appendChild(floatingBtn);
  }

  function removeFloatingButton() {
    if (floatingBtn) {
      floatingBtn.remove();
      floatingBtn = null;
    }
  }

  // ─── Side Panel ────────────────────────────────────────────────────────────

  function createPanel() {
    if (panel) panel.remove();

    panel = document.createElement('div');
    panel.id = 'reachai-panel';
    panel.innerHTML = `
      <div class="rp-header">
        <div class="rp-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#6366f1"/>
          </svg>
          ReachAI
        </div>
        <button class="rp-close" id="reachai-close">✕</button>
      </div>

      <div class="rp-profile-badge" id="rp-target-badge">
        <div class="rp-avatar" id="rp-avatar-initials">–</div>
        <div class="rp-profile-info">
          <div class="rp-profile-name" id="rp-profile-name">Scanning profile…</div>
          <div class="rp-profile-role" id="rp-profile-role"></div>
        </div>
        <div class="rp-scrape-status" id="rp-scrape-status">
          <div class="rp-dot"></div>
        </div>
      </div>

      <div class="rp-tabs">
        <button class="rp-tab active" data-type="referral">Referral</button>
        <button class="rp-tab" data-type="outreach">Outreach</button>
        <button class="rp-tab" data-type="connection">Connect</button>
        <button class="rp-tab" data-type="comment">Comment</button>
        <button class="rp-tab" data-type="followup">Follow-up</button>
      </div>

      <div class="rp-controls">
        <div class="rp-label">Tone</div>
        <div class="rp-tone-btns">
          <button class="rp-tone active" data-tone="professional">Professional</button>
          <button class="rp-tone" data-tone="friendly">Friendly</button>
          <button class="rp-tone" data-tone="bold">Bold</button>
          <button class="rp-tone" data-tone="concise">Concise</button>
        </div>

        <div class="rp-label" style="margin-top:10px">Message Length</div>
        <div class="rp-size-btns">
          <button class="rp-size" data-size="short">🔹 Short</button>
          <button class="rp-size active" data-size="medium">🔸 Medium</button>
          <button class="rp-size" data-size="large">🔶 Large</button>
        </div>

        <div class="rp-label" style="margin-top:10px">Custom context <span class="rp-optional">(optional)</span></div>
        <textarea class="rp-context" id="rp-custom-context" placeholder="e.g. Mention we both went to IIT, or I'm interested in their recent post about AI…" rows="2"></textarea>
      </div>

      <button class="rp-generate-btn" id="rp-generate">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white"/></svg>
        Generate Message
      </button>

      <div class="rp-output-area" id="rp-output-area" style="display:none">
        <div class="rp-output-header">
          <span>Generated Message</span>
          <div class="rp-output-actions">
            <button class="rp-action-btn" id="rp-regenerate" title="Regenerate">↻</button>
            <button class="rp-action-btn" id="rp-copy" title="Copy">Copy</button>
          </div>
        </div>
        <div class="rp-message-box" id="rp-message-box" contenteditable="true"></div>
        <div class="rp-char-count" id="rp-char-count">0 chars</div>
      </div>

      <div class="rp-loading" id="rp-loading" style="display:none">
        <div class="rp-spinner"></div>
        <span>Crafting your message…</span>
      </div>

      <div class="rp-error" id="rp-error" style="display:none"></div>

      <div class="rp-footer">
        <a href="#" id="rp-settings-link">⚙ Settings</a>
        <span>ReachAI v1.1</span>
      </div>
    `;

    document.body.appendChild(panel);
    injectStyles();
    bindPanelEvents();
    refreshProfileBadge();
  }

  function refreshProfileBadge() {
    const profile = scrapeTargetProfile();
    const nameEl = panel.querySelector('#rp-profile-name');
    const roleEl = panel.querySelector('#rp-profile-role');
    const avatarEl = panel.querySelector('#rp-avatar-initials');
    const statusEl = panel.querySelector('#rp-scrape-status');

    let uiName = 'No profile detected';
    let uiRole = 'Navigate to a LinkedIn profile';

    if (profile.pageTitle && profile.pageTitle.includes('|')) {
      uiName = profile.pageTitle.split('|')[0].trim();
      uiRole = profile.pageTitle.split('|')[1]?.trim() || '';
    } else if (profile.pageTitle && profile.pageTitle.includes('-')) {
      uiName = profile.pageTitle.split('-')[0].trim();
      uiRole = 'LinkedIn Member';
    }

    if (profile.rawIntro || profile.pageTitle) {
      nameEl.textContent = uiName;
      roleEl.textContent = uiRole;
      const initials = uiName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      avatarEl.textContent = initials || '?';
      statusEl.innerHTML = `<div class="rp-dot green"></div>`;
    } else {
      nameEl.textContent = 'No profile detected';
      roleEl.textContent = 'Navigate to a LinkedIn profile';
      avatarEl.textContent = '?';
    }
  }

  function togglePanel() {
    if (panel) {
      panel.classList.toggle('rp-open');
      if (panel.classList.contains('rp-open')) refreshProfileBadge();
    } else {
      createPanel();
      setTimeout(() => panel.classList.add('rp-open'), 10);
    }
  }

  function bindPanelEvents() {
    // Close
    panel.querySelector('#reachai-close').addEventListener('click', () => {
      panel.classList.remove('rp-open');
    });

    // Tabs
    let activeType = 'referral';
    panel.querySelectorAll('.rp-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        panel.querySelectorAll('.rp-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeType = tab.dataset.type;
      });
    });

    // Tone
    let activeTone = 'professional';
    panel.querySelectorAll('.rp-tone').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('.rp-tone').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTone = btn.dataset.tone;
      });
    });

    // Message Size
    let activeSize = 'medium';
    panel.querySelectorAll('.rp-size').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('.rp-size').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeSize = btn.dataset.size;
      });
    });

    // Generate
    panel.querySelector('#rp-generate').addEventListener('click', () => {
      generateMessage(activeType, activeTone, activeSize);
    });

    // Regenerate
    panel.querySelector('#rp-regenerate').addEventListener('click', () => {
      generateMessage(activeType, activeTone, activeSize);
    });

    // Copy
    panel.querySelector('#rp-copy').addEventListener('click', () => {
      const text = panel.querySelector('#rp-message-box').innerText;
      navigator.clipboard.writeText(text).then(() => {
        const btn = panel.querySelector('#rp-copy');
        btn.textContent = '✓ Copied!';
        setTimeout(() => btn.textContent = 'Copy', 2000);
      });
    });

    // Char count
    const msgBox = panel.querySelector('#rp-message-box');
    msgBox.addEventListener('input', () => {
      const len = msgBox.innerText.length;
      panel.querySelector('#rp-char-count').textContent = `${len} chars`;
    });

    // Settings link
    panel.querySelector('#rp-settings-link').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.sendMessage({ action: 'openSettings' });
    });
  }

  // ─── Message Generation ────────────────────────────────────────────────────

  async function generateMessage(type, tone, size) {
    const targetProfile = scrapeTargetProfile();
    const customContext = panel.querySelector('#rp-custom-context').value.trim();

    // Get saved user profile
    let stored;
    try {
      stored = await chrome.storage.sync.get(['userProfile']);
    } catch (e) {
      showError('Extension was updated. Please refresh this LinkedIn page (Ctrl+R / Cmd+R) and try again.');
      return;
    }
    const userProfile = stored.userProfile || {};

    showLoading(true);
    hideError();
    panel.querySelector('#rp-output-area').style.display = 'none';

    const prompt = buildPrompt(type, tone, size, targetProfile, userProfile, customContext);
    console.log(prompt, 'prompt');

    try {
      // Route through backend — MiniMax API key stays server-side
      const response = await fetch('http://localhost:3001/api/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Backend error ${response.status}`);
      }

      const data = await response.json();
      displayMessage(data.message);
    } catch (err) {
      showError(err.message || 'Something went wrong. Make sure the ReachAI backend is running.');
    } finally {
      showLoading(false);
    }
  }

  function buildPrompt(type, tone, size, target, user, customContext) {
    const targetInfo = `
===== TARGET PERSON'S PROFILE =====
Name: ${target.pageTitle || 'Unknown'}
Verified Current Role: ${target.explicitRole || 'N/A'}
Verified Current Company: ${target.explicitCompanyBadge || 'N/A'}

[RAW DATA FOR CONTEXT]
${target.rawIntro || 'N/A'}
${target.rawExperience || 'N/A'}

NOTE TO AI: Use 'Verified Current Role' and 'Verified Current Company' as the absolute source of truth for where they work right now. Matches these into your templates.
`.trim();

    const userInfo = `
===== SENDER'S PROFILE (me) =====
Name: ${user.name || 'Not provided'}
Role: ${user.role || 'Not provided'}
Company: ${user.company || 'Not provided'}
Industry: ${user.industry || 'Not provided'}
Value Proposition: ${user.valueProposition || 'Not provided'}
`.trim();

    const toneGuide = {
      professional: 'Professional — formal, polished, business-appropriate, confident but respectful',
      friendly: 'Friendly — warm, conversational, approachable like talking to a peer, use casual language',
      bold: 'Bold — confident, direct, high-energy, slightly provocative, no fluff, make them stop scrolling',
      concise: 'Concise — extremely brief, every word counts, no filler, get straight to the point'
    }[tone];

    const sizeGuide = {
      short: { words: '40-80 words', desc: 'Keep it very brief and impactful. 2-3 sentences max. Every word must earn its place.' },
      medium: { words: '100-180 words', desc: 'A well-crafted message with enough detail to be compelling. 4-6 sentences. Include a specific compliment, your reason for reaching out, and a clear CTA.' },
      large: { words: '200-350 words', desc: 'A detailed, in-depth message. 7-12 sentences. Include multiple references to their profile, build a narrative about why you\'re reaching out, establish credibility, and end with a compelling CTA. Use paragraph breaks for readability.' }
    }[size];

    const typeInstruction = ReachAITemplates[type];

    const extra = customContext ? `\n\nADDITIONAL CONTEXT FROM SENDER:\n${customContext}` : '';

    return `You are an elite LinkedIn networking strategist. You write highly effective, personalized business messages.

Your job: Study the target person's profile below, and write a complete, fully-finished ${type} message. Use your generative AI capabilities to make the message sound natural, highly personalized, and intelligent.

${targetInfo}

${userInfo}
${extra}

===== TASK =====
${typeInstructions}

===== TONE =====
${toneGuide}

===== MESSAGE LENGTH =====
Target length: ${sizeGuide.words}
${sizeGuide.desc}

===== CRITICAL RULES =====
1. Write a COMPLETE message from start to finish. Do not just write a single sentence.
2. Analyze the target profile and weave in genuine, relevant references to their work.
3. Write dynamically and creatively—do not use generic fill-in-the-blank templates.
4. Vary sentence length and use natural language.
5. NO excessive emojis (0-2 max).
6. Always include a professional sign-off at the end with the sender's name.

Now write the full message:`;
  }

  function displayMessage(text) {
    const box = panel.querySelector('#rp-message-box');
    box.innerText = text;
    panel.querySelector('#rp-char-count').textContent = `${text.length} chars`;
    panel.querySelector('#rp-output-area').style.display = 'block';
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function showLoading(show) {
    panel.querySelector('#rp-loading').style.display = show ? 'flex' : 'none';
    panel.querySelector('#rp-generate').disabled = show;
  }

  function showError(msg) {
    const el = panel.querySelector('#rp-error');
    el.textContent = msg;
    el.style.display = 'block';
  }

  function hideError() {
    panel.querySelector('#rp-error').style.display = 'none';
  }

  // ─── Styles ────────────────────────────────────────────────────────────────

  function injectStyles() {
    if (document.getElementById('reachai-styles')) return;

    const style = document.createElement('style');
    style.id = 'reachai-styles';
    style.textContent = `

      #reachai-fab {
        position: fixed;
        bottom: 28px;
        right: 28px;
        z-index: 999999;
        cursor: pointer;
        filter: drop-shadow(0 4px 16px rgba(99,102,241,0.45));
        transition: transform 0.2s;
      }
      #reachai-fab:hover { transform: scale(1.06); }
      .reachai-fab-inner {
        display: flex;
        align-items: center;
        gap: 7px;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        font-weight: 600;
        padding: 10px 16px;
        border-radius: 50px;
        letter-spacing: 0.2px;
      }

      #reachai-panel {
        position: fixed;
        top: 0;
        right: -420px;
        width: 390px;
        height: 100vh;
        background: #0f0f13;
        border-left: 1px solid rgba(255,255,255,0.07);
        z-index: 999998;
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        transition: right 0.32s cubic-bezier(0.4,0,0.2,1);
        overflow-y: auto;
        overflow-x: hidden;
        box-shadow: -8px 0 40px rgba(0,0,0,0.5);
      }
      #reachai-panel.rp-open { right: 0; }

      .rp-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 20px 16px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        background: rgba(99,102,241,0.06);
      }
      .rp-logo {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #e2e2f0;
        font-size: 15px;
        font-weight: 700;
        letter-spacing: -0.3px;
      }
      .rp-close {
        background: none;
        border: none;
        color: #666;
        font-size: 16px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
        transition: all 0.15s;
      }
      .rp-close:hover { background: rgba(255,255,255,0.08); color: #e2e2f0; }

      .rp-profile-badge {
        margin: 16px 20px 0;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 12px;
        padding: 12px 14px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .rp-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        font-weight: 700;
        flex-shrink: 0;
      }
      .rp-profile-info { flex: 1; min-width: 0; }
      .rp-profile-name { color: #e2e2f0; font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .rp-profile-role { color: #777; font-size: 11px; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .rp-dot { width: 8px; height: 8px; border-radius: 50%; background: #444; }
      .rp-dot.green { background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.5); }
      .rp-scrape-status { flex-shrink: 0; }

      .rp-tabs {
        display: flex;
        gap: 4px;
        padding: 14px 20px 0;
        overflow-x: auto;
        scrollbar-width: none;
      }
      .rp-tabs::-webkit-scrollbar { display: none; }
      .rp-tab {
        background: none;
        border: 1px solid rgba(255,255,255,0.08);
        color: #666;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 11.5px;
        font-weight: 500;
        padding: 6px 11px;
        border-radius: 50px;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.15s;
      }
      .rp-tab:hover { border-color: rgba(99,102,241,0.4); color: #a5b4fc; }
      .rp-tab.active { background: rgba(99,102,241,0.15); border-color: #6366f1; color: #a5b4fc; font-weight: 600; }

      .rp-controls {
        padding: 16px 20px 0;
      }
      .rp-label {
        color: #888;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        margin-bottom: 8px;
      }
      .rp-optional { font-weight: 400; text-transform: none; letter-spacing: 0; }
      .rp-tone-btns { display: flex; gap: 6px; flex-wrap: wrap; }
      .rp-tone {
        background: none;
        border: 1px solid rgba(255,255,255,0.08);
        color: #666;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 11.5px;
        font-weight: 500;
        padding: 5px 12px;
        border-radius: 50px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .rp-tone:hover { border-color: rgba(99,102,241,0.4); color: #a5b4fc; }
      .rp-tone.active { background: rgba(99,102,241,0.15); border-color: #6366f1; color: #a5b4fc; font-weight: 600; }

      .rp-size-btns { display: flex; gap: 6px; flex-wrap: wrap; }
      .rp-size {
        background: none;
        border: 1px solid rgba(255,255,255,0.08);
        color: #666;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 11.5px;
        font-weight: 500;
        padding: 5px 12px;
        border-radius: 50px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .rp-size:hover { border-color: rgba(99,102,241,0.4); color: #a5b4fc; }
      .rp-size.active { background: rgba(99,102,241,0.15); border-color: #6366f1; color: #a5b4fc; font-weight: 600; }

      .rp-context {
        width: 100%;
        box-sizing: border-box;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 10px;
        color: #e2e2f0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12.5px;
        padding: 10px 12px;
        resize: none;
        outline: none;
        transition: border-color 0.15s;
        line-height: 1.5;
      }
      .rp-context:focus { border-color: #6366f1; }
      .rp-context::placeholder { color: #444; }

      .rp-generate-btn {
        margin: 16px 20px 0;
        width: calc(100% - 40px);
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        border: none;
        border-radius: 12px;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 600;
        padding: 13px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s;
        letter-spacing: -0.1px;
      }
      .rp-generate-btn:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.35); }
      .rp-generate-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

      .rp-loading {
        margin: 16px 20px 0;
        display: flex;
        align-items: center;
        gap: 10px;
        color: #888;
        font-size: 13px;
      }
      .rp-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(99,102,241,0.3);
        border-top-color: #6366f1;
        border-radius: 50%;
        animation: rp-spin 0.7s linear infinite;
      }
      @keyframes rp-spin { to { transform: rotate(360deg); } }

      .rp-error {
        margin: 12px 20px 0;
        background: rgba(239,68,68,0.1);
        border: 1px solid rgba(239,68,68,0.25);
        border-radius: 10px;
        color: #f87171;
        font-size: 12px;
        padding: 10px 12px;
        line-height: 1.5;
      }

      .rp-output-area {
        margin: 14px 20px 0;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(99,102,241,0.2);
        border-radius: 12px;
        overflow: auto;
      }
      .rp-output-header {
        position: sticky;
        top: 0;
        z-index: 20;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        background: #15151a; /* Solid background to prevent text overlap */
      }
      .rp-output-header span {
        color: #a5b4fc;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.6px;
      }
      .rp-output-actions { display: flex; gap: 8px; align-items: center; }
      .rp-action-btn {
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.1);
        color: #aaa;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 11px;
        padding: 4px 10px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .rp-action-btn:hover { background: rgba(99,102,241,0.2); color: #e2e2f0; }
      .rp-message-box {
        color: #d1d1e0;
        font-size: 13px;
        line-height: 1.65;
        padding: 14px;
        min-height: 170px;
        max-height: 1000px;
        overflow: auto;
        outline: none;
        white-space: pre-wrap;
      }
      .rp-message-box:focus { background: rgba(255,255,255,0.02); }
      .rp-char-count {
        padding: 6px 14px 10px;
        color: #555;
        font-size: 11px;
        text-align: right;
      }

      .rp-footer {
        margin-top: auto;
        padding: 16px 20px;
        border-top: 1px solid rgba(255,255,255,0.06);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .rp-footer a { color: #6366f1; font-size: 12px; text-decoration: none; }
      .rp-footer a:hover { color: #a5b4fc; }
      .rp-footer span { color: #444; font-size: 11px; }
    `;
    document.head.appendChild(style);
  }

  // ─── URL change detection (SPA navigation) ─────────────────────────────────

  function checkUrlChange() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(() => {
        if (panel && panel.classList.contains('rp-open')) refreshProfileBadge();
        updateFabVisibility();
      }, 4000); // 2.5 second delay for stable loading
    }
  }

  function updateFabVisibility() {
    const isLinkedIn = window.location.hostname.includes('linkedin.com');
    if (isLinkedIn) {
      if (!floatingBtn) createFloatingButton();
    } else {
      removeFloatingButton();
    }
  }

  // ─── Init ──────────────────────────────────────────────────────────────────

  function init() {
    updateFabVisibility();
    setInterval(checkUrlChange, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
