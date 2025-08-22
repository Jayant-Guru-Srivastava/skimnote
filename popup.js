const withTab = (cb) => chrome.tabs.query({ active: true, lastFocusedWindow: true }, ([t]) => cb(t));

function canAccess(url) {
  return url && (url.startsWith('http') || url.startsWith('https') || url.startsWith('file:'));
}

function sendOrInject(tab, msg) {
  if (!canAccess(tab.url)) {
    alert('SkimNote cannot run on this page (chrome:// or restricted). Open a regular web page.');
    return;
  }
  chrome.tabs.sendMessage(tab.id, msg, () => {
    if (chrome.runtime.lastError) {
      chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }, () => {
        chrome.tabs.sendMessage(tab.id, msg);
      });
    }
  });
}

// Detect operating system and update keyboard shortcuts
function updateKeyboardShortcuts() {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  if (isMac) {
    // Use Option key combinations for Mac with non-conflicting keys
    document.getElementById('sidebar-kbd').textContent = '⌥K';
    document.getElementById('annotate-kbd').textContent = '⌥A';
    document.getElementById('quicknote-kbd').textContent = '⌥Q';
    document.getElementById('highlight-kbd').textContent = '⌥H';
  } else {
    // Use Ctrl+Shift combinations for Windows/Linux with non-conflicting keys
    document.getElementById('sidebar-kbd').textContent = 'Ctrl+Shift+K';
    document.getElementById('annotate-kbd').textContent = 'Ctrl+Shift+A';
    document.getElementById('quicknote-kbd').textContent = 'Ctrl+Shift+Q';
    document.getElementById('highlight-kbd').textContent = 'Ctrl+Shift+H';
  }
}

// Initialize shortcuts when popup loads
document.addEventListener('DOMContentLoaded', updateKeyboardShortcuts);

document.getElementById('sidebar').onclick = () => withTab(t => sendOrInject(t, { type: 'SK_TOGGLE_SIDEBAR' }));
document.getElementById('annotate').onclick = () => withTab(t => sendOrInject(t, { type: 'SK_TOGGLE_ANNOTATE' }));
document.getElementById('quicknote').onclick = () => withTab(t => sendOrInject(t, { type: 'SK_QUICK_NOTE' }));


