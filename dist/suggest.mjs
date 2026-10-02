import {APP_VERSION} from './version.mjs?v=0.9.0';

// Suggest a feature: drafts a `[Feature]` GitHub issue that the requester submits under their own GitHub account,
// and lists every request with its build status (read from the public GitHub API; nothing is sent anywhere else).
// The builder on the owner's PC (automation/builder.py) picks each issue up, builds it, tests it and publishes it.
export const REPO='connorturansky-svg/pixel-workbench';
// Only these GitHub accounts' requests are built (automation/builder.py ALLOWED_AUTHORS must match).
export const ALLOWED_AUTHORS=['J-Turansky','connorturansky-svg'];
const allowed=u=>ALLOWED_AUTHORS.some(a=>a.toLowerCase()===String(u||'').toLowerCase());
// Builder commits are titled `vX.Y.Z: <title> (#n)`, which maps each shipped request to its release.
export function versionsFrom(commits){const m={};for(const c of commits||[]){const r=/^v(\d+\.\d+\.\d+):.*\(#(\d+)\)\s*$/.exec(String(c?.commit?.message||'').split('\n')[0]);if(r&&!m[r[2]])m[r[2]]=r[1];}return m;}
const MAX_IMAGES=6,MAX_BYTES=10*1024*1024,CACHE_MS=60000,KEY='pw-suggest-status-2';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const testing=new URLSearchParams(location.search).has('test');
const draft={desc:'',images:[],opened:false};
const ready=()=>draft.desc.trim().length>=15;
// Issue title: the description's first sentence or line, cut at a word boundary.
export function titleFrom(desc){const t=String(desc).replace(/\s+/g,' ').trim(),first=(t.match(/^.+?[.!?](?=\s|$)/)?.[0]||t).replace(/[.!?]+$/,'');const cap=x=>x.charAt(0).toUpperCase()+x.slice(1);if(first.length<=70)return cap(first)||'Feature request';const cut=first.slice(0,70),i=cut.lastIndexOf(' ');return cap((i>30?cut.slice(0,i):cut).replace(/[,;:\-–—]+$/,''))+'…';}
let list={state:'idle',items:[],error:'',at:0},toast=()=>{};

const STATUS={
 queued:['Queued','Waiting for the builder (it checks every 5 minutes).'],
 building:['Building','Being built and tested on the build PC.'],
 shipped:['Shipped','Live on the site. Reload the page to get it.'],
 failed:['Build failed','Not released. The issue says why.'],
 info:['Needs info','The builder asked a question on the issue.'],
 declined:['Declined','Out of scope or unsafe. The issue says why.'],
 closed:['Closed','Closed without a build.']
};
const date=s=>{const d=new Date(s);return isNaN(d)?'':`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;};
function statusOf(i){const l=new Set((i.labels||[]).map(x=>x.name));
 if(l.has('shipped'))return 'shipped';if(l.has('declined'))return 'declined';if(l.has('build-failed'))return 'failed';
 if(l.has('needs-info'))return 'info';if(l.has('in-progress'))return 'building';return i.state==='closed'?'closed':'queued';}

function issueUrl(){
 const body=`<!-- pixel-workbench-feature -->\n### What should it do?\n${draft.desc.trim().slice(0,5000)}\n\n### Screenshots\n${draft.images.length?'<!-- Click here and press Ctrl+V to paste each screenshot copied from Pixel Workbench, or drag the image files in. -->\n\n':'_None_\n'}\n---\n_Suggested from Pixel Workbench v${APP_VERSION}_`;
 const q=new URLSearchParams({title:'[Feature] '+titleFrom(draft.desc),body,labels:'feature-request'});
 return `https://github.com/${REPO}/issues/new?${q}`;
}

function imagesHtml(){
 if(!draft.images.length)return '';
 return `<div class="sg-thumbs">${draft.images.map((im,i)=>`<figure class="sg-thumb"><img src="${im.url}" alt="${E(im.name)}"><figcaption><span title="${E(im.name)}">${E(im.name)}</span><span class="sg-thumb-actions">${draft.opened?`<button type="button" class="text-btn" data-sg="copy:${i}">Copy</button>`:''}<button type="button" class="text-btn" data-sg="remove:${i}" aria-label="Remove ${E(im.name)}">Remove</button></span></figcaption></figure>`).join('')}</div>`;
}

function listHtml(){
 if(list.state==='loading'&&!list.items.length)return '<p class="empty">Loading requests…</p>';
 if(list.state==='error'&&!list.items.length)return `<p class="empty">Couldn't load the request list (${E(list.error)}). <a href="https://github.com/${REPO}/issues?q=%5BFeature%5D" target="_blank" rel="noopener">See them on GitHub</a>.</p>`;
 if(!list.items.length)return '<p class="empty">No feature requests yet. Be the first.</p>';
 return `<ul class="sg-list">${list.items.map(i=>{const s=statusOf(i),[label,help]=STATUS[s];return `<li class="sg-item"><span class="sg-state"><span class="sg-pill sg-${s}" title="${E(help)}">${label}</span>${s==='shipped'&&list.versions?.[i.number]?`<a class="sg-ver" href="https://github.com/${REPO}/releases/tag/v${E(list.versions[i.number])}" target="_blank" rel="noopener" title="Released in this version">v${E(list.versions[i.number])}</a>`:''}</span><div class="sg-item-main"><a href="${E(i.html_url)}" target="_blank" rel="noopener">${E(i.title.replace(/^\[Feature\]\s*/i,''))}</a><small>#${i.number} · ${E(i.user?.login||'')} · ${date(i.created_at)}${s==='shipped'&&i.closed_at?` · shipped ${date(i.closed_at)}`:''}${i.comments?` · ${i.comments} comment${i.comments>1?'s':''}`:''}</small></div></li>`;}).join('')}</ul>`;
}

export function suggestView(){
 return `<div class="sg-grid">
<section class="panel sg-form"><h3>Describe your idea</h3>
<p class="sg-lead">Tell us what you'd like Pixel Workbench to do. Your request becomes a GitHub issue under your own GitHub account. Requests from approved accounts (${ALLOWED_AUTHORS.map(E).join(' and ')}) are built, tested and published automatically, usually within 30 minutes. Requests from other accounts are closed without a build.</p>
<label>What should it do?<textarea rows="7" maxlength="5000" data-sg-field="desc" placeholder="e.g. Show the voltage drop on each room cable route. Highlight routes over 5% so I know where to inject power.">${E(draft.desc)}</textarea></label>
<div class="sg-drop" data-sg-drop tabindex="0" role="button" aria-label="Add screenshots: paste, drop or choose files"><strong>Add screenshots</strong><span>Paste (Ctrl+V), drop images here, or <u>choose files</u>. Up to ${MAX_IMAGES}.</span><input type="file" accept="image/*" multiple hidden data-sg-file></div>
${imagesHtml()}
<div class="sg-actions"><button type="button" class="btn primary" data-sg="open" ${ready()?'':'disabled'}>Create the GitHub issue</button><small>${ready()?'Opens GitHub in a new tab with your request filled in.':'Describe your idea in a sentence or more. The issue title is taken from your first sentence.'}</small></div>
${draft.opened?`<div class="sg-next"><strong>Finish on GitHub</strong><ol><li>Check the issue that opened in the new tab.</li>${draft.images.length?`<li>Add your screenshots: select <b>Copy</b> on an image above, then click under <i>Screenshots</i> on GitHub and press Ctrl+V. Repeat for each image.</li>`:''}<li>Select <b>Create</b> on GitHub. Your request appears below within a minute.</li></ol><button type="button" class="text-btn" data-sg="reset">Start a new request</button></div>`:''}
</section>
<section class="panel sg-status"><div class="sg-status-head"><h3>Requests and build status <span data-sg-count>(${list.items.length})</span></h3><button type="button" class="text-btn" data-sg="refresh">Refresh</button></div>
<ol class="sg-pipeline" aria-label="How a request is built"><li>Queued</li><li>Building</li><li>Tested</li><li>Shipped</li></ol>
<div data-sg-list>${listHtml()}</div></section></div>`;
}

function paint(){const root=document.querySelector('.sg-grid');if(!root)return;const focus=document.activeElement?.dataset?.sgField,pos=document.activeElement?.selectionStart;root.outerHTML=suggestView();if(focus){const el=document.querySelector(`[data-sg-field="${focus}"]`);el?.focus();try{el.setSelectionRange(pos,pos);}catch{}}}
function paintList(){const el=document.querySelector('[data-sg-list]'),count=document.querySelector('[data-sg-count]');if(el)el.innerHTML=listHtml();if(count)count.textContent=`(${list.items.length})`;}

export async function loadRequests(force=false){
 if(testing)return;
 try{const c=JSON.parse(sessionStorage.getItem(KEY)||'null');if(!force&&c&&Date.now()-c.at<CACHE_MS){list={state:'ok',items:c.items,versions:c.versions||{},error:'',at:c.at};paintList();return;}}catch{}
 list.state='loading';paintList();
 try{const r=await fetch(`https://api.github.com/repos/${REPO}/issues?state=all&per_page=50&sort=created&direction=desc`,{headers:{Accept:'application/vnd.github+json'}});
  if(!r.ok)throw new Error(r.status===403?'GitHub rate limit, try again later':'GitHub returned '+r.status);
  const items=(await r.json()).filter(i=>!i.pull_request&&/^\[Feature\]/i.test(i.title)&&allowed(i.user?.login));
  let versions={};try{const cr=await fetch(`https://api.github.com/repos/${REPO}/commits?sha=main&per_page=100`,{headers:{Accept:'application/vnd.github+json'}});if(cr.ok)versions=versionsFrom(await cr.json());}catch{}
  list={state:'ok',items,versions,error:'',at:Date.now()};try{sessionStorage.setItem(KEY,JSON.stringify({at:list.at,items,versions}));}catch{}
 }catch(e){list={...list,state:'error',error:e.message||'network error'};}
 paintList();
}

function addFiles(files){
 let skipped=0;
 for(const f of files){if(!/^image\//.test(f.type)||f.size>MAX_BYTES||draft.images.length>=MAX_IMAGES){skipped++;continue;}
  draft.images.push({name:f.name||`screenshot-${draft.images.length+1}.png`,url:URL.createObjectURL(f),blob:f});}
 if(skipped)toast(`Skipped ${skipped} file(s): images only, up to ${MAX_IMAGES}, each under 10 MB.`);
 paint();
}

async function copyImage(i){
 const im=draft.images[i];if(!im)return;
 try{const png=im.blob.type==='image/png'?im.blob:await new Promise(async(res,rej)=>{const bmp=await createImageBitmap(im.blob),c=document.createElement('canvas');c.width=bmp.width;c.height=bmp.height;c.getContext('2d').drawImage(bmp,0,0);c.toBlob(b=>b?res(b):rej(new Error('convert')),'image/png');});
  await navigator.clipboard.write([new ClipboardItem({'image/png':png})]);toast(`Copied ${im.name}. Paste it into the GitHub issue with Ctrl+V.`);}
 catch{toast('Your browser blocked copying the image. Drag the image file into the GitHub issue instead.');}
}

export function afterSuggestRender(){loadRequests();}

export function installSuggest(opts={}){
 toast=opts.toast||toast;
 document.addEventListener('input',e=>{const f=e.target.dataset?.sgField;if(!f)return;const was=ready();draft[f]=e.target.value;const now=ready();if(was!==now)paint();});
 document.addEventListener('change',e=>{if(e.target.matches('[data-sg-file]')){addFiles([...e.target.files]);e.target.value='';}});
 document.addEventListener('paste',e=>{if(!document.querySelector('.sg-grid'))return;const files=[...(e.clipboardData?.files||[])].filter(f=>/^image\//.test(f.type));if(!files.length)return;e.preventDefault();addFiles(files);});
 document.addEventListener('dragover',e=>{const d=e.target.closest?.('[data-sg-drop]');if(!d)return;e.preventDefault();d.classList.add('over');});
 document.addEventListener('dragleave',e=>{e.target.closest?.('[data-sg-drop]')?.classList.remove('over');});
 document.addEventListener('drop',e=>{const d=e.target.closest?.('[data-sg-drop]');if(!d)return;e.preventDefault();d.classList.remove('over');addFiles([...(e.dataTransfer?.files||[])]);});
 document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches?.('[data-sg-drop]')){e.preventDefault();e.target.querySelector('[data-sg-file]').click();}});
 document.addEventListener('click',e=>{
  const drop=e.target.closest('[data-sg-drop]');if(drop&&!e.target.matches('[data-sg-file]')){drop.querySelector('[data-sg-file]').click();return;}
  const b=e.target.closest('[data-sg]');if(!b)return;e.preventDefault();const [a,n]=b.dataset.sg.split(':');
  if(a==='open'){window.open(issueUrl(),'_blank','noopener');draft.opened=true;paint();}
  else if(a==='copy')copyImage(+n);
  else if(a==='remove'){const [im]=draft.images.splice(+n,1);if(im)URL.revokeObjectURL(im.url);paint();}
  else if(a==='reset'){draft.images.forEach(im=>URL.revokeObjectURL(im.url));Object.assign(draft,{desc:'',images:[],opened:false});paint();loadRequests(true);}
  else if(a==='refresh')loadRequests(true);
 });
}
