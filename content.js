const BUS = "__SKIMNOTE_BUS__";

// Extension loading indicator
console.log('🔥 SkimNote content script loading...');
window.SKIMNOTE_LOADED = true;

// Simple test function available immediately
window.testSkimNote = () => {
  console.log('✅ SkimNote extension is loaded and working!');
  return 'SkimNote is active';
};

// Inject global CSS to ensure highlights are always visible
function injectHighlightCSS() {
  const cssId = 'skimnote-highlight-css';
  if (document.getElementById(cssId)) return;
  
  const style = document.createElement('style');
  style.id = cssId;
  style.textContent = `
    /* SkimNote Highlight Styles - Maximum Specificity */
    span[data-skimnote-highlight="true"],
    .skimnote-highlight,
    span.skimnote-highlight,
    *[data-skimnote-color] {
      background-color: var(--skimnote-bg, #ffff00) !important;
      background: var(--skimnote-bg, #ffff00) !important;
      background-image: none !important;
      color: #000 !important;
      border: 2px solid var(--skimnote-border, #ffff00) !important;
      border-radius: 3px !important;
      padding: 1px 2px !important;
      margin: 0 !important;
      display: inline !important;
      opacity: 1 !important;
      visibility: visible !important;
      text-decoration: underline !important;
      text-decoration-color: #000 !important;
      text-decoration-thickness: 2px !important;
      box-shadow: 0 0 0 1px #000 !important;
      position: relative !important;
      z-index: 9999 !important;
      font-weight: bold !important;
      min-height: 1em !important;
      line-height: inherit !important;
      pointer-events: auto !important;
    }
    
    /* Color-specific overrides for traditional highlights */
    span[data-skimnote-color="yellow"] { --skimnote-bg: #ffff00; --skimnote-border: #ffff00; }
    span[data-skimnote-color="pink"] { --skimnote-bg: #ff69b4; --skimnote-border: #ff69b4; }
    span[data-skimnote-color="green"] { --skimnote-bg: #32cd32; --skimnote-border: #32cd32; }
    span[data-skimnote-color="blue"] { --skimnote-bg: #1e90ff; --skimnote-border: #1e90ff; }
    span[data-skimnote-color="purple"] { --skimnote-bg: #9370db; --skimnote-border: #9370db; }
    span[data-skimnote-color="orange"] { --skimnote-bg: #ff8c00; --skimnote-border: #ff8c00; }
    
    /* Overlay highlight styles - consistent with traditional highlights */
    .skimnote-overlay-highlight {
      background-color: var(--skimnote-bg, #ffff00) !important;
      background: var(--skimnote-bg, #ffff00) !important;
      border: 2px solid var(--skimnote-border, #ffff00) !important;
      border-radius: 3px !important;
      opacity: 1 !important;
      box-shadow: 0 0 0 1px #000 !important;
      pointer-events: none !important;
      z-index: 9999 !important;
    }
    
    /* Color-specific overrides for overlay highlights */
    .skimnote-overlay-highlight[data-skimnote-color="yellow"] { --skimnote-bg: #ffff00; --skimnote-border: #ffff00; }
    .skimnote-overlay-highlight[data-skimnote-color="pink"] { --skimnote-bg: #ff69b4; --skimnote-border: #ff69b4; }
    .skimnote-overlay-highlight[data-skimnote-color="green"] { --skimnote-bg: #32cd32; --skimnote-border: #32cd32; }
    .skimnote-overlay-highlight[data-skimnote-color="blue"] { --skimnote-bg: #1e90ff; --skimnote-border: #1e90ff; }
    .skimnote-overlay-highlight[data-skimnote-color="purple"] { --skimnote-bg: #9370db; --skimnote-border: #9370db; }
    .skimnote-overlay-highlight[data-skimnote-color="orange"] { --skimnote-bg: #ff8c00; --skimnote-border: #ff8c00; }
  `;
  
  // Insert at the end of head to maximize specificity
  (document.head || document.documentElement).appendChild(style);
}

// 1) Shadow root host for UI (toolbar + sidebar + composer)
function ensureUI(){
  console.log('SkimNote: ensureUI() called');
  
  let host = document.getElementById("skimnote-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "skimnote-host";
    Object.assign(host.style, { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 2147483647 });
    document.documentElement.appendChild(host);
    console.log('SkimNote: Created host element');
  }
  
  const shadow = host.shadowRoot || host.attachShadow({ mode: "open" });
  if (!shadow.getElementById('toolbar')){
    console.log('SkimNote: Creating shadow DOM content');
    shadow.innerHTML = `<style>
    :host{ all: initial }
    .toolbar{ 
      position: fixed !important; 
      background: rgba(17, 17, 17, 0.95) !important; 
      color: #fff !important; 
      border-radius: 10px !important; 
      padding: 8px 12px !important; 
      font: 12px/1.4 system-ui !important; 
      display: none; 
      gap: 8px !important; 
      align-items: center !important; 
      backdrop-filter: blur(6px) !important; 
      box-shadow: 0 6px 24px rgba(0,0,0,0.3) !important;
      z-index: 2147483647 !important;
      pointer-events: auto !important;
      border: 1px solid rgba(255,255,255,0.2) !important;
      transform: translateZ(0); /* ensure on top in some stacking contexts */
    }
    .btn{ 
      background: #fff !important; 
      color: #111 !important; 
      border-radius: 8px !important; 
      padding: 6px 12px !important; 
      cursor: pointer !important; 
      border: none !important; 
      font-size: 12px !important;
      font-weight: 500 !important;
      transition: all 0.2s ease !important;
    }
    .btn:hover{ 
      filter: brightness(0.96) !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
    }
    .sidebar{ position:fixed; right:0; top:0; height:100vh; width:360px; background:#fff; border-left:1px solid #ddd; box-shadow:-8px 0 24px #0001; z-index:2147483647; padding:12px; display:none; pointer-events:auto; color:#111; }
    .tabbar{ display:flex; gap:6px; margin:0 0 8px }
    .tab{ padding:6px 10px; border-radius:8px; border:1px solid #eee; cursor:pointer; }
    .tab.active{ background:#111; color:#fff; border-color:#111 }
    .composer{ position:fixed; right:16px; bottom:16px; width:320px; background:#fff; border:1px solid #e5e5e5; box-shadow:0 10px 30px #0002; border-radius:12px; display:none; pointer-events:auto; overflow:hidden; }
    .composer-header{ padding:8px 10px; font:600 13px system-ui; background:#f7f7f7; border-bottom:1px solid #eee; }
    .composer-text{ width:100%; height:120px; border:0; outline:none; resize:vertical; padding:10px; font:14px/1.5 system-ui; }
    .composer-actions{ display:flex; justify-content:flex-end; gap:8px; padding:8px; }
    .chip{ display:inline-flex; align-items:center; gap:6px; font:12px system-ui; padding:6px 8px; background:#f5f5f5; border-radius:999px; }
    .noteItem{ padding:8px; border:1px solid #eee; border-radius:10px; margin:8px 0 }
    .row{ display:flex; align-items:center; justify-content:space-between; gap:8px }
    .muted{ opacity:.65 }
    .colors{ display:flex; gap:6px }
    .dot{ width:16px; height:16px; border-radius:50%; border:1px solid #0002; cursor:pointer }
    .fab{ position:fixed; bottom:16px; right:16px; width:40px; height:40px; border-radius:50%; background:#111; color:#fff; display:flex; align-items:center; justify-content:center; box-shadow:0 10px 30px #0003; cursor:pointer; pointer-events:auto; }
  </style>
  <div id="toolbar" class="toolbar">
    <button class="btn" id="btnSave">💡 Highlight</button>
    <button class="btn" id="btnNote">📝 Add Note</button>
  </div>
  <div id="sidebar" class="sidebar">
    <h3 style="margin:0 0 8px;font:600 16px system-ui">SkimNote</h3>
    <div class="tabbar">
      <div id="tabPage" class="tab active">Page</div>
      <div id="tabAll" class="tab">All</div>
    </div>
    <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px">
      <input id="search" placeholder="Search..." style="flex:1; padding:8px 10px; border:1px solid #ddd; border-radius:8px; font: 13px system-ui"/>
      <span class="chip" id="countChip">0</span>
    </div>
    <div id="listPage" style="font: 13px/1.5 system-ui; overflow:auto; height: calc(100vh - 128px)"></div>
    <div id="listAll" style="display:none; font: 13px/1.5 system-ui; overflow:auto; height: calc(100vh - 128px)"></div>
  </div>
  <div id="composer" class="composer">
    <div class="composer-header">Quick Note</div>
    <textarea id="composerText" class="composer-text" placeholder="Type your note..."></textarea>
    <div class="composer-actions">
      <button class="btn" id="composerSave">Save</button>
      <button class="btn" id="composerCancel">Cancel</button>
    </div>
  </div>
  <div id="fab" class="fab" title="SkimNote Sidebar">S</div>`;
    
    const btnSave = shadow.getElementById("btnSave");
    const btnNote = shadow.getElementById("btnNote");
    const fab = shadow.getElementById('fab');
    const toolbarEl = shadow.getElementById('toolbar');
    
    if (btnSave) {
      btnSave.addEventListener("click", (e) => { 
        e.preventDefault(); 
        e.stopPropagation(); 
        console.log('SkimNote: Highlight button clicked');
        saveSelection(); 
      });
    }
    
    if (btnNote) {
      btnNote.addEventListener("click", (e) => { 
        e.preventDefault(); 
        e.stopPropagation(); 
        console.log('SkimNote: Add Note button clicked');
        saveSelection({ withNote: true }); 
      });
    }
    
    shadow.addEventListener("mousedown", e => e.stopPropagation(), true);
    // Keep page selection intact when interacting with toolbar
    if (toolbarEl) {
      toolbarEl.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
    }
    
    if (fab) {
      fab.addEventListener('click', () => toggleSidebar());
    }
    
    console.log('SkimNote: UI elements created and event listeners attached');
  }
  window.__skimnoteShadow = shadow;
  
  // Verify toolbar element exists
  const toolbar = shadow.getElementById('toolbar');
  if (toolbar) {
    console.log('SkimNote: Toolbar element confirmed to exist');
  } else {
    console.error('SkimNote: Toolbar element not found after creation!');
  }
}

