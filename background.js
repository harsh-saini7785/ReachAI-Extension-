// ReachAI Background Service Worker

// ─── Message Handler ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openSettings') {
    chrome.action.openPopup();
  }

  if (message.action === 'incrementStat') {
    chrome.storage.sync.get(['stats'], (result) => {
      const stats = result.stats || { generated: 0, copied: 0 };
      if (message.stat === 'generated') stats.generated++;
      if (message.stat === 'copied') stats.copied++;
      chrome.storage.sync.set({ stats });
    });
  }

  // Schedule a follow-up alarm 7 days after email is sent
  if (message.action === 'scheduleFollowup') {
    const { contactId, contactName } = message;
    const alarmName = `followup-${contactId}`;
    const delayInMinutes = 7 * 24 * 60; // 7 days in minutes

    chrome.alarms.create(alarmName, { delayInMinutes });
    console.log(`⏰ Follow-up alarm set for "${contactName}" in 7 days.`);
    sendResponse({ success: true, alarmName });
  }

  // Cancel a follow-up alarm (e.g. if contact is deleted)
  if (message.action === 'cancelFollowup') {
    const { contactId } = message;
    chrome.alarms.clear(`followup-${contactId}`);
    sendResponse({ success: true });
  }

  return true; // Keep message channel open for async
});

// ─── Alarm Fired → Show Follow-up Notification ────────────────────────────────
chrome.alarms.onAlarm.addListener((alarm) => {
  if (!alarm.name.startsWith('followup-')) return;

  const contactId = alarm.name.replace('followup-', '');

  // Minimal contact cache written by popup.js { id: { name, company, email } }
  chrome.storage.local.get(['alarmContacts'], (result) => {
    const cache   = result.alarmContacts || {};
    const contact = cache[contactId];
    if (!contact) return;

    // Show browser notification
    chrome.notifications.create(`notif-${contactId}`, {
      type:     'basic',
      iconUrl:  'icons/icon48.png',
      title:    '📧 Time to Follow Up!',
      message:  `It's been a week since you emailed ${contact.name || contact.email} at ${contact.company}. Send a follow-up?`,
      priority: 2,
      buttons:  [{ title: 'Open ReachAI' }],
    });
  });
});

// ─── Notification Click → Open Popup ─────────────────────────────────────────
chrome.notifications.onButtonClicked.addListener((notifId) => {
  chrome.action.openPopup().catch(() => {});
});

chrome.notifications.onClicked.addListener((notifId) => {
  chrome.action.openPopup().catch(() => {});
});

// ─── On Install ───────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.action.openPopup().catch(() => {});
  }
});
