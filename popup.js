// ReachAI Popup Script

const BACKEND_URL = 'http://localhost:3001/api';

// Purpose labels for display
const PURPOSE_LABELS = {
  job:      '💼 Job Opportunity',
  referral: '🤝 Referral',
  sales:    '🚀 Sales / Product',
  network:  '🌐 Networking',
  followup: '🔁 Follow-up',
  custom:   '✏️ Custom',
};

document.addEventListener('DOMContentLoaded', async () => {

  // ─── Tab Navigation ──────────────────────────────────────────────────────────
  const tabBtns = document.querySelectorAll('.tab-btn');
  const sections = {
    home:    document.getElementById('tab-home'),
    profile: document.getElementById('tab-profile'),
    email:   document.getElementById('tab-email'),
    about:   document.getElementById('tab-about'),
  };

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      Object.values(sections).forEach(s => { if (s) s.style.display = 'none'; });
      const target = sections[btn.dataset.tab];
      if (target) target.style.display = 'block';
      if (btn.dataset.tab === 'email') renderContactList();
    });
  });

  Object.values(sections).forEach(s => { if (s) s.style.display = 'none'; });
  sections.home.style.display = 'block';

  // ─── Load Saved Data ─────────────────────────────────────────────────────────
  const stored = await chrome.storage.sync.get(['userProfile', 'stats']);
  const profile = stored.userProfile || {};
  const stats   = stored.stats || { generated: 0, copied: 0 };

  if (profile.name)             document.getElementById('user-name').value = profile.name;
  if (profile.role)             document.getElementById('user-role').value = profile.role;
  if (profile.company)          document.getElementById('user-company').value = profile.company;
  if (profile.industry)         document.getElementById('user-industry').value = profile.industry;
  if (profile.valueProposition) document.getElementById('user-value').value = profile.valueProposition;
  if (profile.resumeLink)       document.getElementById('user-resume-link').value = profile.resumeLink;

  document.getElementById('stat-generated').textContent = stats.generated;
  document.getElementById('stat-copied').textContent = stats.copied;

  // ─── Save Profile ────────────────────────────────────────────────────────────
  document.getElementById('save-profile').addEventListener('click', async () => {
    const userProfile = {
      name:             document.getElementById('user-name').value.trim(),
      role:             document.getElementById('user-role').value.trim(),
      company:          document.getElementById('user-company').value.trim(),
      industry:         document.getElementById('user-industry').value.trim(),
      valueProposition: document.getElementById('user-value').value.trim(),
      resumeLink:       document.getElementById('user-resume-link').value.trim(),
    };
    await chrome.storage.sync.set({ userProfile });
    const msg = document.getElementById('profile-status');
    msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 2500);
  });

  // ─── Resume Upload ────────────────────────────────────────────────────────────
  const resumeInput    = document.getElementById('resume-file-input');
  const resumeDropzone = document.getElementById('resume-dropzone');
  const resumeText     = document.getElementById('resume-dropzone-text');
  const resumeStatus   = document.getElementById('resume-status');

  async function checkResumeStatus() {
    try {
      const res  = await fetch(`${BACKEND_URL}/resume/status`, { signal: AbortSignal.timeout(2000) });
      const data = await res.json();
      if (data.exists) {
        const kb = Math.round(data.sizeBytes / 1024);
        resumeDropzone.classList.add('has-file');
        resumeText.textContent = `✓ Resume uploaded (${kb} KB) — click to replace`;
        showResumePreview(data.preview);
      }
    } catch { /* backend offline */ }
  }

  function showResumePreview(preview) {
    if (!preview) return;
    resumeStatus.style.display = 'block';
    resumeStatus.className     = 'resume-status';
    resumeStatus.textContent   = `📄 Extracted: "${preview.slice(0, 120).trim()}…"`;
  }

  checkResumeStatus();

  resumeInput.addEventListener('change', async () => {
    const file = resumeInput.files[0];
    if (!file) return;
    resumeText.textContent     = '⏳ Uploading…';
    resumeStatus.style.display = 'none';
    resumeDropzone.classList.remove('has-file');
    const formData = new FormData();
    formData.append('resume', file);
    try {
      const res  = await fetch(`${BACKEND_URL}/resume`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      resumeDropzone.classList.add('has-file');
      resumeText.textContent = `✓ ${file.name} (${data.pages} page${data.pages > 1 ? 's' : ''}) — click to replace`;
      showResumePreview(data.preview);
    } catch (err) {
      console.error('Upload error:', err);
      resumeText.textContent     = 'Click to upload PDF resume';
      resumeStatus.style.display = 'block';
      resumeStatus.className     = 'resume-status error';
      
      let errorMsg = err.message;
      if (err.message === 'Failed to fetch') {
        errorMsg = 'Could not connect to backend. Please ensure "npm run dev" is running in the backend folder.';
      }
      resumeStatus.textContent   = `❌ ${errorMsg}`;
    }
    resumeInput.value = '';
  });

  // ─── Launch Panel Button ─────────────────────────────────────────────────────
  document.getElementById('launch-btn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes('linkedin.com')) {
      chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => {
        const fab = document.getElementById('reachai-fab');
        if (fab) fab.click();
      }});
      window.close();
    } else {
      chrome.tabs.create({ url: 'https://www.linkedin.com' });
    }
  });

  // ─── Cold Email Feature ───────────────────────────────────────────────────────
  checkBackendHealth();
  renderContactList();

  document.getElementById('email-add-btn').addEventListener('click', addContact);
  document.getElementById('email-send-all-btn').addEventListener('click', sendAllPending);

  // ─── Purpose Chip Selection ───────────────────────────────────────────────────
  let selectedPurpose = 'job';
  const chips = document.querySelectorAll('.purpose-chip');
  const customInput = document.getElementById('email-custom-purpose');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedPurpose = chip.dataset.purpose;
      customInput.style.display = selectedPurpose === 'custom' ? 'block' : 'none';
    });
  });

  // ─── Preview Modal State ──────────────────────────────────────────────────────
  let pendingContact     = null; // contact being previewed
  let pendingIsFollowup  = false;

  const overlay         = document.getElementById('preview-overlay');
  const previewLoading  = document.getElementById('preview-loading');
  const previewContent  = document.getElementById('preview-content');
  const previewFooter   = document.getElementById('preview-modal-footer');
  const previewSubject  = document.getElementById('preview-subject');
  const previewBodyEl   = document.getElementById('preview-body');
  const previewResNote  = document.getElementById('preview-resume-note');
  const sendBtn         = document.getElementById('preview-btn-send');

  function openPreviewModal() {
    overlay.classList.add('open');
    previewLoading.style.display  = 'flex';
    previewContent.style.display  = 'none';
    previewFooter.style.display   = 'none';
  }

  function showPreviewContent(subject, body, hasResume) {
    previewLoading.style.display       = 'none';
    previewContent.style.display       = 'block';
    previewFooter.style.display        = 'flex';
    previewSubject.value               = subject;
    previewBodyEl.value                = body;
    previewResNote.style.display       = hasResume ? 'block' : 'none';
  }

  function closePreviewModal() {
    overlay.classList.remove('open');
    pendingContact    = null;
    pendingIsFollowup = false;
  }

  document.getElementById('preview-close-btn').addEventListener('click', closePreviewModal);
  document.getElementById('preview-btn-cancel').addEventListener('click', closePreviewModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closePreviewModal(); });

  document.getElementById('preview-btn-send').addEventListener('click', async () => {
    if (!pendingContact) return;
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending…';
    // Use edited subject/body from the modal
    const editedSubject = previewSubject.value.trim();
    const editedBody    = previewBodyEl.value.trim();
    await doSendEmail(pendingContact, editedSubject, editedBody, pendingIsFollowup);
    closePreviewModal();
    sendBtn.disabled = false;
    sendBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg> Send Now`;
    await renderContactList();
  });

  // ─── Backend Health Check ─────────────────────────────────────────────────────
  async function checkBackendHealth() {
    const pill  = document.getElementById('email-backend-status');
    const label = document.getElementById('email-backend-text');
    try {
      const res = await fetch(`${BACKEND_URL.replace('/api', '')}/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        pill.className    = 'email-backend-pill ok';
        label.textContent = 'Backend connected';
      } else throw new Error();
    } catch {
      pill.className    = 'email-backend-pill err';
      label.textContent = 'Backend offline — run npm start';
    }
  }

  // ─── Load & Render Contacts from Firebase ────────────────────────────────────
  async function renderContactList() {
    const list  = document.getElementById('email-contact-list');
    const empty = document.getElementById('email-empty-state');
    list.querySelectorAll('.email-contact-card').forEach(c => c.remove());
    empty.textContent    = 'Loading…';
    empty.style.display  = 'block';

    try {
      const res = await fetch(`${BACKEND_URL}/contacts`);
      if (!res.ok) throw new Error('fetch failed');
      const contacts = await res.json();
      list.querySelectorAll('.email-contact-card').forEach(c => c.remove());

      if (contacts.length === 0) {
        empty.textContent = 'No contacts added yet. Add someone above! 📧';
        return;
      }
      empty.style.display = 'none';
      contacts.forEach(contact => list.appendChild(createContactCard(contact)));
    } catch {
      empty.textContent = '⚠ Could not load contacts — is backend running?';
    }
  }

  // ─── Create Contact Card ─────────────────────────────────────────────────────
  function createContactCard(contact) {
    const badgeLabel = {
      pending:        '⏳ Pending',
      sending:        '📤 Sending…',
      sent:           '✅ Sent',
      'followup-due': '🔔 Follow-up Due',
      done:           '✓ Done',
      error:          '❌ Error',
    }[contact.status] || '⏳ Pending';

    const isSent   = ['sent', 'sending', 'done'].includes(contact.status);
    const purpose  = contact.purpose || 'job';
    const purposeLabel = purpose === 'custom'
      ? (contact.customPurpose || 'Custom')
      : (PURPOSE_LABELS[purpose] || PURPOSE_LABELS.job);

    const card = document.createElement('div');
    card.className = `email-contact-card status-${contact.status || 'pending'}`;
    card.id = `card-${contact.id}`;
    card.innerHTML = `
      <div class="email-contact-top">
        <div class="email-contact-name">${contact.name || contact.email}</div>
        <span class="email-status-badge badge-${contact.status || 'pending'}">${badgeLabel}</span>
      </div>
      <div class="email-contact-meta">${contact.email}${contact.company ? ` · ${contact.company}` : ''}${contact.role ? ` · ${contact.role}` : ''}</div>
      <div style="margin-bottom:7px"><span class="purpose-chip active" style="font-size:10px;padding:2px 8px;cursor:default">${purposeLabel}</span></div>
      <div class="email-contact-actions">
        <button class="email-action-btn" id="send-btn-${contact.id}" ${isSent ? 'disabled' : ''}>
          ${contact.status === 'followup-due' ? '↩ Send Follow-up' : '👁 Preview & Send'}
        </button>
        <button class="email-action-btn danger" id="del-btn-${contact.id}">🗑 Remove</button>
      </div>
    `;
    card.querySelector(`#send-btn-${contact.id}`).addEventListener('click', () => {
      previewAndSend(contact, contact.status === 'followup-due');
    });
    card.querySelector(`#del-btn-${contact.id}`).addEventListener('click', () => deleteContact(contact.id));
    return card;
  }

  // ─── Add Contact to Firebase ──────────────────────────────────────────────────
  async function addContact() {
    const name    = document.getElementById('email-contact-name').value.trim();
    const email   = document.getElementById('email-contact-email').value.trim();
    const company = document.getElementById('email-contact-company').value.trim();
    const role    = document.getElementById('email-contact-role').value.trim();
    const purpose = selectedPurpose;
    const customPurpose = customInput.value.trim();

    if (!email) { alert('Email address is required.'); return; }

    let resolvedCompany = company;
    if (!resolvedCompany) {
      const domainRoot = (email.split('@')[1] || '').split('.')[0];
      resolvedCompany  = domainRoot.charAt(0).toUpperCase() + domainRoot.slice(1);
    }

    const btn = document.getElementById('email-add-btn');
    btn.disabled = true;
    btn.textContent = 'Adding…';

    try {
      const res = await fetch(`${BACKEND_URL}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, company: resolvedCompany, role, purpose, customPurpose }),
      });
      if (!res.ok) throw new Error('Failed to add contact');
      ['email-contact-name','email-contact-email','email-contact-company','email-contact-role'].forEach(id => {
        document.getElementById(id).value = '';
      });
      customInput.value = '';
      await renderContactList();
    } catch (err) {
      alert('Could not save contact. Is the backend running?');
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Add to Queue';
    }
  }

  // ─── Delete Contact ───────────────────────────────────────────────────────────
  async function deleteContact(contactId) {
    try {
      await fetch(`${BACKEND_URL}/contacts/${contactId}`, { method: 'DELETE' });
      chrome.runtime.sendMessage({ action: 'cancelFollowup', contactId });
      await renderContactList();
    } catch (err) { console.error('Delete error:', err); }
  }

  // ─── Preview → then Send ──────────────────────────────────────────────────────
  async function previewAndSend(contact, isFollowup = false) {
    pendingContact    = contact;
    pendingIsFollowup = isFollowup;
    openPreviewModal();

    const { userProfile } = await chrome.storage.sync.get(['userProfile']);
    const sender = userProfile || {};

    // Determine purpose text to send to backend
    const purposeText = contact.purpose === 'custom'
      ? contact.customPurpose
      : contact.purpose;

    try {
      const genRes = await fetch(`${BACKEND_URL}/generate-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName:    contact.name,
          recipientCompany: contact.company,
          recipientRole:    contact.role,
          senderName:       sender.name,
          senderSkills:     sender.valueProposition,
          senderExperience: sender.role,
          purpose:          purposeText,
          isFollowup,
        }),
      });
      if (!genRes.ok) throw new Error('Generation failed');
      const { subject, body } = await genRes.json();

      // Check if resume exists
      let hasResume = false;
      try {
        const rs = await fetch(`${BACKEND_URL}/resume/status`);
        const rd = await rs.json();
        hasResume = rd.exists;
      } catch { /* ignore */ }

      showPreviewContent(subject, body, hasResume);

    } catch (err) {
      closePreviewModal();
      alert(`Could not generate email: ${err.message}`);
      console.error(err);
    }
  }

  // ─── Actually Send the Email (called from modal confirm) ─────────────────────
  async function doSendEmail(contact, subject, body, isFollowup) {
    await patchContact(contact.id, { status: 'sending' });

    try {
      const sendRes = await fetch(`${BACKEND_URL}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail: contact.email, toName: contact.name, subject, body }),
      });
      if (!sendRes.ok) throw new Error('SES send failed');

      const now       = Date.now();
      const newStatus = isFollowup ? 'done' : 'sent';
      const updates   = { status: newStatus };
      if (!isFollowup) updates.sentAt        = now;
      else             updates.followupSentAt = now;
      await patchContact(contact.id, updates);

      if (!isFollowup) {
        chrome.runtime.sendMessage({ action: 'scheduleFollowup', contactId: contact.id, contactName: contact.name || contact.email });
        const { alarmContacts = {} } = await chrome.storage.local.get(['alarmContacts']);
        alarmContacts[contact.id] = { name: contact.name || contact.email, company: contact.company, email: contact.email };
        await chrome.storage.local.set({ alarmContacts });
      }
    } catch (err) {
      console.error('Send error:', err);
      await patchContact(contact.id, { status: 'error' });
    }
  }

  // ─── Send All Pending ─────────────────────────────────────────────────────────
  async function sendAllPending() {
    const btn = document.getElementById('email-send-all-btn');
    try {
      const res      = await fetch(`${BACKEND_URL}/contacts`);
      const contacts = await res.json();
      const pending  = contacts.filter(c => c.status === 'pending');

      if (pending.length === 0) { alert('No pending contacts!'); return; }

      // For "send all" — show preview for each one sequentially
      // First confirm with user
      if (!confirm(`Preview and send to ${pending.length} contact(s) one by one?`)) return;

      btn.disabled = true;
      for (let i = 0; i < pending.length; i++) {
        btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg> ${i + 1}/${pending.length}…`;
        await previewAndSend(pending[i], false);
        // Wait for user to close the modal before moving to next
        await new Promise(resolve => {
          const interval = setInterval(() => {
            if (!overlay.classList.contains('open')) {
              clearInterval(interval);
              resolve();
            }
          }, 300);
        });
        if (i < pending.length - 1) await new Promise(r => setTimeout(r, 500));
      }
    } catch (err) {
      alert('Could not load contacts. Is the backend running?');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg> Send All Pending`;
      await renderContactList();
    }
  }

  // ─── Helper: PATCH contact ────────────────────────────────────────────────────
  async function patchContact(id, updates) {
    try {
      await fetch(`${BACKEND_URL}/contacts/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(updates),
      });
    } catch (err) { console.error('patchContact error:', err); }
  }

});
