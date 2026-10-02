import {BOARDS} from './model.mjs?v=0.21.0';

export function ensureWiring(p){
  const used=new Map();
  const reserve=(id,port)=>{if(!used.has(id))used.set(id,new Set());used.get(id).add(port);};
  const next=(id,max=3)=>{const n=used.get(id)||new Set();let port=1;while(n.has(port)&&port<max)port++;reserve(id,port);return port;};
  for(const c of p.controllers){c.bankPsuPorts??=[];c.bankPsus.forEach((id,i)=>{if(c.bankPsuPorts[i])reserve(id,c.bankPsuPorts[i]);});}
  for(const d of p.distros)if(d.psuPort)reserve(d.psu,d.psuPort);
  for(const c of p.controllers)c.bankPsus.forEach((id,i)=>{c.bankPsuPorts[i]??=next(id);});
  for(const d of p.distros)d.psuPort??=next(d.psu);
  const distroUse=new Map();
  for(const ch of p.chains)for(const s of ch.segments)if(s.inject&&s.distroPort){if(!distroUse.has(s.distro))distroUse.set(s.distro,new Set());distroUse.get(s.distro).add(s.distroPort);}
  for(const ch of p.chains)for(const s of ch.segments)if(s.inject&&!s.distroPort){const u=distroUse.get(s.distro)||new Set();let n=1;while(u.has(n))n++;s.distroPort=n;u.add(n);distroUse.set(s.distro,u);}
  return p;
}

export function validateWiring(p){
  const psuUse=new Set(),distroUse=new Set();
  for(const c of p.controllers){if(!Array.isArray(c.bankPsuPorts)||c.bankPsuPorts.length!==BOARDS[c.model].banks)throw Error('Invalid PSU bank terminals.');c.bankPsuPorts.forEach((port,i)=>{if(!Number.isInteger(port)||port<1||port>3)throw Error('PSU terminal must be 1–3.');const key=c.bankPsus[i]+':'+port;if(psuUse.has(key))throw Error('A PSU terminal is already assigned.');psuUse.add(key);});}
  for(const d of p.distros){if(!Number.isInteger(d.psuPort)||d.psuPort<1||d.psuPort>3)throw Error('Distro PSU terminal must be 1–3.');const key=d.psu+':'+d.psuPort;if(psuUse.has(key))throw Error('A PSU terminal is already assigned.');psuUse.add(key);}
  for(const ch of p.chains)for(const s of ch.segments)if(s.inject){const d=p.distros.find(x=>x.id===s.distro);if(!d||!Number.isInteger(s.distroPort)||s.distroPort<1||s.distroPort>d.outputs)throw Error('Injection needs an available distro terminal.');const key=d.id+':'+s.distroPort;if(distroUse.has(key))throw Error('A distro terminal is already assigned.');distroUse.add(key);}
}

export function connectWire(p,source,target){
  ensureWiring(p);
  const [st,si,sp]=source.split(':'),[tt,ti,tp]=target.split(':');
  if(st==='psu'&&(tt==='bank'||tt==='distro-in')){
    const ps=p.psus.find(x=>x.id===si),port=+sp;if(!ps||port<1||port>3)throw Error('Choose a PSU terminal.');
    if(tt==='bank'){const c=p.controllers.find(x=>x.id===ti),b=+tp-1;if(!c||b<0||b>=BOARDS[c.model].banks)throw Error('Choose a Baldrick bank.');c.bankPsus[b]=si;c.bankPsuPorts[b]=port;}
    else {const d=p.distros.find(x=>x.id===ti);if(!d)throw Error('Choose a distro input.');d.psu=si;d.psuPort=port;for(const ch of p.chains)for(const s of ch.segments)if(s.inject&&s.distro===d.id)s.psu=si;}
  }else if(st==='distro'&&tt==='power'){
    const d=p.distros.find(x=>x.id===si),port=+sp,seg=p.chains.flatMap(ch=>ch.segments).find(x=>x.id===ti);if(!d||!seg||port<1||port>d.outputs)throw Error('Choose a distro output and a pixel power input.');Object.assign(seg,{inject:true,psu:d.psu,distro:d.id,distroPort:port,fuse:Math.min(seg.fuse,d.fuse)});
  }else if(st==='data'&&tt==='data-in'){
    const c=p.controllers.find(x=>x.id===si),port=+sp,chain=p.chains.find(ch=>ch.segments[0].id===ti);if(!c||!chain||port<1||port>BOARDS[c.model].ports)throw Error('Connect a controller data port to the first pixel group in a chain.');if(p.chains.some(ch=>ch!==chain&&ch.controller===c.id&&ch.port===port))throw Error('That controller data port already has a chain.');chain.controller=c.id;chain.port=port;
  }else if(st==='data-out'&&tt==='data-in'){
    const source=p.chains.find(ch=>ch.segments.some(s=>s.id===si)),targetChain=p.chains.find(ch=>ch.segments.some(s=>s.id===ti));if(!source||!targetChain||si===ti)throw Error('Choose two different pixel groups.');const targetIndex=targetChain.segments.findIndex(s=>s.id===ti),[segment]=targetChain.segments.splice(targetIndex,1);if(!targetChain.segments.length)p.chains=p.chains.filter(ch=>ch!==targetChain);const sourceIndex=source.segments.findIndex(s=>s.id===si);source.segments.splice(sourceIndex+1,0,segment);
  }else if(st==='power-out'&&tt==='power'){
    const ch=p.chains.find(x=>x.segments.some(s=>s.id===si));if(!ch||ch.segments.findIndex(s=>s.id===ti)!==ch.segments.findIndex(s=>s.id===si)+1)throw Error('Upstream power can connect only to the next group in the same data chain.');ch.segments.find(s=>s.id===ti).inject=false;
  }else throw Error('Connect PSU to bank or distro, distro to pixel power, or data output to pixel data input.');
  validateWiring(p);
}