// Initialize the extension
injectHighlightCSS();
ensureUI();
let isSelecting = false;
let lastSelectionRange = null;

// Debug function to manually test toolbar (can be called from console)
// Available immediately even if other parts fail to load
window.skimNoteDebug = {
  testToolbar: () => {
    console.log('SkimNote: Manual toolbar test');
    try {
      const sel = window.getSelection();
      console.log('Current selection:', {
        exists: !!sel,
        isCollapsed: sel?.isCollapsed,
        rangeCount: sel?.rangeCount,
        text: sel?.toString()?.substring(0, 50)
      });
      
      if (typeof showToolbar === 'function') {
        if (sel && !sel.isCollapsed) {
          showToolbar();
        } else {
          console.log('SkimNote: No selection to show toolbar for');
        }
      } else {
        console.error('SkimNote: showToolbar function not available');
      }
    } catch (e) {
      console.error('SkimNote: Error in testToolbar:', e);
    }
  },
  
  forceShowToolbar: () => {
    console.log('SkimNote: Force showing toolbar');
    try {
      if (typeof ensureUI === 'function') {
        ensureUI();
      }
      const tb = window.__skimnoteShadow && window.__skimnoteShadow.getElementById("toolbar");
      if (tb) {
        tb.style.left = '100px';
        tb.style.top = '100px';
        tb.style.display = 'flex';
        tb.style.position = 'fixed';
        tb.style.zIndex = '2147483647';
        console.log('SkimNote: Toolbar forced to show at 100px, 100px');
      } else {
        console.error('SkimNote: Could not find toolbar element');
      }
    } catch (e) {
      console.error('SkimNote: Error in forceShowToolbar:', e);
    }
  },
  
  checkShadow: () => {
    console.log('SkimNote: Shadow DOM check:', {
      shadowExists: !!window.__skimnoteShadow,
      hostExists: !!document.getElementById('skimnote-host'),
      toolbarExists: !!(window.__skimnoteShadow && window.__skimnoteShadow.getElementById('toolbar')),
      extensionLoaded: !!window.SKIMNOTE_LOADED,
      functions: {
        ensureUI: typeof ensureUI,
        showToolbar: typeof showToolbar,
        hideToolbar: typeof hideToolbar
      }
    });
  },
  
  reinitialize: () => {
    console.log('SkimNote: Attempting to reinitialize extension');
    try {
      injectHighlightCSS();
      ensureUI();
      console.log('SkimNote: Reinitialization complete');
    } catch (e) {
      console.error('SkimNote: Error during reinitialization:', e);
    }
  }
};

console.log('📋 SkimNote debug functions loaded. Try: window.skimNoteDebug.checkShadow()');

// Bridge: allow page context to call debug via window.postMessage
try {
  window.addEventListener('message', (event) => {
    try {
      if (event.source !== window) return;
      const data = event.data;
      if (!data || data.type !== 'SKIMNOTE_DEBUG') return;
      const command = data.command;
      let result = null;
      if (command === 'ping') {
        result = { ok: true, ts: Date.now() };
      } else if (command === 'checkShadow') {
        result = {
          shadowExists: !!window.__skimnoteShadow,
          hostExists: !!document.getElementById('skimnote-host'),
          toolbarExists: !!(window.__skimnoteShadow && window.__skimnoteShadow.getElementById('toolbar')),
          extensionLoaded: !!window.SKIMNOTE_LOADED,
          functions: {
            ensureUI: typeof ensureUI,
            showToolbar: typeof showToolbar,
            hideToolbar: typeof hideToolbar
          }
        };
      } else if (command === 'testToolbar') {
        window.skimNoteDebug?.testToolbar?.();
        result = { invoked: true };
      } else if (command === 'forceShowToolbar') {
        window.skimNoteDebug?.forceShowToolbar?.();
        result = { invoked: true };
      } else if (command === 'reinitialize') {
        window.skimNoteDebug?.reinitialize?.();
        result = { invoked: true };
      }
      window.postMessage({ type: 'SKIMNOTE_DEBUG_RESULT', command, result }, '*');
    } catch (e) {
      try { window.postMessage({ type: 'SKIMNOTE_DEBUG_RESULT', command: event?.data?.command, error: String(e) }, '*'); } catch {}
    }
  });
} catch {}

function showMiniNotice(text){
  try{
    ensureUI();
    const sh = window.__skimnoteShadow;
    let note = sh.getElementById('sn-mini-note');
    if (!note){
      note = document.createElement('div');
      note.id = 'sn-mini-note';
      Object.assign(note.style, { position:'fixed', bottom:'16px', left:'16px', background:'#111', color:'#fff', padding:'8px 10px', borderRadius:'8px', boxShadow:'0 8px 24px #0005', zIndex:2147483647, pointerEvents:'auto', font:'12px system-ui' });
      sh.appendChild(note);
    }
    note.textContent = text;
    note.style.opacity = '0.95';
    clearTimeout(note.__t);
    note.__t = setTimeout(()=>{ note.style.opacity='0'; }, 3000);
  } catch {}
}

function sendMessageSafe(message, callback){
  try{
    chrome.runtime.sendMessage(message, (resp)=>{
      const err = chrome.runtime.lastError;
      if (err && /context invalidated/i.test(err.message)) {
        showMiniNotice('SkimNote updated. Please refresh this tab.');
        return;
      }
      if (callback) callback(resp);
    });
  } catch(e){
    showMiniNotice('SkimNote updated. Please refresh this tab.');
  }
}

