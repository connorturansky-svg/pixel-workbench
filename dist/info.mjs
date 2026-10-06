import {
  APP_VERSION,
  CHANGELOG,
  HOW_TO_USE,
  ABOUT,
  SHORTCUTS,
  ARCHITECTURE_NOTES,
  SUGGEST_GUIDE
} from './version.mjs?v=0.72.0';

const E = s =>
  String(s ?? '').replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
const TABS = [
  ['how', 'How to use'],
  ['suggest', 'Suggest a feature'],
  ['new', "What's new"],
  ['arch', 'Architecture'],
  ['keys', 'Shortcuts']
];
let dialog,
  tab = 'how';

const box = (x, y, w, h, title, sub, cls = '') =>
  `<g class="arch-node ${cls}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/><text x="${x + w / 2}" y="${y + (sub ? h / 2 - 4 : h / 2 + 5)}" class="t">${E(title)}</text>${sub ? `<text x="${x + w / 2}" y="${y + h / 2 + 13}" class="s">${E(sub)}</text>` : ''}</g>`;
const line = (x1, y1, x2, y2, label = '') =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#arch-arrow)"/>${label ? `<text x="${(x1 + x2) / 2 + 6}" y="${(y1 + y2) / 2 - 4}" class="l">${E(label)}</text>` : ''}`;

function diagram() {
  return `<svg class="arch-diagram" viewBox="0 0 820 560" role="img" aria-label="Pixel Workbench architecture diagram">
<defs><marker id="arch-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker></defs>
<rect class="arch-zone" x="10" y="10" width="800" height="62" rx="10"/><text class="z" x="24" y="30">HOSTING</text>
${box(150, 24, 240, 40, 'GitHub repo · dist/', 'static files, no build step', 'host')}${box(450, 24, 240, 40, 'GitHub Pages', 'Actions workflow on push to main', 'host')}
${line(390, 44, 448, 44)}
<rect class="arch-zone" x="10" y="86" width="800" height="300" rx="10"/><text class="z" x="24" y="106">BROWSER (device-local)</text>
${box(300, 100, 220, 44, 'index.html', 'loads CSS + app.js module', '')}
${box(300, 170, 220, 48, 'app.js', 'state, notifications & pages', 'core')}
${line(410, 144, 410, 168)}
${box(30, 250, 170, 48, 'model.mjs', 'pixels, power, wire drop', 'calc')}
${box(215, 250, 190, 48, 'wiring-graph.mjs', 'illustrated drag wiring', 'ui')}
${box(420, 250, 190, 48, 'room.js · installation-room', 'room presentation & edge routing', 'ui')}
${box(625, 250, 170, 48, 'installation-ui.mjs', 'controller + button builders', 'ui')}
${box(30, 320, 170, 48, 'layout-model.mjs', 'scene & props', 'calc')}
${box(215, 320, 190, 48, 'installation-model.mjs', 'boxes, standards sync, routes', 'calc')}
${box(420, 320, 190, 48, 'demo-project.mjs', 'disposable sample', 'calc')}
${box(625, 320, 170, 48, 'version · info · suggest', 'changelog, i dialog, requests', 'ui')}
${line(360, 218, 115, 248)}${line(390, 218, 310, 248)}${line(430, 218, 515, 248)}${line(460, 218, 710, 248)}
<rect class="arch-zone" x="10" y="400" width="800" height="60" rx="10"/><text class="z" x="24" y="420">PERSISTENCE &amp; OUTPUT</text>
${box(210, 410, 180, 40, 'localStorage', 'project + standards library', 'store')}
${box(410, 410, 180, 40, 'Project JSON', 'export / import backup', 'store')}
${box(610, 410, 180, 40, 'Guide · CSV · BOM', 'print & field sheets', 'store')}
${line(300, 376, 300, 408)}${line(500, 376, 500, 408)}${line(700, 376, 700, 408)}
<rect class="arch-zone" x="10" y="474" width="800" height="76" rx="10"/><text class="z" x="24" y="494">FEATURE REQUESTS</text>
${box(30, 500, 150, 42, 'GitHub issue', '#n title, replies', 'host')}${box(215, 500, 175, 42, 'builder.py (build PC)', 'allowed target / feature', 'core')}${box(425, 500, 170, 42, 'Restore / Copilot', 'any verified tag / AI', 'calc')}${box(630, 500, 165, 42, 'Checks + push', 'tests, cost, new tag, Pages', 'host')}
${line(180, 521, 213, 521)}${line(390, 521, 423, 521)}${line(595, 521, 628, 521)}
</svg>`;
}

