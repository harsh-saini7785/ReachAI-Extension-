// ReachAI Background Service Worker

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
});

// On install, open the settings page
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.action.openPopup().catch(() => {
      // Popup can't be opened programmatically in all contexts
    });
  }
});
