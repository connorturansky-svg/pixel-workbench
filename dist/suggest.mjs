import { APP_VERSION } from './version.mjs?v=0.51.0';

// Suggest a feature: submits a `[Feature]` GitHub issue in the background under the requester's own GitHub account
// (a token they connect once, kept only in this browser and sent only to api.github.com). Screenshots are uploaded
// to the repo's `feature-assets` branch, which is never deployed. The page also lists each request's build status.
// The builder on the owner's PC (automation/builder.py) picks each issue up, builds it, tests it and publishes it.
export const REPO = 'connorturansky-svg/pixel-workbench';
// Only these GitHub accounts' requests are built (automation/builder.py ALLOWED_AUTHORS must match).
export const ALLOWED_AUTHORS = ['J-Turansky', 'connorturansky-svg'];
const allowed = u => ALLOWED_AUTHORS.some(a => a.toLowerCase() === String(u || '').toLowerCase());
// Builder commits are titled `vX.Y.Z: <title> (#n)`, which maps each shipped request to its release.
export function versionsFrom(commits) {
  const m = {};
  for (const c of commits || []) {
    const r = /^v(\d+\.\d+\.\d+):.*\(#(\d+)\)\s*$/.exec(String(c?.commit?.message || '').split('\n')[0]);
    if (r && !m[r[2]]) m[r[2]] = r[1];
  }
  return m;
}
const MAX_IMAGES = 6,
  MAX_BYTES = 10 * 1024 * 1024,
  CACHE_MS = 60000,
  KEY = 'pw-suggest-status-2';
const E = s =>
  String(s ?? '').replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
const testing = new URLSearchParams(location.search).has('test');
const draft = { title: '', desc: '', images: [] },
  AUTH_KEY = 'pw-gh-auth',
  ASSETS = 'feature-assets',
  API = `https://api.github.com/repos/${REPO}`;
let auth = (() => {
  try {
    const a = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    return a?.token && a?.login ? a : null;
  } catch {
    return null;
  }
})();
let sub = { state: 'idle', msg: '', number: 0, url: '' },
  connect = { open: false, busy: false, error: '' };
const TOKEN_URL =
  'https://github.com/settings/tokens/new?scopes=public_repo&description=Pixel%20Workbench%20feature%20requests';
const gh = (url, opts = {}) =>
  fetch(url.startsWith('http') ? url : API + url, {
    ...opts,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(auth ? { Authorization: `Bearer ${auth.token}` } : {}),
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      ...opts.headers
    }
  });
const ready = () => draft.title.trim().length >= 5 && draft.desc.trim().length >= 15;
export const FOLLOW_UP_DAYS = 7; // automation/builder.py FOLLOW_UP_DAYS must match
let list = { state: 'idle', items: [], error: '', at: 0 },
  toast = () => {},
  stage = 'all';
// Status-pane tabs: the build stages in order, plus failed/needs-info requests (shown only when there are any).
const STAGES = [
  ['all', 'All', () => true],
  ['queued', 'Queued', s => s === 'queued'],
  ['building', 'Building', s => s === 'building'],
  ['tested', 'Tested', s => s === 'tested'],
  ['shipped', 'Shipped', s => s === 'shipped'],
  ['attention', 'Needs attention', s => s === 'failed' || s === 'info']
];
const stageOf = k => STAGES.find(x => x[0] === k) || STAGES[0];
function stagesHtml() {
  const n = k => list.items.filter(i => stageOf(k)[2](statusOf(i))).length;
  if (stage === 'attention' && !n('attention')) stage = 'all';
  return STAGES.filter(([k]) => k !== 'attention' || n(k))
    .map(
      ([k, label]) =>
        `<button type="button" role="tab" class="sg-stage${k === 'all' ? ' sg-stage-all' : ''}${k === 'attention' ? ' sg-stage-warn' : ''}" aria-selected="${stage === k}" data-sg="stage:${k}">${label} <span class="sg-stage-n">${n(k)}</span></button>`
    )
    .join('');
}

const STATUS = {
  queued: ['Queued', 'Waiting for the builder (it checks every 5 minutes).'],
  building: ['Building', 'Being built and tested on the build PC.'],
  tested: ['Tested', 'Passed every check; being published to the site.'],
  shipped: ['Shipped', 'Live on the site. Reload the page to get it.'],
  failed: ['Build failed', 'Not released. The issue says why.'],
  info: ['Needs info', 'The builder asked a question on the issue.'],
  declined: ['Declined', 'Out of scope or unsafe. The issue says why.'],
  closed: ['Closed', 'Closed without a build.']
};
const date = s => {
  const d = new Date(s);
  return isNaN(d)
    ? ''
    : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};
