// ReachAI Popup Script

document.addEventListener('DOMContentLoaded', async () => {

  // ─── Tab Navigation ──────────────────────────────────────────────────────
  const tabBtns = document.querySelectorAll('.tab-btn');
  const sections = {
    home: document.getElementById('tab-home'),
    profile: document.getElementById('tab-profile'),
    settings: document.getElementById('tab-settings'),
    about: document.getElementById('tab-about'),
  };

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      Object.values(sections).forEach(s => s.style.display = 'none');
      const target = sections[btn.dataset.tab];
      if (target) target.style.display = 'block';
    });
  });

  // Show home by default
  Object.values(sections).forEach(s => s.style.display = 'none');
  sections.home.style.display = 'block';

  // ─── Load Saved Data ─────────────────────────────────────────────────────
  const stored = await chrome.storage.sync.get(['userProfile', 'apiKey', 'stats']);
  const profile = stored.userProfile || {};
  const stats = stored.stats || { generated: 0, copied: 0 };

  // Fill profile fields
  if (profile.name) document.getElementById('user-name').value = profile.name;
  if (profile.role) document.getElementById('user-role').value = profile.role;
  if (profile.company) document.getElementById('user-company').value = profile.company;
  if (profile.industry) document.getElementById('user-industry').value = profile.industry;
  if (profile.valueProposition) document.getElementById('user-value').value = profile.valueProposition;

  // Fill API key
  if (stored.apiKey) document.getElementById('api-key').value = stored.apiKey;

  // Fill stats
  document.getElementById('stat-generated').textContent = stats.generated;
  document.getElementById('stat-copied').textContent = stats.copied;

  // ─── Save Profile ────────────────────────────────────────────────────────
  document.getElementById('save-profile').addEventListener('click', async () => {
    const userProfile = {
      name: document.getElementById('user-name').value.trim(),
      role: document.getElementById('user-role').value.trim(),
      company: document.getElementById('user-company').value.trim(),
      industry: document.getElementById('user-industry').value.trim(),
      valueProposition: document.getElementById('user-value').value.trim(),
    };
    await chrome.storage.sync.set({ userProfile });
    const msg = document.getElementById('profile-status');
    msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 2500);
  });

  // ─── Save API Key ────────────────────────────────────────────────────────
  document.getElementById('save-settings').addEventListener('click', async () => {
    const key = document.getElementById('api-key').value.trim();
    const errorEl = document.getElementById('settings-error');
    const successEl = document.getElementById('settings-status');

    if (!key.startsWith('AIza')) {
      errorEl.textContent = '⚠ That doesn\'t look like a valid Google API key.';
      errorEl.style.display = 'block';
      setTimeout(() => errorEl.style.display = 'none', 3000);
      return;
    }

    await chrome.storage.sync.set({ apiKey: key });
    successEl.style.display = 'block';
    errorEl.style.display = 'none';
    setTimeout(() => successEl.style.display = 'none', 2500);
  });

  // ─── Toggle API Key Visibility ───────────────────────────────────────────
  document.getElementById('toggle-key').addEventListener('click', () => {
    const input = document.getElementById('api-key');
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  // ─── Launch Panel Button ─────────────────────────────────────────────────
  document.getElementById('launch-btn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes('linkedin.com')) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const fab = document.getElementById('reachai-fab');
          if (fab) fab.click();
        }
      });
      window.close();
    } else {
      // Open LinkedIn in a new tab
      chrome.tabs.create({ url: 'https://www.linkedin.com' });
    }
  });
});