// 2) Show inline toolbar near selection
function showToolbar() {
  console.log('SkimNote: showToolbar() called');
  
  if (!window.__skimnoteShadow) { 
    console.log('SkimNote: Shadow DOM not found, ensuring UI');
    ensureUI(); 
  }
  
  const sel = window.getSelection();
  console.log('SkimNote: Selection:', { 
    exists: !!sel, 
    isCollapsed: sel?.isCollapsed, 
    rangeCount: sel?.rangeCount,
    selectedText: sel?.toString()?.substring(0, 50) 
  });
  
  const tb = window.__skimnoteShadow && window.__skimnoteShadow.getElementById("toolbar");
  if (!tb) { 
    console.warn('SkimNote: Toolbar element not found, ensuring UI');
    ensureUI(); 
    return; 
  }
  
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) { 
    console.log('SkimNote: No valid selection, hiding toolbar');
    tb.style.display = "none"; 
    return; 
  }
  
  const range = sel.getRangeAt(0);
  try { lastSelectionRange = range.cloneRange(); } catch {}
  
  let rect = range.getBoundingClientRect();
  console.log('SkimNote: Selection rect:', { 
    width: rect?.width, 
    height: rect?.height, 
    top: rect?.top, 
    left: rect?.left 
  });
  
  if (!rect || (!rect.width && !rect.height)) {
    const rects = range.getClientRects();
    if (rects && rects.length) {
      rect = rects[0];
      console.log('SkimNote: Using first client rect:', { 
        width: rect.width, 
        height: rect.height, 
        top: rect.top, 
        left: rect.left 
      });
    }
  }
  
  if (!rect || (!rect.width && !rect.height)) {
    console.warn('SkimNote: No valid rectangle found for selection');
    return;
  }
  
  // Temporarily make visible to measure size
  const prevDisplay = tb.style.display;
  const prevVisibility = tb.style.visibility;
  tb.style.setProperty('display', 'flex', 'important');
  tb.style.setProperty('visibility', 'hidden', 'important');
  const tbWidth = tb.offsetWidth || 160;
  const tbHeight = tb.offsetHeight || 40;
  
  // Compute position in viewport coordinates (position: fixed)
  let topPx = rect.top - tbHeight - 8;
  if (topPx < 8) topPx = rect.bottom + 8;
  let leftPx = rect.left + (rect.width / 2) - (tbWidth / 2);
  leftPx = Math.max(8, Math.min(leftPx, window.innerWidth - tbWidth - 8));
  
  console.log('SkimNote: Positioning toolbar at:', { leftPx, topPx, tbWidth, tbHeight });
  
  // Apply final styles
  tb.style.setProperty('left', `${leftPx}px`, 'important');
  tb.style.setProperty('top', `${topPx}px`, 'important');
  tb.style.setProperty('display', 'flex', 'important');
  tb.style.setProperty('pointer-events', 'auto', 'important');
  tb.style.setProperty('position', 'fixed', 'important');
  tb.style.setProperty('z-index', '2147483647', 'important');
  tb.style.setProperty('visibility', 'visible', 'important');
  
  console.log('SkimNote: Toolbar should now be visible');
}

function isEventInSkimnote(evt){
  try {
    const host = document.getElementById('skimnote-host');
    if (!host) return false;
    const path = typeof evt.composedPath === 'function' ? evt.composedPath() : [];
    return path.includes(host);
  } catch { return false; }
}

if (!window.__skimnotePointerInit){
  document.addEventListener('pointerdown', (e) => { 
    if (isEventInSkimnote(e)) return; 
    console.log('SkimNote: pointerdown - starting selection');
    isSelecting = true; 
    hideToolbar(); 
  }, true);
  
  document.addEventListener('pointerup', (e) => { 
    if (isEventInSkimnote(e)) return; 
    console.log('SkimNote: pointerup - ending selection');
    isSelecting = false; 
    setTimeout(() => {
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
        console.log('SkimNote: pointerup with valid selection, showing toolbar');
        showToolbar();
      }
    }, 50); 
  }, true);
  
  window.__skimnotePointerInit = true;
}

function hideToolbar(){
  const tb = window.__skimnoteShadow && window.__skimnoteShadow.getElementById('toolbar');
  if (tb) tb.style.setProperty('display', 'none', 'important');
}

if (!window.__skimnoteSelectionInit){
  let selectionTimeout;
  
  // Main selection change handler
  document.addEventListener('selectionchange', () => {
    clearTimeout(selectionTimeout);
    selectionTimeout = setTimeout(() => {
      console.log('SkimNote: selectionchange event fired');
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) { 
        console.log('SkimNote: Selection collapsed, hiding toolbar');
        hideToolbar(); 
        return; 
      }
      if (!isSelecting) {
        console.log('SkimNote: Selection exists and not actively selecting, showing toolbar');
        showToolbar();
      } else {
        console.log('SkimNote: Currently selecting, will show toolbar after selection ends');
      }
    }, 10); // Reduced timeout for faster response
  }, true);
  
  // Alternative mouseup handler as backup
  document.addEventListener('mouseup', (e) => {
    if (isEventInSkimnote(e)) return;
    setTimeout(() => {
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
        console.log('SkimNote: mouseup detected with selection, showing toolbar');
        showToolbar();
      }
    }, 50);
  }, true);
  
  document.addEventListener('scroll', () => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && !isSelecting) showToolbar(); else hideToolbar();
  }, true);
  window.addEventListener('scroll', () => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && !isSelecting) showToolbar();
  }, { passive: true });
  window.addEventListener('resize', () => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && !isSelecting) showToolbar();
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.shiftKey || e.key.startsWith('Arrow')) {
      setTimeout(() => {
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed) {
          console.log('SkimNote: Keyboard selection detected, showing toolbar');
          showToolbar();
        }
      }, 100);
    }
  }, true);
  
  document.addEventListener('mousedown', (e) => {
    const rootHost = document.getElementById('skimnote-host');
    if (!rootHost || !rootHost.contains(e.target)) hideToolbar();
  }, true);
  
  // Force check after DOM mutations that might affect selection visibility
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => {
      if (!isSelecting) {
        setTimeout(() => {
          const sel = window.getSelection();
          if (sel && !sel.isCollapsed) showToolbar();
        }, 50);
      }
    });
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }
  
  window.__skimnoteSelectionInit = true;
}

// 3) Create robust selectors (TextQuote + TextPosition)
function makeSelectors(range) {
  const exact = range.toString();
  const text = (document.body && document.body.innerText) || document.documentElement.innerText || "";
  const start = text.indexOf(exact);
  const tq = { type: 'TextQuoteSelector', exact, prefix: exact.slice(0, 0), suffix: exact.slice(-0) };
  const tp = start >= 0 ? { type: 'TextPositionSelector', start, end: start + exact.length } : null;
  return { selectors: tp ? [tq, tp] : [tq] };
}

// 4) Visually wrap selection; if surroundContents fails (split nodes), fallback to CSS approach per text range
function colorToRgba(color){
  switch((color||'yellow')){
    case 'pink': return '#ff69b4';
    case 'green': return '#32cd32';
    case 'blue': return '#1e90ff';
    case 'purple': return '#9370db';
    case 'orange': return '#ff8c00';
    default: return '#ffd600';
  }
}
// Semi-transparent color used for non-destructive overlay so text remains readable
function overlayFillRgba(color){
  // Use mid opacity to keep text readable with blend mode
  switch((color||'yellow')){
    case 'pink': return 'rgba(255,105,180,0.55)';
    case 'green': return 'rgba(50,205,50,0.55)';
    case 'blue': return 'rgba(30,144,255,0.55)';
    case 'purple': return 'rgba(147,112,219,0.55)';
    case 'orange': return 'rgba(255,140,0,0.55)';
    default: return 'rgba(255,214,0,0.55)';
  }
}
function applyHighlightStyle(span, color){
  const colorVal = colorToRgba(color);
  
  // Set data attributes for identification
  span.setAttribute('data-skimnote-color', color);
  span.className = 'skimnote-highlight';
  span.setAttribute('data-skimnote-highlight', 'true');
  
  // Apply styles using multiple methods for maximum compatibility
  const styleStr = `
    background: ${colorVal} !important;
    background-color: ${colorVal} !important;
    background-image: none !important;
    color: #000 !important;
    border: 2px solid ${colorVal} !important;
    border-radius: 3px !important;
    padding: 1px 2px !important;
    margin: 0 !important;
    display: inline !important;
    opacity: 1 !important;
    visibility: visible !important;
    text-decoration: underline !important;
    text-decoration-color: #000 !important;
    text-decoration-thickness: 2px !important;
    box-shadow: 0 0 0 1px #000 !important;
    position: relative !important;
    z-index: 9999 !important;
    font-weight: bold !important;
    min-height: 1em !important;
    line-height: inherit !important;
  `;
  
  // Set style attribute
  span.setAttribute('style', styleStr);
  
  // Also set individual CSS properties as backup
  const props = [
    ['background-color', colorVal],
    ['border', `2px solid ${colorVal}`],
    ['color', '#000'],
    ['opacity', '1'],
    ['visibility', 'visible'],
    ['display', 'inline'],
    ['position', 'relative'],
    ['z-index', '9999']
  ];
  
  for (const [prop, value] of props) {
    try {
      span.style.setProperty(prop, value, 'important');
    } catch (e) {
      console.warn('Failed to set style property:', prop, value, e);
    }
  }
  
  // Force a reflow to ensure styles are applied
  span.offsetHeight;
}