function statusOf(i) {
  const l = new Set((i.labels || []).map(x => x.name));
  if (l.has('shipped')) return 'shipped';
  if (l.has('declined')) return 'declined';
  if (l.has('build-failed')) return 'failed';
  if (l.has('needs-info')) return 'info';
  if (l.has('tested')) return 'tested';
  if (l.has('in-progress')) return 'building';
  return i.state === 'closed' ? 'closed' : 'queued';
}

function issueBody(shots) {
  return `<!-- pixel-workbench-feature -->\n### What should it do?\n${draft.desc.trim().slice(0, 5000)}\n\n### Screenshots\n${shots.length ? shots.map((u, i) => `![Screenshot ${i + 1}](${u})`).join('\n\n') : '_None_'}\n\n---\n_Suggested from Pixel Workbench v${APP_VERSION}_`;
}
const toBase64 = blob =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1]);
    r.onerror = () => rej(new Error('read'));
    r.readAsDataURL(blob);
  });
const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' };
async function fail(r, what) {
  if (r.status === 401) {
    auth = null;
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {}
    throw new Error('Your GitHub connection has expired. Connect GitHub again, then select Submit.');
  }
  let m = '';
  try {
    m = (await r.json()).message || '';
  } catch {}
  throw new Error(`GitHub couldn't ${what} (${r.status}${m ? ': ' + m : ''}).`);
}

async function submit() {
  if (!ready() || sub.state === 'sending') return;
  if (!auth) {
    connect.open = true;
    paint();
    return;
  }
  const title = draft.title.replace(/\s+/g, ' ').trim().slice(0, 100),
    folder = `requests/${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}-${auth.login}`;
  sub = { state: 'sending', msg: 'Submitting…', number: 0, url: '' };
  paint();
  try {
    const shots = [];
    for (const [i, im] of draft.images.entries()) {
      sub.msg = `Uploading screenshot ${i + 1} of ${draft.images.length}…`;
      paint();
      const r = await gh(`/contents/${folder}/${i + 1}.${EXT[im.blob.type] || 'png'}`, {
        method: 'PUT',
        body: JSON.stringify({
          message: `Screenshot for feature request: ${title}`,
          content: await toBase64(im.blob),
          branch: ASSETS
        })
      });
      if (!r.ok) await fail(r, 'upload a screenshot');
      shots.push((await r.json()).content.download_url);
    }
    sub.msg = 'Creating the request…';
    paint();
    const r = await gh('/issues', {
      method: 'POST',
      body: JSON.stringify({
        title: '[Feature] ' + title,
        body: issueBody(shots),
        labels: ['feature-request']
      })
    });
    if (!r.ok) await fail(r, 'create the request');
    const issue = await r.json();
    try {
      const nt = numberedTitle(issue.title, issue.number),
        pr = await gh(`/issues/${issue.number}`, { method: 'PATCH', body: JSON.stringify({ title: nt }) });
      if (pr.ok) issue.title = nt;
    } catch {}
    draft.images.forEach(im => URL.revokeObjectURL(im.url));
    Object.assign(draft, { title: '', desc: '', images: [] });
    sub = { state: 'done', msg: '', number: issue.number, url: issue.html_url };
    list = { ...list, items: [issue, ...list.items.filter(x => x.number !== issue.number)] };
    try {
      sessionStorage.removeItem(KEY);
    } catch {}
  } catch (e) {
    sub = { state: 'error', msg: e.message || 'Network error. Try again.', number: 0, url: '' };
  }
  paint();
}

