// Stamps ?v=<APP_VERSION> onto every local module import and the index.html assets,
// so browsers never mix cached and new modules after a release. Run: node stamp-version.mjs
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
const dir=new URL('./dist/',import.meta.url).pathname.replace(/^\/(\w:)/,'$1');
const v=readFileSync(join(dir,'version.mjs'),'utf8').match(/APP_VERSION\s*=\s*'([^']+)'/)[1];
const {CHANGELOG}=await import(new URL('./dist/version.mjs?check='+Date.now(),import.meta.url));
const top=CHANGELOG[0];
if(top?.version!==v||!/^\d{2}\/\d{2}\/\d{4}$/.test(top?.date||'')){console.error(`Release check failed: newest CHANGELOG entry must be v${v} with a DD/MM/YYYY date (found v${top?.version} ${top?.date||'no date'}).`);process.exit(1);}
let changed=0;
for(const f of readdirSync(dir).filter(f=>/\.(m?js|html)$/.test(f))){
 const path=join(dir,f),src=readFileSync(path,'utf8');
 const out=src
  .replace(/(from\s*|import\s*\(\s*)(['"])(\.\/[\w.-]+\.m?js)(\?v=[^'"]*)?\2/g,(_,a,q,p)=>`${a}${q}${p}?v=${v}${q}`)
  .replace(/((?:href|src)=")(\.?\/?[\w.-]+\.(?:css|m?js))(\?v=[^"]*)?"/g,(_,a,p)=>`${a}${p}?v=${v}"`);
 if(out!==src){writeFileSync(path,out);changed++;}
}
console.log(`Stamped v${v} into ${changed} file(s).`);