function getTextNodesIntersectingRange(range){
  const root = range.commonAncestorContainer;
  const selectedText = range.toString();
  
  console.log(`SkimNote: Looking for text nodes in range:`, {
    selectedText: selectedText.substring(0, 100) + (selectedText.length > 100 ? '...' : ''),
    root: root.nodeName,
    startContainer: range.startContainer.nodeName,
    endContainer: range.endContainer.nodeName,
    startOffset: range.startOffset,
    endOffset: range.endOffset
  });
  
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node){
      if (!node.nodeValue || !node.nodeValue.trim()) {
        return NodeFilter.FILTER_REJECT;
      }
      
      // Build a range for the node and test intersection
      const r = document.createRange();
      try { 
        r.selectNodeContents(node); 
      } catch (e) { 
        console.warn('SkimNote: Failed to select node contents', node, e);
        return NodeFilter.FILTER_REJECT; 
      }
      
      try {
        // More robust intersection check
        const nodeStartVsRangeEnd = r.compareBoundaryPoints(Range.START_TO_END, range);
        const nodeEndVsRangeStart = r.compareBoundaryPoints(Range.END_TO_START, range);
        const rangeStartVsNodeEnd = range.compareBoundaryPoints(Range.START_TO_END, r);
        const rangeEndVsNodeStart = range.compareBoundaryPoints(Range.END_TO_START, r);
        
        // Two ranges intersect if:
        // 1. Node starts before range ends AND node ends after range starts
        const intersects = (nodeStartVsRangeEnd <= 0 && nodeEndVsRangeStart >= 0) ||
                          (rangeStartVsNodeEnd <= 0 && rangeEndVsNodeStart >= 0);
        
        if (intersects) {
          console.log(`SkimNote: Found intersecting text node:`, {
            nodeValue: node.nodeValue.substring(0, 50) + (node.nodeValue.length > 50 ? '...' : ''),
            parentTag: node.parentElement?.tagName,
            nodeLength: node.nodeValue.length,
            comparisons: {
              nodeStartVsRangeEnd,
              nodeEndVsRangeStart,
              rangeStartVsNodeEnd,
              rangeEndVsNodeStart
            }
          });
        }
        
        return intersects ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      } catch (e) {
        console.warn('SkimNote: Error comparing ranges', e);
        return NodeFilter.FILTER_REJECT;
      }
    }
  });
  
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  
  console.log(`SkimNote: Found ${nodes.length} intersecting text nodes`);
  
  // If no nodes found, try a simpler approach
  if (nodes.length === 0) {
    console.warn('SkimNote: No intersecting nodes found, trying fallback approach');
    return getTextNodesFallback(range);
  }
  
  return nodes;
}

function getTextNodesFallback(range) {
  console.log('SkimNote: Using fallback text node detection');
  const selectedText = range.toString();
  
  if (!selectedText) {
    console.warn('SkimNote: No selected text in range');
    return [];
  }
  
  // Get all text nodes within the range's common ancestor
  const allTextNodes = [];
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        return node.nodeValue && node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  let node;
  while ((node = walker.nextNode())) {
    allTextNodes.push(node);
  }
  
  // Now filter to only nodes that are actually within our range
  const nodesInRange = [];
  
  for (const textNode of allTextNodes) {
    try {
      // Create a range for this text node
      const nodeRange = document.createRange();
      nodeRange.selectNodeContents(textNode);
      
      // Check if this node is within our selection range
      const nodeStart = nodeRange.compareBoundaryPoints(Range.START_TO_START, range);
      const nodeEnd = nodeRange.compareBoundaryPoints(Range.END_TO_END, range);
      const rangeStart = range.compareBoundaryPoints(Range.START_TO_START, nodeRange);
      const rangeEnd = range.compareBoundaryPoints(Range.END_TO_END, nodeRange);
      
      // Node is in range if:
      // 1. The range starts before or at the node start AND range ends after or at node start, OR
      // 2. The node starts before or at the range end AND node ends after or at range start
      const nodeIntersects = (rangeStart <= 0 && rangeEnd >= 0) || (nodeStart <= 0 && nodeEnd >= 0);
      
      if (nodeIntersects) {
        nodesInRange.push(textNode);
        console.log(`SkimNote: Fallback found intersecting text node:`, {
          nodeValue: textNode.nodeValue.substring(0, 50) + (textNode.nodeValue.length > 50 ? '...' : ''),
          parentTag: textNode.parentElement?.tagName
        });
      }
    } catch (e) {
      console.warn('SkimNote: Error checking node intersection in fallback', e);
    }
  }
  
  console.log(`SkimNote: Fallback found ${nodesInRange.length} intersecting nodes out of ${allTextNodes.length} total`);
  return nodesInRange;
}

function paintRange(range, note) {
  // Ensure CSS is injected before creating highlights
  injectHighlightCSS();
  
  const selectedText = range.toString();
  console.log(`SkimNote: paintRange called for text: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`);
  
  // Try the simple direct approach first
  const directResult = paintRangeDirectly(range, note);
  if (directResult && directResult.length > 0) {
    return directResult;
  }
  
  // If direct approach failed, try the complex text node approach
  console.warn('SkimNote: Direct approach failed, trying text node approach');
  const spans = [];
  const nodes = getTextNodesIntersectingRange(range);
  
  console.log(`SkimNote: Found ${nodes.length} text nodes for complex approach`);
  
  if (nodes.length === 0) {
    console.warn('SkimNote: No text nodes found, trying manual text replacement');
    const manualResult = highlightTextManually(selectedText, note);
    return manualResult ? [manualResult] : [];
  }
  
  for (const node of nodes){
    // Calculate the correct start and end offsets for this specific text node
    let start = 0;
    let end = node.nodeValue.length;
    
    // If this is the start container, use the range's start offset
    if (node === range.startContainer) {
      start = range.startOffset;
    }
    
    // If this is the end container, use the range's end offset
    if (node === range.endContainer) {
      end = range.endOffset;
    }
    
    console.log(`SkimNote: Processing node with start=${start}, end=${end}, nodeLength=${node.nodeValue.length}`, {
      nodeText: node.nodeValue.substring(0, 50) + (node.nodeValue.length > 50 ? '...' : ''),
      isStartContainer: node === range.startContainer,
      isEndContainer: node === range.endContainer
    });
    
    if (end <= start || start < 0 || end > node.nodeValue.length) {
      console.warn(`SkimNote: Skipping node due to invalid range: start=${start}, end=${end}, nodeLength=${node.nodeValue.length}`);
      continue;
    }
    
    const sub = document.createRange();
    try {
      sub.setStart(node, start);
      sub.setEnd(node, end);
      
      // Verify that this sub-range actually contains text from our selection
      const subText = sub.toString();
      
      if (!subText.trim()) {
        console.warn(`SkimNote: Skipping node - sub-range text is empty`);
        continue;
      }
      
      console.log(`SkimNote: Sub-range text: "${subText.substring(0, 30)}${subText.length > 30 ? '...' : ''}"`);
    } catch (e) {
      console.error('SkimNote: Failed to set range on node', e);
      continue;
    }
    
    const span = document.createElement('span');
    
    // Set attributes first
    if (note?.id) { 
      span.dataset.skimnoteId = note.id; 
    }
    
    // Apply highlighting styles
    applyHighlightStyle(span, note?.color);
    
    try { 
      sub.surroundContents(span);
      console.log('SkimNote: Successfully surrounded contents with span');
    }
    catch (e) {
      console.warn('SkimNote: surroundContents failed, using fallback method', e);
      // Fallback: extract and insert; this is per-text-node so it won't wrap blocks
      try {
        const frag = sub.cloneContents();
        span.appendChild(frag);
        sub.deleteContents();
        sub.insertNode(span);
        console.log('SkimNote: Successfully used fallback insertion method');
      } catch (e2) {
        console.error('SkimNote: Fallback insertion also failed', e2);
        continue;
      }
    }
    
    spans.push(span);
  }
  
  console.log(`SkimNote: Created ${spans.length} highlight spans using text node approach`);
  return spans;
}