function body() {
  if (tab === 'how')
    return `<div class="info-about"><strong>About</strong><p>${E(ABOUT)}</p></div>${HOW_TO_USE.map(([t, c]) => `<div class="info-step"><strong>${E(t)}</strong><p>${E(c)}</p></div>`).join('')}`;
  if (tab === 'suggest')
    return SUGGEST_GUIDE.map(
      ([t, c]) => `<div class="info-step"><strong>${E(t)}</strong><p>${E(c)}</p></div>`
    ).join('');
  if (tab === 'new')
    return CHANGELOG.map(
      c =>
        `<div class="info-release"><div class="info-release-head"><strong>v${E(c.version)}</strong>${c.date ? `<span>${E(c.date)}</span>` : ''}</div><ul>${c.items.map(i => `<li>${E(i)}</li>`).join('')}</ul></div>`
    ).join('');
  if (tab === 'arch')
    return (
      diagram() + `<ul class="info-notes">${ARCHITECTURE_NOTES.map(n => `<li>${E(n)}</li>`).join('')}</ul>`
    );
  return `<table class="info-keys"><tbody>${SHORTCUTS.map(
    ([k, d]) =>
      `<tr><td>${k
        .split(' + ')
        .map(x => `<kbd>${E(x)}</kbd>`)
        .join(' + ')}</td><td>${E(d)}</td></tr>`
  ).join('')}</tbody></table>`;
}

function paint() {
  dialog.querySelector('.info-tabs').innerHTML = TABS.map(
    ([id, label]) =>
      `<button type="button" role="tab" data-info-tab="${id}" aria-selected="${id === tab}" class="${id === tab ? 'active' : ''}">${label}</button>`
  ).join('');
  const panel = dialog.querySelector('.info-body');
  panel.innerHTML = body();
  panel.scrollTop = 0;
}

export function openInfo(which = 'how') {
  tab = TABS.some(t => t[0] === which) ? which : 'how';
  paint();
  if (!dialog.open) dialog.showModal();
}

export function installInfo() {
  dialog = document.createElement('dialog');
  dialog.id = 'info-dialog';
  dialog.setAttribute('aria-labelledby', 'info-title');
  dialog.innerHTML = `<header class="info-head"><h2 id="info-title">Pixel Workbench <small>v${E(APP_VERSION)}</small></h2><button type="button" class="info-close" data-info-close aria-label="Close">×</button></header><nav class="info-tabs" role="tablist" aria-label="Info sections"></nav><div class="info-body" role="tabpanel"></div>`;
  document.body.append(dialog);
  dialog.addEventListener('click', e => {
    const t = e.target.closest('[data-info-tab]');
    if (t) {
      tab = t.dataset.infoTab;
      paint();
      return;
    }
    if (e.target.closest('[data-info-close]') || e.target === dialog) dialog.close();
  });
  document.addEventListener(
    'click',
    e => {
      const b = e.target.closest('[data-info]');
      if (b) {
        e.preventDefault();
        e.stopPropagation();
        openInfo(b.dataset.info);
      }
    },
    true
  );
  document.addEventListener('keydown', e => {
    if (e.key !== '?' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    e.preventDefault();
    openInfo('keys');
  });
}
