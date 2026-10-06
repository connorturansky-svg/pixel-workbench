export const PALETTE = ['#39886e', '#dc8955', '#728ee0', '#bc73c9', '#d0aa3d', '#42a6b9'];
export function makeProp(shape = 'smiley', id = 'prop-' + Math.random().toString(36).slice(2, 9)) {
  return {
    id,
    name: shape === 'smiley' ? 'Smiley face' : shape === 'star' ? 'Five-point star' : 'Pixel circle',
    shape,
    count: shape === 'smiley' ? 64 : 50,
    columns: 10,
    width: 1,
    height: 1,
    color: PALETTE[shape === 'smiley' ? 1 : 2],
    kind: 'seed',
    watts: 0.3,
    channels: 3,
    points: [],
    reference: '',
    referenceName: ''
  };
}
export function entities(p) {
  const linked = new Set(
    (p.installation?.boxes || []).flatMap(b => b.components.map(c => c.sourceKey).filter(Boolean))
  );
  return [
    ...p.controllers
      .filter(o => !linked.has('controller:' + o.id))
      .map(o => ({ key: 'controller:' + o.id, type: 'controller', id: o.id, name: o.name, o })),
    ...p.psus
      .filter(o => !linked.has('psu:' + o.id))
      .map(o => ({ key: 'psu:' + o.id, type: 'psu', id: o.id, name: o.name, o })),
    ...p.distros
      .filter(o => !linked.has('distro:' + o.id))
      .map(o => ({ key: 'distro:' + o.id, type: 'distro', id: o.id, name: o.name, o })),
    ...p.aux
      .filter(o => !linked.has('aux:' + o.id))
      .map(o => ({ key: 'aux:' + o.id, type: 'aux', id: o.id, name: o.name, o })),
    ...(p.installation?.boxes || []).map(o => ({
      key: 'box:' + o.id,
      type: 'box',
      id: o.id,
      name: o.name,
      o
    })),
    ...(p.installation?.fieldDevices || []).map(o => ({
      key: 'field:' + o.id,
      type: 'field',
      id: o.id,
      name: o.name,
      o
    })),
    ...p.chains.flatMap(ch =>
      ch.segments.map((o, i) => ({
        key: 'segment:' + o.id,
        type: 'segment',
        id: o.id,
        name:
          (o.propId ? p.props.find(pr => pr.id === o.propId)?.name : null) ||
          ch.name + (ch.segments.length > 1 ? ' · ' + (i + 1) : ''),
        chain: ch,
        index: i,
        o
      }))
    )
  ];
}
export function ensureScene(p) {
  p.props ??= [
    makeProp('smiley', 'prop-smiley'),
    makeProp('circle', 'prop-circle'),
    makeProp('star', 'prop-star')
  ];
  p.scene ??= { width: 12, depth: 8, snap: 0.1, placements: {} };
  const es = entities(p);
  es.forEach((e, i) => {
    if (p.scene.placements[e.key]) return;
    const isPixel = e.type === 'segment',
      prop = p.props.find(pr => pr.id === e.o.propId);
    p.scene.placements[e.key] = {
      x: Math.min(p.scene.width - 0.5, isPixel ? 4 + (i % 3) * 2.2 : 1 + (i % 3) * 1.3),
      y: Math.min(
        p.scene.depth - 0.5,
        isPixel
          ? 1 +
              Math.floor((i - p.controllers.length - p.psus.length - p.distros.length - p.aux.length) / 3) * 2
          : 1 + Math.floor(i / 3) * 1.25
      ),
      width: prop?.width || (isPixel ? 1.8 : e.type === 'box' ? 2.4 : e.type === 'field' ? 0.7 : 0.65),
      height: prop?.height || (isPixel ? 0.45 : e.type === 'box' ? 1.7 : e.type === 'field' ? 0.6 : 0.45),
      rotation: 0,
      color: prop?.color || PALETTE[isPixel ? p.chains.indexOf(e.chain) % PALETTE.length : i % PALETTE.length]
    };
  });
  for (const key of Object.keys(p.scene.placements))
    if (!es.some(e => e.key === key) && !/^(controller|psu|distro|aux):/.test(key))
      delete p.scene.placements[key];
  return p;
}
export function clampPosition(pos, scene) {
  return { x: Math.min(scene.width, Math.max(0, pos.x)), y: Math.min(scene.depth, Math.max(0, pos.y)) };
}
export function pixelPoints(prop, count = prop.count) {
  const n = Math.max(0, Math.min(600, count));
  if (prop.shape === 'custom') return prop.points.slice(0, 600);
  if (!n) return [];
  const arc = (t, cx, cy, rx, ry, a, b) => {
    const ang = a + t * (b - a);
    return { x: cx + Math.cos(ang) * rx, y: cy + Math.sin(ang) * ry };
  };
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    if (prop.shape === 'line') pts.push({ x: 0.08 + 0.84 * t, y: 0.5 });
    else if (prop.shape === 'grid') {
      const cols = Math.min(n, prop.columns || 10),
        rows = Math.ceil(n / cols);
      pts.push({
        x: cols === 1 ? 0.5 : 0.08 + (0.84 * (i % cols)) / (cols - 1),
        y: rows === 1 ? 0.5 : 0.08 + (0.84 * Math.floor(i / cols)) / (rows - 1)
      });
    } else if (prop.shape === 'star') {
      const v = Array.from({ length: 10 }, (_, k) =>
        arc(k / 10, 0.5, 0.5, k % 2 ? 0.2 : 0.44, k % 2 ? 0.2 : 0.44, -Math.PI / 2, Math.PI * 1.5)
      );
      const q = (i / n) * 10,
        j = Math.floor(q),
        a = v[j],
        b = v[(j + 1) % 10];
      pts.push({ x: a.x + (b.x - a.x) * (q - j), y: a.y + (b.y - a.y) * (q - j) });
    } else if (prop.shape === 'smiley') {
      const rim = Math.max(1, Math.round(n * 0.58)),
        eyes = Math.max(1, Math.round(n * 0.12));
      if (i < rim) pts.push(arc(i / rim, 0.5, 0.5, 0.44, 0.44, 0, Math.PI * 2));
      else if (i < rim + eyes) {
        const k = i - rim,
          half = Math.max(1, Math.ceil(eyes / 2));
        pts.push({ x: k < half ? 0.34 : 0.66, y: 0.32 + ((k % half) * 0.1) / half });
      } else
        pts.push(
          arc(
            (i - rim - eyes) / Math.max(1, n - rim - eyes - 1),
            0.5,
            0.49,
            0.25,
            0.25,
            Math.PI * 0.1,
            Math.PI * 0.9
          )
        );
    } else pts.push(arc(i / n, 0.5, 0.5, 0.44, 0.44, -Math.PI / 2, Math.PI * 1.5));
  }
  return pts;
}
export function validateScene(p) {
  if (p.scene === undefined && p.props === undefined) return;
  const n = (v, a, b) => typeof v === 'number' && Number.isFinite(v) && v >= a && v <= b,
    txt = v => typeof v === 'string' && v.length <= 200,
    col = v => /^#[0-9a-f]{6}$/i.test(v),
    bad = () => {
      throw Error('Invalid room layout or prop data.');
    };
  if (
    !p.scene ||
    !n(p.scene.width, 2, 100) ||
    !n(p.scene.depth, 2, 100) ||
    ![0, 0.05, 0.1, 0.25, 0.5, 1].includes(p.scene.snap) ||
    !p.scene.placements ||
    Array.isArray(p.scene.placements) ||
    !Array.isArray(p.props) ||
    p.props.length > 100
  )
    bad();
  let bytes = 0;
  const ids = new Set();
  for (const pr of p.props) {
    if (
      !txt(pr.id) ||
      !/^[A-Za-z0-9_-]+$/.test(pr.id) ||
      ids.has(pr.id) ||
      !txt(pr.name) ||
      !['smiley', 'circle', 'star', 'line', 'grid', 'custom'].includes(pr.shape) ||
      !Number.isInteger(pr.count) ||
      !n(pr.count, 0, 5000) ||
      !n(pr.columns, 1, 100) ||
      !Number.isInteger(pr.columns) ||
      !n(pr.width, 0.1, 50) ||
      !n(pr.height, 0.1, 50) ||
      !col(pr.color) ||
      !['seed', 'bullet'].includes(pr.kind) ||
      !n(pr.watts, 0.001, 1000) ||
      ![3, 4].includes(pr.channels) ||
      !Array.isArray(pr.points) ||
      pr.points.length > 5000 ||
      pr.points.some(pt => !n(pt.x, 0, 1) || !n(pt.y, 0, 1)) ||
      !txt(pr.referenceName)
    )
      bad();
    ids.add(pr.id);
    if (
      typeof pr.reference !== 'string' ||
      pr.reference.length > 1500000 ||
      (pr.reference && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(pr.reference))
    )
      bad();
    bytes += pr.reference.length;
    if (pr.shape === 'custom' && pr.count !== pr.points.length) bad();
  }
  if (bytes > 3500000)
    throw Error('Prop references are too large. Remove an image or use a smaller reference.');
  if (Object.keys(p.scene.placements).length > 52000) bad();
  for (const [key, v] of Object.entries(p.scene.placements)) {
    if (
      !/^(controller|psu|distro|aux|segment|box|field):/.test(key) ||
      !v ||
      !n(v.x, 0, 100) ||
      !n(v.y, 0, 100) ||
      !n(v.width, 0.1, 50) ||
      !n(v.height, 0.1, 50) ||
      !n(v.rotation, -360, 360) ||
      !col(v.color)
    )
      bad();
  }
  for (const c of p.chains) for (const s of c.segments) if (s.propId && !ids.has(s.propId)) bad();
}