function paintRangeDirectly(range, note) {
  console.log('SkimNote: Attempting direct range highlighting (primary method)');
  
  // First, let's try the cleanest approach: surroundContents
  try {
    const span = document.createElement('span');
    if (note?.id) span.dataset.skimnoteId = note.id;
    applyHighlightStyle(span, note?.color);
    
    // Clone the range so we don't modify the original
    const workingRange = range.cloneRange();
    workingRange.surroundContents(span);
    
    console.log('SkimNote: Direct surroundContents succeeded');
    return [span];
  } catch (e) {
    console.warn('SkimNote: surroundContents failed, trying non-destructive overlay approach', e);
  }
  
  // Second approach: Create overlay spans without disrupting DOM structure
  try {
    console.log('SkimNote: Attempting non-destructive overlay highlighting');
    const overlays = createOverlayHighlight(range, note);
    if (overlays && overlays.length) return overlays;
  } catch (e) {
    console.warn('SkimNote: Overlay approach failed, trying manual text replacement', e);
  }
  
  // Third approach: use the manual text replacement method
  try {
    const selectedText = range.toString();
    const manualResult = highlightTextManually(selectedText, note);
    if (manualResult) {
      console.log('SkimNote: Manual text replacement succeeded as direct fallback');
      return [manualResult];
    }
  } catch (e) {
    console.error('SkimNote: Manual text replacement also failed', e);
  }
  
  console.error('SkimNote: All direct highlighting methods failed');
  return [];
}

