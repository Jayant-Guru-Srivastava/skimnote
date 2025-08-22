const KEY = 'skimnote.notes';

async function getAll() {
  return new Promise(res => chrome.storage.local.get(KEY, o => res(o[KEY] || [])));
}
async function setAll(notes) {
  return new Promise(res => chrome.storage.local.set({ [KEY]: notes }, res));
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'sk_highlight', title: 'SkimNote: Save Highlight', contexts: ['selection'] });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'sk_highlight' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'SK_CONTEXT_SAVE' });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === 'SK_SAVE_NOTE') {
      const notes = await getAll();
      notes.push(msg.payload);
      await setAll(notes);
      sendResponse({ ok: true });
      return;
    }
    if (msg.type === 'SK_UPDATE_NOTE') {
      const notes = await getAll();
      const idx = notes.findIndex(n => n.id === msg.payload?.id);
      if (idx !== -1) {
        notes[idx] = { ...notes[idx], ...msg.payload, updatedAt: Date.now() };
        await setAll(notes);
        sendResponse({ ok: true, note: notes[idx] });
      } else {
        sendResponse({ ok: false });
      }
      return;
    }
    if (msg.type === 'SK_DELETE_NOTE') {
      const notes = await getAll();
      const next = notes.filter(n => n.id !== msg.id);
      await setAll(next);
      sendResponse({ ok: true });
      return;
    }
    if (msg.type === 'SK_GET_NOTES_FOR_URL') {
      const notes = await getAll();
      const out = notes.filter(n => (n.url || '').split('#')[0] === (msg.url || '').split('#')[0]);
      sendResponse(out);
      return;
    }
    if (msg.type === 'SK_GET_ALL_NOTES') {
      const notes = await getAll();
      sendResponse(notes);
      return;
    }
  })();
  return true; // async
});

// Keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab?.id) return;
  if (command === 'toggle_sidebar') chrome.tabs.sendMessage(tab.id, { type: 'SK_TOGGLE_SIDEBAR' });
  if (command === 'toggle_annotate') chrome.tabs.sendMessage(tab.id, { type: 'SK_TOGGLE_ANNOTATE' });
  if (command === 'save_highlight') chrome.tabs.sendMessage(tab.id, { type: 'SK_CONTEXT_SAVE' });
  if (command === 'quick_note') chrome.tabs.sendMessage(tab.id, { type: 'SK_QUICK_NOTE' });
  if (command === 'jump_next_highlight') chrome.tabs.sendMessage(tab.id, { type: 'SK_JUMP_NEXT' });
});