async function doConnect() {
  const input = document.querySelector('[data-sg-token]'),
    token = (input?.value || '').trim();
  if (!token) {
    connect.error = 'Paste your token first.';
    paint();
    return;
  }
  connect = { ...connect, busy: true, error: '' };
  paint();
  try {
    const r = await fetch('https://api.github.com/user', {
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}` }
    });
    if (r.status === 401) throw new Error("GitHub didn't accept that token. Check you copied all of it.");
    if (!r.ok) throw new Error(`GitHub returned ${r.status}. Try again.`);
    const login = (await r.json()).login;
    if (!allowed(login))
      throw new Error(
        `@${login} isn't an approved account. Requests are limited to ${ALLOWED_AUTHORS.join(' and ')}.`
      );
    auth = { token, login };
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    } catch {}
    const go = connect.open && ready() && sub.state !== 'done';
    connect = { open: false, busy: false, error: '' };
    toast(`Connected as @${login}.`);
    paint();
    if (go) submit();
  } catch (e) {
    connect = { ...connect, busy: false, error: e.message };
    paint();
    const el = document.querySelector('[data-sg-token]');
    if (el) {
      el.value = token;
      el.focus();
    }
  }
}

function connectHtml() {
  if (auth)
    return `<p class="sg-who">Submitting as <b>@${E(auth.login)}</b> · <button type="button" class="text-btn" data-sg="disconnect">Disconnect</button></p>`;
  if (!connect.open)
    return `<p class="sg-who">One-time setup: <button type="button" class="text-btn" data-sg="connect">Connect GitHub</button> so requests can be submitted from here.</p>`;
  return `<div class="sg-connect"><strong>Connect GitHub (one time)</strong><ol><li><a href="${TOKEN_URL}" target="_blank" rel="noopener">Create a token on GitHub</a>. Only <i>public_repo</i> is selected; choose an expiry, then select <b>Generate token</b> and copy it.</li><li>Paste it here. It's kept only in this browser and only sent to GitHub.</li></ol><div class="sg-connect-row"><input type="password" autocomplete="off" spellcheck="false" placeholder="ghp_…" data-sg-token aria-label="GitHub token"><button type="button" class="btn" data-sg="save-token" ${connect.busy ? 'disabled' : ''}>${connect.busy ? 'Checking…' : 'Connect'}</button></div>${connect.error ? `<p class="sg-error">${E(connect.error)}</p>` : ''}</div>`;
}

function resultHtml() {
  if (sub.state === 'done')
    return `<div class="sg-done" role="status"><strong>Submitted as #${sub.number}.</strong> It's queued, and the builder picks it up within 5 minutes. Follow its status on the right.</div>`;
  if (sub.state === 'error') return `<p class="sg-error" role="alert">${E(sub.msg)}</p>`;
  return '';
}

function imagesHtml() {
  if (!draft.images.length) return '';
  return `<div class="sg-thumbs">${draft.images.map((im, i) => `<figure class="sg-thumb"><img src="${im.url}" alt="${E(im.name)}"><figcaption><span title="${E(im.name)}">${E(im.name)}</span><span class="sg-thumb-actions"><button type="button" class="text-btn" data-sg="remove:${i}" aria-label="Remove ${E(im.name)}">Remove</button></span></figcaption></figure>`).join('')}</div>`;
}

const fmtTok = n =>
  n >= 1e6
    ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M'
    : n >= 1e3
      ? Math.round(n / 1e3) + 'k'
      : String(Math.round(n));