function createOverlayHighlight(range, note) {
  console.log('SkimNote: Creating overlay highlight to preserve DOM structure');
  
  // Get all the client rectangles for the selection
  let rectList = Array.from(range.getClientRects ? range.getClientRects() : []);
  const spans = [];
  
  if (rectList.length === 0) {
    // Fallback to single bounding rect if available
    const br = range.getBoundingClientRect ? range.getBoundingClientRect() : null;
    if (br && br.width > 0 && br.height > 0) {
      console.warn('SkimNote: No client rects; using bounding rect fallback');
      rectList = [br];
    } else {
      console.warn('SkimNote: No client rectangles or bounding rect available');
      return [];
    }
  }
  
  // Create a container for all highlight overlays
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 2147483646;
    top: 0;
    left: 0;
  `;
  if (note?.id) container.dataset.skimnoteId = note.id;
  if (note?.color) container.dataset.skimnoteColor = note.color;
  
  // Add container to top-most UI layer for max z-index
  const uiRoot = window.__skimnoteShadow || document.body;
  uiRoot.appendChild(container);
  // Track association for repositioning
  const existing = noteElIndex.get(note.id) || [];
  existing.push(container);
  noteElIndex.set(note.id, existing);
  
  // Create an overlay span for each rectangle
  for (let i = 0; i < rectList.length; i++) {
    const rect = rectList[i];
    const overlay = document.createElement('span');
    
    // Position the overlay exactly over the text with same styling as traditional highlights
    const colorVal = overlayFillRgba(note?.color);
    overlay.style.cssText = `
      position: absolute;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      background-color: ${colorVal};
      border-radius: 3px;
      outline: 1px solid rgba(0,0,0,0.25);
      mix-blend-mode: multiply;
      pointer-events: none;
      z-index: 2147483647;
    `;
    
    if (note?.id) overlay.dataset.skimnoteId = note.id;
    if (note?.color) overlay.dataset.skimnoteColor = note.color;
    overlay.className = 'skimnote-overlay-highlight';
    
    container.appendChild(overlay);
    spans.push(overlay);
  }
  
  // Also create invisible markers in the original text for text-based operations
  try {
    const startMarker = document.createElement('span');
    const endMarker = document.createElement('span');
    
    startMarker.style.cssText = 'display: none;';
    endMarker.style.cssText = 'display: none;';
    startMarker.className = 'skimnote-start-marker';
    endMarker.className = 'skimnote-end-marker';
    
    if (note?.id) {
      startMarker.dataset.skimnoteId = note.id;
      endMarker.dataset.skimnoteId = note.id;
    }
    
    // Insert markers at the start and end of the range
    const clonedRange = range.cloneRange();
    clonedRange.collapse(true);
    clonedRange.insertNode(startMarker);
    
    // Insert end marker safely even when endContainer moves after first insertion
    const endRange = range.cloneRange();
    endRange.collapse(false);
    endRange.insertNode(endMarker);
    
    spans.push(startMarker, endMarker);
  } catch (e) {
    console.warn('SkimNote: Could not insert text markers', e);
  }
  
  // Add scroll listener to keep highlights positioned correctly
  if (!window.__skimnoteScrollHandlerAdded) {
    window.addEventListener('scroll', updateOverlayPositions, { passive: true });
    window.addEventListener('resize', updateOverlayPositions);
    window.__skimnoteScrollHandlerAdded = true;
  }
  
  console.log(`SkimNote: Created overlay highlight with ${rectList.length} rectangles`);
  if (spans.length === 0) {
    console.warn('SkimNote: No overlay spans created');
  }
  return spans;
}

function updateOverlayPositions() {
  // Update positions of all overlay highlights when user scrolls
  const docOverlays = Array.from(document.querySelectorAll('.skimnote-overlay-highlight'));
  const shadowOverlays = window.__skimnoteShadow ? Array.from(window.__skimnoteShadow.querySelectorAll('.skimnote-overlay-highlight')) : [];
  const overlays = [...docOverlays, ...shadowOverlays];
  for (const overlay of overlays) {
    try {
      // Get the associated note ID and find the original range
      const noteId = overlay.dataset.skimnoteId;
      if (!noteId) continue;
      
      const elements = noteElIndex.get(noteId) || [];
      const markers = elements.filter(el => 
        el.className === 'skimnote-start-marker' || el.className === 'skimnote-end-marker'
      );
      
      if (markers.length >= 2) {
        // Recreate the range from markers and update overlay position
        const startMarker = markers.find(el => el.className === 'skimnote-start-marker');
        const endMarker = markers.find(el => el.className === 'skimnote-end-marker');
        
        if (startMarker && endMarker) {
          const range = document.createRange();
          range.setStartAfter(startMarker);
          range.setEndBefore(endMarker);
          
          const rects = Array.from(range.getClientRects());
          if (rects.length > 0) {
            // Update overlay positions based on current scroll position
            const overlaysForNote = elements.filter(el => el.className === 'skimnote-overlay-highlight');
            for (let i = 0; i < Math.min(rects.length, overlaysForNote.length); i++) {
              const rect = rects[i];
              const overlayEl = overlaysForNote[i];
              if (overlayEl) {
                overlayEl.style.left = `${rect.left}px`;
                overlayEl.style.top = `${rect.top}px`;
                overlayEl.style.width = `${rect.width}px`;
                overlayEl.style.height = `${rect.height}px`;
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('SkimNote: Error updating overlay position', e);
    }
  }
}

function highlightTextManually(selectedText, note) {
  console.log('SkimNote: Attempting manual text highlighting for:', selectedText.substring(0, 50));
  
  // Clean up the selected text - remove extra whitespace but preserve internal spacing
  const cleanedText = selectedText.trim();
  if (!cleanedText) {
    console.warn('SkimNote: No clean text to highlight');
    return null;
  }
  
  // Strategy 1: Look for exact text match
  let textNode = findTextNodeContaining(cleanedText);
  if (textNode) {
    const span = wrapTextInNode(textNode, cleanedText, note);
    if (span) {
      console.log('SkimNote: Manual highlighting succeeded with exact match');
      return span;
    }
  }
  
  // Strategy 2: Look for text with normalized whitespace
  const normalizedText = cleanedText.replace(/\s+/g, ' ');
  textNode = findTextNodeContaining(normalizedText);
  if (textNode) {
    const span = wrapTextInNode(textNode, normalizedText, note);
    if (span) {
      console.log('SkimNote: Manual highlighting succeeded with normalized text');
      return span;
    }
  }
  
  // Strategy 3: Try to find the start of the text and create multiple spans
  const firstWords = cleanedText.split(' ').slice(0, 3).join(' ');
  textNode = findTextNodeContaining(firstWords);
  if (textNode) {
    console.log('SkimNote: Found start of text, attempting multi-node highlighting');
    return highlightAcrossMultipleNodes(cleanedText, note);
  }
  
  console.warn('SkimNote: Manual text highlighting could not find any matching text');
  return null;
}

function findTextNodeContaining(text) {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        return node.nodeValue && node.nodeValue.includes(text) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    }
  );
  
  return walker.nextNode();
}

function wrapTextInNode(textNode, targetText, note) {
  try {
    const nodeText = textNode.nodeValue;
    const startIndex = nodeText.indexOf(targetText);
    
    if (startIndex === -1) return null;
    
    // Split the text node and wrap the middle part
    const beforeText = nodeText.substring(0, startIndex);
    const highlightText = nodeText.substring(startIndex, startIndex + targetText.length);
    const afterText = nodeText.substring(startIndex + targetText.length);
    
    // Create the highlight span
    const span = document.createElement('span');
    if (note?.id) span.dataset.skimnoteId = note.id;
    applyHighlightStyle(span, note?.color);
    span.textContent = highlightText;
    
    // Replace the original text node
    const parent = textNode.parentNode;
    
    if (beforeText) {
      parent.insertBefore(document.createTextNode(beforeText), textNode);
    }
    
    parent.insertBefore(span, textNode);
    
    if (afterText) {
      parent.insertBefore(document.createTextNode(afterText), textNode);
    }
    
    parent.removeChild(textNode);
    
    return span;
  } catch (e) {
    console.error('SkimNote: Error wrapping text in node', e);
    return null;
  }
}

function highlightAcrossMultipleNodes(selectedText, note) {
  console.log('SkimNote: Attempting to highlight across multiple nodes');
  
  // This is a complex case - for now, just try to highlight the first significant chunk
  const words = selectedText.split(' ');
  const firstChunk = words.slice(0, Math.min(5, words.length)).join(' ');
  
  const textNode = findTextNodeContaining(firstChunk);
  if (textNode) {
    return wrapTextInNode(textNode, firstChunk, note);
  }
  
  return null;
}

// 5) Save selection
async function saveSelection(opts = {}) {
  const sel = window.getSelection();
  let range = null;
  if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
    range = sel.getRangeAt(0);
  } else if (lastSelectionRange) {
    console.warn('SkimNote: Selection collapsed; using lastSelectionRange backup');
    try {
      // Restore selection so DOM APIs relying on current selection still work
      sel?.removeAllRanges?.();
      sel?.addRange?.(lastSelectionRange);
    } catch {}
    try { range = lastSelectionRange.cloneRange(); } catch { range = lastSelectionRange; }
  } else {
    console.warn('SkimNote: No selection available and no backup range');
    showMiniNotice('Please select some text to highlight');
    return;
  }
  const selectedText = range.toString();
  
  console.log(`SkimNote: saveSelection called with selection:`, {
    text: selectedText.substring(0, 100) + (selectedText.length > 100 ? '...' : ''),
    rangeValid: !!range,
    startContainer: range.startContainer?.nodeName,
    endContainer: range.endContainer?.nodeName,
    collapsed: range.collapsed
  });
  
  if (!selectedText.trim()) {
    console.warn('SkimNote: Selected text is empty or only whitespace');
    showMiniNotice('Please select some text to highlight');
    return;
  }
  
  const anchor = makeSelectors(range);
  const htmlFrag = range.cloneContents();
  const div = document.createElement('div');
  div.appendChild(htmlFrag);
  const note = {
    id: crypto.randomUUID(),
    url: location.href,
    title: document.title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    kind: 'highlight',
    quoteHtml: div.innerHTML,
    anchor,
    color: 'yellow'
  };
  
  if (opts.withNote) {
    const text = prompt('Add a note (optional):');
    if (text) note.text = text;
  }
  
  console.log('SkimNote: About to call paintRange for note:', note.id);
  const els = paintRange(range, note) || [];
  
  if (els.length) {
    noteElIndex.set(note.id, els);
    console.log(`SkimNote: Successfully saved ${els.length} highlight elements for note ${note.id}`);
    showMiniNotice(`Highlighted text saved!`);
  } else {
    console.error('SkimNote: Failed to create any highlight elements, trying manual text replacement');
    // Last resort: try to find and replace the text manually
    const manualEl = highlightTextManually(selectedText, note);
    if (manualEl) {
      noteElIndex.set(note.id, [manualEl]);
      showMiniNotice(`Highlighted text saved using fallback method!`);
    } else {
      showMiniNotice('Failed to highlight text. Please try selecting different text.');
    }
  }
  
  try { window.__skimnoteShadow.getElementById('toolbar').style.setProperty('display','none','important'); } catch {}
  sendMessageSafe({ type: 'SK_SAVE_NOTE', payload: note }, () => {
    if (sidebarOpen) refreshSidebar();
  });
}

// 6) Re-apply highlights on load
function loadAndRestoreHighlights() {
  sendMessageSafe({ type: 'SK_GET_NOTES_FOR_URL', url: location.href }, (notes = []) => {
    const highlights = notes.filter(n => n.kind === 'highlight' && n.anchor);
    console.log(`SkimNote: Attempting to restore ${highlights.length} highlights`);
    
    for (const n of highlights) {
      try { 
        anchorAndPaint(n); 
      } catch (e) {
        console.error('SkimNote: Error restoring highlight', n.id, e);
      }
    }
    
    // If some highlights failed to restore, try again after a delay
    setTimeout(() => {
      const unrestoredNotes = highlights.filter(n => !noteElIndex.has(n.id));
      if (unrestoredNotes.length > 0) {
        console.log(`SkimNote: Retrying restoration for ${unrestoredNotes.length} highlights`);
        for (const n of unrestoredNotes) {
          try { anchorAndPaint(n); } catch {}
        }
      }
    }, 1000);
  });
}

// Load highlights immediately
loadAndRestoreHighlights();

// Also try to restore highlights when DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAndRestoreHighlights);
} else if (document.readyState === 'interactive') {
  // DOM is already interactive, try again after a short delay
  setTimeout(loadAndRestoreHighlights, 100);
}

function anchorAndPaint(note) {
  // Ensure CSS is available for restoring highlights
  injectHighlightCSS();
  
  const anchor = note.anchor;
  const exact = anchor.selectors.find(s => s.type === 'TextQuoteSelector')?.exact;
  if (!exact) {
    console.warn('SkimNote: No exact text found in anchor for note', note.id);
    return;
  }
  
  console.log(`SkimNote: Attempting to restore highlight for note ${note.id} with text: "${exact.substring(0, 50)}..."`);
  
  // Create a more robust text search using document.body
  const bodyText = document.body ? document.body.innerText : '';
  const normalizedExact = normalizeText(exact);
  const normalizedBodyText = normalizeText(bodyText);
  
  console.log(`SkimNote: Looking for normalized text: "${normalizedExact.substring(0, 50)}..."`);
  
  if (!normalizedBodyText.includes(normalizedExact)) {
    console.warn('SkimNote: Normalized text not found, trying partial matching');
    // Try to find at least part of the text
    const words = normalizedExact.split(' ').filter(w => w.length > 3);
    const foundWords = words.filter(word => normalizedBodyText.includes(word));
    
    if (foundWords.length < words.length * 0.5) {
      console.warn(`SkimNote: Only found ${foundWords.length}/${words.length} words for note ${note.id}`);
      return;
    } else {
      console.log(`SkimNote: Found ${foundWords.length}/${words.length} words, attempting partial restoration`);
    }
  }
  
  // Try multiple strategies to find and restore the highlight
  let found = false;
  
  // Strategy 1: Try to find the exact text in a single text node
  found = restoreHighlightFromTextNode(exact, note);
  
  // Strategy 2: If not found, try to reconstruct the range across multiple nodes
  if (!found) {
    found = restoreHighlightFromMultipleNodes(exact, note);
  }
  
  // Strategy 3: As a last resort, try the original text-based approach
  if (!found) {
    found = restoreHighlightLegacyMethod(exact, note);
  }
  
  if (found) {
    console.log(`SkimNote: Successfully restored highlight for note ${note.id}`);
  } else {
    console.warn('SkimNote: Could not restore highlight for note', note.id);
  }
}

function normalizeText(text) {
  // Normalize text for better matching
  return text
    .replace(/\s+/g, ' ')           // Replace multiple whitespace with single space
    .replace(/[\r\n\t]/g, ' ')      // Replace newlines and tabs with spaces
    .replace(/[""'']/g, '"')        // Normalize quotes
    .replace(/[–—]/g, '-')          // Normalize dashes
    .replace(/…/g, '...')           // Normalize ellipsis
    .trim()
    .toLowerCase();
}

function findTextWithFallbacks(targetText, searchInText) {
  // Try multiple normalization strategies
  const strategies = [
    // Strategy 1: Exact match
    { target: targetText, search: searchInText },
    
    // Strategy 2: Normalized match
    { target: normalizeText(targetText), search: normalizeText(searchInText) },
    
    // Strategy 3: Remove extra whitespace
    { target: targetText.replace(/\s+/g, ' ').trim(), search: searchInText.replace(/\s+/g, ' ') },
    
    // Strategy 4: Just the meaningful words (remove short words)
    { 
      target: targetText.split(' ').filter(w => w.length > 3).join(' '),
      search: searchInText.split(' ').filter(w => w.length > 3).join(' ')
    }
  ];
  
  for (let i = 0; i < strategies.length; i++) {
    const { target, search } = strategies[i];
    const index = search.indexOf(target);
    if (index >= 0) {
      console.log(`SkimNote: Found text using strategy ${i + 1}`);
      return { index, target, search };
    }
  }
  
  return null;
}

function restoreHighlightFromTextNode(exact, note) {
  console.log('SkimNote: Trying to restore from single text node');
  
  const walker = document.createTreeWalker(
    document.body || document.documentElement, 
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
        
        // Try flexible text matching
        const matchResult = findTextWithFallbacks(exact, node.nodeValue);
        return matchResult ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const nodeText = node.nodeValue;
    
    // Try multiple matching strategies
    const matchResult = findTextWithFallbacks(exact, nodeText);
    if (matchResult) {
      try {
        // For normalized matches, we need to find the actual position in the original text
        let startIdx, endIdx;
        
        if (matchResult.target === exact && matchResult.search === nodeText) {
          // Exact match case
          startIdx = matchResult.index;
          endIdx = startIdx + exact.length;
        } else {
          // Normalized match case - find best approximation
          const words = exact.split(' ').filter(w => w.length > 2);
          const firstWord = words[0];
          const lastWord = words[words.length - 1];
          
          startIdx = nodeText.toLowerCase().indexOf(firstWord.toLowerCase());
          const lastWordIdx = nodeText.toLowerCase().lastIndexOf(lastWord.toLowerCase());
          endIdx = lastWordIdx >= 0 ? lastWordIdx + lastWord.length : startIdx + Math.min(exact.length, nodeText.length - startIdx);
          
          if (startIdx < 0) startIdx = 0;
          if (endIdx <= startIdx) endIdx = Math.min(startIdx + exact.length, nodeText.length);
        }
        
        console.log(`SkimNote: Found match in node at positions ${startIdx}-${endIdx}: "${nodeText.substring(startIdx, endIdx)}"`);
        
        const range = document.createRange();
        range.setStart(node, startIdx);
        range.setEnd(node, endIdx);
        const newEls = paintRange(range, note) || [];
        if (newEls.length) {
          const list = noteElIndex.get(note.id) || [];
          list.push(...newEls);
          noteElIndex.set(note.id, list);
          return true;
        }
      } catch (e) {
        console.warn('SkimNote: Failed to create range for note', note.id, e);
      }
    }
  }
  return false;
}

function restoreHighlightFromMultipleNodes(exact, note) {
  console.log('SkimNote: Trying to restore from multiple text nodes');
  
  // Look for the start of the text with flexible matching
  const words = exact.split(' ').filter(w => w.length > 2);
  if (words.length < 2) {
    console.warn('SkimNote: Not enough words for multi-node restoration');
    return false;
  }
  
  const firstWords = words.slice(0, Math.min(3, words.length)).join(' ');
  const lastWords = words.slice(-Math.min(3, words.length)).join(' ');
  
  let startNode = null, startOffset = -1;
  let endNode = null, endOffset = -1;
  
  // Find start position with flexible matching
  const startWalker = document.createTreeWalker(
    document.body || document.documentElement, 
    NodeFilter.SHOW_TEXT
  );
  
  while (startWalker.nextNode()) {
    const node = startWalker.currentNode;
    if (!node.nodeValue) continue;
    
    const matchResult = findTextWithFallbacks(firstWords, node.nodeValue);
    if (matchResult) {
      // Find the actual position in the original text
      const firstWord = words[0];
      const idx = node.nodeValue.toLowerCase().indexOf(firstWord.toLowerCase());
      if (idx >= 0) {
        startNode = node;
        startOffset = idx;
        console.log(`SkimNote: Found start position in node: "${node.nodeValue.substring(idx, idx + 20)}..."`);
        break;
      }
    }
  }
  
  // Find end position with flexible matching
  const endWalker = document.createTreeWalker(
    document.body || document.documentElement, 
    NodeFilter.SHOW_TEXT
  );
  
  while (endWalker.nextNode()) {
    const node = endWalker.currentNode;
    if (!node.nodeValue) continue;
    
    const matchResult = findTextWithFallbacks(lastWords, node.nodeValue);
    if (matchResult) {
      // Find the actual position in the original text
      const lastWord = words[words.length - 1];
      const idx = node.nodeValue.toLowerCase().lastIndexOf(lastWord.toLowerCase());
      if (idx >= 0) {
        endNode = node;
        endOffset = idx + lastWord.length;
        console.log(`SkimNote: Found end position in node: "...${node.nodeValue.substring(Math.max(0, idx - 10), idx + lastWord.length)}"`);
        break;
      }
    }
  }
  
  if (startNode && endNode && startOffset >= 0 && endOffset >= 0) {
    try {
      const range = document.createRange();
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
      
      // Verify the range contains something close to our target text
      const rangeText = range.toString();
      if (rangeText.length > exact.length * 0.8 && rangeText.length < exact.length * 1.2) {
        const newEls = paintRange(range, note) || [];
        if (newEls.length) {
          const list = noteElIndex.get(note.id) || [];
          list.push(...newEls);
          noteElIndex.set(note.id, list);
          return true;
        }
      }
    } catch (e) {
      console.warn('SkimNote: Failed to create multi-node range', e);
    }
  }
  
  return false;
}

function restoreHighlightLegacyMethod(exact, note) {
  console.log('SkimNote: Trying legacy restoration method');
  
  // This is the old approach as a last resort
  const walker = document.createTreeWalker(
    document.body || document.documentElement, 
    NodeFilter.SHOW_TEXT
  );
  
  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }
  
  // Try to find the text spanning across multiple nodes
  const fullText = textNodes.map(n => n.nodeValue).join('');
  const startIndex = fullText.indexOf(exact);
  
  if (startIndex >= 0) {
    // Calculate which nodes and offsets the text spans
    let currentIndex = 0;
    let startNode = null, startOffset = 0;
    let endNode = null, endOffset = 0;
    
    for (const node of textNodes) {
      const nodeLength = node.nodeValue.length;
      
      if (currentIndex <= startIndex && currentIndex + nodeLength > startIndex) {
        startNode = node;
        startOffset = startIndex - currentIndex;
      }
      
      const endIndex = startIndex + exact.length;
      if (currentIndex < endIndex && currentIndex + nodeLength >= endIndex) {
        endNode = node;
        endOffset = endIndex - currentIndex;
        break;
      }
      
      currentIndex += nodeLength;
    }
    
    if (startNode && endNode) {
      try {
        const range = document.createRange();
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        
        const newEls = paintRange(range, note) || [];
        if (newEls.length) {
          const list = noteElIndex.get(note.id) || [];
          list.push(...newEls);
          noteElIndex.set(note.id, list);
          return true;
        }
      } catch (e) {
        console.warn('SkimNote: Legacy restoration failed', e);
      }
    }
  }
  
  return false;
}

// 7) Commands from background
chrome.runtime.onMessage.addListener((msg) => {
  if (!window.__skimnoteShadow) ensureUI();
  if (msg?.type === 'SK_TOGGLE_SIDEBAR') toggleSidebar();
  if (msg?.type === 'SK_TOGGLE_ANNOTATE') toggleAnnotate();
  if (msg?.type === 'SK_CONTEXT_SAVE') saveSelection();
  if (msg?.type === 'SK_QUICK_NOTE') openComposer();
  if (msg?.type === 'SK_JUMP_NEXT') jumpNext();
});

// 8) Sidebar
let sidebarOpen = false, sidebarEl;
const noteElIndex = new Map(); // noteId -> [elements]
let jumpFlat = []; let jumpIdx = 0;
function toggleSidebar() {
  const sh = window.__skimnoteShadow;
  if (!sidebarEl) {
    sidebarEl = sh.getElementById('sidebar');
    const search = sh.getElementById('search');
    const tabPage = sh.getElementById('tabPage');
    const tabAll = sh.getElementById('tabAll');
    search.addEventListener('input', () => refreshSidebar(search.value.trim()))
    tabPage.addEventListener('click', () => setTab('page'));
    tabAll.addEventListener('click', () => setTab('all'));
    sh.getElementById('fab').addEventListener('click', () => toggleSidebar());
    refreshSidebar();
  }
  sidebarOpen = !sidebarOpen;
  sidebarEl.style.display = sidebarOpen ? 'block' : 'none';
  if (sidebarOpen) refreshSidebar();
}

let activeTab = 'page';
function setTab(tab){
  activeTab = tab;
  const sh = window.__skimnoteShadow;
  sh.getElementById('tabPage').classList.toggle('active', tab==='page');
  sh.getElementById('tabAll').classList.toggle('active', tab==='all');
  sh.getElementById('listPage').style.display = tab==='page'? 'block':'none';
  sh.getElementById('listAll').style.display = tab==='all'? 'block':'none';
  refreshSidebar(sh.getElementById('search').value.trim());
}

function noteItemHtml(n, scope){
  const colorDots = ['yellow','pink','green','blue','purple','orange'].map(c=>`<span class="dot" data-action="color" data-id="${n.id}" data-color="${c}" style="background:${colorToRgba(c)}"></span>`).join('');
  const origin = scope==='all' ? `<div class="muted">${new URL(n.url).hostname}</div>` : '';
  return `<div class="noteItem" data-id="${n.id}">
    <div class="row">
      <div class="muted">${new Date(n.createdAt).toLocaleString()}</div>
      <div>
        <button class="btn" data-action="jump" data-id="${n.id}">Jump</button>
        <button class="btn" data-action="open" data-url="${n.url}">Open</button>
        <button class="btn" data-action="del" data-id="${n.id}">Delete</button>
      </div>
    </div>
    ${origin}
    ${n.text ? `<div><b>Note:</b> ${escapeHtml(n.text)}</div>` : ''}
    ${n.quoteHtml ? `<div>${n.quoteHtml}</div>` : ''}
    <div class="colors" style="margin-top:6px">${colorDots}</div>
  </div>`;
}

function refreshSidebar(query = "") {
  const sh = window.__skimnoteShadow;
  const chip = sh.querySelector('#countChip');
  if (activeTab === 'page') {
    sendMessageSafe({ type: 'SK_GET_NOTES_FOR_URL', url: location.href }, (notes = []) => {
      const filtered = query ? notes.filter(n => (n.text || "").toLowerCase().includes(query.toLowerCase()) || (n.quoteHtml || "").toLowerCase().includes(query.toLowerCase())) : notes;
      chip.textContent = String(filtered.length);
      sh.getElementById('listPage').innerHTML = filtered.map(n => noteItemHtml(n, 'page')).join('');
    });
  } else {
    sendMessageSafe({ type: 'SK_GET_ALL_NOTES' }, (notes = []) => {
      const filtered = query ? notes.filter(n => (n.text || "").toLowerCase().includes(query.toLowerCase()) || (n.quoteHtml || "").toLowerCase().includes(query.toLowerCase()) || (n.url||"").toLowerCase().includes(query.toLowerCase())) : notes;
      chip.textContent = String(filtered.length);
      sh.getElementById('listAll').innerHTML = filtered.map(n => noteItemHtml(n, 'all')).join('');
    });
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
}

// 9) Quick Note Composer
function openComposer() {
  const sh = window.__skimnoteShadow;
  const el = sh.getElementById('composer');
  const ta = sh.getElementById('composerText');
  el.style.display = 'block';
  ta.value = '';
  ta.focus();
  const onSave = async () => {
    const text = ta.value.trim();
    if (!text) { closeComposer(); return; }
    const note = {
      id: crypto.randomUUID(),
      url: location.href,
      title: document.title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      kind: 'quick-note',
      text
    };
    sendMessageSafe({ type: 'SK_SAVE_NOTE', payload: note }, () => {
      closeComposer();
      if (sidebarOpen) refreshSidebar();
    });
  };
  const onCancel = () => closeComposer();
  sh.getElementById('composerSave').onclick = onSave;
  sh.getElementById('composerCancel').onclick = onCancel;
}

function closeComposer() {
  const sh = window.__skimnoteShadow;
  sh.getElementById('composer').style.display = 'none';
}

// 10) Annotate Mode (drawing)
let annotate = false, overlayCanvas, ctx, strokes = [];
function toggleAnnotate() {
  annotate = !annotate;
  if (annotate) ensureCanvas(); else destroyCanvas();
}
function ensureCanvas() {
  if (overlayCanvas) return;
  overlayCanvas = document.createElement('canvas');
  Object.assign(overlayCanvas.style, { position: 'fixed', inset: 0, zIndex: 2147483646, pointerEvents: 'auto' });
  const sh = window.__skimnoteShadow; sh.appendChild(overlayCanvas);
  const dpr = window.devicePixelRatio || 1; overlayCanvas.width = innerWidth * dpr; overlayCanvas.height = innerHeight * dpr; overlayCanvas.getContext('2d').scale(dpr, dpr); ctx = overlayCanvas.getContext('2d');
  ctx.lineWidth = 3; ctx.lineCap = 'round';
  let drawing = false, path = [];
  overlayCanvas.addEventListener('pointerdown', e => { drawing = true; path = [[e.clientX, e.clientY]]; });
  overlayCanvas.addEventListener('pointermove', e => { if (!drawing) return; const [x, y] = [e.clientX, e.clientY]; const [px, py] = path[path.length - 1]; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke(); path.push([x, y]); });
  overlayCanvas.addEventListener('pointerup', () => { drawing = false; strokes.push(path); });
}
function destroyCanvas() {
  overlayCanvas?.remove(); overlayCanvas = null; ctx = null;
}

// 11) Actions in sidebar
window.__skimnoteShadow?.addEventListener('click', (e) => {
  const target = e.target;
  if (!(target instanceof Element)) return;
  const action = target.getAttribute('data-action');
  if (!action) return;
  if (action === 'del') {
    const id = target.getAttribute('data-id');
    sendMessageSafe({ type: 'SK_DELETE_NOTE', id }, () => {
      removeHighlights(id);
      refreshSidebar(window.__skimnoteShadow.getElementById('search').value.trim());
    });
  } else if (action === 'color') {
    const id = target.getAttribute('data-id');
    const color = target.getAttribute('data-color');
    sendMessageSafe({ type: 'SK_UPDATE_NOTE', payload: { id, color } }, () => {
      recolorHighlights(id, color);
      refreshSidebar(window.__skimnoteShadow.getElementById('search').value.trim());
    });
  } else if (action === 'jump') {
    const id = target.getAttribute('data-id');
    jumpToNote(id);
  } else if (action === 'open') {
    const url = target.getAttribute('data-url');
    window.open(url, '_blank');
  }
});

function removeHighlights(id){
  const els = noteElIndex.get(id) || [];
  for (const el of els) {
    try {
      if (el.className === 'skimnote-overlay-highlight' || el.className === 'skimnote-start-marker' || el.className === 'skimnote-end-marker') {
        // For overlay highlights and markers, just remove them
        el.remove();
      } else {
        // For traditional highlights, unwrap the content
        const parent = el.parentNode;
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
      }
    } catch (e) {
      console.warn('SkimNote: Error removing highlight element', e);
    }
  }
  noteElIndex.delete(id);
}
function recolorHighlights(id, color){
  const els = noteElIndex.get(id) || [];
  for (const el of els) {
    if (el.className === 'skimnote-overlay-highlight') {
      // For overlay highlights, update the color attribute and styles
      el.dataset.skimnoteColor = color;
      const colorVal = colorToRgba(color);
      el.style.setProperty('background-color', colorVal, 'important');
      el.style.setProperty('background', colorVal, 'important');
      el.style.setProperty('border', `2px solid ${colorVal}`, 'important');
    } else if (el.className !== 'skimnote-start-marker' && el.className !== 'skimnote-end-marker') {
      // For traditional highlights, apply full styling
      applyHighlightStyle(el, color);
    }
  }
}
function jumpFlatList(){
  const all = [];
  for (const arr of noteElIndex.values()) all.push(...arr);
  return all.filter(Boolean);
}
function jumpNext(){
  const list = jumpFlatList();
  if (!list.length) return;
  jumpIdx = (jumpIdx + 1) % list.length;
  const el = list[jumpIdx];
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  flash(el);
}
function jumpToNote(id){
  const els = noteElIndex.get(id) || [];
  if (!els.length) return;
  const el = els[0];
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  flash(el);
}
function flash(el){
  const prev = el.style.outline;
  el.style.outline = '2px solid #ff7a59';
  setTimeout(()=>{ el.style.outline = prev || 'none'; }, 1200);
}

// Final loading confirmation
console.log('✅ SkimNote content script fully loaded and initialized!');
console.log('🧪 Test commands:');
console.log('  - window.testSkimNote() - Basic extension test');
console.log('  - window.skimNoteDebug.checkShadow() - Check UI state');
console.log('  - window.skimNoteDebug.forceShowToolbar() - Force show toolbar');
console.log('📝 Select text to see highlight toolbar appear automatically!');


