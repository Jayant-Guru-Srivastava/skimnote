const KEY = 'skimnote.notes';

async function getAll() {
  return new Promise(res => chrome.storage.local.get(KEY, o => res(o[KEY] || [])));
}
async function setAll(notes) {
  return new Promise(res => chrome.storage.local.set({ [KEY]: notes }, res));
}

function render(notes) {
  const list = document.getElementById('notes');
  const search = document.getElementById('search').value.trim().toLowerCase();
  const filtered = search ? notes.filter(n =>
    (n.text || '').toLowerCase().includes(search) ||
    (n.quoteHtml || '').toLowerCase().includes(search) ||
    (n.title || '').toLowerCase().includes(search) ||
    (n.url || '').toLowerCase().includes(search)
  ) : notes;
  document.getElementById('count').textContent = `${filtered.length} notes`;
  list.innerHTML = filtered.map(n => `
    <div class="note">
      <div class="row"><strong>${escapeHtml(n.title || '')}</strong> <span class="muted">— ${new URL(n.url).hostname}</span></div>
      <div class="muted">${new Date(n.createdAt).toLocaleString()}</div>
      ${n.text ? `<div>${escapeHtml(n.text)}</div>` : ''}
      ${n.quoteHtml ? `<div>${n.quoteHtml}</div>` : ''}
      <div style="margin-top:6px">
        <a href="${n.url}" target="_blank">Open</a>
      </div>
    </div>
  `).join('');
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s]));
}

async function init(){
  const notes = await getAll();
  document.getElementById('search').addEventListener('input', async ()=>{
    const current = await getAll();
    render(current);
  });
  document.getElementById('export').onclick = async () => {
    const data = await getAll();
    const blob = new Blob([JSON.stringify({ version:'0.1.0', notes: data }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'skimnote-export.json'; a.click();
    URL.revokeObjectURL(url);
  };
  document.getElementById('importBtn').onclick = () => document.getElementById('import').click();
  document.getElementById('import').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      if (Array.isArray(json.notes)) {
        await setAll(json.notes);
        render(json.notes);
      }
    } catch {}
  });
  render(notes);
}

document.addEventListener('DOMContentLoaded', init);