const fmtCredits = c => Math.round(c).toLocaleString('en-GB');
const fmtTime = s => (s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);
export const RECENT_DAYS = 28;
export function costSummary(data, now = Date.now()) {
  const rate = Number(data?.creditUsd) || 0.01,
    by = {},
    tot = { credits: 0, tokens: 0, builds: 0, shipped: 0 },
    recent = { credits: 0, tokens: 0, builds: 0 },
    cut = now - RECENT_DAYS * 864e5;
  for (const b of Array.isArray(data?.builds) ? data.builds : []) {
    const c = Number(b.credits) || 0,
      ti = Number(b.tokensIn) || 0,
      to = Number(b.tokensOut) || 0,
      x =
        by[b.issue] ||
        (by[b.issue] = {
          credits: 0,
          tokensIn: 0,
          tokensCached: 0,
          tokensOut: 0,
          seconds: 0,
          attempts: 0,
          model: ''
        });
    x.credits += c;
    x.tokensIn += ti;
    x.tokensOut += to;
    x.tokensCached += Number(b.tokensCached) || 0;
    x.seconds += Number(b.seconds) || 0;
    x.attempts++;
    if (b.model) x.model = b.model;
    tot.credits += c;
    tot.tokens += ti + to;
    tot.builds++;
    if (b.outcome === 'shipped') tot.shipped++;
    if (Date.parse(b.at) > cut) {
      recent.credits += c;
      recent.tokens += ti + to;
      recent.builds++;
    }
  }
  return { rate, by, tot, recent };
}
const usd = (c, rate) => '$' + (Math.round(c) * rate).toFixed(2);
function costHtml(n) {
  const s = list.cost,
    x = s?.by?.[n];
  if (!x) return '';
  const help = `Model: ${x.model || 'unknown'}\nTokens: ${fmtTok(x.tokensIn)} in (${fmtTok(x.tokensCached)} cached) + ${fmtTok(x.tokensOut)} out\nAgent time: ${fmtTime(x.seconds)}${x.attempts > 1 ? `\nIncludes ${x.attempts} build attempts` : ''}\n1 AI credit = $${s.rate} (GitHub’s rate)`;
  return `<span class="sg-cost" title="${E(help)}">Est. ${fmtTok(x.tokensIn + x.tokensOut)} tokens · ${fmtCredits(x.credits)} credits · ${usd(x.credits, s.rate)}</span>`;
}
export const DAILY_CREDIT_LIMIT = 5000;
export function usageNow(u, now = Date.now()) {
  if (!u) return null;
  const lim = Number(u.limit) || DAILY_CREDIT_LIMIT,
    cut = now - 864e5;
  const b = (Array.isArray(u.builds) ? u.builds : [])
    .filter(x => Date.parse(x.at) > cut)
    .sort((a, c) => Date.parse(a.at) - Date.parse(c.at));
  const used = b.reduce((s, x) => s + (Number(x.credits) || 0), 0);
  let resume = null;
  if (used >= lim) {
    let r = used;
    for (const x of b) {
      r -= Number(x.credits) || 0;
      if (r < lim) {
        resume = Date.parse(x.at) + 864e5;
        break;
      }
    }
  }
  return { lim, used, resume };
}
function whenText(ms) {
  const d = new Date(ms),
    t = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return d.toDateString() === new Date().toDateString() ? t : `${t} tomorrow`;
}
function limitHtml() {
  const u = usageNow(list.usage);
  if (!u) return '';
  const pct = Math.min(100, (u.used / u.lim) * 100),
    full = u.used >= u.lim,
    cls = full ? ' full' : pct >= 80 ? ' near' : '';
  return `<div class="sg-limit${cls}" role="group" aria-label="Daily build allowance"><div class="sg-limit-row"><span><b>Daily build allowance</b> · <span title="AI credits used by all builds in the last 24 hours">${fmtCredits(u.used)} of ${fmtCredits(u.lim)} credits, last 24h</span></span><span>${Math.round(pct)}%</span></div><div class="sg-limit-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${u.lim}" aria-valuenow="${Math.round(u.used)}"><i style="width:${pct.toFixed(1)}%"></i></div>${full ? `<p>Limit reached. Requests stay queued and building restarts${u.resume ? ` at about ${whenText(u.resume)}` : ' when older builds drop out of the 24-hour window'}.</p>` : ''}</div>`;
}
function recentHtml(s) {
  const r = s?.recent;
  if (!r) return '';
  return `<div class="sg-limit sg-recent" role="group" aria-label="Last ${RECENT_DAYS} days"><div class="sg-limit-row"><span><b>Last ${RECENT_DAYS} days</b> · <span title="AI usage of builds in the last ${RECENT_DAYS} days, read from build-costs.json">${fmtCredits(r.credits)} credits · ${usd(r.credits, s.rate)} · ${fmtTok(r.tokens)} tokens</span></span><span>${r.builds} build${r.builds === 1 ? '' : 's'}</span></div></div>`;
}
function spendHtml() {
  const s = list.cost;
  if (!s?.tot?.builds) return limitHtml();
  const t = s.tot,
    other = t.builds - t.shipped;
  return `<div class="sg-spend" title="AI usage of every automatic build, read from build-costs.json. 1 AI credit = $${s.rate} (GitHub’s rate).">
<div><b>${fmtCredits(t.credits)}</b><span>AI credits</span></div><div><b>${usd(t.credits, s.rate)}</b><span>est. cost</span></div><div><b>${fmtTok(t.tokens)}</b><span>tokens</span></div><div><b>${t.builds}</b><span>build${t.builds === 1 ? '' : 's'}${other ? ` (${other} not shipped)` : ''}</span></div></div>${recentHtml(s)}${limitHtml()}`;
}
const mine = i => !!auth && String(i.user?.login || '').toLowerCase() === auth.login.toLowerCase();
const REPLIED_KEY = 'pw-sg-replied';
let replied = (() => {
    try {
      return JSON.parse(localStorage.getItem(REPLIED_KEY) || '{}') || {};
    } catch {
      return {};
    }
  })(),
  reply = { open: 0, text: '', busy: false, error: '', notes: {} };
