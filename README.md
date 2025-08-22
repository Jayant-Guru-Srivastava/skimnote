SkimNote — Highlight to Notes (MV3)

A minimal working scaffold for the SkimNote Chrome extension. Select text and use the inline toolbar to save a highlight; reload to see highlights re‑applied. Toggle a basic annotate mode to free‑draw. Use the options page as a simple library to search and export/import notes.

Load unpacked

1. Open chrome://extensions
2. Enable Developer mode
3. Click "Load unpacked" and select this folder

Included features

- Inline toolbar: Highlight, Add Note
- Saves: url, title, timestamps, and TextQuote/TextPosition selectors
- Re-applies visual highlights on load
- Sidebar (Alt+S) with search and per‑page notes
- Quick Note composer (Alt+N) bottom-right
- Annotate Mode (Alt+E) for free‑draw on overlay canvas
- Options page: search, export/import

Files

- manifest.json — MV3 manifest with commands and permissions
- content.js — UI injection, selection capture, sidebar, quick note, annotate mode
- sw.js — background service worker for storage and commands
- popup.html — quick toggles
- options.html, options.js — simple library

Notes

- Data is stored in chrome.storage.local under key skimnote.notes
- Overlays are in-memory only in this scaffold; persist to IndexedDB in future
- For robustness across dynamic pages, improve anchoring beyond this minimal demo


# skimnote
