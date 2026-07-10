// public/admin/admin.js
const state = { site: null, meta: null, adminEmail: '', activeSection: 'hero', themeDraft: null };

const SECTION_META = {
  hero: { title: 'Hero & Identity', desc: 'The first thing people see — headline, tagline, photo and the CTA buttons.' },
  about: { title: 'About & Results', desc: 'Your story, the "currently working on" line, and the four result stat cards.' },
  journey: { title: 'Journey', desc: 'Your work timeline. Add, edit, reorder or remove roles.' },
  craft: { title: 'Craft & Skills', desc: 'Skill categories and the tool chips inside each one.' },
  projects: { title: 'Projects', desc: 'Showcase specific projects with an image, description, tags and a link.' },
  edu: { title: 'Education & Languages', desc: 'Your degree and the languages you speak.' },
  contact: { title: 'Contact Info', desc: 'Email, phone and location shown in the Contact section.' },
  theme: { title: 'Theme & Style', desc: 'Pick a preset palette or build your own, plus typography and text size.' },
  messages: { title: 'Messages', desc: 'Everything submitted through your site\'s contact form.' },
  account: { title: 'Account', desc: 'Update your admin email or password.' }
};

// ---------- tiny helpers ----------
function esc(s) { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; }
function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
function toast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove('show'), 3200);
}
async function apiPut(section, body) {
  const res = await fetch(`/api/content/${section}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Save failed.');
  return data;
}
function saveBarHTML(id) {
  return `<div class="save-bar"><span class="save-status" id="${id}-status"></span><button class="btn btn-primary btn-sm" id="${id}-save">Save changes</button></div>`;
}
function wireSaveBar(id, onSave) {
  const btn = document.getElementById(`${id}-save`);
  const status = document.getElementById(`${id}-status`);
  btn.addEventListener('click', async () => {
    btn.disabled = true; const original = btn.textContent; btn.textContent = 'Saving…';
    status.textContent = ''; status.className = 'save-status';
    try {
      await onSave();
      status.textContent = 'Saved ✓'; status.classList.add('ok');
      toast('Changes saved.');
    } catch (err) {
      status.textContent = err.message; status.classList.add('err');
      toast(err.message, 'err');
    } finally {
      btn.disabled = false; btn.textContent = original;
    }
  });
}

// ---------- bootstrap ----------
async function init() {
  try {
    const meRes = await fetch('/api/auth/me');
    if (!meRes.ok) { window.location.href = '/admin/login.html'; return; }
    const me = await meRes.json();
    state.adminEmail = me.email;

    const [contentRes, metaRes] = await Promise.all([
      fetch('/api/content').then(r => r.json()),
      fetch('/api/content/meta/presets').then(r => r.json())
    ]);
    state.site = contentRes.site;
    state.meta = metaRes;
    state.themeDraft = JSON.parse(JSON.stringify(state.site.theme));

    if (window.ThemeEngine) window.ThemeEngine.applyTheme(state.site.theme, state.meta);

    document.getElementById('loadingBlock').style.display = 'none';
    document.getElementById('appShell').style.display = 'flex';

    setupSidebar();
    setupLogout();
    updateMessagesBadge();
    renderSection('hero');
  } catch (err) {
    document.getElementById('loadingBlock').textContent = 'Failed to load: ' + err.message;
  }
}

function setupSidebar() {
  document.querySelectorAll('#sideNav button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#sideNav button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderSection(btn.dataset.section);
    });
  });
}
function setupLogout() {
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login.html';
  });
}
async function updateMessagesBadge() {
  try {
    const data = await fetch('/api/messages').then(r => r.json());
    const unread = (data.messages || []).filter(m => !m.read).length;
    const btn = document.querySelector('#sideNav button[data-section="messages"]');
    if (unread > 0) btn.innerHTML = `<span class="dot"></span> Messages <span style="margin-left:auto;background:var(--gold);color:var(--ink);border-radius:100px;padding:1px 7px;font-size:11px;font-weight:700;">${unread}</span>`;
  } catch (e) { /* non-critical */ }
}

function renderSection(key) {
  state.activeSection = key;
  document.getElementById('panelTitle').textContent = SECTION_META[key].title;
  document.getElementById('panelDesc').textContent = SECTION_META[key].desc;
  const c = document.getElementById('panelContent');
  c.innerHTML = '';
  const renderers = {
    hero: renderHero, about: renderAbout, journey: renderJourney, craft: renderCraft,
    projects: renderProjects, edu: renderEdu, contact: renderContact, theme: renderTheme,
    messages: renderMessages, account: renderAccount
  };
  renderers[key](c);
}

// ============ HERO ============
function renderHero(container) {
  const h = state.site.hero;
  const panel = el(`<div class="panel">
    <h3>Photo</h3>
    <p class="panel-desc">Shown in the circular frame on the homepage.</p>
    <div class="img-upload">
      <div class="preview round"><img id="heroImgPreview" src="${h.profileImage || ''}" alt=""></div>
      <input type="file" id="heroImgFile" accept="image/*">
    </div>
  </div>`);
  container.appendChild(panel);

  const panel2 = el(`<div class="panel">
    <h3>Headline</h3>
    <div class="field"><label>Eyebrow text</label><input id="h-eyebrow" value="${esc(h.eyebrow)}"></div>
    <div class="grid-2">
      <div class="field"><label>Headline — line 1</label><input id="h-line1" value="${esc(h.headlineLine1)}"></div>
      <div class="field"><label>Headline — line 2 (gold/italic)</label><input id="h-line2" value="${esc(h.headlineLine2)}"></div>
    </div>
    <div class="field"><label>Subtext</label><textarea id="h-subtext">${esc(h.subtext)}</textarea></div>
  </div>`);
  container.appendChild(panel2);

  const panel3 = el(`<div class="panel">
    <h3>Buttons</h3>
    <div class="grid-2">
      <div class="field"><label>Primary button text</label><input id="h-ctaPrimaryText" value="${esc(h.ctaPrimaryText)}"></div>
      <div class="field"><label>Primary button link</label><input id="h-ctaPrimaryLink" value="${esc(h.ctaPrimaryLink)}"></div>
      <div class="field"><label>Secondary button text</label><input id="h-ctaGhostText" value="${esc(h.ctaGhostText)}"></div>
      <div class="field"><label>Secondary button link</label><input id="h-ctaGhostLink" value="${esc(h.ctaGhostLink)}"></div>
    </div>
  </div>`);
  container.appendChild(panel3);

  const panel4 = el(`<div class="panel">
    <h3>Floating stat badge</h3>
    <div class="grid-2">
      <div class="field"><label>Value (e.g. +60%)</label><input id="h-badgeValue" value="${esc(h.badgeValue)}"></div>
      <div class="field"><label>Label</label><input id="h-badgeLabel" value="${esc(h.badgeLabel)}"></div>
    </div>
    ${saveBarHTML('hero')}
  </div>`);
  container.appendChild(panel4);

  let newImage = null;
  document.getElementById('heroImgFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    newImage = await fileToBase64(file);
    document.getElementById('heroImgPreview').src = newImage;
  });

  wireSaveBar('hero', async () => {
    const body = {
      eyebrow: document.getElementById('h-eyebrow').value,
      headlineLine1: document.getElementById('h-line1').value,
      headlineLine2: document.getElementById('h-line2').value,
      subtext: document.getElementById('h-subtext').value,
      ctaPrimaryText: document.getElementById('h-ctaPrimaryText').value,
      ctaPrimaryLink: document.getElementById('h-ctaPrimaryLink').value,
      ctaGhostText: document.getElementById('h-ctaGhostText').value,
      ctaGhostLink: document.getElementById('h-ctaGhostLink').value,
      badgeValue: document.getElementById('h-badgeValue').value,
      badgeLabel: document.getElementById('h-badgeLabel').value
    };
    if (newImage) body.profileImage = newImage;
    const data = await apiPut('hero', body);
    state.site.hero = data.site.hero;
  });
}

// ============ ABOUT ============
function renderAbout(container) {
  const a = state.site.about;
  const panel = el(`<div class="panel">
    <h3>Intro</h3>
    <div class="grid-2">
      <div class="field"><label>Kicker (small label above title)</label><input id="a-kicker" value="${esc(a.kicker)}"></div>
      <div class="field"><label>Section title</label><input id="a-title" value="${esc(a.title)}"></div>
    </div>
    <div class="field"><label>Paragraphs</label></div>
    <div id="a-paragraphs"></div>
    <button class="add-item-btn" id="a-addPara">+ Add paragraph</button>
    <div class="field" style="margin-top:16px;"><label>"Currently" highlight line</label><textarea id="a-nowLine">${esc(a.nowLine)}</textarea></div>
  </div>`);
  container.appendChild(panel);

  const paraWrap = panel.querySelector('#a-paragraphs');
  function addParaRow(text = '') {
    const row = el(`<div class="item-card"><div class="item-top"><span class="item-title">Paragraph</span><button class="btn btn-danger btn-sm remove-para">Remove</button></div><textarea class="para-text">${esc(text)}</textarea></div>`);
    row.querySelector('.remove-para').addEventListener('click', () => row.remove());
    paraWrap.appendChild(row);
  }
  (a.paragraphs || []).forEach(p => addParaRow(p));
  panel.querySelector('#a-addPara').addEventListener('click', () => addParaRow(''));

  const panel2 = el(`<div class="panel">
    <h3>Result stat cards</h3>
    <p class="panel-desc">The four highlighted numbers shown next to your story.</p>
    <div id="a-results"></div>
    <button class="add-item-btn" id="a-addResult">+ Add stat card</button>
    ${saveBarHTML('about')}
  </div>`);
  container.appendChild(panel2);

  const resultsWrap = panel2.querySelector('#a-results');
  function addResultRow(r = { number: '', label: '' }) {
    const row = el(`<div class="item-card">
      <div class="item-top"><span class="item-title">Stat</span><button class="btn btn-danger btn-sm remove-result">Remove</button></div>
      <div class="grid-2">
        <div class="field"><label>Number</label><input class="res-number" value="${esc(r.number)}"></div>
        <div class="field"><label>Label</label><input class="res-label" value="${esc(r.label)}"></div>
      </div>
    </div>`);
    row.querySelector('.remove-result').addEventListener('click', () => row.remove());
    resultsWrap.appendChild(row);
  }
  (a.results || []).forEach(r => addResultRow(r));
  panel2.querySelector('#a-addResult').addEventListener('click', () => addResultRow());

  wireSaveBar('about', async () => {
    const paragraphs = [...paraWrap.querySelectorAll('.para-text')].map(t => t.value).filter(v => v.trim());
    const results = [...resultsWrap.querySelectorAll('.item-card')].map(card => ({
      number: card.querySelector('.res-number').value,
      label: card.querySelector('.res-label').value
    })).filter(r => r.number || r.label);
    const body = {
      kicker: document.getElementById('a-kicker').value,
      title: document.getElementById('a-title').value,
      nowLine: document.getElementById('a-nowLine').value,
      paragraphs, results
    };
    const data = await apiPut('about', body);
    state.site.about = data.site.about;
  });
}

// ============ JOURNEY ============
function renderJourney(container) {
  const wrap = el(`<div class="panel"><div id="j-list"></div><button class="add-item-btn" id="j-add">+ Add role</button>${saveBarHTML('journey')}</div>`);
  container.appendChild(wrap);
  const list = wrap.querySelector('#j-list');

  function addItem(item = { date: '', role: '', org: '', orgNote: '', bullets: [''] }) {
    const card = el(`<div class="item-card">
      <div class="item-top"><span class="item-title">Role</span><button class="btn btn-danger btn-sm remove-item">Remove role</button></div>
      <div class="grid-2">
        <div class="field"><label>Date range</label><input class="j-date" value="${esc(item.date)}" placeholder="MARCH 2026 — PRESENT"></div>
        <div class="field"><label>Role title</label><input class="j-role" value="${esc(item.role)}"></div>
        <div class="field"><label>Organization</label><input class="j-org" value="${esc(item.org)}"></div>
        <div class="field"><label>Org note (industry / location)</label><input class="j-orgNote" value="${esc(item.orgNote)}"></div>
      </div>
      <div class="field"><label>Bullet points</label></div>
      <div class="j-bullets"></div>
      <button class="add-item-btn add-bullet" type="button">+ Add bullet</button>
    </div>`);
    card.querySelector('.remove-item').addEventListener('click', () => card.remove());
    const bulletsWrap = card.querySelector('.j-bullets');
    function addBullet(text = '') {
      const row = el(`<div class="chip-input-row" style="align-items:center;">
        <input class="j-bullet-text" style="flex:1;background:var(--ink);border:1px solid var(--line);border-radius:8px;padding:10px 12px;color:var(--cream);font-family:var(--font-body);font-size:13.5px;" value="${esc(text)}">
        <button class="btn btn-danger btn-sm remove-bullet" type="button">✕</button>
      </div>`);
      row.querySelector('.remove-bullet').addEventListener('click', () => row.remove());
      bulletsWrap.appendChild(row);
    }
    (item.bullets && item.bullets.length ? item.bullets : ['']).forEach(b => addBullet(b));
    card.querySelector('.add-bullet').addEventListener('click', () => addBullet(''));
    list.appendChild(card);
  }

  (state.site.journey || []).forEach(item => addItem(item));
  wrap.querySelector('#j-add').addEventListener('click', () => addItem());

  wireSaveBar('journey', async () => {
    const items = [...list.querySelectorAll(':scope > .item-card')].map(card => ({
      date: card.querySelector('.j-date').value,
      role: card.querySelector('.j-role').value,
      org: card.querySelector('.j-org').value,
      orgNote: card.querySelector('.j-orgNote').value,
      bullets: [...card.querySelectorAll('.j-bullet-text')].map(b => b.value).filter(v => v.trim())
    }));
    const data = await apiPut('journey', items);
    state.site.journey = data.site.journey;
  });
}

// ============ CRAFT ============
function renderCraft(container) {
  const wrap = el(`<div class="panel"><div id="c-list"></div><button class="add-item-btn" id="c-add">+ Add category</button>${saveBarHTML('craft')}</div>`);
  container.appendChild(wrap);
  const list = wrap.querySelector('#c-list');

  function addCategory(cat = { category: '', chips: [] }) {
    const card = el(`<div class="item-card">
      <div class="item-top"><span class="item-title">Category</span><button class="btn btn-danger btn-sm remove-item">Remove category</button></div>
      <div class="field"><label>Category name</label><input class="c-name" value="${esc(cat.category)}"></div>
      <div class="field"><label>Tools / skills (press Enter to add)</label></div>
      <div class="chip-input-row c-chips"></div>
      <input class="c-chip-input" placeholder="Type a skill and press Enter" style="width:100%;background:var(--ink);border:1px solid var(--line);border-radius:8px;padding:10px 12px;color:var(--cream);font-family:var(--font-body);font-size:13.5px;">
    </div>`);
    card.querySelector('.remove-item').addEventListener('click', () => card.remove());
    const chipsWrap = card.querySelector('.c-chips');
    function addChip(text) {
      if (!text.trim()) return;
      const chip = el(`<span class="chip-editable">${esc(text)}<button type="button">✕</button></span>`);
      chip.dataset.value = text;
      chip.querySelector('button').addEventListener('click', () => chip.remove());
      chipsWrap.appendChild(chip);
    }
    (cat.chips || []).forEach(addChip);
    const input = card.querySelector('.c-chip-input');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addChip(input.value); input.value = ''; }
    });
    list.appendChild(card);
  }

  (state.site.craft || []).forEach(cat => addCategory(cat));
  wrap.querySelector('#c-add').addEventListener('click', () => addCategory());

  wireSaveBar('craft', async () => {
    const items = [...list.querySelectorAll(':scope > .item-card')].map(card => ({
      category: card.querySelector('.c-name').value,
      chips: [...card.querySelectorAll('.chip-editable')].map(c => c.dataset.value)
    }));
    const data = await apiPut('craft', items);
    state.site.craft = data.site.craft;
  });
}

// ============ PROJECTS ============
function renderProjects(container) {
  const wrap = el(`<div class="panel"><div id="p-list"></div><button class="add-item-btn" id="p-add">+ Add project</button>${saveBarHTML('projects')}</div>`);
  container.appendChild(wrap);
  const list = wrap.querySelector('#p-list');

  function addProject(p = { id: '', title: '', description: '', image: '', tags: [], link: '', featured: false }) {
    const uid = p.id || ('proj-' + Math.random().toString(36).slice(2, 9));
    const card = el(`<div class="item-card" data-id="${uid}">
      <div class="item-top"><span class="item-title">Project</span><button class="btn btn-danger btn-sm remove-item">Remove</button></div>
      <div class="img-upload" style="margin-bottom:16px;">
        <div class="preview"><img class="p-img-preview" src="${p.image || ''}" alt=""></div>
        <input type="file" class="p-img-file" accept="image/*">
      </div>
      <div class="field"><label>Title</label><input class="p-title" value="${esc(p.title)}"></div>
      <div class="field"><label>Description</label><textarea class="p-desc">${esc(p.description)}</textarea></div>
      <div class="field"><label>Tags (press Enter to add)</label></div>
      <div class="chip-input-row p-chips"></div>
      <input class="p-chip-input" placeholder="Type a tag and press Enter" style="width:100%;margin-bottom:14px;background:var(--ink);border:1px solid var(--line);border-radius:8px;padding:10px 12px;color:var(--cream);font-family:var(--font-body);font-size:13.5px;">
      <div class="grid-2">
        <div class="field"><label>Link (optional)</label><input class="p-link" value="${esc(p.link)}" placeholder="https://..."></div>
        <div class="field"><label style="display:flex;align-items:center;gap:8px;margin-top:8px;"><input type="checkbox" class="p-featured" ${p.featured ? 'checked' : ''} style="width:auto;"> Mark as featured</label></div>
      </div>
    </div>`);
    card.querySelector('.remove-item').addEventListener('click', () => card.remove());

    let newImage = p.image || '';
    card.querySelector('.p-img-file').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      newImage = await fileToBase64(file);
      card.querySelector('.p-img-preview').src = newImage;
    });
    card._getImage = () => newImage;

    const chipsWrap = card.querySelector('.p-chips');
    function addChip(text) {
      if (!text.trim()) return;
      const chip = el(`<span class="chip-editable">${esc(text)}<button type="button">✕</button></span>`);
      chip.dataset.value = text;
      chip.querySelector('button').addEventListener('click', () => chip.remove());
      chipsWrap.appendChild(chip);
    }
    (p.tags || []).forEach(addChip);
    const input = card.querySelector('.p-chip-input');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addChip(input.value); input.value = ''; }
    });

    list.appendChild(card);
  }

  (state.site.projects || []).forEach(p => addProject(p));
  wrap.querySelector('#p-add').addEventListener('click', () => addProject());

  wireSaveBar('projects', async () => {
    const items = [...list.querySelectorAll(':scope > .item-card')].map(card => ({
      id: card.dataset.id,
      title: card.querySelector('.p-title').value,
      description: card.querySelector('.p-desc').value,
      image: card._getImage(),
      tags: [...card.querySelectorAll('.chip-editable')].map(c => c.dataset.value),
      link: card.querySelector('.p-link').value,
      featured: card.querySelector('.p-featured').checked
    }));
    const data = await apiPut('projects', items);
    state.site.projects = data.site.projects;
  });
}

// ============ EDUCATION & LANGUAGES ============
function renderEdu(container) {
  const edu = state.site.education;
  const panel = el(`<div class="panel">
    <h3>Education</h3>
    <div class="field"><label>Degree</label><input id="e-degree" value="${esc(edu.degree)}"></div>
    <div class="grid-2">
      <div class="field"><label>School</label><input id="e-school" value="${esc(edu.school)}"></div>
      <div class="field"><label>Years</label><input id="e-years" value="${esc(edu.years)}"></div>
    </div>
  </div>`);
  container.appendChild(panel);

  const panel2 = el(`<div class="panel">
    <h3>Languages</h3>
    <div id="l-list"></div>
    <button class="add-item-btn" id="l-add">+ Add language</button>
    ${saveBarHTML('edu')}
  </div>`);
  container.appendChild(panel2);
  const list = panel2.querySelector('#l-list');

  function addLang(l = { name: '', level: '', pct: 70 }) {
    const row = el(`<div class="item-card">
      <div class="item-top"><span class="item-title">Language</span><button class="btn btn-danger btn-sm remove-item">Remove</button></div>
      <div class="grid-2">
        <div class="field"><label>Name</label><input class="l-name" value="${esc(l.name)}"></div>
        <div class="field"><label>Level label</label><input class="l-level" value="${esc(l.level)}" placeholder="Fluent / Conversational"></div>
      </div>
      <div class="field"><label>Proficiency: <span class="l-pct-val">${l.pct}</span>%</label>
        <input type="range" class="l-pct" min="0" max="100" value="${l.pct}" style="width:100%;"></div>
    </div>`);
    row.querySelector('.remove-item').addEventListener('click', () => row.remove());
    const range = row.querySelector('.l-pct');
    range.addEventListener('input', () => row.querySelector('.l-pct-val').textContent = range.value);
    list.appendChild(row);
  }
  (state.site.languages || []).forEach(l => addLang(l));
  panel2.querySelector('#l-add').addEventListener('click', () => addLang());

  wireSaveBar('edu', async () => {
    const eduBody = {
      degree: document.getElementById('e-degree').value,
      school: document.getElementById('e-school').value,
      years: document.getElementById('e-years').value
    };
    const languages = [...list.querySelectorAll(':scope > .item-card')].map(card => ({
      name: card.querySelector('.l-name').value,
      level: card.querySelector('.l-level').value,
      pct: Number(card.querySelector('.l-pct').value)
    }));
    const [eduData, langData] = await Promise.all([
      apiPut('education', eduBody),
      apiPut('languages', languages)
    ]);
    state.site.education = eduData.site.education;
    state.site.languages = langData.site.languages;
  });
}

// ============ CONTACT ============
function renderContact(container) {
  const c = state.site.contact;
  const panel = el(`<div class="panel">
    <h3>Contact details</h3>
    <div class="field"><label>Intro line (lede)</label><textarea id="ct-lede">${esc(c.lede)}</textarea></div>
    <div class="grid-2">
      <div class="field"><label>Email</label><input id="ct-email" value="${esc(c.email)}"></div>
      <div class="field"><label>Phone</label><input id="ct-phone" value="${esc(c.phone)}"></div>
    </div>
    <div class="field"><label>Location</label><input id="ct-location" value="${esc(c.location)}"></div>
    ${saveBarHTML('contact')}
  </div>`);
  container.appendChild(panel);

  wireSaveBar('contact', async () => {
    const body = {
      lede: document.getElementById('ct-lede').value,
      email: document.getElementById('ct-email').value,
      phone: document.getElementById('ct-phone').value,
      location: document.getElementById('ct-location').value
    };
    const data = await apiPut('contact', body);
    state.site.contact = data.site.contact;
  });
}

// ============ THEME ============
function renderTheme(container) {
  const draft = state.themeDraft;

  const presetPanel = el(`<div class="panel">
    <h3>Palette</h3>
    <p class="panel-desc">Pick a preset, or choose Custom to set your own colors.</p>
    <div class="theme-presets" id="presetGrid"></div>
  </div>`);
  container.appendChild(presetPanel);
  const grid = presetPanel.querySelector('#presetGrid');

  function renderPresetCards() {
    grid.innerHTML = '';
    Object.entries(state.meta.themePresets).forEach(([key, preset]) => {
      const card = el(`<div class="theme-preset-card ${draft.preset === key ? 'active' : ''}" data-key="${key}">
        <div class="swatches">
          <i style="background:${preset.colors.ink}"></i><i style="background:${preset.colors.gold}"></i><i style="background:${preset.colors.maroon}"></i>
        </div>
        <div class="name">${esc(preset.label)}</div>
      </div>`);
      card.addEventListener('click', () => {
        draft.preset = key;
        previewTheme();
        renderPresetCards();
      });
      grid.appendChild(card);
    });
    const customCard = el(`<div class="theme-preset-card ${draft.preset === 'custom' ? 'active' : ''}" data-key="custom">
      <div class="swatches"><i style="background:${draft.custom.ink}"></i><i style="background:${draft.custom.gold}"></i><i style="background:${draft.custom.maroon}"></i></div>
      <div class="name">Custom</div>
    </div>`);
    customCard.addEventListener('click', () => { draft.preset = 'custom'; previewTheme(); renderPresetCards(); renderCustomColors(); });
    grid.appendChild(customCard);
  }

  const customPanel = el(`<div class="panel">
    <h3>Custom colors</h3>
    <p class="panel-desc">These apply when "Custom" is selected above.</p>
    <div class="custom-colors" id="customColors"></div>
  </div>`);
  container.appendChild(customPanel);
  const customColorsWrap = customPanel.querySelector('#customColors');

  const COLOR_LABELS = { ink: 'Background', panel: 'Panel', gold: 'Gold accent', maroon: 'Maroon accent', cream: 'Text', teal: 'Teal accent' };
  function renderCustomColors() {
    customColorsWrap.innerHTML = '';
    Object.keys(COLOR_LABELS).forEach(key => {
      const value = draft.custom[key] || '#000000';
      const field = el(`<div class="color-field">
        <label>${COLOR_LABELS[key]}</label>
        <div class="swatch-row">
          <input type="color" class="cc-${key}" value="${value}">
          <input type="text" class="cc-${key}-text" value="${value}">
        </div>
      </div>`);
      const colorInput = field.querySelector(`.cc-${key}`);
      const textInput = field.querySelector(`.cc-${key}-text`);
      colorInput.addEventListener('input', () => { textInput.value = colorInput.value; draft.custom[key] = colorInput.value; draft.preset = 'custom'; previewTheme(); renderPresetCards(); });
      textInput.addEventListener('change', () => { colorInput.value = textInput.value; draft.custom[key] = textInput.value; draft.preset = 'custom'; previewTheme(); renderPresetCards(); });
      customColorsWrap.appendChild(field);
    });
  }

  const typoPanel = el(`<div class="panel"><h3>Typography</h3><div class="type-presets" id="typoGrid"></div></div>`);
  container.appendChild(typoPanel);
  const typoGrid = typoPanel.querySelector('#typoGrid');
  function renderTypoCards() {
    typoGrid.innerHTML = '';
    Object.entries(state.meta.typographyPresets).forEach(([key, preset]) => {
      const card = el(`<div class="type-preset-card ${draft.typography === key ? 'active' : ''}" data-key="${key}">
        <div class="sample" style="font-family:${preset.display}">Aa</div>
        <div class="name">${esc(preset.label)}</div>
      </div>`);
      card.addEventListener('click', () => { draft.typography = key; previewTheme(); renderTypoCards(); });
      typoGrid.appendChild(card);
    });
  }

  const scalePanel = el(`<div class="panel">
    <h3>Text size</h3>
    <div class="scale-options" id="scaleOptions"></div>
    ${saveBarHTML('theme')}
  </div>`);
  container.appendChild(scalePanel);
  const scaleWrap = scalePanel.querySelector('#scaleOptions');
  function renderScaleOptions() {
    scaleWrap.innerHTML = '';
    Object.entries(state.meta.fontScales).forEach(([key, s]) => {
      const btn = el(`<button type="button" class="${draft.fontScale === key ? 'active' : ''}" data-key="${key}">${esc(s.label)}</button>`);
      btn.addEventListener('click', () => { draft.fontScale = key; previewTheme(); renderScaleOptions(); });
      scaleWrap.appendChild(btn);
    });
  }

  function previewTheme() {
    if (window.ThemeEngine) window.ThemeEngine.applyTheme(draft, state.meta);
  }

  renderPresetCards();
  renderCustomColors();
  renderTypoCards();
  renderScaleOptions();

  wireSaveBar('theme', async () => {
    const data = await apiPut('theme', draft);
    state.site.theme = data.site.theme;
    state.themeDraft = JSON.parse(JSON.stringify(data.site.theme));
  });
}

// ============ MESSAGES ============
async function renderMessages(container) {
  container.innerHTML = `<div class="loading-block">Loading messages…</div>`;
  let data;
  try {
    data = await fetch('/api/messages').then(r => r.json());
  } catch (e) {
    container.innerHTML = `<div class="panel">Failed to load messages.</div>`;
    return;
  }
  const messages = data.messages || [];
  container.innerHTML = '';

  if (!messages.length) {
    container.appendChild(el(`<div class="panel"><div class="empty-state">No messages yet. When someone submits your contact form, it'll show up here.</div></div>`));
    return;
  }

  const panel = el(`<div class="panel" id="msgPanel"></div>`);
  container.appendChild(panel);

  messages.forEach(m => {
    const item = el(`<div class="msg-item ${m.read ? '' : 'unread'}" data-id="${m.id}">
      <div class="msg-top">
        <div><span class="msg-from">${esc(m.name)}</span><br><span class="msg-email">${esc(m.email)}</span></div>
        <span class="msg-date">${new Date(m.createdAt).toLocaleString()}</span>
      </div>
      <p class="msg-body">${esc(m.message)}</p>
      <div class="msg-actions">
        <button class="btn btn-ghost btn-sm toggle-read">${m.read ? 'Mark unread' : 'Mark read'}</button>
        <button class="btn btn-danger btn-sm delete-msg">Delete</button>
        <a class="btn btn-ghost btn-sm" href="mailto:${esc(m.email)}">Reply by email</a>
      </div>
    </div>`);
    item.querySelector('.toggle-read').addEventListener('click', async () => {
      await fetch(`/api/messages/${m.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ read: !m.read }) });
      renderMessages(container);
      updateMessagesBadge();
    });
    item.querySelector('.delete-msg').addEventListener('click', async () => {
      if (!confirm('Delete this message permanently?')) return;
      await fetch(`/api/messages/${m.id}`, { method: 'DELETE' });
      renderMessages(container);
      updateMessagesBadge();
    });
    panel.appendChild(item);
  });
}

// ============ ACCOUNT ============
function renderAccount(container) {
  const panel = el(`<div class="panel">
    <h3>Login email</h3>
    <p class="panel-desc">Currently: <b style="color:var(--cream)">${esc(state.adminEmail)}</b></p>
    <div class="alert alert-err" id="email-err"></div>
    <div class="alert alert-ok" id="email-ok"></div>
    <div class="field"><label>New email</label><input type="email" id="acc-newEmail"></div>
    <div class="field"><label>Current password</label><input type="password" id="acc-emailPassword"></div>
    <button class="btn btn-primary btn-sm" id="acc-emailSave">Update email</button>
  </div>`);
  container.appendChild(panel);

  const panel2 = el(`<div class="panel">
    <h3>Password</h3>
    <div class="alert alert-err" id="pw-err"></div>
    <div class="alert alert-ok" id="pw-ok"></div>
    <div class="field"><label>Current password</label><input type="password" id="acc-currentPw"></div>
    <div class="grid-2">
      <div class="field"><label>New password</label><input type="password" id="acc-newPw"></div>
      <div class="field"><label>Confirm new password</label><input type="password" id="acc-confirmPw"></div>
    </div>
    <button class="btn btn-primary btn-sm" id="acc-pwSave">Update password</button>
  </div>`);
  container.appendChild(panel2);

  panel.querySelector('#acc-emailSave').addEventListener('click', async () => {
    const errBox = document.getElementById('email-err'), okBox = document.getElementById('email-ok');
    errBox.classList.remove('show'); okBox.classList.remove('show');
    try {
      const res = await fetch('/api/auth/change-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: document.getElementById('acc-newEmail').value, currentPassword: document.getElementById('acc-emailPassword').value })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      state.adminEmail = data.email;
      okBox.textContent = 'Email updated.'; okBox.classList.add('show');
      toast('Email updated.');
      renderAccount(container);
    } catch (err) {
      errBox.textContent = err.message; errBox.classList.add('show');
    }
  });

  panel2.querySelector('#acc-pwSave').addEventListener('click', async () => {
    const errBox = document.getElementById('pw-err'), okBox = document.getElementById('pw-ok');
    errBox.classList.remove('show'); okBox.classList.remove('show');
    const newPw = document.getElementById('acc-newPw').value;
    const confirmPw = document.getElementById('acc-confirmPw').value;
    if (newPw !== confirmPw) { errBox.textContent = 'New passwords do not match.'; errBox.classList.add('show'); return; }
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: document.getElementById('acc-currentPw').value, newPassword: newPw })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      okBox.textContent = 'Password updated.'; okBox.classList.add('show');
      toast('Password updated.');
      document.getElementById('acc-currentPw').value = '';
      document.getElementById('acc-newPw').value = '';
      document.getElementById('acc-confirmPw').value = '';
    } catch (err) {
      errBox.textContent = err.message; errBox.classList.add('show');
    }
  });
}

init();