// The status a reply was sent from; once the builder changes the status, the request needs nothing from the user.
const repliedNow = i => replied[i.number] && replied[i.number] === statusOf(i) + '|' + (i.closed_at || '');
// Requests waiting on their requester: a builder question, or a failed build to retry.
export const needsReply = i => mine(i) && ['info', 'failed'].includes(statusOf(i)) && !repliedNow(i);
// Shipped requests can take a follow-up comment for a few days; the builder reopens and rebuilds them.
const canFollowUp = i =>
  mine(i) &&
  statusOf(i) === 'shipped' &&
  Date.now() - new Date(i.closed_at || 0).getTime() < FOLLOW_UP_DAYS * 86400000 &&
  !repliedNow(i);
export function attentionItems() {
  return list.items.filter(needsReply);
}
export function bellHtml() {
  const n = attentionItems().length;
  if (!n) return '<span data-sg-bell hidden></span>';
  return `<button type="button" class="btn sg-bell" data-action="page:suggest" data-sg-bell title="${n} feature request${n > 1 ? 's need' : ' needs'} your reply" aria-label="${n} feature request${n > 1 ? 's need' : ' needs'} your reply"><span aria-hidden="true">🔔</span><span class="sg-bell-n">${n}</span></button>`;
}
function replyHtml(i) {
  const s = statusOf(i),
    due = needsReply(i),
    follow = canFollowUp(i);
  if (replied[i.number] && repliedNow(i))
    return `<p class="sg-replied">Reply sent. The builder picks it up within 5 minutes.</p>`;
  if (!due && !follow) return '';
  const label = s === 'info' ? 'Answer the question' : s === 'failed' ? 'Reply to retry' : 'Add a follow-up';
  if (reply.open !== i.number)
    return `<button type="button" class="text-btn sg-reply-open${due ? ' sg-reply-due' : ''}" data-sg="reply:${i.number}">${label}</button>`;
  const note = reply.notes[i.number],
    lead =
      s === 'shipped'
        ? `Missed something? Describe what still needs changing. The builder reopens #${i.number} and builds it as a new version (within ${FOLLOW_UP_DAYS} days of shipping).`
        : s === 'info'
          ? 'The builder needs more detail before it can build this.'
          : 'Add detail or corrections, and the builder tries again.';
  return `<div class="sg-reply"><p>${E(lead)}</p>${note === undefined ? '<p class="sg-note">Loading the builder’s latest message…</p>' : note ? `<blockquote class="sg-note">${E(note)}</blockquote>` : ''}<textarea rows="4" maxlength="4000" data-sg-field="reply" aria-label="Your reply to #${i.number}" placeholder="${s === 'shipped' ? 'e.g. The main ask was … which still isn’t there.' : 'Your answer'}">${E(reply.text)}</textarea>${reply.error ? `<p class="sg-error">${E(reply.error)}</p>` : ''}<div class="sg-reply-actions"><button type="button" class="btn primary" data-sg="send-reply:${i.number}" ${reply.busy || reply.text.trim().length < 5 ? 'disabled' : ''}>${reply.busy ? 'Sending…' : 'Send'}</button><button type="button" class="text-btn" data-sg="reply-cancel">Cancel</button></div></div>`;
}
async function loadNote(n) {
  try {
    const r = await fetch(`${API}/issues/${n}/comments?per_page=100`, {
      headers: { Accept: 'application/vnd.github+json' }
    });
    const c = r.ok ? (await r.json()).filter(x => /<!-- pw-builder -->/.test(x.body || '')) : [];
    reply.notes[n] = c.length
      ? c[c.length - 1].body
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/\*\*/g, '')
          .trim()
          .slice(0, 1200)
      : '';
  } catch {
    reply.notes[n] = '';
  }
  paintList();
}
async function sendReply(n) {
  const i = list.items.find(x => x.number === n),
    text = reply.text.trim();
  if (!i || !auth || text.length < 5 || reply.busy) return;
  reply = { ...reply, busy: true, error: '' };
  paintList();
  try {
    const r = await gh(`/issues/${n}/comments`, { method: 'POST', body: JSON.stringify({ body: text }) });
    if (!r.ok) await fail(r, 'post your reply');
    replied[n] = statusOf(i) + '|' + (i.closed_at || '');
    try {
      localStorage.setItem(REPLIED_KEY, JSON.stringify(replied));
    } catch {}
    reply = { open: 0, text: '', busy: false, error: '', notes: reply.notes };
    toast(`Reply sent on #${n}. The builder picks it up within 5 minutes.`);
  } catch (e) {
    reply = { ...reply, busy: false, error: e.message || 'Network error. Try again.' };
  }
  paintList();
}
export const titleText = t =>
  String(t || '')
    .replace(/^\s*\[Feature\]\s*/i, '')
    .replace(/^#\d+\b\s*[:\-–]?\s*/, '');
export const numberedTitle = (t, n) => `[Feature] #${n} ${titleText(t)}`;
function listHtml() {
  if (list.state === 'loading' && !list.items.length) return '<p class="empty">Loading requests…</p>';
  if (list.state === 'error' && !list.items.length)
    return `<p class="empty">Couldn't load the request list (${E(list.error)}). <a href="https://github.com/${REPO}/issues?q=%5BFeature%5D" target="_blank" rel="noopener">See them on GitHub</a>.</p>`;
  if (!list.items.length) return '<p class="empty">No feature requests yet. Be the first.</p>';
  const [, stageLabel, match] = stageOf(stage),
    shown = list.items.filter(i => match(statusOf(i)));
  if (!shown.length)
    return `<p class="empty">Nothing is ${stage === 'attention' ? 'waiting for attention' : stageLabel.toLowerCase()} right now.</p>`;
  return `<ul class="sg-list">${shown
    .map(i => {
      const s = statusOf(i),
        [label, help] = STATUS[s];
      return `<li class="sg-item${needsReply(i) ? ' sg-item-due' : ''}"><span class="sg-state"><span class="sg-pill sg-${s}" title="${E(help)}">${label}</span>${s === 'shipped' && list.versions?.[i.number] ? `<a class="sg-ver" href="https://github.com/${REPO}/releases/tag/v${E(list.versions[i.number])}" target="_blank" rel="noopener" title="Released in this version">v${E(list.versions[i.number])}</a>` : ''}</span><div class="sg-item-main"><a href="${E(i.html_url)}" target="_blank" rel="noopener"><span class="sg-num">#${i.number}</span> ${E(titleText(i.title))}</a><small>${E(i.user?.login || '')} · ${date(i.created_at)}${s === 'shipped' && i.closed_at ? ` · shipped ${date(i.closed_at)}` : ''}${i.comments ? ` · ${i.comments} comment${i.comments > 1 ? 's' : ''}` : ''}</small>${s === 'shipped' ? costHtml(i.number) : ''}${replyHtml(i)}</div></li>`;
    })
    .join('')}</ul>`;
}

export function suggestView() {
  return `<div class="sg-grid">
