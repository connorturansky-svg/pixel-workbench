import { validateScene } from './layout-model.mjs?v=0.49.0';
import {
  validateInstallation,
  routeSpecs,
  routeGeometry,
  projectCapacity,
  RESOURCE_LABELS
} from './installation-model.mjs?v=0.49.0';
import { ensureWiring, validateWiring } from './wiring-model.mjs?v=0.49.0';
export const AWG = {
  10: 0.003277,
  12: 0.005211,
  14: 0.008286,
  16: 0.01317,
  18: 0.02095,
  20: 0.03331,
  22: 0.05296,
  24: 0.08422
};
export const BOARDS = {
  b8: {
    name: 'Baldrick8',
    ports: 8,
    banks: 2,
    fuse: 7.5,
    maxPixels: 750,
    maxChannels: 2250,
    inputs: 3,
    relays: 0,
    url: 'https://www.baldrickboard.com/en/boards/baldrick8/manual'
  },
  b17: {
    name: 'Baldrick17',
    ports: 17,
    banks: 5,
    fuse: 7.5,
    maxPixels: 750,
    maxChannels: 2250,
    inputs: 3,
    relays: 0,
    url: 'https://www.baldrickboard.com/en/boards/baldrick17/manual'
  }
};
export const PSU_MODELS = {
  unconfirmed: { name: 'Mean Well 320 W · confirm model', voltage: 12, watts: 320 },
  rsp320: { name: 'Mean Well RSP-320-12', voltage: 12, watts: 320.4 },
  lrs350: { name: 'Mean Well LRS-350-12', voltage: 12, watts: 348 },
  custom: { name: 'Custom PSU', voltage: 12, watts: 320 }
};
export const uid = () => Math.random().toString(36).slice(2, 10);
export const newSegment = (kind = 'seed') => ({
  id: uid(),
  kind,
  count: kind === 'flood' ? 1 : 100,
  watts: kind === 'flood' ? 10 : kind === 'bullet' ? 0.6 : 0.3,
  channels: 3,
  spacing: kind === 'flood' ? 0 : 0.1,
  stringAwg: 22,
  leadM: 1,
  leadAwg: 18,
  inject: false,
  psu: 'p3',
  distro: 'd1',
  feedM: 2,
  feedAwg: 18,
  fuse: 5
});
export function initial() {
  let s1 = newSegment();
  s1.count = 100;
  s1.leadM = 5;
  let s2 = newSegment('bullet');
  s2.count = 150;
  s2.leadM = 3;
  let s3 = newSegment('flood');
  s3.count = 2;
  s3.watts = 20;
  s3.leadM = 2;
  return {
    version: 1,
    name: 'Garden show',
    brightness: 40,
    headroom: 80,
    dropLimit: 10,
    startChannel: 1,
    psus: [
      { id: 'p1', name: 'PSU 01', model: 'lrs350', voltage: 12, watts: 348 },
      { id: 'p2', name: 'PSU 02', model: 'lrs350', voltage: 12, watts: 348 }
    ],
    distros: [{ id: 'd1', name: 'Distro 01', psu: 'p2', outputs: 6, amps: 30, fuse: 5 }],
    controllers: [
      {
        id: 'c1',
        name: 'Baldrick · front garden',
        model: 'b8',
        host: '192.168.1.101',
        bankPsus: ['p1', 'p1'],
        bankLimits: [0, 0],
        bankM: [0.5, 0.5],
        bankAwg: [14, 14],
        io: []
      }
    ],
    chains: [
      { id: 'r1', name: 'Hedge / seeds', controller: 'c1', port: 1, segments: [s1] },
      { id: 'r2', name: 'Path / bullets', controller: 'c1', port: 2, segments: [s2] },
      { id: 'r3', name: 'Tree / floods', controller: 'c1', port: 5, segments: [s3] }
    ],
    presets: [
      {
        id: 'seed100',
        name: '100 seed pixels',
        kind: 'seed',
        count: 100,
        watts: 0.3,
        channels: 3,
        spacing: 0.1,
        stringAwg: 22
      },
      {
        id: 'bullet100',
        name: '100 bullet pixels',
        kind: 'bullet',
        count: 100,
        watts: 0.6,
        channels: 3,
        spacing: 0.1,
        stringAwg: 20
      },
      {
        id: 'flood10',
        name: '10 W flood',
        kind: 'flood',
        count: 1,
        watts: 10,
        channels: 3,
        spacing: 0,
        stringAwg: 18
      },
      {
        id: 'flood20',
        name: '20 W flood',
        kind: 'flood',
        count: 1,
        watts: 20,
        channels: 3,
        spacing: 0,
        stringAwg: 18
      },
      {
        id: 'flood30',
        name: '30 W flood',
        kind: 'flood',
        count: 1,
        watts: 30,
        channels: 3,
        spacing: 0,
        stringAwg: 18
      }
    ]
  };
}
export function tailoredInitial() {
  const p = initial();
  p.name = 'Garden show';
  p.brightness = 100;
  p.chains[0].name = 'Hedge / see';
  p.chains[0].segments[0].count = 200;
  p.psus = Array.from({ length: 4 }, (_, i) => ({
    id: 'p' + (i + 1),
    name: ['PSU 01 · bank A', 'PSU 02 · bank B', 'PSU 03 · external', 'PSU 04 · external'][i],
    model: 'unconfirmed',
    voltage: 12,
    watts: 320
  }));
  p.distros = [
    { id: 'd1', name: 'Distro 01', psu: 'p3', outputs: 6, amps: 30, fuse: 5 },
    { id: 'd2', name: 'Distro 02', psu: 'p4', outputs: 6, amps: 30, fuse: 5 }
  ];
  p.controllers[0].io = ['', '', ''];
  p.controllers[0].bankPsus = ['p1', 'p2'];
  p.controllers[0].bankAwg = [10, 10];
  p.chains[1].port = 3;
  p.chains[1].segments[0].inject = true;
  p.chains[2].port = 7;
  const s = newSegment();
  s.count = 100;
  s.inject = true;
  s.psu = 'p4';
  s.distro = 'd2';
  p.chains.push({ id: 'r4', name: 'Canopy / seeds', controller: 'c1', port: 5, segments: [s] });
  p.aux = [];
  return p;
}
export const bankFor = (c, port) =>
  Math.min(
    BOARDS[c.model].banks - 1,
    Math.floor((port - 1) / Math.ceil(BOARDS[c.model].ports / BOARDS[c.model].banks))
  );