<section class="panel sg-form"><h3>Describe your idea</h3>
<p class="sg-lead">Tell us what you'd like Pixel Workbench to do. Your request is filed as a GitHub issue under your own GitHub account. Requests from approved accounts (${ALLOWED_AUTHORS.map(E).join(' and ')}) are built, tested and published automatically, usually within 30 minutes. Requests from other accounts are closed without a build.</p>
<label>Title<input type="text" maxlength="100" data-sg-field="title" placeholder="e.g. Voltage drop on room cable routes" value="${E(draft.title)}"></label>
<label>What should it do?<textarea rows="7" maxlength="5000" data-sg-field="desc" placeholder="e.g. Show the voltage drop on each room cable route. Highlight routes over 5% so I know where to inject power.">${E(draft.desc)}</textarea></label>
<div class="sg-drop" data-sg-drop tabindex="0" role="button" aria-label="Add screenshots: paste, drop or choose files"><strong>Add screenshots</strong><span>Paste (Ctrl+V), drop images here, or <u>choose files</u>. Up to ${MAX_IMAGES}.</span><input type="file" accept="image/*" multiple hidden data-sg-file></div>
${imagesHtml()}
${connectHtml()}
<div class="sg-actions"><button type="button" class="btn primary" data-sg="submit" ${ready() && sub.state !== 'sending' ? '' : 'disabled'}>${sub.state === 'sending' ? 'Submitting…' : 'Submit'}</button><small>${sub.state === 'sending' ? E(sub.msg) : ready() ? (auth ? 'Your request is built, tested and published automatically.' : "You'll be asked to connect GitHub once.") : 'Give it a short title and describe your idea in a sentence or more.'}</small></div>
${resultHtml()}
</section>
<section class="panel sg-status"><div class="sg-status-head"><h3>Requests and build status <span data-sg-count>(${list.items.length})</span></h3><button type="button" class="text-btn" data-sg="refresh">Refresh</button></div>
<div data-sg-spend>${spendHtml()}</div>
<div class="sg-stages" role="tablist" aria-label="Filter requests by build stage" data-sg-stages>${stagesHtml()}</div>
<div data-sg-list>${listHtml()}</div></section></div>`;
}

function paint() {
  const root = document.querySelector('.sg-grid');
  if (!root) return;
  const focus = document.activeElement?.dataset?.sgField,
    pos = document.activeElement?.selectionStart;
  root.outerHTML = suggestView();
  if (focus) {
    const el = document.querySelector(`[data-sg-field="${focus}"]`);
    el?.focus();
    try {
      el.setSelectionRange(pos, pos);
    } catch {}
  }
}
function paintList() {
  const el = document.querySelector('[data-sg-list]'),
    count = document.querySelector('[data-sg-count]'),
    st = document.querySelector('[data-sg-stages]');
  if (st) st.innerHTML = stagesHtml();
  const sp = document.querySelector('[data-sg-spend]');
  if (sp) sp.innerHTML = spendHtml();
  if (el) el.innerHTML = listHtml();
  if (count) count.textContent = `(${list.items.length})`;
  const bell = document.querySelector('[data-sg-bell]');
  if (bell) bell.outerHTML = bellHtml();
}

export async function loadRequests(force = false) {
  if (testing) return;
  try {
    const c = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (!force && c && Date.now() - c.at < CACHE_MS) {
      list = {
        state: 'ok',
        items: c.items,
        versions: c.versions || {},
        cost: costSummary(c.costs),
        usage: c.usage || null,
        error: '',
        at: c.at
      };
      paintList();
      return;
    }
  } catch {}
  list.state = 'loading';
  paintList();
  try {
    const r = await fetch(
      `https://api.github.com/repos/${REPO}/issues?state=all&per_page=50&sort=created&direction=desc`,
      { headers: { Accept: 'application/vnd.github+json' } }
    );
    if (!r.ok)
      throw new Error(
        r.status === 403 ? 'GitHub rate limit, try again later' : 'GitHub returned ' + r.status
      );
    const items = (await r.json()).filter(
      i => !i.pull_request && /^\[Feature\]/i.test(i.title) && allowed(i.user?.login)
    );
    let versions = {};
    try {
      const cr = await fetch(`https://api.github.com/repos/${REPO}/commits?sha=main&per_page=100`, {
        headers: { Accept: 'application/vnd.github+json' }
      });
      if (cr.ok) versions = versionsFrom(await cr.json());
    } catch {}
    let costs = null;
    try {
      const k = await fetch(`./build-costs.json?t=${Date.now()}`, { cache: 'no-store' });
      if (k.ok) costs = await k.json();
    } catch {}
    let usage = null;
    try {
      const u = await fetch(`https://api.github.com/repos/${REPO}/contents/usage.json?ref=feature-assets`, {
        headers: { Accept: 'application/vnd.github.raw+json' }
      });
      if (u.ok) usage = await u.json();
    } catch {}
    if (!usage && costs) usage = { limit: DAILY_CREDIT_LIMIT, builds: costs.builds || [] };
    list = { state: 'ok', items, versions, cost: costSummary(costs), usage, error: '', at: Date.now() };
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ at: list.at, items, versions, costs, usage }));
    } catch {}
  } catch (e) {
    list = { ...list, state: 'error', error: e.message || 'network error' };
  }
  paintList();
}

function addFiles(files) {
  let skipped = 0;
  for (const f of files) {
    if (!/^image\//.test(f.type) || f.size > MAX_BYTES || draft.images.length >= MAX_IMAGES) {
      skipped++;
      continue;
    }
    draft.images.push({
      name: f.name || `screenshot-${draft.images.length + 1}.png`,
      url: URL.createObjectURL(f),
      blob: f
    });
  }
  if (skipped) toast(`Skipped ${skipped} file(s): images only, up to ${MAX_IMAGES}, each under 10 MB.`);
  paint();
}

export function afterSuggestRender() {
  loadRequests();
}

export function installSuggest(opts = {}) {
  toast = opts.toast || toast;
  document.addEventListener(
    'click',
    e => {
      if (e.target.closest?.('[data-sg-bell]')) stage = 'attention';
    },
    true
  );
  // Keep the top-bar bell current for a connected requester (their own requests only).
  if (auth && !testing) {
    loadRequests();
    setInterval(() => document.visibilityState === 'visible' && auth && loadRequests(true), 300000);
  }
  document.addEventListener('input', e => {
    const f = e.target.dataset?.sgField;
    if (!f) return;
    if (f === 'reply') {
      const was = reply.text.trim().length >= 5;
      reply.text = e.target.value;
      const btn = document.querySelector('[data-sg^="send-reply:"]');
      if (btn && was !== reply.text.trim().length >= 5)
        btn.disabled = reply.busy || reply.text.trim().length < 5;
      return;
    }
    const was = ready();
    draft[f] = e.target.value;
    const now = ready();
    if (sub.state === 'done' || sub.state === 'error') {
      sub = { state: 'idle', msg: '', number: 0, url: '' };
      paint();
    } else if (was !== now) paint();
  });
  document.addEventListener('change', e => {
    if (e.target.matches('[data-sg-file]')) {
      addFiles([...e.target.files]);
      e.target.value = '';
    }
  });
  document.addEventListener('paste', e => {
    if (!document.querySelector('.sg-grid')) return;
    const files = [...(e.clipboardData?.files || [])].filter(f => /^image\//.test(f.type));
    if (!files.length) return;
    e.preventDefault();
    addFiles(files);
  });
  document.addEventListener('dragover', e => {
    const d = e.target.closest?.('[data-sg-drop]');
    if (!d) return;
    e.preventDefault();
    d.classList.add('over');
  });
  document.addEventListener('dragleave', e => {
    e.target.closest?.('[data-sg-drop]')?.classList.remove('over');
  });
  document.addEventListener('drop', e => {
    const d = e.target.closest?.('[data-sg-drop]');
    if (!d) return;
    e.preventDefault();
    d.classList.remove('over');
    addFiles([...(e.dataTransfer?.files || [])]);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.matches?.('[data-sg-token]')) {
      e.preventDefault();
      doConnect();
      return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[data-sg-drop]')) {
      e.preventDefault();
      e.target.querySelector('[data-sg-file]').click();
    }
  });
  document.addEventListener('click', e => {
    const drop = e.target.closest('[data-sg-drop]');
    if (drop && !e.target.matches('[data-sg-file]')) {
      drop.querySelector('[data-sg-file]').click();
      return;
    }
    const b = e.target.closest('[data-sg]');
    if (!b) return;
    e.preventDefault();
    const [a, n] = b.dataset.sg.split(':');
    if (a === 'submit') submit();
    else if (a === 'connect') {
      connect.open = true;
      paint();
      document.querySelector('[data-sg-token]')?.focus();
    } else if (a === 'save-token') doConnect();
    else if (a === 'disconnect') {
      auth = null;
      try {
        localStorage.removeItem(AUTH_KEY);
      } catch {}
      paint();
      toast('Disconnected. The token is removed from this browser; you can also delete it on GitHub.');
    } else if (a === 'remove') {
      const [im] = draft.images.splice(+n, 1);
      if (im) URL.revokeObjectURL(im.url);
      paint();
    } else if (a === 'refresh') loadRequests(true);
    else if (a === 'reply') {
      reply = { open: +n, text: '', busy: false, error: '', notes: reply.notes };
      paintList();
      document.querySelector('[data-sg-field="reply"]')?.focus();
      if (!((+n) in reply.notes)) loadNote(+n);
    } else if (a === 'reply-cancel') {
      reply = { ...reply, open: 0, text: '', error: '' };
      paintList();
    } else if (a === 'send-reply') sendReply(+n);
    else if (a === 'stage') {
      stage = n;
      paintList();
    }
  });
}