export function calculate(p) {
  const out = {
    watts: 0,
    fullWatts: 0,
    pixels: 0,
    channels: 0,
    feeds: 0,
    psus: {},
    distros: {},
    banks: {},
    chains: {},
    warnings: []
  };
  const warn = (level, title, detail, chain) => out.warnings.push({ level, title, detail, chain });
  for (const ps of p.psus) out.psus[ps.id] = { watts: 0, fullWatts: 0, amps: 0 };
  for (const d of p.distros) out.distros[d.id] = { amps: 0, fullAmps: 0, feeds: 0 };
  for (const c of p.controllers)
    for (let b = 0; b < BOARDS[c.model].banks; b++) out.banks[c.id + ':' + b] = { amps: 0, fullAmps: 0 };
  let channel = p.startChannel;
  const used = new Set();
  for (const ch of p.chains) {
    const c = p.controllers.find(x => x.id === ch.controller),
      board = BOARDS[c.model],
      bank = bankFor(c, ch.port),
      res = {
        watts: 0,
        fullWatts: 0,
        pixels: 0,
        channels: 0,
        start: channel,
        segments: [],
        minV: Infinity,
        bank
      };
    const key = c.id + ':' + ch.port;
    if (used.has(key)) warn('error', 'Port assigned more than once', `${c.name}, port ${ch.port}`, ch.id);
    used.add(key);
    const zones = [];
    for (let i = 0; i < ch.segments.length; i++) {
      const s = ch.segments[i];
      if (i === 0 || s.inject)
        zones.push({
          start: i,
          items: [],
          injected: s.inject,
          source: s.inject ? s.psu : c.bankPsus[bank],
          distro: s.inject ? s.distro : null,
          fuse: s.inject ? s.fuse : board.fuse
        });
      zones.at(-1).items.push(s);
    }
    for (const z of zones) {
      const ps = p.psus.find(x => x.id === z.source);
      if (!ps) {
        warn('error', 'Missing power supply', ch.name, ch.id);
        continue;
      }
      z.voltage = ps.voltage;
      z.fullW = z.items.reduce((a, s) => a + s.count * s.watts, 0);
      z.w = (z.fullW * p.brightness) / 100;
      z.amps = z.w / ps.voltage;
      z.fullAmps = z.fullW / ps.voltage;
      out.psus[ps.id].watts += z.w;
      out.psus[ps.id].fullWatts += z.fullW;
      out.psus[ps.id].amps += z.amps;
      if (z.injected) {
        out.feeds++;
        const d = p.distros.find(x => x.id === z.distro);
        if (!d || d.psu !== ps.id)
          warn('error', 'Injection source mismatch', `${ch.name}: choose a distro on ${ps.name}.`, ch.id);
        else {
          out.distros[d.id].amps += z.amps;
          out.distros[d.id].fullAmps += z.fullAmps;
          out.distros[d.id].feeds++;
          if (z.fuse > d.fuse)
            warn(
              'error',
              'Feed fuse exceeds distro setting',
              `${ch.name}: ${z.fuse} A feed / ${d.fuse} A distro output.`,
              ch.id
            );
        }
      } else {
        out.banks[c.id + ':' + bank].amps += z.amps;
        out.banks[c.id + ':' + bank].fullAmps += z.fullAmps;
      }
      if (z.amps > z.fuse)
        warn(
          'error',
          'Feed current exceeds fuse',
          `${ch.name}: ${z.amps.toFixed(2)} A on a ${z.fuse} A feed.`,
          ch.id
        );
      else if (z.fullAmps > z.fuse)
        warn(
          'warn',
          'Full white exceeds feed fuse',
          `${ch.name}: ${z.fullAmps.toFixed(2)} A at 100%.`,
          ch.id
        );
    }
    res.zones = zones;
    for (const s of ch.segments) {
      const prop = p.props?.find(pr => pr.id === s.propId);
      if (prop?.shape === 'custom' && prop.points.length !== s.count)
        warn(
          'warn',
          'Prop layout count differs from wiring',
          `${ch.name}: ${prop.points.length} marked positions / ${s.count} wired pixels. Update the template or output count.`,
          ch.id
        );
      res.watts += (s.count * s.watts * p.brightness) / 100;
      res.fullWatts += s.count * s.watts;
      res.pixels += s.count;
      res.channels += s.count * s.channels;
    }
    if (res.channels > board.maxChannels)
      warn(
        'error',
        'Controller channel limit',
        `${ch.name}: ${res.channels} channels; ${board.maxChannels} per port at 40 fps.`,
        ch.id
      );
    if (new Set(ch.segments.map(s => s.channels)).size > 1)
      warn(
        'warn',
        'Mixed pixel formats',
        `${ch.name}: confirm controller support for mixed RGB/RGBW on this port.`,
        ch.id
      );
    res.end = channel + res.channels - 1;
    channel += res.channels;
    out.watts += res.watts;
    out.fullWatts += res.fullWatts;
    out.pixels += res.pixels;
    out.channels += res.channels;
    out.chains[ch.id] = res;
  }
  for (const ch of p.chains) {
    const r = out.chains[ch.id],
      c = p.controllers.find(x => x.id === ch.controller);
    for (const z of r.zones) {
      if (!z.voltage) continue;
      const first = z.items[0],
        bk = out.banks[c.id + ':' + r.bank];
      let v =
        z.voltage -
        (z.injected
          ? 2 * first.feedM * AWG[first.feedAwg] * z.amps
          : 2 * c.bankM[r.bank] * AWG[c.bankAwg[r.bank]] * bk.amps);
      let downstream = z.amps;
      for (const s of z.items) {
        const own = (s.count * s.watts * p.brightness) / 100 / z.voltage;
        const leadDrop = z.injected && s === first ? 0 : 2 * s.leadM * AWG[s.leadAwg] * downstream;
        v -= leadDrop;
        const inputV = v;
        const stringDrop = 2 * AWG[s.stringAwg] * s.spacing * (s.count - 1) * (downstream - own + own / 2);
        v -= stringDrop;
        r.segments.push({
          id: s.id,
          inputV,
          endV: v,
          drop: z.voltage - v,
          dropPct: ((z.voltage - v) / z.voltage) * 100,
          amps: own,
          feedAmps: downstream,
          source: z.source
        });
        r.minV = Math.min(r.minV, v);
        downstream -= own;
      }
    }
    if (r.segments.some(s => s.dropPct > p.dropLimit))
      warn(
        'warn',
        'Power injection recommended',
        `${ch.name}: estimated end voltage ${Math.max(0, r.minV).toFixed(2)} V; drop exceeds ${p.dropLimit}%. Split the load into separately fed sections.`,
        ch.id
      );
  }
  for (const a of p.aux || []) {
    const ps = p.psus.find(x => x.id === a.psu);
    if (ps) {
      const watts = a.watts;
      out.psus[ps.id].watts += watts;
      out.psus[ps.id].fullWatts += watts;
      out.psus[ps.id].amps += watts / ps.voltage;
      out.watts += watts;
      out.fullWatts += watts;
    }
    warn(
      'info',
      `${a.name}: external loads excluded`,
      'Only the entered board allowance is budgeted. Relay-switched circuits and button lamps require a separate load design.'
    );
  }
  for (const ps of p.psus) {
    let r = out.psus[ps.id];
    if (ps.model === 'unconfirmed')
      warn(
        'info',
        'Confirm PSU model and rating',
        `${ps.name}: provisional 12 V / 320 W. Check the label before building.`
      );
    if (r.watts > ps.watts)
      warn('error', `${ps.name} over capacity`, `${r.watts.toFixed(1)} W / ${ps.watts} W nameplate.`);
    else if (r.watts > (ps.watts * p.headroom) / 100)
      warn(
        'warn',
        `${ps.name} above design budget`,
        `${r.watts.toFixed(1)} W exceeds your ${p.headroom}% budget.`
      );
    if (r.fullWatts > ps.watts)
      warn(
        'warn',
        `${ps.name}: full-white overload`,
        `${r.fullWatts.toFixed(1)} W at 100%; the brightness setting here does not limit hardware.`
      );
  }
  for (const d of p.distros) {
    let r = out.distros[d.id];
    if (r.feeds > d.outputs)
      warn('error', `${d.name} has no free outputs`, `${r.feeds} feeds assigned to ${d.outputs} outputs.`);
    if (r.amps > d.amps)
      warn('error', `${d.name} over current limit`, `${r.amps.toFixed(2)} A / ${d.amps} A.`);
    else if (r.fullAmps > d.amps)
      warn('warn', `${d.name}: full-white current`, `${r.fullAmps.toFixed(2)} A at 100% / ${d.amps} A.`);
  }
  for (const c of p.controllers) {
    for (let b = 0; b < BOARDS[c.model].banks; b++) {
      const r = out.banks[c.id + ':' + b],
        limit = c.bankLimits[b];
      if (limit && r.amps > limit)
        warn('error', `${c.name}: bank ${b + 1} over limit`, `${r.amps.toFixed(2)} A / ${limit} A.`);
      else if (limit && r.fullAmps > limit)
        warn(
          'warn',
          `${c.name}: bank ${b + 1} full-white current`,
          `${r.fullAmps.toFixed(2)} A / ${limit} A.`
        );
      else if (!limit && r.amps)
        warn(
          'info',
          `Bank ${b + 1} limit needs confirmation`,
          `${c.name}: enter the verified aggregate limit in Hardware.`
        );
    }
  }
  if (p.installation && p.scene) {
    for (const spec of routeSpecs(p)) {
      const g = routeGeometry(p, spec);
      if (g?.shortByM > 0)
        warn(
          'warn',
          'Cable too short',
          `${spec.name}: ${g.requiredM.toFixed(2)} m required; ${g.physicalM.toFixed(2)} m assigned. Short by ${g.shortByM.toFixed(2)} m.`
        );
    }
    const capacity = projectCapacity(p);
    for (const [key, used] of Object.entries(capacity.used)) {
      const limit = capacity.capacity[key] || 0;
      if (used > limit)
        warn(
          'warn',
          `${RESOURCE_LABELS[key] || key} over operating limit`,
          `${used} planned / ${limit} available across boxes and unboxed hardware.`
        );
    }
  }
  out.warnings.sort(
    (a, b) => ({ error: 0, warn: 1, info: 2 })[a.level] - { error: 0, warn: 1, info: 2 }[b.level]
  );
  return out;
}
export function validateProject(p) {
  const fail = m => {
      throw new Error(m);
    },
    num = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max,
    txt = v => typeof v === 'string' && v.length <= 200;
  if (
    !p ||
    p.version !== 1 ||
    !txt(p.name) ||
    !num(p.brightness, 1, 100) ||
    !num(p.headroom, 1, 100) ||
    !num(p.dropLimit, 1, 50) ||
    !Number.isInteger(p.startChannel) ||
    !num(p.startChannel, 1, 1e8)
  )
    fail('This is not a valid Workbench v1 project.');
  for (const key of ['psus', 'distros', 'controllers', 'chains', 'presets', 'aux'])
    if (!Array.isArray(p[key]) || p[key].length > 500) fail(`Invalid ${key} list.`);
  if (p.controllers.length && !p.psus.length) fail('Add a PSU before adding a controller.');
  const validId = v =>
    typeof v === 'string' &&
    /^[A-Za-z0-9_-]{1,200}$/.test(v) &&
    !['__proto__', 'constructor', 'prototype'].includes(v);
  const ids = new Set();
  for (const list of ['psus', 'distros', 'controllers', 'chains', 'presets', 'aux'])
    for (const x of p[list]) {
      if (!validId(x.id) || !txt(x.name) || ids.has(x.id)) fail('Invalid or duplicate item.');
      ids.add(x.id);
    }
  const psu = id => p.psus.some(x => x.id === id),
    validSeg = s =>
      s &&
      ['seed', 'bullet', 'flood'].includes(s.kind) &&
      Number.isInteger(s.count) &&
      num(s.count, 1, 100000) &&
      num(s.watts, 0.001, 1000) &&
      [3, 4].includes(s.channels) &&
      num(s.spacing, 0, 100) &&
      AWG[s.stringAwg] &&
      num(s.leadM, 0, 10000) &&
      AWG[s.leadAwg];
  for (const s of p.psus)
    if (!PSU_MODELS[s.model] || s.voltage !== 12 || !num(s.watts, 1, 100000)) fail('Invalid 12 V PSU.');
  for (const d of p.distros)
    if (
      !psu(d.psu) ||
      !Number.isInteger(d.outputs) ||
      !num(d.outputs, 1, 100) ||
      !num(d.amps, 0.1, 1000) ||
      !num(d.fuse, 0.1, 100)
    )
      fail('Invalid distro.');
  for (const c of p.controllers) {
    const b = BOARDS[c.model];
    if (!b || !txt(c.host) || !Array.isArray(c.io) || c.io.length !== 3 || c.io.some(x => !txt(x)))
      fail('Invalid controller.');
    for (const key of ['bankPsus', 'bankLimits', 'bankM', 'bankAwg'])
      if (!Array.isArray(c[key]) || c[key].length !== b.banks) fail('Invalid power banks.');
    for (let i = 0; i < b.banks; i++)
      if (
        !psu(c.bankPsus[i]) ||
        !num(c.bankLimits[i], 0, 1000) ||
        !num(c.bankM[i], 0, 10000) ||
        !AWG[c.bankAwg[i]]
      )
        fail('Invalid bank supply.');
  }
  for (const ch of p.chains) {
    const c = p.controllers.find(x => x.id === ch.controller);
    if (
      !c ||
      !Number.isInteger(ch.port) ||
      !num(ch.port, 1, BOARDS[c.model].ports) ||
      !Array.isArray(ch.segments) ||
      ch.segments.length < 1 ||
      ch.segments.length > 100
    )
      fail('Invalid port or segment list.');
    for (const s of ch.segments) {
      if (
        !validSeg(s) ||
        !validId(s.id) ||
        ids.has(s.id) ||
        typeof s.inject !== 'boolean' ||
        !num(s.feedM, 0, 10000) ||
        !AWG[s.feedAwg] ||
        !num(s.fuse, 0.1, 100)
      )
        fail('Invalid segment.');
      ids.add(s.id);
      if (s.inject && !p.distros.some(d => d.id === s.distro && d.psu === s.psu))
        fail('Injection must have a matching PSU and distro.');
    }
  }
  for (const s of p.presets) if (!validSeg({ ...s, leadM: 0, leadAwg: 18 })) fail('Invalid preset.');
  for (const a of p.aux)
    if (
      !['switchy', 'input1', 'input8'].includes(a.model) ||
      !psu(a.psu) ||
      !num(a.watts, 0, 1000) ||
      !Array.isArray(a.labels) ||
      a.labels.length !== (a.model === 'switchy' ? 4 : a.model === 'input8' ? 8 : 1) ||
      a.labels.some(x => !txt(x))
    )
      fail('Invalid accessory board.');
  ensureWiring(p);
  validateWiring(p);
  validateScene(p);
  validateInstallation(p);
  return p;
}
export function recommendSections(project, chainId, index, distroId) {
  const p = structuredClone(project),
    ch = p.chains.find(c => c.id === chainId),
    d = p.distros.find(d => d.id === distroId);
  if (!ch || !d || !ch.segments[index]) throw Error('Choose a segment and a valid distro.');
  const original = ch.segments[index],
    prefix = ch.segments.slice(0, index),
    suffix = ch.segments.slice(index + 1),
    sections = [];
  let remaining = original.count;
  while (remaining > 0) {
    if (prefix.length + suffix.length + sections.length >= 100)
      throw Error(
        'This would exceed 100 segments. Use shorter feeds, heavier wire or a lower planning brightness.'
      );
    const chunk = { ...original, id: sections.length ? uid() : original.id };
    if (sections.length)
      Object.assign(chunk, {
        inject: true,
        psu: d.psu,
        distro: d.id,
        distroPort: undefined,
        leadM: original.spacing,
        feedM: original.feedM,
        feedAwg: original.feedAwg,
        fuse: Math.min(original.fuse, d.fuse)
      });
    const fits = count => {
      chunk.count = count;
      const rest =
        remaining > count
          ? [{ ...chunk, id: uid(), count: remaining - count, inject: true, psu: d.psu, distro: d.id }]
          : [];
      ch.segments = [...prefix, ...sections, chunk, ...rest, ...suffix];
      const r = calculate(p),
        cr = r.chains[ch.id],
        sr = cr.segments.find(s => s.id === chunk.id),
        zone = cr.zones.find(z => z.items.some(s => s.id === chunk.id));
      return !!sr && sr.dropPct <= p.dropLimit && sr.endV > 0 && zone.amps <= zone.fuse;
    };
    let low = 1,
      high = remaining,
      best = 0;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (fits(mid)) {
        best = mid;
        low = mid + 1;
      } else high = mid - 1;
    }
    if (!best)
      throw Error(
        'Even one device cannot meet the selected drop/fuse limits on this feed. Increase wire size, shorten the cable, lower brightness or isolate the preceding loads.'
      );
    chunk.count = best;
    sections.push({ ...chunk });
    remaining -= best;
  }
  ch.segments = [...prefix, ...sections, ...suffix];
  validateProject(p);
  const before = prefix.reduce((n, s) => n + s.count, 0);
  let position = before;
  const boundaries = sections.map((s, i) => {
    const start = position + 1;
    position += s.count;
    return { start, end: position, count: s.count, newFeed: i > 0 };
  });
  return { project: p, sections: boundaries, addedFeeds: sections.length - 1 };
}
