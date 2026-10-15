import {
  ensureScene,
  entities,
  pixelPoints,
  makeProp,
  PALETTE,
  clampPosition
} from './layout-model.mjs?v=0.96.0';
import {
  ensureInstallation,
  makeBox,
  addBoxFromTemplate,
  BUTTON_COLOURS,
  exposedPorts,
  roomPortGeometry,
  boxVisualScale,
  perimeterAnchor,
  deleteRoute,
  removePowerSupply,
  portTypeColour,
  connectionProblem
} from './installation-model.mjs?v=0.96.0';
import {
  routeLayer,
  routeMarkers,
  routeControls,
  routeInspector,
  installRoutes,
  refreshRoutes,
  refreshRouteInspector
} from './installation-room.mjs?v=0.96.0';
let api,
  chosen = '',
  propId = 'prop-smiley',
  showGrid = true,
  showPixelLines = true,
  zoom = 1,
  drag = null,
  panDrag = null,
  roomWire = null,
  suppressPortClick = false,
  portPicker = '',
  viewport = { left: 0, top: 0 },
  wheelGesture = null,
  detailLevels = new Map();
const E = s =>
  String(s ?? '').replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
const b = (t, a, c = 'btn') => `<button type="button" class="${c}" data-room="${a}">${t}</button>`;
const field = (label, value, key, type = 'number', min = 0, max = 100, step = 'any') =>
  `<label>${label}<input type="${type}" value="${E(value)}" data-room-field="${key}" ${type === 'number' ? `required min="${min}" max="${max}" step="${step}"` : 'maxlength="200"'}></label>`;
const pick = (label, value, key, items) =>
  `<label>${label}<select data-room-field="${key}">${items.map(([v, t]) => `<option value="${v}" ${String(value) === String(v) ? 'selected' : ''}>${E(t)}</option>`).join('')}</select></label>`;
function restoreViewport() {
  const sc = document.querySelector('.room-scroll');
  if (sc) {
    sc.scrollLeft = viewport.left;
    sc.scrollTop = viewport.top;
  }
}
function siteFitZoom(sc) {
  const p = api.getProject(),
    naturalHeight = (sc.clientWidth * p.scene.depth) / p.scene.width;
  return Math.min(1, sc.clientHeight / Math.max(1, naturalHeight));
}
function zoomLimits(sc) {
  const p = api.getProject(),
    footprints = entities(p)
      .map(item => p.scene.placements[item.key])
      .filter(Boolean),
    smallest = Math.min(...footprints.map(item => Math.max(item.width, item.height)), p.scene.width),
    fit = siteFitZoom(sc);
  return { min: fit, max: Math.max(8, (p.scene.width * 0.82) / Math.max(0.01, smallest)) };
}
function setZoom(next, clientX, clientY) {
  const sc = document.querySelector('.room-scroll'),
    svg = sc?.querySelector('#room-canvas');
  if (!sc || !svg) return;
  const limits = zoomLimits(sc);
  next = Math.max(limits.min, Math.min(limits.max, next));
  const rect = sc.getBoundingClientRect(),
    x = clientX == null ? sc.clientWidth / 2 : clientX - rect.left,
    y = clientY == null ? sc.clientHeight / 2 : clientY - rect.top,
    ratio = next / zoom;
  zoom = next;
  svg.style.width = svg.style.minWidth = zoom * 100 + '%';
  sc.scrollLeft = (sc.scrollLeft + x) * ratio - x;
  sc.scrollTop = (sc.scrollTop + y) * ratio - y;
  viewport = { left: sc.scrollLeft, top: sc.scrollTop };
  const read = document.querySelector('[data-room-zoom]');
  if (read) read.textContent = Math.round(zoom * 100) + '%';
  requestAnimationFrame(updateVisualScale);
}
function fitSite() {
  const sc = document.querySelector('.room-scroll'),
    svg = sc?.querySelector('#room-canvas');
  if (!sc || !svg) return;
  zoom = siteFitZoom(sc);
  svg.style.width = svg.style.minWidth = zoom * 100 + '%';
  const read = document.querySelector('[data-room-zoom]');
  if (read) read.textContent = Math.round(zoom * 100) + '%';
  requestAnimationFrame(() => {
    sc.scrollLeft = Math.max(0, (sc.scrollWidth - sc.clientWidth) / 2);
    sc.scrollTop = Math.max(0, (sc.scrollHeight - sc.clientHeight) / 2);
    viewport = { left: sc.scrollLeft, top: sc.scrollTop };
    updateVisualScale();
  });
}
function fitSelected() {
  fitBounds(componentView(true));
}
function componentView(selected = false) {
  const p = api.getProject(),
    sc = document.querySelector('.room-scroll'),
    placements = entities(p)
      .filter(item => !selected || item.key === chosen)
      .map(item => p.scene.placements[item.key])
      .filter(Boolean);
  if (!sc || !placements.length) return null;
  const bounds = placements.map(v => {
    const angle = (v.rotation * Math.PI) / 180,
      width = Math.abs(Math.cos(angle)) * v.width + Math.abs(Math.sin(angle)) * v.height,
      height = Math.abs(Math.sin(angle)) * v.width + Math.abs(Math.cos(angle)) * v.height;
    return {
      left: v.x - width / 2,
      right: v.x + width / 2,
      top: v.y - height / 2,
      bottom: v.y + height / 2
    };
  });
  const left = Math.min(...bounds.map(v => v.left)),
    right = Math.max(...bounds.map(v => v.right)),
    top = Math.min(...bounds.map(v => v.top)),
    bottom = Math.max(...bounds.map(v => v.bottom)),
    padding = selected ? 0.64 : 0.82,
    limits = zoomLimits(sc),
    horizontal = (p.scene.width / Math.max(0.01, right - left)) * padding,
    vertical =
      ((p.scene.width * sc.clientHeight) / Math.max(0.01, (bottom - top) * sc.clientWidth)) * padding;
  return {
    x: (left + right) / 2,
    y: (top + bottom) / 2,
    zoom: Math.max(limits.min, Math.min(limits.max, horizontal, vertical))
  };
}
function fitBounds(view) {
  const p = api.getProject(),
    sc = document.querySelector('.room-scroll'),
    svg = sc?.querySelector('#room-canvas');
  if (!view || !sc || !svg) return;
  setZoom(view.zoom);
  requestAnimationFrame(() => {
    sc.scrollLeft = (view.x / p.scene.width) * svg.clientWidth - sc.clientWidth / 2;
    sc.scrollTop = (view.y / p.scene.depth) * svg.clientHeight - sc.clientHeight / 2;
    viewport = { left: sc.scrollLeft, top: sc.scrollTop };
    updateVisualScale();
  });
}
function zoomStep(next, clientX, clientY, gesture = null) {
  if (gesture?.blocked) return;
  const outward = next < zoom,
    view = componentView(!outward);
  if (view && (outward ? zoom > view.zoom && next <= view.zoom : zoom < view.zoom && next >= view.zoom)) {
    fitBounds(view);
    if (gesture) gesture.blocked = true;
  } else setZoom(next, clientX, clientY);
}
export function roomDetailPolicy({ width, height, cellWidth, cellHeight }, previous = 'overview') {
  const detailed = previous === 'detail',
    equipment = previous !== 'overview',
    tiles =
      height >= (detailed ? 64 : 72) &&
      cellWidth >= (detailed ? 28 : 32) &&
      cellHeight >= (detailed ? 20 : 24);
  if (width >= (detailed ? 104 : 120) && tiles) return 'detail';
  return width >= (equipment ? 92 : 108) ? 'equipment' : 'overview';
}
export function roomPresentationLayout(width, height, count, ports) {
  const header = (36 * width) / 400,
    padding = (8 * width) / 400,
    cols = Math.max(1, Math.ceil(Math.sqrt((count * width) / Math.max(height, 1)))),
    rows = Math.max(1, Math.ceil(count / cols)),
    cellWidth = (width - padding * 2) / cols,
    cellHeight = Math.max(0, (height - header - padding) / rows);
  return {
    header,
    padding,
    cols,
    cellWidth,
    cellHeight,
    ports: ports.map(node => {
      const anchor = roomPortGeometry(width, height, node, ports, true),
        side = node.edge === 'left' || node.edge === 'right',
        labelWidth = side ? 128 : Math.min(128, anchor.spacing - 12),
        labelHeight = 18,
        labelX = side ? (node.edge === 'left' ? anchor.x - labelWidth - 8 : anchor.x + 8) : anchor.x + 6,
        labelY = side ? anchor.y + 5 : node.edge === 'top' ? anchor.y - 26 : anchor.y + 8;
      return {
        ...anchor,
        labelX,
        labelY,
        labelWidth,
        labelHeight,
        labelFits: anchor.spacing >= 28 && labelWidth >= 32
      };
    })
  };
}
const boundsOverlap = (a, b, gap = 2) =>
  a.left < b.right + gap && a.right + gap > b.left && a.top < b.bottom + gap && a.bottom + gap > b.top;
export function roomLineOverlapsBounds(a, b, bounds, gap = 3) {
  let start = 0,
    end = 1;
  for (const [axis, low, high] of [
    ['x', bounds.left - gap, bounds.right + gap],
    ['y', bounds.top - gap, bounds.bottom + gap]
  ]) {
    const delta = b[axis] - a[axis];
    if (!delta) {
      if (a[axis] < low || a[axis] > high) return false;
    } else {
      const first = (low - a[axis]) / delta,
        last = (high - a[axis]) / delta;
      start = Math.max(start, Math.min(first, last));
      end = Math.min(end, Math.max(first, last));
      if (start > end) return false;
    }
  }
  return true;
}
function reserveRoomLabels(svg) {
  const shown = el => {
      const owner = el.closest('[data-room-node]'),
        box = owner?.querySelector('.room-box-visual'),
        port = el.closest('[data-room-port]');
      if (
        box?.dataset.inViewport === 'false' ||
        (port && (port.dataset.labelVisible !== 'true' || port.dataset.dense === 'true')) ||
        (el.closest('.room-box-internals') && owner.dataset.roomDetail !== 'detail') ||
        (el.closest('.room-box-equipment') &&
          (owner.dataset.roomDetail !== 'equipment' || owner.dataset.roomCompactFits !== 'true')) ||
        (el.closest('.room-overview-label') && owner.dataset.roomTitleInside === 'true')
      )
        return false;
      const style = getComputedStyle(el);
      return (
        style.display !== 'none' && style.visibility !== 'hidden' && el.getBoundingClientRect().width > 0
      );
    },
    shells = [...svg.querySelectorAll('.room-box-shell')].map(el => ({
      owner: el.closest('[data-room-node]'),
      bounds: el.getBoundingClientRect()
    })),
    markers = [...svg.querySelectorAll('.room-port-tip')].map(el => el.getBoundingClientRect()),
    lanes = [];
  for (const path of svg.querySelectorAll('.route-line, .route-interface-line')) {
    const matrix = path.getScreenCTM();
    let previous;
    for (const [, command, coordinates] of path.getAttribute('d').matchAll(/([ML])([^ML]+)/g)) {
      const [x, y] = coordinates
          .trim()
          .split(/[,\s]+/)
          .map(Number),
        next = new DOMPoint(x, y).matrixTransform(matrix);
      if (command === 'L' && previous) lanes.push([previous, next]);
      previous = next;
    }
  }
  const reserved = [],
    texts = [
      ...svg.querySelectorAll(
        '.room-box-name, .room-component-label, .room-box-configuration, .room-port-label, ' +
          '.room-overview-label text, .room-object-label, .room-object-detail, .route-cable-label'
      )
    ];
  const candidates = texts
    .filter(shown)
    .map(text => {
      const port = text.closest('[data-room-port]');
      return {
        text,
        port,
        bounds: (port?.querySelector('.room-port-symbol') || text).getBoundingClientRect(),
        owner: text.closest('[data-room-node]'),
        internal: !!text.closest('.room-box-internals, .room-box-equipment'),
        primary: text.classList.contains('room-box-name') || !!text.closest('.room-overview-label')
      };
    })
    .sort((a, b) => Number(b.primary) - Number(a.primary));
  for (const { text, port, bounds, owner, internal, primary } of candidates) {
    const blocked =
      !primary &&
      (reserved.some(b => boundsOverlap(bounds, b)) ||
        shells.some(shell => (!internal || shell.owner !== owner) && boundsOverlap(bounds, shell.bounds)) ||
        (!internal &&
          (markers.some(b => boundsOverlap(bounds, b)) ||
            lanes.some(([a, b]) => roomLineOverlapsBounds(a, b, bounds)))));
    if (blocked) {
      text.style.visibility = 'hidden';
      text.dataset.roomCollision = 'true';
    } else reserved.push(bounds);
    if (port) port.dataset.labelVisible = blocked ? 'false' : 'true';
  }
  for (const port of svg.querySelectorAll('[data-room-port]')) {
    const text = port.querySelector('.room-port-label');
    if (
      !text ||
      text.style.visibility === 'hidden' ||
      port.dataset.dense === 'true' ||
      port.dataset.labelFits !== 'true'
    )
      port.dataset.labelVisible = 'false';
  }
}
function updateVisualScale() {
  const svg = document.querySelector('#room-canvas'),
    matrix = svg?.getScreenCTM();
  if (!svg || !matrix) return;
  const rootScale = Math.hypot(matrix.a, matrix.b) || 1;
  for (const text of svg.querySelectorAll('[data-room-collision]')) {
    text.style.visibility = '';
    delete text.dataset.roomCollision;
  }
  const viewport = svg.closest('.room-scroll').getBoundingClientRect();
  const boxMetrics = [...svg.querySelectorAll('.room-box-visual')].map(box => {
    const transform = box.getScreenCTM(),
      shell = box.querySelector('.room-box-shell'),
      width = +shell.getAttribute('width'),
      height = +shell.getAttribute('height'),
      halfW = (Math.abs(transform.a) * width + Math.abs(transform.c) * height) / 2,
      halfH = (Math.abs(transform.b) * width + Math.abs(transform.d) * height) / 2,
      visible =
        transform.e + halfW + 140 >= viewport.left &&
        transform.e - halfW - 140 <= viewport.right &&
        transform.f + halfH + 140 >= viewport.top &&
        transform.f - halfH - 140 <= viewport.bottom;
    return {
      box,
      visible,
      width,
      height,
      halfH,
      boxScale: Math.hypot(transform.a, transform.b) || rootScale,
      heightScale: Math.hypot(transform.c, transform.d) || rootScale
    };
  });
  svg.style.setProperty('--room-unit', 1 / rootScale);
  for (const el of svg.querySelectorAll('[data-room-node]')) {
    const ring = el.querySelector('.selection-ring'),
      gap = 4 / rootScale;
    ring.dataset.footprintWidth ??= +ring.getAttribute('width') - 12;
    ring.dataset.footprintHeight ??= +ring.getAttribute('height') - 12;
    const width = +ring.dataset.footprintWidth,
      height = +ring.dataset.footprintHeight;
    ring.setAttribute('x', -width / 2 - gap);
    ring.setAttribute('y', -height / 2 - gap);
    ring.setAttribute('width', width + gap * 2);
    ring.setAttribute('height', height + gap * 2);
    ring.setAttribute('rx', gap);
    if (el.querySelector('.room-box-visual')) continue;
    const pixels = +el.dataset.roomSize * rootScale,
      previous = detailLevels.get(el.dataset.roomNode) || 'overview';
    let level =
      pixels >= (previous === 'detail' ? 122 : 138)
        ? 'detail'
        : pixels >= (previous === 'overview' ? 54 : 40)
          ? 'equipment'
          : 'overview';
    if (el.classList.contains('chosen') && level === 'overview') level = 'equipment';
    detailLevels.set(el.dataset.roomNode, level);
    el.dataset.roomDetail = level;
  }
  const tips = new Map(
    [...svg.querySelectorAll('[data-room-port-tips]')].map(group => [group.dataset.roomPortTips, group])
  );
  for (const { box, boxScale, heightScale, width, height, halfH, visible } of boxMetrics) {
    box.dataset.inViewport = String(visible);
    const owner = box.closest('[data-room-node]'),
      key = owner.dataset.roomNode,
      ports = [...box.querySelectorAll('[data-room-port]')],
      layout = roomPresentationLayout(
        width * boxScale,
        height * heightScale,
        +box.dataset.componentCount,
        ports.map(port => ({
          edge: port.dataset.edge,
          t: +port.dataset.portT
        }))
      ),
      level = roomDetailPolicy(
        {
          width: width * boxScale,
          height: height * heightScale,
          cellWidth: layout.cellWidth,
          cellHeight: layout.cellHeight,
          portSpacing: Math.min(
            ...ports.map(
              port =>
                +port.dataset.portSpacing *
                (port.dataset.edge === 'left' || port.dataset.edge === 'right' ? heightScale : boxScale)
            )
          )
        },
        detailLevels.get(key) || 'overview'
      );
    detailLevels.set(key, level);
    owner.dataset.roomDetail = level;
    box.style.setProperty('--room-unit', 1 / (boxScale || 1));
    box.style.setProperty('--room-label-size', 14 / boxScale + 'px');
    const symbol = box.querySelector('.room-equipment-symbol'),
      symbolSize = Math.min(24, width * boxScale * 0.55, height * heightScale * 0.45);
    symbol.setAttribute('transform', `scale(${symbolSize / 24 / boxScale})`);
    const compact = box.querySelector('.room-box-equipment');
    compact.dataset.fits = height * heightScale >= 84 ? 'true' : 'false';
    owner.dataset.roomCompactFits = compact.dataset.fits;
    compact.querySelector('.room-box-configuration')?.setAttribute('y', height / 2 - 9 / heightScale);
    const badge = owner.querySelector('.room-overview-label');
    if (badge) {
      badge.querySelector('path').setAttribute('d', `M0 ${halfH / rootScale}v${6 / rootScale}`);
      badge.querySelector('text').setAttribute('y', (halfH + 18) / rootScale);
    }
    for (const port of ports) {
      const gap =
        +port.dataset.portSpacing *
        (port.dataset.edge === 'left' || port.dataset.edge === 'right' ? heightScale : boxScale);
      port.dataset.dense = gap < 20 ? 'true' : 'false';
      port.dataset.grouped = gap < 10 ? 'true' : 'false';
      const placement = layout.ports[ports.indexOf(port)],
        pillWidth = Math.max(0, placement.labelWidth) / boxScale,
        pillHeight = placement.labelHeight / heightScale,
        pillX = placement.labelX / boxScale,
        pillY = placement.labelY / heightScale,
        rect = port.querySelector('.room-port-symbol'),
        label = port.querySelector('.room-port-label');
      port.dataset.labelFits = level !== 'overview' && placement.labelFits ? 'true' : 'false';
      port.dataset.labelVisible = port.dataset.labelFits;
      rect.setAttribute('x', pillX);
      rect.setAttribute('y', pillY);
      rect.setAttribute('width', pillWidth);
      rect.setAttribute('height', pillHeight);
      if (label) {
        label.dataset.maxWidth = Math.max(0, pillWidth - 8 / boxScale);
        label.setAttribute('x', pillX + pillWidth / 2);
        label.setAttribute('y', pillY + pillHeight / 2 + 4 / heightScale);
      }
    }
    for (const tip of tips.get(key)?.querySelectorAll('[data-room-port-proxy]') || []) {
      const port = ports.find(port => port.dataset.roomPort === tip.dataset.roomPortProxy);
      tip.dataset.grouped = port?.dataset.grouped || 'false';
    }
    owner.dataset.roomTitleInside = 'false';
    for (const text of visible ? box.querySelectorAll('[data-max-width]') : []) {
      text.dataset.fullText ??= text.textContent;
      const full = text.dataset.fullText,
        card = text.classList.contains('room-component-label')
          ? text.closest('.room-component-card')?.querySelector('rect')
          : null,
        primary = text.classList.contains('room-box-name'),
        portLabel = text.classList.contains('room-port-label'),
        font = (primary ? 15 : text.classList.contains('room-component-label') ? 14 : 12) / boxScale,
        characters = Math.max(1, Math.floor(+text.dataset.maxWidth / (font * 0.62)));
      text.style.fontSize = font + 'px';
      if (card || primary) {
        if (card) text.setAttribute('y', +card.getAttribute('y') + font + 3);
        const iconSize = card
            ? Math.max(
                0,
                Math.min(
                  22,
                  +card.getAttribute('width') * boxScale - 12,
                  +card.getAttribute('height') * heightScale - 12
                )
              )
            : 0,
          count = card
            ? Math.min(
                3,
                Math.floor((+card.getAttribute('height') - (iconSize + 10) / heightScale) / (font * 1.2))
              )
            : (text.closest('.room-box-equipment') ? height * heightScale >= 112 : 36 * heightScale >= 40)
              ? 2
              : 1;
        text.replaceChildren(
          ...componentLines(full, characters, Math.max(1, count)).map((value, index) => {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            line.setAttribute('x', text.getAttribute('x'));
            line.setAttribute('dy', index ? font * 1.2 : 0);
            line.textContent = value;
            return line;
          })
        );
        text.style.visibility = count > 0 && characters >= 4 ? 'visible' : 'hidden';
        if (card) {
          const bounds = text.getBBox(),
            fits =
              bounds.x >= +card.getAttribute('x') &&
              bounds.y >= +card.getAttribute('y') &&
              bounds.x + bounds.width <= +card.getAttribute('x') + +card.getAttribute('width') &&
              bounds.y + bounds.height <=
                +card.getAttribute('y') + +card.getAttribute('height') - (iconSize + 6) / heightScale;
          if (!fits || text.textContent.includes('…')) text.style.visibility = 'hidden';
        }
      } else {
        const value = full;
        text.textContent =
          value.length > characters ? value.slice(0, Math.max(1, characters - 1)) + '…' : value;
        if (portLabel) text.textContent = full;
        text.style.visibility = text.getComputedTextLength() <= +text.dataset.maxWidth ? 'visible' : 'hidden';
      }
      const buttonSurface = text.closest('[data-room-button]')?.querySelector('.room-button-label-surface');
      if (buttonSurface) {
        buttonSurface.setAttribute('x', +text.getAttribute('x') - +text.dataset.maxWidth / 2 - 2 / boxScale);
        buttonSurface.setAttribute('y', +text.getAttribute('y') - 16 / heightScale);
        buttonSurface.setAttribute('width', +text.dataset.maxWidth + 4 / boxScale);
        buttonSurface.setAttribute('height', 20 / heightScale);
        buttonSurface.setAttribute('rx', 2 / boxScale);
        buttonSurface.style.visibility = text.style.visibility;
      }
      if (primary && !text.closest('.room-box-equipment'))
        text.setAttribute('y', -height / 2 + 18 / heightScale);
      text.setAttribute('aria-label', full);
      if (primary) {
        const bounds = text.getBBox(),
          fits =
            text.style.visibility !== 'hidden' &&
            !text.textContent.includes('…') &&
            bounds.width <= width - 16 &&
            bounds.y >= -height / 2 &&
            bounds.y + bounds.height <= -height / 2 + 36;
        owner.dataset.roomTitleInside = String(level === 'detail' && fits);
        if (!fits) text.style.visibility = 'hidden';
      }
    }
    for (const card of box.querySelectorAll('.room-component-card')) {
      const rect = card.querySelector('rect'),
        icon = card.querySelector('.room-component-icon'),
        name = card.querySelector('.room-component-label'),
        size = Math.max(
          0,
          Math.min(
            22,
            +rect.getAttribute('width') * boxScale - 12,
            +rect.getAttribute('height') * heightScale - 12
          )
        ),
        named = name && name.style.visibility !== 'hidden';
      icon.style.fontSize = size / boxScale + 'px';
      icon.setAttribute(
        'y',
        +rect.getAttribute('y') +
          (named
            ? +rect.getAttribute('height') - (size / 2 + 4) / heightScale
            : +rect.getAttribute('height') / 2)
      );
    }
  }
  reserveRoomLabels(svg);
}
function propSvg(pr, count = pr.count, numbered = false) {
  const points = pixelPoints(pr, count);
  return `${pr.reference ? `<image href="${pr.reference}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet" opacity=".55"/>` : ''}${showPixelLines && points.length > 1 ? `<polyline points="${points.map(pt => `${pt.x * 100},${pt.y * 100}`).join(' ')}" fill="none" stroke="${pr.color}" stroke-opacity=".55" stroke-width=".8"/>` : ''}${points.map((pt, i) => `<circle cx="${pt.x * 100}" cy="${pt.y * 100}" r="${numbered ? 1.5 : 1.8}" fill="${pr.color}"/>${numbered && points.length <= 150 ? `<text x="${pt.x * 100 + 1.8}" y="${pt.y * 100 - 1.5}" font-size="2.3" fill="#677b78">${i + 1}</text>` : ''}`).join('')}`;
}
function floodSvg(count, color) {
  return Array.from({ length: Math.min(count, 8) }, (_, i) => {
    const x = 8 + i * (84 / Math.max(1, Math.min(count, 8)));
    return `<g transform="translate(${x} 50)"><path d="M-5-7v-5h14v5M-3 8v5h10V8" fill="none" stroke="#54625e" stroke-width="2"/><rect x="-6" y="-8" width="16" height="16" rx="2" fill="#364541" stroke="#182824" stroke-width="1.5"/><rect x="-3" y="-5" width="10" height="10" rx="1" fill="${color}" stroke="#f3d984" stroke-width="1.5"/><path d="M-2 8L-8 27H12L6 8" fill="${color}" opacity=".18"/></g>`;
  }).join('');
}
function fieldVisual(device, w, h) {
  const name = device.snapshot.name.toLowerCase(),
    frame = body =>
      `<svg x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${body}</svg>`;
  if (name.includes('button'))
    return frame(
      `<rect x="22" y="38" width="56" height="42" rx="8" fill="#505c58" stroke="#243a34" stroke-width="4"/><ellipse cx="50" cy="40" rx="23" ry="18" fill="${E(device.buttonColor)}" stroke="#f5f7f4" stroke-width="5"/><ellipse cx="50" cy="36" rx="13" ry="8" fill="#ffffff55"/>`
    );
  if (name.includes('switch'))
    return frame(
      `<rect x="22" y="25" width="56" height="55" rx="8" fill="#d9dedb" stroke="#344942" stroke-width="4"/><circle cx="50" cy="55" r="14" fill="#65736e"/><path d="M50 54L65 20" stroke="#263934" stroke-width="8" stroke-linecap="round"/><circle cx="67" cy="17" r="8" fill="#d5dcd8" stroke="#263934" stroke-width="3"/>`
    );
  if (/(pir|motion)/.test(name))
    return frame(
      `<rect x="24" y="22" width="52" height="62" rx="9" fill="#4d7770" stroke="#27453f" stroke-width="4"/><circle cx="50" cy="48" r="20" fill="#eef3e8" stroke="#b8c6bd" stroke-width="3"/><path d="M34 48h32M37 39h26M37 57h26" stroke="#cad5ce" stroke-width="2"/>`
    );
  if (/(beam|proximity|ultrasonic|ir sensor)/.test(name))
    return frame(
      `<rect x="17" y="28" width="66" height="48" rx="8" fill="#397c68" stroke="#22483d" stroke-width="4"/><circle cx="36" cy="50" r="12" fill="#dbe8e2" stroke="#233a34" stroke-width="4"/><circle cx="65" cy="50" r="12" fill="#dbe8e2" stroke="#233a34" stroke-width="4"/><path d="M25 82h50" stroke="#526962" stroke-width="5"/>`
    );
  if (/(pressure mat|force sensor|load cell)/.test(name))
    return frame(
      `<rect x="10" y="25" width="80" height="52" rx="6" fill="#577c70" stroke="#263f38" stroke-width="4"/><rect x="20" y="35" width="60" height="32" rx="3" fill="#7fa899"/><path d="M29 43h42M29 51h42M29 59h42" stroke="#dce9e2" stroke-width="3"/>`
    );
  if (/(encoder|potentiometer)/.test(name))
    return frame(
      `<rect x="22" y="22" width="56" height="62" rx="7" fill="#477867" stroke="#253e36" stroke-width="4"/><circle cx="50" cy="48" r="22" fill="#d9dfdc" stroke="#364a44" stroke-width="4"/><path d="M50 48V30" stroke="#364a44" stroke-width="5" stroke-linecap="round"/><path d="M35 84v10M50 84v10M65 84v10" stroke="#a68243" stroke-width="4"/>`
    );
  if (name.includes('light sensor'))
    return frame(
      `<rect x="22" y="20" width="56" height="64" rx="8" fill="#477867" stroke="#253e36" stroke-width="4"/><circle cx="50" cy="50" r="16" fill="#e8d574" stroke="#fff2a6" stroke-width="4"/><path d="M50 19v10M50 71v10M19 50h10M71 50h10M28 28l7 7M65 65l7 7M72 28l-7 7M35 65l-7 7" stroke="#e8d574" stroke-width="4" stroke-linecap="round"/>`
    );
  if (/(rfid|nfc)/.test(name))
    return frame(
      `<rect x="17" y="17" width="66" height="70" rx="7" fill="#e8eee9" stroke="#304a42" stroke-width="4"/><rect x="28" y="29" width="27" height="35" rx="3" fill="#5b8d79"/><path d="M61 36q17 14 0 28M67 29q25 21 0 42" fill="none" stroke="#3f7460" stroke-width="4" stroke-linecap="round"/>`
    );
  if (name.includes('microphone'))
    return frame(
      `<rect x="37" y="15" width="26" height="49" rx="13" fill="#52645e" stroke="#263d36" stroke-width="4"/><path d="M29 48v5a21 21 0 0042 0v-5M50 74v14M36 88h28" fill="none" stroke="#263d36" stroke-width="5" stroke-linecap="round"/>`
    );
  if (name.includes('speaker'))
    return frame(
      `<path d="M17 39h17l23-19v60L34 61H17Z" fill="#52665f" stroke="#263c35" stroke-width="4"/><path d="M67 36q16 14 0 28M75 27q27 23 0 46" fill="none" stroke="#3d6657" stroke-width="5" stroke-linecap="round"/>`
    );
  if (name.includes('fan'))
    return frame(
      `<circle cx="50" cy="50" r="39" fill="#d9e1dd" stroke="#2c463e" stroke-width="4"/><circle cx="50" cy="50" r="8" fill="#31483f"/><path d="M50 42C38 12 68 8 61 38M58 50c30-12 34 18 4 11M50 58c12 30-18 34-11 4M42 50c-30 12-34-18-4-11" fill="#568b77"/>`
    );
  if (/(motor|servo|actuator)/.test(name))
    return frame(
      `<rect x="15" y="28" width="62" height="49" rx="9" fill="#678079" stroke="#283f38" stroke-width="4"/><rect x="77" y="42" width="16" height="18" fill="#b2bbb7" stroke="#394e47" stroke-width="3"/><circle cx="39" cy="52" r="15" fill="#d7dfdb" stroke="#3c514a" stroke-width="3"/><path d="M39 37v30M24 52h30" stroke="#8c9994" stroke-width="2"/>`
    );
  if (/(light|fixture|projector|display)/.test(name))
    return frame(
      `<path d="M20 28h60l-7 46H27Z" fill="#3f4e4a" stroke="#1f312c" stroke-width="4"/><rect x="31" y="36" width="38" height="29" rx="4" fill="#f0d06d" stroke="#fff1ae" stroke-width="4"/><path d="M29 78h42M36 78v10M64 78v10" stroke="#52635e" stroke-width="5" stroke-linecap="round"/>`
    );
  if (/(smoke|fog|haze|bubble|snow)/.test(name))
    return frame(
      `<rect x="18" y="42" width="55" height="38" rx="5" fill="#505f5b" stroke="#263b35" stroke-width="4"/><path d="M73 51h15v17H73" fill="#788680" stroke="#263b35" stroke-width="3"/><path d="M75 36c8-13 19-5 13-17M61 34c5-10 14-6 11-17" fill="none" stroke="#9bb1aa" stroke-width="5" stroke-linecap="round"/>`
    );
  if (/(relay|solenoid|magnet|maglock)/.test(name))
    return frame(
      `<rect x="17" y="23" width="66" height="59" rx="7" fill="#4b7d6c" stroke="#263f37" stroke-width="4"/><path d="M28 56h10c0-20 24-20 24 0h10M35 35h30" fill="none" stroke="#e3eee8" stroke-width="5"/><circle cx="28" cy="68" r="4" fill="#dfbd61"/><circle cx="72" cy="68" r="4" fill="#dfbd61"/>`
    );
  return frame(
    `<rect x="18" y="20" width="64" height="64" rx="10" fill="${E(device.snapshot.color || '#4b8a76')}" stroke="#244d43" stroke-width="4"/><circle cx="50" cy="52" r="17" fill="#e8f1ec" stroke="#34594d" stroke-width="4"/><path d="M50 35v34M33 52h34" stroke="#6a8f82" stroke-width="3"/>`
  );
}
function fieldConnectionLabel(p, device) {
  const key = 'field:' + device.id,
    link = p.installation.connections.find(x => x.fromKey === key || x.toKey === key);
  if (!link) return '';
  const box = p.installation.boxes.find(x => x.id === link.boxId),
    componentId = link.fromKey === key ? link.toComponent : link.fromComponent,
    portId = link.fromKey === key ? link.toPort : link.fromPort,
    part = box?.components.find(x => x.id === componentId),
    port = part?.snapshot.ports.find(x => x.id === portId);
  return [box?.name, port?.label].filter(Boolean).join(' ');
}
export function roomView(p) {
  ensureInstallation(p);
  ensureScene(p);
  requestAnimationFrame(() => {
    restoreViewport();
    updateVisualScale();
    const camera = document.querySelector('.room-camera');
    if (camera && !camera.querySelector('[data-room="fit-all"]'))
      camera
        .querySelector('[data-room="fit-selected"]')
        .insertAdjacentHTML('beforebegin', b('Fit all', 'fit-all', 'room-fit'));
    if (camera && !camera.querySelector('[data-room="ports"]'))
      camera.insertAdjacentHTML('beforeend', b('Ports', 'ports', 'room-fit'));
    if (portPicker) showPortPicker(portPicker);
  });
  const es = entities(p);
  if (!es.some(e => e.key === chosen)) chosen = es[0]?.key;
  const e = es.find(e => e.key === chosen),
    v = p.scene.placements[chosen];
  return `<div class="room-toolbar"><div><strong>Room layout</strong><span>Bird’s-eye · drag objects to position · drag empty space to pan</span></div><div>${b('+ Controller box', 'add-box', 'btn')}${b('+ Pixels / flood', 'add-pixels', 'btn')}${b('+ Field device', 'field-library', 'btn')}${b(showGrid ? 'Grid on' : 'Grid off', 'grid', 'btn ' + (showGrid ? 'pressed' : ''))}</div></div>${routeControls(p)}<div class="room-workspace"><div class="room-panel panel"><div class="room-dimensions"><span>${p.scene.width} m × ${p.scene.depth} m</span><span>${p.scene.snap ? 'Snap ' + p.scene.snap + ' m' : 'Free positioning'}</span></div><div class="room-stage"><div class="room-scroll"><svg id="room-canvas" viewBox="0 0 ${p.scene.width * 100} ${p.scene.depth * 100}" style="width:${zoom * 100}%;min-width:${zoom * 100}%" role="img" aria-label="Bird’s-eye room layout. Drag objects to position, drag empty space to pan, or use the mouse wheel to zoom."><defs><pattern id="room-grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0H0V100" fill="none" stroke="#dce5e4" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="#f9fbfa"/>${showGrid ? '<rect width="100%" height="100%" fill="url(#room-grid)"/>' : ''}<rect class="room-boundary" x="3" y="3" width="${p.scene.width * 100 - 6}" height="${p.scene.depth * 100 - 6}" fill="none" stroke="#9cafad"/><g id="room-routes">${routeLayer(p)}</g><path id="room-wire-preview" aria-hidden="true"/>${es.map(en => node(p, en)).join('')}${boxPorts(p)}</svg></div><div class="room-camera" role="group" aria-label="Room view controls"><button type="button" data-room="zoom-out" aria-label="Zoom out" title="Zoom out">−</button><span data-room-zoom aria-live="polite">${Math.round(zoom * 100)}%</span><button type="button" data-room="zoom-in" aria-label="Zoom in" title="Zoom in">+</button><button class="room-fit" type="button" data-room="fit-site" title="Fit the whole site">Fit site</button><button class="room-fit" type="button" data-room="fit-selected" title="Fit the selected object">Fit selected</button></div></div><div class="room-key"><span><i></i> Data <i class="room-power-key"></i> Power <i class="room-inject-key"></i> Injection</span><span>Mouse wheel zooms · drag empty space to pan</span></div></div><aside class="panel room-inspector"><div class="inspector-title"><h3>Layout inspector</h3><span class="pill">2D</span></div><div class="inspector-body">${
    e
      ? `<details class="room-inspector-section"><summary>Selected object</summary><div class="room-inspector-section-body"><span class="room-type">${e.type === 'segment' ? 'PIXEL GROUP' : e.type.toUpperCase()}</span><h3>${E(e.name)}</h3>${pick(
          'Selected object',
          chosen,
          'selection',
          es.map(x => [x.key, x.name + ' · ' + x.type])
        )}<div class="two">${field('X position (m)', v.x, 'item.x', 'number', 0, p.scene.width)}${field('Y position (m)', v.y, 'item.y', 'number', 0, p.scene.depth)}</div><div class="two">${field('Width (m)', v.width, 'item.width', 'number', 0.1, 50)}${field('Depth (m)', v.height, 'item.height', 'number', 0.1, 50)}</div>${field('Rotation (degrees)', v.rotation, 'item.rotation', 'number', -360, 360)}${
          e.type === 'field' && e.o.snapshot.name.toLowerCase().includes('button')
            ? pick(
                'Button colour',
                e.o.buttonColour,
                'device.buttonColour',
                BUTTON_COLOURS.map(([name]) => [name, name])
              )
            : field(
                e.type === 'segment' ? 'String / prop colour' : 'Box colour',
                v.color,
                'item.color',
                'color'
              )
        }${e.type === 'field' ? '' : `<div class="colour-swatches">${PALETTE.map(c => `<button data-room="colour:${c}" style="background:${c}" aria-label="Use colour ${c}"></button>`).join('')}</div>`}${e.type === 'box' ? b('Edit box internals', 'open-box:' + e.id) : ''}${e.type === 'segment' ? b('Edit wiring for this group', 'wire:' + e.chain.id) : ''}${b('Remove selected object', 'delete-object', 'text-btn danger')}${e.type === 'segment' ? `<p class="micro">${e.o.count} ${E(e.o.kind)} pixels${e.o.propId ? ' · ' + E(p.props.find(pr => pr.id === e.o.propId)?.name) : ''}. Size and colour are layout labels, not output brightness or LED colours.</p>` : '<p class="micro">Plan dimensions use measured enclosure or device sizes when available, otherwise a practical approximation. Edit electrical ratings in Hardware & power.</p>'}</div></details>`
      : ''
  }${routeInspector(p, api.getLibrary())}<details class="room-inspector-section"><summary>Room settings</summary><div class="room-inspector-section-body"><div class="two">${field('Width (m)', p.scene.width, 'scene.width', 'number', 2, 100)}${field('Depth (m)', p.scene.depth, 'scene.depth', 'number', 2, 100)}</div>${pick(
    'Snap to grid',
    p.scene.snap,
    'scene.snap',
    [
      [0, 'Off'],
      [0.05, '5 cm'],
      [0.1, '10 cm'],
      [0.25, '25 cm'],
      [0.5, '50 cm'],
      [1, '1 m']
    ]
  )}<p class="micro">Drag any box or pixel group. Arrow keys move a selected object; Shift moves 1 m. Dimensions and positions are saved with your project.</p></div></details></div></aside></div>`;
}
const componentShortName = name =>
  name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d)/g, '$1 $2')
    .replace(/\bRaspberry Pi\b/gi, 'RPi')
    .replace(/\bBaldrick\b/gi, 'B')
    .replace(/\bInput\b/gi, 'IN')
    .replace(/\bOutput\b/gi, 'OUT')
    .replace(/\bNetwork\b/gi, 'NET')
    .replace(/\bSwitch\b/gi, 'SW')
    .replace(/\bDistribution\b/gi, 'DIST')
    .replace(/\bAmplifier\b/gi, 'AMP')
    .replace(/\bTransformer\b/gi, 'XFMR');
export function componentLines(name, limit, maxLines = 2) {
  const words = name.split(/\s+/),
    lines = [];
  for (const word of words) {
    const current = lines.at(-1);
    if (!current || current.length + word.length + 1 > limit) lines.push(word);
    else lines[lines.length - 1] += ' ' + word;
  }
  if (lines.length > maxLines) {
    lines[maxLines - 1] = lines.slice(maxLines - 1).join(' ');
    lines.length = maxLines;
  }
  return lines.map(line => (line.length > limit ? line.slice(0, Math.max(2, limit - 1)) + '…' : line));
}
export function compactPortLabel(port) {
  const role = {
      digital_input: 'DI',
      relay_output: 'Relay',
      pixel_output: 'Pixel',
      ethernet: 'Eth',
      dmx: 'DMX'
    }[port.type],
    number = port.id.match(/(\d+)$/)?.[1] || port.label.match(/\b(\d+)\b/)?.[1];
  return role && number ? `${role} ${number}` : port.label;
}
function boxVisual(box, w, h) {
  const scale = w / 400;
  w /= scale;
  h /= scale;
  const items = box.components,
    ports = exposedPorts(box),
    n = items.length,
    layout = roomPresentationLayout(w, h, n, ports),
    { cols, header, padding } = layout,
    cellW = layout.cellWidth,
    cellH = layout.cellHeight,
    labels = api.getProject().installation.showLabels,
    inputs = ports.filter(({ port }) => port.direction === 'in').length,
    outputs = ports.filter(({ port }) => port.direction === 'out').length,
    bidirectional = ports.length - inputs - outputs,
    configuration = ports.length
      ? [inputs && `${inputs} IN`, outputs && `${outputs} OUT`, bidirectional && `${bidirectional} I/O`]
          .filter(Boolean)
          .join(' / ')
      : box.interfacePorts?.length
        ? 'NO ACTIVE EDGE PORTS'
        : `${n} COMPONENT${n === 1 ? '' : 'S'}`;
  const summary = `${n} component${n === 1 ? '' : 's'} · ${ports.length} port${ports.length === 1 ? '' : 's'}`,
    equipment = `<g class="room-box-equipment">${labels ? `<text class="room-box-configuration" data-max-width="${w - 16}" x="0" text-anchor="middle" fill="#d7ebe4">${E(summary)}</text>` : ''}</g><g class="room-equipment-symbol" aria-hidden="true"><rect x="-11" y="-10" width="22" height="20" rx="2"/><path d="M-6 -5H3M-6 0H3M-6 5H3"/><circle cx="7" cy="5" r="1"/></g>`;
  const internals = `<rect class="room-box-shell" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="4" fill="#193f39" stroke="#4f806a"/><title>${E(box.name)} · ${E(summary)}</title>${equipment}<g class="room-box-internals">${labels ? `<text class="room-box-name" data-max-width="${w - 16}" data-characters="${box.name.length}" x="${-w / 2 + 8}" y="${-h / 2 + 15}" fill="white" font-weight="700">${E(box.name)}</text><text class="room-box-configuration" data-max-width="${w - 16}" x="${-w / 2 + 8}" y="${-h / 2 + 29}" fill="#d7ebe4">${E(configuration)}</text>` : ''}${items
    .map((part, i) => {
      const x = -w / 2 + padding + (i % cols) * cellW,
        y = -h / 2 + header + Math.floor(i / cols) * cellH,
        c = part.snapshot.color || '#4b8a76',
        shortName = componentShortName(part.snapshot.name),
        name = part.snapshot.name + (part.subname ? ` (${part.subname})` : ''),
        details = `${box.name} → ${name} · ${part.snapshot.ports.length} ports`;
      if (box.kind === 'button') {
        const labelHeight = labels ? 28 : 0,
          size = { small: 0.7, medium: 0.85, large: 1 }[part.buttonSize || 'medium'],
          scale = size * Math.max(0.18, Math.min((cellW - 8) / 62, (cellH - labelHeight - 4) / 62)),
          cx = x + cellW / 2,
          cy = y + (cellH - labelHeight) / 2;
        return `<g data-room-button="${E(part.id)}" data-button-size="${E(part.buttonSize)}" data-room-label-details="${E(details)}" tabindex="0" role="group" aria-label="${E(details)}"><g class="room-button-symbol" transform="translate(${cx} ${cy}) scale(${scale}) translate(-50 -51)"><rect x="22" y="38" width="56" height="42" rx="8" fill="#505c58" stroke="#243a34" stroke-width="1.5"/><ellipse cx="50" cy="40" rx="23" ry="18" fill="${E(c)}" stroke="${part.buttonType === 'illuminated' ? '#fff3ad' : '#d7dfdc'}" stroke-width="${part.buttonType === 'illuminated' ? 4 : 2}"/><ellipse cx="50" cy="36" rx="13" ry="8" fill="#ffffff55"/></g>${labels ? `<g><rect class="room-button-label-surface" x="${x + 4}" y="${y + cellH - 19}" width="${cellW - 8}" height="20" rx="2" fill="#f9fbfa"/><text class="room-component-label" data-max-width="${cellW - 8}" data-characters="${(part.subname || shortName).length}" x="${cx}" y="${y + cellH - 3}" text-anchor="middle" fill="white">${E(part.subname || shortName)}</text></g>` : ''}<title>${E(details)} · ${E(part.buttonColour || 'Custom')} · ${E(part.buttonSize)}</title></g>`;
      }
      return `<g class="room-component-card" tabindex="0" role="group" data-room-label-details="${E(details)}" aria-label="${E(details)}"><rect x="${x + 2}" y="${y + 2}" width="${cellW - 4}" height="${cellH - 4}" rx="2" fill="#f9fbfa" stroke="${E(c)}" stroke-width="2"/><text class="room-component-icon" x="${x + cellW / 2}" y="${y + cellH / 2}" text-anchor="middle" dominant-baseline="central" aria-hidden="true">${E(part.snapshot.icon)}</text>${labels ? `<text class="room-component-label" data-max-width="${cellW - 12}" x="${x + 6}" y="${y + 17}">${E(name)}</text>` : ''}<title>${E(details)}</title></g>`;
    })
    .join(
      ''
    )}${n || !labels ? '' : '<text text-anchor="middle" y="5" fill="white" font-size="11">EMPTY BOX</text>'}</g>`;
  const nodes = ports
    .map(({ component, port, edge, t }, index) => {
      const {
          x,
          y,
          spacing,
          labelWidth: pillW,
          labelHeight: pillH,
          labelX: pillX,
          labelY: pillY
        } = layout.ports[index],
        label = port.label,
        textX = pillX + pillW / 2,
        textY = pillY + 14;
      return `<g class="room-external-node" data-room-port="${E(box.id)}:${E(component.id)}:${E(port.id)}" data-edge="${E(edge)}" data-port-t="${t}" data-port-spacing="${spacing}" data-anchor-x="${x}" data-anchor-y="${y}" tabindex="0" role="button" aria-label="${E(box.name)} ${E(component.snapshot.name)} ${E(port.label)} ${E(port.type)} port"><rect class="room-port-symbol" x="${pillX}" y="${pillY}" width="${Math.max(0, pillW)}" height="20" rx="5" fill="#f9fbfa" stroke="${portTypeColour(port.type)}"/><circle class="room-port-dot" cx="${x}" cy="${y}" fill="${E(component.snapshot.color || '#4b8a76')}" stroke="${portTypeColour(port.type)}"/><title>${E(box.name)} → ${E(component.snapshot.name)}${component.subname ? ` (${E(component.subname)})` : ''} → ${E(port.label)} (${E(port.type)})</title>${labels ? `<text class="room-port-label" data-compact="${E(compactPortLabel(port))}" data-port-id="${E(port.id)}" data-max-width="${pillW - 8}" x="${textX}" y="${textY}" text-anchor="middle">${E(label)}</text>` : ''}</g>`;
    })
    .join('');
  return `<g class="room-box-visual" data-component-count="${n}" data-cell-width="${cellW}" data-cell-height="${cellH}" transform="scale(${scale})">${internals}${nodes}</g>`;
}
function boxPorts(p) {
  return (
    `<g id="room-route-markers">${routeMarkers(p)}</g>` +
    p.installation.boxes
      .map(box => {
        const v = p.scene.placements['box:' + box.id];
        if (!v) return '';
        const ports = exposedPorts(box);
        return `<g data-room-port-tips="${E('box:' + box.id)}" transform="translate(${v.x * 100} ${v.y * 100})" aria-hidden="true"><g transform="rotate(${v.rotation})">${ports
          .map(node => {
            const { x, y } = roomPortGeometry(v.width * 100, v.height * 100, node, ports, true);
            return `<circle class="room-port-tip" data-room-port-proxy="${E(box.id)}:${E(node.component.id)}:${E(node.port.id)}" cx="${x}" cy="${y}" fill="${E(node.component.snapshot.color || '#4b8a76')}" stroke="${portTypeColour(node.port.type)}"/>`;
          })
          .join('')}</g></g>`;
      })
      .join('')
  );
}
function roomPortTarget(element) {
  const proxy = element?.closest('[data-room-port-proxy]');
  return proxy
    ? document.querySelector(`[data-room-port="${CSS.escape(proxy.dataset.roomPortProxy)}"]`)
    : element?.closest('[data-room-port]');
}
function node(p, e) {
  const v = p.scene.placements[e.key],
    pr = p.props.find(pr => pr.id === e.o.propId),
    is = e.type === 'segment',
    connected =
      !is ||
      !!e.chain.controller ||
      p.installation.connections.some(x => x.fromKey === e.key || x.toKey === e.key),
    w = v.width * 100,
    h = v.height * 100,
    labels = p.installation.showLabels;
  const detail = is
    ? `P${e.chain.port} · ${e.o.count} pixels`
    : e.type === 'field'
      ? fieldConnectionLabel(p, e.o)
      : '';
  return `<g data-room-node="${E(e.key)}" data-room-size="${Math.max(w, h)}" tabindex="0" role="button" aria-label="Move ${E(e.name)}" transform="translate(${v.x * 100} ${v.y * 100})" class="room-object ${chosen === e.key ? 'chosen' : ''}"><g transform="rotate(${v.rotation})"><rect x="${-w / 2 - 6}" y="${-h / 2 - 6}" width="${w + 12}" height="${h + 12}" rx="7" fill="transparent" class="selection-ring" stroke="${chosen === e.key ? '#153f3d' : 'transparent'}"/>${is ? `<svg x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" viewBox="0 0 100 100" preserveAspectRatio="none">${e.o.kind === 'flood' && !pr ? floodSvg(e.o.count, v.color) : propSvg(pr ? { ...pr, color: v.color } : { shape: 'line', count: e.o.count, columns: Math.min(e.o.count, 8), color: v.color }, e.o.count)}</svg><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="transparent"/>${connected ? '' : `<g class="room-unconnected" transform="translate(${w / 2 - 5} ${-h / 2 + 5})"><circle r="12"/><text y="5" text-anchor="middle">!</text><title>Not connected to a pixel output</title></g>`}` : `${e.type === 'box' ? boxVisual(e.o, w, h) : e.type === 'field' ? fieldVisual(e.o, w, h) : e.type === 'psu' ? `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="3" fill="#e7f0e8" stroke="${v.color}" stroke-width="4"/><path d="M${w / 2 - 10} ${-h / 2}v${h}" stroke="${v.color}" stroke-width="5"/>` : e.type === 'distro' ? `<path d="M${-w / 2} ${-h / 2}h${w - 8}l8 8v${h - 8}h${-w}z" fill="#e9f1f4" stroke="${v.color}" stroke-width="4"/>` : e.type === 'controller' ? `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="10" fill="#173f34" stroke="${v.color}" stroke-width="4"/>` : `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="6" fill="${v.color}"/>`}${labels ? `<text text-anchor="middle" y="4" fill="${e.type === 'psu' || e.type === 'distro' ? '#28483d' : 'white'}" font-size="${Math.min(14, w / 5)}" font-weight="700">${e.type === 'box' || e.type === 'field' ? '' : { controller: 'CTRL', psu: 'PSU', distro: 'DIST', aux: 'I/O' }[e.type]}</text>` : ''}`}</g>${labels ? `${e.type === 'box' ? `<g class="room-overview-label"><path d="M0 ${h / 2}v12"/><text x="0" y="${h / 2 + 24}" text-anchor="middle">${E(e.name.length > 30 ? e.name.slice(0, 28) + '…' : e.name)}</text></g>` : `<text class="room-object-label" x="0" y="${h / 2 + 16}" text-anchor="middle">${E(e.name.length > 30 ? e.name.slice(0, 28) + '…' : e.name)}</text>`}${detail ? `<text class="room-object-detail" x="0" y="${h / 2 + 30}" text-anchor="middle">(${E(detail)})</text>` : ''}` : ''}</g>`;
}
export function propsView(p) {
  ensureScene(p);
  if (!p.props.some(x => x.id === propId)) propId = p.props[0]?.id;
  const pr = p.props.find(x => x.id === propId);
  return `<div class="room-note">Props are reusable pixel layouts. Place an instance on a controller port to include its pixels in the electrical plan. Imported images and SVGs are visual references; mark the actual pixel positions over them.</div><div class="prop-page"><aside class="panel prop-library">${p.props.map(x => `<button data-room="prop:${x.id}" class="prop-tile ${propId === x.id ? 'active' : ''}"><svg viewBox="0 0 100 100" aria-hidden="true">${propSvg(x)}</svg><span><strong>${E(x.name)}</strong><small>${x.count} pixels · ${E(x.shape)}</small></span></button>`).join('')}${b('+ New prop', 'new-prop')}</aside><section class="panel prop-editor">${
    pr
      ? `<div class="props-header"><div><div class="eyebrow">PROP DESIGNER</div><h2>${E(pr.name)}</h2></div>${b('Place in room', 'place-prop', 'btn primary')}</div><div class="prop-edit-grid"><div><div class="prop-canvas ${pr.shape === 'custom' ? 'marking' : ''}"><svg id="prop-canvas" viewBox="0 0 100 100" role="img" aria-label="Prop pixel layout${pr.shape === 'custom' ? '. Click to add a pixel.' : ''}">${propSvg(pr, pr.count, true)}</svg></div><div class="prop-stat"><span>${pr.count} pixels / ${pr.count * pr.channels} channels</span><span>${(pr.count * pr.watts).toFixed(1)} W full white</span></div><div class="prop-actions">${b('Import image / SVG', 'upload-reference')}${b(showPixelLines ? 'Hide pixel lines' : 'Show pixel lines', 'pixel-lines')}${b('Reset to one point', 'reset-points', 'text-btn danger')}${pr.shape === 'custom' ? b('Undo last pixel', 'undo-pixel') + b('Clear pixels', 'clear-pixels', 'text-btn danger') : b('Edit individual pixels', 'make-custom')}</div>${pr.reference ? `<div class="prop-reference">Reference: ${E(pr.referenceName)} · embedded in project ${b('Remove', 'remove-reference', 'text-btn')}</div>` : ''}<p class="prop-help">${pr.shape === 'custom' ? 'Click the drawing to add pixels in wiring order. Use Undo last pixel to correct a point.' : 'Choose a shape and pixel count, then edit individual points if needed.'} Numbering follows data order. ${pr.count > 600 ? 'The preview displays the first 600 points.' : ''}</p></div><div class="prop-form">${field('Prop name', pr.name, 'prop.name', 'text')}${pick(
          'Pixel layout',
          pr.shape,
          'prop.shape',
          [
            ['smiley', 'Smiley face'],
            ['circle', 'Circle'],
            ['star', 'Star'],
            ['line', 'Straight string'],
            ['grid', 'Grid / matrix'],
            ['custom', 'Custom pixel points']
          ]
        )}${pr.shape === 'custom' ? `<div class="readout"><span>Marked pixel count</span><strong>${pr.count}</strong></div>` : field('Pixel count', pr.count, 'prop.count', 'number', 1, 5000, 1)}${pr.shape === 'grid' ? field('Grid columns', pr.columns, 'prop.columns', 'number', 1, 100, 1) : ''}<div class="two">${field('Width (m)', pr.width, 'prop.width', 'number', 0.1, 50)}${field('Height (m)', pr.height, 'prop.height', 'number', 0.1, 50)}</div>${field('Prop colour', pr.color, 'prop.color', 'color')}${pick(
          'Pixel type',
          pr.kind,
          'prop.kind',
          [
            ['seed', 'Seeds'],
            ['bullet', 'Bullets']
          ]
        )}${field('Full-white W / pixel', pr.watts, 'prop.watts', 'number', 0.001, 1000)}${pick(
          'Channels / pixel',
          pr.channels,
          'prop.channels',
          [
            [3, 'RGB · 3'],
            [4, 'RGBW · 4']
          ]
        )}<p class="prop-help">These are template defaults. Placed props have their own pixel count, colour, dimensions and electrical settings. Their shape and reference stay linked to this template.</p></div></div><div class="prop-actions">${b('Duplicate prop', 'duplicate-prop')}${b('Delete template', 'delete-prop', 'text-btn danger')}</div>`
      : '<div class="prop-empty">Create a prop to begin.</div>'
  }</section></div>`;
}
export function installRoom(a) {
  api = a;
  installRoutes(a);
  document.addEventListener('click', onClick);
  document.addEventListener('change', onChange);
  document.addEventListener('pointerdown', down);
  document.addEventListener('pointermove', move);
  const inspect = e => {
    if (
      e.target.closest('.physical-route') &&
      e.target.closest('.physical-route') !== e.relatedTarget?.closest?.('.physical-route')
    )
      requestAnimationFrame(updateVisualScale);
    const port = roomPortTarget(e.target),
      component = e.target.closest('[data-room-label-details]');
    tracePort(port?.dataset.roomPort);
    const inspector = document.querySelector('.room-inspector .inspector-body');
    if (!inspector || (!port && !component)) return;
    let details = inspector.querySelector('.room-label-details');
    if (!details) {
      details = document.createElement('p');
      details.className = 'room-label-details';
      details.setAttribute('aria-live', 'polite');
      inspector.prepend(details);
    }
    details.textContent = component?.dataset.roomLabelDetails || port.querySelector('title').textContent;
  };
  document.addEventListener('pointerover', inspect);
  document.addEventListener('focusin', inspect);
  document.addEventListener('pointerout', e => {
    if (
      e.target.closest('.physical-route') &&
      e.target.closest('.physical-route') !== e.relatedTarget?.closest?.('.physical-route')
    )
      requestAnimationFrame(updateVisualScale);
  });
  document.addEventListener('focusout', e => {
    if (e.target.closest('.physical-route')) requestAnimationFrame(updateVisualScale);
  });
  document.addEventListener('pointerup', up);
  document.addEventListener('pointercancel', up);
  document.addEventListener('wheel', wheel, { passive: false });
  document.addEventListener('scroll', rememberViewport, true);
  document.addEventListener('keydown', key);
  window.addEventListener('resize', updateVisualScale);
  const file = document.createElement('input');
  file.id = 'prop-reference-file';
  file.type = 'file';
  file.accept = 'image/png,image/jpeg,image/webp,image/svg+xml';
  file.hidden = true;
  document.body.append(file);
  file.addEventListener('change', importReference);
}
function completeRoomWire(target) {
  if (
    !roomWire ||
    !target ||
    (typeof target === 'string' && !target.startsWith('field:') && !target.startsWith('segment:'))
  )
    return;
  const source = roomWire;
  roomWire = null;
  portPicker = '';
  document.querySelector('.room-port-picker')?.remove();
  api.linkRoom(source, target);
}
function showPortPicker(boxId, candidates) {
  const box = api.getProject().installation.boxes.find(b => b.id === boxId);
  const stage = document.querySelector('.room-stage');
  if (!box || !stage) return;
  portPicker = boxId;
  document.querySelector('.room-port-picker')?.remove();
  stage.insertAdjacentHTML(
    'beforeend',
    `<section class="room-port-picker" aria-label="${E(box.name)} individual ports"><div><strong>${E(box.name)}</strong>${b('Close', 'close-ports', 'text-btn')}</div><p>${roomWire ? 'Select the exact destination port.' : 'Select a port, then another box’s port or a field object.'}</p>${
      (candidates || exposedPorts(box).map(e => ({ ...e, boxId: box.id })))
        .map(
          ({ component, port, boxId: owner }) =>
            `<button type="button" data-room-choose-port="${E(owner)}:${E(component.id)}:${E(port.id)}" style="--port-color:${portTypeColour(port.type)}">${candidates ? E(api.getProject().installation.boxes.find(b => b.id === owner)?.name) + ' · ' : ''}${E(component.snapshot.name)}${component.subname ? ` (${E(component.subname)})` : ''} · <strong>${E(port.label)}</strong><small>${E(port.type.replaceAll('_', ' '))}</small></button>`
        )
        .join('') || '<p>No active edge ports. Activate them in Box builder.</p>'
    }</section>`
  );
}
function overlappingPorts(ev) {
  if (ev.target.closest('.room-port-dot, .room-port-tip')) return [];
  return [...document.querySelectorAll('[data-room-port]')]
    .filter(el => {
      if (el.dataset.labelVisible !== 'true' || el.dataset.dense === 'true') return false;
      const r = el.querySelector('.room-port-symbol').getBoundingClientRect();
      return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
    })
    .map(el => {
      const [boxId, componentId, portId] = el.dataset.roomPort.split(':'),
        box = api.getProject().installation.boxes.find(b => b.id === boxId),
        component = box.components.find(c => c.id === componentId);
      return { boxId, component, port: component.snapshot.ports.find(p => p.id === portId) };
    });
}
function removeRoomObject(p) {
  const e = entities(p).find(item => item.key === chosen);
  if (!e) return;
  if (
    (e.type === 'distro' && p.chains.some(c => c.segments.some(s => s.inject && s.distro === e.id))) ||
    (e.type === 'controller' && p.controllers.length === 1)
  ) {
    api.toast(
      e.type === 'controller' ? 'Keep at least one controller.' : 'Reassign this distro’s feeds first.'
    );
    return;
  }
  const detail =
    `${e.name} will be removed from the project.` +
    (e.type === 'psu'
      ? ' Linked box components and cables will be removed; loads remain unassigned with missing-power warnings.'
      : '');
  api.confirmAction('Remove selected object?', detail, () => {
    const keys = new Set([e.key]);
    if (e.type === 'box') {
      p.installation.boxes = p.installation.boxes.filter(box => box.id !== e.id);
      p.installation.infrastructureMigrated = false;
    } else if (e.type === 'field')
      p.installation.fieldDevices = p.installation.fieldDevices.filter(device => device.id !== e.id);
    else if (e.type === 'segment') {
      e.chain.segments.splice(e.index, 1);
      if (!e.chain.segments.length) p.chains = p.chains.filter(chain => chain.id !== e.chain.id);
    } else if (e.type === 'controller') {
      for (const chain of p.chains.filter(chain => chain.controller === e.id))
        for (const segment of chain.segments) keys.add('segment:' + segment.id);
      p.controllers = p.controllers.filter(controller => controller.id !== e.id);
      p.chains = p.chains.filter(chain => chain.controller !== e.id);
    } else if (e.type === 'psu') removePowerSupply(p, e.id);
    else if (e.type === 'distro') p.distros = p.distros.filter(distro => distro.id !== e.id);
    else if (e.type === 'aux') p.aux = p.aux.filter(board => board.id !== e.id);
    for (const link of p.installation.connections.filter(
      link => link.boxId === e.id || keys.has(link.fromKey) || keys.has(link.toKey)
    ))
      deleteRoute(p, 'custom:' + link.id);
    for (const key of keys) delete p.scene.placements[key];
    chosen = '';
  });
}
function onClick(ev) {
  const group = ev.target.closest('[data-room-port-group]');
  if (group) {
    const boxId = group.dataset.roomPortGroup,
      box = api.getProject().installation.boxes.find(box => box.id === boxId);
    showPortPicker(
      boxId,
      exposedPorts(box)
        .filter(port => port.edge === group.dataset.edge)
        .map(port => ({ ...port, boxId }))
    );
    return;
  }
  const precise = ev.target.closest('[data-room-choose-port]');
  if (precise) {
    const [boxId, componentId, portId] = precise.dataset.roomChoosePort.split(':');
    if (roomWire) completeRoomWire({ boxId, componentId, portId });
    else {
      roomWire = { boxId, componentId, portId };
      portPicker = '';
      document.querySelector('.room-port-picker')?.remove();
      api.toast('Select another box, its exact port, or a field object.');
    }
    return;
  }
  const external = roomPortTarget(ev.target);
  if (external) {
    if (suppressPortClick) {
      suppressPortClick = false;
      return;
    }
    const [boxId, componentId, portId] = external.dataset.roomPort.split(':');
    const nearby = overlappingPorts(ev);
    if (nearby.length > 1) {
      showPortPicker(boxId, nearby);
      return;
    }
    if (external.dataset.dense === 'true' && ev.detail !== 0) {
      showPortPicker(boxId);
      return;
    }
    if (roomWire) {
      completeRoomWire({ boxId, componentId, portId });
      return;
    }
    roomWire = { boxId, componentId, portId };
    api.toast('Choose another box port, field device or pixel group to connect.');
    return;
  }
  const node = ev.target.closest('[data-room-node]');
  if (node && roomWire) {
    if (node.dataset.roomNode.startsWith('box:')) {
      showPortPicker(node.dataset.roomNode.slice(4));
      return;
    }
    completeRoomWire(node.dataset.roomNode);
    return;
  }
  const canvas = ev.target.closest('#prop-canvas');
  if (canvas) {
    const pr = api.getProject().props.find(x => x.id === propId);
    if (pr?.shape === 'custom') {
      const pt = canvas.createSVGPoint();
      pt.x = ev.clientX;
      pt.y = ev.clientY;
      const a = pt.matrixTransform(canvas.getScreenCTM().inverse());
      if (a.x >= 0 && a.x <= 100 && a.y >= 0 && a.y <= 100)
        api.transact(() => {
          pr.points.push({ x: +(a.x / 100).toFixed(5), y: +(a.y / 100).toFixed(5) });
          pr.count = pr.points.length;
        });
    }
    return;
  }
  const el = ev.target.closest('[data-room]');
  if (!el) return;
  const [action, id] = el.dataset.room.split(':'),
    p = api.getProject(),
    pr = p.props.find(x => x.id === propId);
  if (action === 'ports') {
    if (chosen?.startsWith('box:')) showPortPicker(chosen.slice(4));
    else api.toast('Select a box to inspect its individual ports.');
    return;
  }
  if (action === 'close-ports') {
    portPicker = '';
    document.querySelector('.room-port-picker')?.remove();
    return;
  }
  if (action === 'field-library') {
    api.showFieldLibrary();
    return;
  }
  if (action === 'add-pixels') {
    addPixels(p);
    return;
  }
  if (action === 'add-box') {
    addControllerBox(p);
    return;
  }
  if (action === 'delete-object') {
    removeRoomObject(p);
    return;
  }
  if (action === 'grid') showGrid = !showGrid;
  else if (action === 'pixel-lines') showPixelLines = !showPixelLines;
  else if (action === 'zoom-in') {
    wheelGesture = null;
    zoomStep(zoom * 1.25);
    return;
  } else if (action === 'zoom-out') {
    wheelGesture = null;
    zoomStep(zoom / 1.25);
    return;
  } else if (action === 'fit-site') {
    wheelGesture = null;
    fitSite();
    return;
  } else if (action === 'fit-selected') {
    wheelGesture = null;
    fitSelected();
    return;
  } else if (action === 'fit-all') {
    wheelGesture = null;
    const view = componentView();
    if (view) fitBounds(view);
    else fitSite();
    return;
  } else if (action === 'colour') {
    api.transact(() => (p.scene.placements[chosen].color = id));
    return;
  } else if (action === 'wire') {
    api.wiring(id);
    return;
  } else if (action === 'open-box') {
    api.showBoxes(id);
    return;
  } else if (action === 'prop') propId = id;
  else if (action === 'new-prop') {
    api.transact(() => {
      const item = makeProp();
      item.name = 'New prop';
      p.props.push(item);
      propId = item.id;
    });
    return;
  } else if (action === 'duplicate-prop') {
    api.transact(() => {
      const item = structuredClone(pr);
      item.id = makeProp().id;
      item.name += ' copy';
      p.props.push(item);
      propId = item.id;
    });
    return;
  } else if (action === 'make-custom') {
    api.transact(() => {
      if (pr.count > 600)
        throw Error('Reduce the template to 600 pixels or fewer before editing individual points.');
      pr.points = pixelPoints(pr);
      pr.shape = 'custom';
      pr.count = pr.points.length;
    });
    return;
  } else if (action === 'undo-pixel') {
    api.transact(() => {
      pr.points.pop();
      pr.count = pr.points.length;
    });
    return;
  } else if (action === 'reset-points') {
    api.confirmAction(
      'Reset prop drawing?',
      'This replaces the template with one pixel at the centre. Placed instances keep their electrical count and will show a layout mismatch until updated.',
      () => {
        pr.shape = 'custom';
        pr.points = [{ x: 0.5, y: 0.5 }];
        pr.count = 1;
      }
    );
    return;
  } else if (action === 'clear-pixels') {
    api.confirmAction(
      'Clear marked pixels?',
      'This clears the template drawing. Existing placed props keep their pixel count.',
      () => {
        pr.points = [];
        pr.count = 0;
      }
    );
    return;
  } else if (action === 'delete-prop') {
    api.confirmAction(
      'Delete prop template?',
      'Placed instances will become ordinary pixel strings with the same pixel count and electrical settings.',
      () => {
        for (const ch of p.chains) for (const s of ch.segments) if (s.propId === pr.id) delete s.propId;
        p.props = p.props.filter(x => x.id !== pr.id);
      }
    );
    return;
  } else if (action === 'upload-reference') {
    document.querySelector('#prop-reference-file').dataset.target = pr.id;
    document.querySelector('#prop-reference-file').click();
    return;
  } else if (action === 'remove-reference') {
    api.transact(() => {
      pr.reference = '';
      pr.referenceName = '';
    });
    return;
  } else if (action === 'place-prop') {
    place(pr, p);
    return;
  } else return;
  api.render();
}
function onChange(ev) {
  const t = ev.target,
    k = t.dataset.roomField;
  if (!k) return;
  if (!t.checkValidity()) {
    t.reportValidity();
    return;
  }
  if (k === 'selection') {
    chosen = t.value;
    api.render();
    return;
  }
  api.transact(() => {
    const p = api.getProject();
    if (k.startsWith('scene.')) {
      p.scene[k.slice(6)] = +t.value;
      for (const v of Object.values(p.scene.placements)) Object.assign(v, clampPosition(v, p.scene));
    } else if (k.startsWith('item.')) {
      const key = k.slice(5);
      p.scene.placements[chosen][key] = key === 'color' ? t.value : +t.value;
      if (key === 'width' || key === 'height') p.scene.placements[chosen].customFootprint = true;
    } else if (k === 'device.buttonColour') {
      const device = p.installation.fieldDevices.find(x => 'field:' + x.id === chosen),
        colour = BUTTON_COLOURS.find(([name]) => name === t.value);
      if (!device || !colour) throw Error('Choose a valid button colour.');
      [device.buttonColour, device.buttonColor] = colour;
    } else if (k.startsWith('prop.')) {
      const pr = p.props.find(x => x.id === propId),
        key = k.slice(5);
      if (key === 'shape' && t.value === 'custom') {
        if (pr.count > 600) throw Error('Reduce the template to 600 pixels or fewer first.');
        pr.points = pixelPoints(pr);
      }
      pr[key] = typeof pr[key] === 'number' ? +t.value : t.value;
      if (key === 'shape') pr.count = pr.shape === 'custom' ? pr.points.length : Math.max(1, pr.count);
    }
  });
}
function locationAt(ev, svg) {
  const pt = svg.createSVGPoint();
  pt.x = ev.clientX;
  pt.y = ev.clientY;
  const a = pt.matrixTransform(svg.getScreenCTM().inverse());
  return { x: a.x / 100, y: a.y / 100 };
}
function refreshRoomWire(ev) {
  const svg = document.querySelector('#room-canvas'),
    path = document.querySelector('#room-wire-preview'),
    source = roomWire
      ? svg?.querySelector(
          `[data-room-port="${CSS.escape(
            roomWire.boxId + ':' + roomWire.componentId + ':' + roomWire.portId
          )}"]`
        )
      : null;
  for (const node of document.querySelectorAll('.wire-target, .wire-invalid'))
    node.classList.remove('wire-target', 'wire-invalid');
  if (!svg || !path || !source || !ev) {
    path?.removeAttribute('d');
    return;
  }
  const start = svg.createSVGPoint();
  start.x = +source.dataset.anchorX;
  start.y = +source.dataset.anchorY;
  const a = start.matrixTransform(source.parentElement.getCTM()),
    point = locationAt(ev, svg),
    target = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-room-node]'),
    key = target?.dataset.roomNode;
  if (key?.startsWith('field:') || key?.startsWith('segment:')) target.classList.add('wire-target');
  const port = roomPortTarget(document.elementFromPoint(ev.clientX, ev.clientY));
  if (port) {
    const [boxId, componentId, portId] = port.dataset.roomPort.split(':');
    port.classList.add(
      connectionProblem(api.getProject(), roomWire, { boxId, componentId, portId })
        ? 'wire-invalid'
        : 'wire-target'
    );
  }
  path.setAttribute('stroke', source.querySelector('.room-port-dot')?.getAttribute('stroke') || '#d9982d');
  path.setAttribute('d', `M${a.x} ${a.y} L${point.x * 100} ${point.y * 100}`);
}
function tracePort(value) {
  for (const el of document.querySelectorAll('.port-traced')) el.classList.remove('port-traced');
  if (!value) return;
  const [boxId, componentId, portId] = value.split(':');
  for (const link of api.getProject().installation.connections) {
    const endpoints = ['from', 'to'].map(end => ({
      boxId: link[end + 'Key']?.startsWith('box:') ? link[end + 'Key'].slice(4) : link.boxId,
      componentId: link[end + 'Component'],
      portId: link[end + 'Port']
    }));
    if (!endpoints.some(e => e.boxId === boxId && e.componentId === componentId && e.portId === portId))
      continue;
    document.querySelector(`[data-route="custom:${CSS.escape(link.id)}"]`)?.classList.add('port-traced');
    for (const e of endpoints)
      document
        .querySelector(`[data-room-port="${CSS.escape(e.boxId + ':' + e.componentId + ':' + e.portId)}"]`)
        ?.classList.add('port-traced');
  }
}
function down(ev) {
  if (ev.target.closest('.room-port-picker,[data-room-port-group]')) return;
  const element = roomPortTarget(ev.target);
  if (element) {
    if (element.dataset.dense === 'true' || overlappingPorts(ev).length > 1 || roomWire) return;
    const [boxId, componentId, portId] = element.dataset.roomPort.split(':');
    roomWire = { boxId, componentId, portId, pointer: ev.pointerId, startX: ev.clientX, startY: ev.clientY };
    refreshRoomWire(ev);
    ev.preventDefault();
    return;
  }
  const el = ev.target.closest('[data-room-node]');
  if (el && ev.button === 0) {
    const p = api.getProject(),
      svg = el.closest('svg#room-canvas'),
      key = el.dataset.roomNode,
      v = p.scene.placements[key],
      pt = locationAt(ev, svg);
    const alreadySelected = chosen === key;
    chosen = key;
    drag = {
      svg,
      el,
      key,
      alreadySelected,
      start: { ...v },
      offset: { x: pt.x - v.x, y: pt.y - v.y },
      pointer: ev.pointerId
    };
    el.setPointerCapture(ev.pointerId);
    ev.preventDefault();
    return;
  }
  const sc = ev.target.closest('.room-scroll');
  if (
    !sc ||
    ev.button !== 0 ||
    !ev.target.closest('#room-canvas') ||
    ev.target.closest('.physical-route,[data-route-pivot],[data-route-endpoint]')
  )
    return;
  panDrag = {
    sc,
    pointer: ev.pointerId,
    x: ev.clientX,
    y: ev.clientY,
    left: sc.scrollLeft,
    top: sc.scrollTop
  };
  sc.setPointerCapture(ev.pointerId);
  sc.classList.add('panning');
  ev.preventDefault();
}
function move(ev) {
  if (roomWire?.pointer === ev.pointerId) refreshRoomWire(ev);
  if (panDrag && ev.pointerId === panDrag.pointer) {
    panDrag.sc.scrollLeft = panDrag.left - (ev.clientX - panDrag.x);
    panDrag.sc.scrollTop = panDrag.top - (ev.clientY - panDrag.y);
    return;
  }
  if (!drag || ev.pointerId !== drag.pointer) return;
  const p = api.getProject(),
    pt = locationAt(ev, drag.svg),
    s = p.scene.snap;
  let pos = { x: pt.x - drag.offset.x, y: pt.y - drag.offset.y };
  if (s) {
    pos.x = Math.round(pos.x / s) * s;
    pos.y = Math.round(pos.y / s) * s;
  }
  pos = clampPosition(pos, p.scene);
  const v = p.scene.placements[drag.key];
  const x = +pos.x.toFixed(3),
    y = +pos.y.toFixed(3);
  if (v.x === x && v.y === y) return;
  v.x = x;
  v.y = y;
  drag.el.setAttribute('transform', `translate(${v.x * 100} ${v.y * 100})`);
  document
    .querySelector(`[data-room-port-tips="${CSS.escape(drag.key)}"]`)
    ?.setAttribute('transform', `translate(${v.x * 100} ${v.y * 100})`);
  refreshRoutes();
}
function up(ev) {
  if (ev.type === 'pointercancel') {
    roomWire = null;
    refreshRoomWire();
  }
  if (panDrag && ev.pointerId === panDrag.pointer) {
    panDrag.sc.classList.remove('panning');
    viewport = { left: panDrag.sc.scrollLeft, top: panDrag.sc.scrollTop };
    panDrag = null;
    return;
  }
  if (roomWire?.pointer === ev.pointerId && !drag) {
    const element = document.elementFromPoint(ev.clientX, ev.clientY),
      targetPort = roomPortTarget(element),
      target = element?.closest('[data-room-node]');
    const moved = Math.hypot(ev.clientX - roomWire.startX, ev.clientY - roomWire.startY) > 4;
    roomWire.pointer = null;
    refreshRoomWire();
    if (!moved) {
      roomWire = null;
      return;
    }
    suppressPortClick = true;
    if (targetPort) {
      const [boxId, componentId, portId] = targetPort.dataset.roomPort.split(':');
      const nearby = overlappingPorts({ target: element, clientX: ev.clientX, clientY: ev.clientY });
      if (nearby.length > 1) showPortPicker(boxId, nearby);
      else if (targetPort.dataset.dense === 'true') showPortPicker(boxId);
      else completeRoomWire({ boxId, componentId, portId });
    } else if (target) completeRoomWire(target.dataset.roomNode);
    return;
  }
  if (!drag || ev.pointerId !== drag.pointer) return;
  if (ev.type === 'pointercancel') Object.assign(api.getProject().scene.placements[drag.key], drag.start);
  const incremental = drag.alreadySelected && ev.type !== 'pointercancel';
  drag = null;
  if (incremental) {
    const placement = api.getProject().scene.placements[chosen];
    for (const axis of ['x', 'y']) {
      const field = document.querySelector(`[data-room-field="item.${axis}"]`);
      if (field) field.value = placement[axis];
    }
    refreshRouteInspector();
    api.refreshRoomSummary();
    requestAnimationFrame(updateVisualScale);
  } else api.render();
  api.save();
}
function wheel(ev) {
  const sc = ev.target.closest('.room-scroll');
  if (!sc) return;
  ev.preventDefault();
  if (!ev.deltaY) return;
  const now = performance.now(),
    direction = Math.sign(ev.deltaY);
  if (!wheelGesture || now - wheelGesture.time > 250 || wheelGesture.direction !== direction)
    wheelGesture = { time: now, direction, blocked: false };
  wheelGesture.time = now;
  zoomStep(zoom * (direction < 0 ? 1.15 : 1 / 1.15), ev.clientX, ev.clientY, wheelGesture);
}
function rememberViewport(ev) {
  if (ev.target.matches?.('.room-scroll')) {
    viewport = { left: ev.target.scrollLeft, top: ev.target.scrollTop };
    requestAnimationFrame(updateVisualScale);
  }
}
function key(ev) {
  if (ev.key === 'Escape') {
    roomWire = null;
    portPicker = '';
    document.querySelector('.room-port-picker')?.remove();
    refreshRoomWire();
    return;
  }
  if (ev.target.closest('[data-room-label-details]')) return;
  const port = ev.target.closest('[data-room-port],[data-room-port-group]');
  if (port && ['Enter', ' '].includes(ev.key)) {
    ev.preventDefault();
    port.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return;
  }
  const el = ev.target.closest('[data-room-node]');
  if (!el) return;
  if (['Enter', ' '].includes(ev.key)) {
    ev.preventDefault();
    if (roomWire && !el.dataset.roomNode.startsWith('box:')) {
      completeRoomWire(el.dataset.roomNode);
      return;
    }
    chosen = el.dataset.roomNode;
    api.render();
    return;
  }
  const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[ev.key];
  if (!delta) return;
  ev.preventDefault();
  chosen = el.dataset.roomNode;
  api.transact(() => {
    const p = api.getProject(),
      v = p.scene.placements[chosen],
      step = ev.shiftKey ? 1 : p.scene.snap || 0.1;
    Object.assign(v, clampPosition({ x: v.x + step * delta[0], y: v.y + step * delta[1] }, p.scene));
  });
  document.querySelector(`[data-room-node="${CSS.escape(chosen)}"]`)?.focus();
}
function place(pr, p) {
  if (!pr.count) {
    api.toast('Mark at least one pixel before placing this prop.');
    return;
  }
  const options = outputOptions(p);
  api.modal(
    'Place ' + E(pr.name),
    `<p>Add ${pr.count} ${E(pr.kind)} pixels (${(pr.count * pr.watts).toFixed(1)} W full white) to the electrical plan.</p><label>Data connection<select name="target">${options.join('')}</select></label>`,
    f => {
      api.transact(() => {
        const [mode, id, port] = f.get('target').split('|'),
          s = api.newSegment(pr.kind);
        Object.assign(s, { count: pr.count, watts: pr.watts, channels: pr.channels, propId: pr.id });
        if (mode === 'new' || mode === 'unconnected')
          p.chains.push({
            id: 'r-' + Math.random().toString(36).slice(2, 10),
            name: pr.name,
            controller: mode === 'unconnected' ? '' : id,
            port: mode === 'unconnected' ? 0 : +port,
            segments: [s]
          });
        else p.chains.find(c => c.id === id).segments.push(s);
        ensureScene(p);
        chosen = 'segment:' + s.id;
        Object.assign(p.scene.placements[chosen], {
          x: p.scene.width / 2,
          y: p.scene.depth / 2,
          width: pr.width,
          height: pr.height,
          color: pr.color
        });
      });
      api.showRoom();
    }
  );
}
function outputOptions(p) {
  const free = [];
  for (const c of p.controllers)
    for (let port = 1; port <= api.boardPorts(c); port++)
      if (!p.chains.some(ch => ch.controller === c.id && ch.port === port))
        free.push([c.id + '|' + port, c.name + ' · port ' + port]);
  return [
    ...free.map(([id, name]) => `<option value="new|${id}">New output: ${E(name)}</option>`),
    ...p.chains
      .filter(ch => ch.controller)
      .map(ch => `<option value="append|${ch.id}">Append to ${E(ch.name)} · P${ch.port}</option>`),
    '<option value="unconnected||0">Not connected yet · show warning</option>'
  ];
}
function addControllerBox(p) {
  const templates = api.getLibrary().boxTemplates;
  api.modal(
    'Add controller box',
    `<label>Box / template<select name="template"><option value="">New empty controller box</option>${templates.length ? `<optgroup label="Saved box templates">${templates.map(t => `<option value="${E(t.id)}">${E(t.name)} · v${t.version}</option>`).join('')}</optgroup>` : ''}</select></label><p class="micro">Save reusable boxes with Save as template in Box builder. The new box is placed in the centre of the room. Drag it to its installed position, or choose Edit box internals to configure its hardware.</p>`,
    f => {
      const templateId = f.get('template'),
        template = api.getLibrary().boxTemplates.find(t => t.id === templateId);
      if (templateId && !template) {
        api.toast('This box template is no longer available. Choose a template again.');
        return;
      }
      api.transact(() => {
        const box = template
          ? addBoxFromTemplate(p, template)
          : makeBox('Controller box ' + (p.installation.boxes.filter(b => b.kind !== 'button').length + 1));
        if (!template) p.installation.boxes.push(box);
        ensureScene(p);
        chosen = 'box:' + box.id;
        Object.assign(p.scene.placements[chosen], {
          x: p.scene.width / 2,
          y: p.scene.depth / 2
        });
      });
    }
  );
}
function addPixels(p) {
  const targets = outputOptions(p);
  api.modal(
    'Add pixels or a flood',
    `<label>Pixels / flood<select name="item"><optgroup label="Individual items"><option value="custom|seed">Seed pixel string · 100 pixels</option><option value="custom|bullet">Bullet pixel string · 100 pixels</option><option value="custom|flood">Single flood · 10 W</option></optgroup>${p.presets.length ? `<optgroup label="Saved presets">${p.presets.map(x => `<option value="preset|${x.id}">${E(x.name)} · ${x.count} ${E(x.kind)}</option>`).join('')}</optgroup>` : ''}${
      p.props.length
        ? `<optgroup label="Prop models">${p.props
            .filter(x => x.count)
            .map(x => `<option value="prop|${x.id}">${E(x.name)} · ${x.count} pixels</option>`)
            .join('')}</optgroup>`
        : ''
    }</select></label><label>Data connection<select name="target">${targets.join('')}</select></label><p class="micro">The new item is placed in the centre of the room. Drag it to its installed position, then edit its electrical details from the wiring workspace.</p>`,
    f => {
      api.transact(() => {
        const [source, sourceId] = f.get('item').split('|'),
          [mode, targetId, port] = f.get('target').split('|'),
          preset = source === 'preset' ? p.presets.find(x => x.id === sourceId) : null,
          pr = source === 'prop' ? p.props.find(x => x.id === sourceId) : null,
          s = api.newSegment(source === 'custom' ? sourceId : preset?.kind || pr?.kind);
        if (preset)
          Object.assign(s, {
            kind: preset.kind,
            count: preset.count,
            watts: preset.watts,
            channels: preset.channels,
            spacing: preset.spacing,
            stringAwg: preset.stringAwg
          });
        if (pr) Object.assign(s, { count: pr.count, watts: pr.watts, channels: pr.channels, propId: pr.id });
        const name = pr?.name || preset?.name || (sourceId === 'flood' ? 'Flood light' : 'Pixel string');
        if (mode === 'new' || mode === 'unconnected')
          p.chains.push({
            id: 'r-' + Math.random().toString(36).slice(2, 10),
            name,
            controller: mode === 'unconnected' ? '' : targetId,
            port: mode === 'unconnected' ? 0 : +port,
            segments: [s]
          });
        else p.chains.find(ch => ch.id === targetId).segments.push(s);
        ensureScene(p);
        chosen = 'segment:' + s.id;
        Object.assign(p.scene.placements[chosen], {
          x: p.scene.width / 2,
          y: p.scene.depth / 2,
          ...(pr ? { width: pr.width, height: pr.height, color: pr.color } : {})
        });
      });
      api.showRoom();
    }
  );
}
export function sanitizeSvg(text) {
  if (/<!DOCTYPE|<!ENTITY/i.test(text))
    throw Error('SVG document declarations are not supported. Export a plain SVG.');
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'svg')
    throw Error('This file is not a valid SVG.');
  const tags = new Set([
    'svg',
    'g',
    'path',
    'rect',
    'circle',
    'ellipse',
    'line',
    'polyline',
    'polygon',
    'text',
    'tspan',
    'defs',
    'linearGradient',
    'radialGradient',
    'stop',
    'clipPath',
    'use',
    'title',
    'desc'
  ]);
  const attrs = new Set([
    'id',
    'viewBox',
    'width',
    'height',
    'x',
    'y',
    'x1',
    'y1',
    'x2',
    'y2',
    'cx',
    'cy',
    'r',
    'rx',
    'ry',
    'd',
    'points',
    'fill',
    'stroke',
    'stroke-width',
    'stroke-linecap',
    'stroke-linejoin',
    'fill-rule',
    'opacity',
    'fill-opacity',
    'stroke-opacity',
    'transform',
    'font-size',
    'font-family',
    'font-weight',
    'text-anchor',
    'dominant-baseline',
    'offset',
    'stop-color',
    'stop-opacity',
    'gradientUnits',
    'gradientTransform',
    'preserveAspectRatio',
    'clip-path',
    'href',
    'xmlns'
  ]);
  for (const el of [...doc.querySelectorAll('*')]) {
    if (!tags.has(el.localName)) {
      el.remove();
      continue;
    }
    for (const attr of [...el.attributes]) {
      if (
        !attrs.has(attr.name) ||
        (attr.name === 'href' && !attr.value.startsWith('#')) ||
        (/url\s*\(/i.test(attr.value) && !/^url\(#[\w-]+\)$/.test(attr.value)) ||
        (/javascript:|data:|https?:|@import|expression/i.test(attr.value) && attr.name !== 'xmlns')
      )
        el.removeAttribute(attr.name);
    }
  }
  doc.documentElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  if (!doc.documentElement.getAttribute('width')) doc.documentElement.setAttribute('width', '1000');
  if (!doc.documentElement.getAttribute('height')) doc.documentElement.setAttribute('height', '1000');
  return new XMLSerializer().serializeToString(doc);
}
async function importReference(ev) {
  const input = ev.target,
    file = input.files[0],
    target = input.dataset.target;
  input.value = '';
  if (!file) return;
  try {
    if (file.size > 5 * 1024 * 1024) throw Error('Choose a reference smaller than 5 MB.');
    let blob = file;
    if (file.type === 'image/svg+xml' || /\.svg$/i.test(file.name))
      blob = new Blob([sanitizeSvg(await file.text())], { type: 'image/svg+xml' });
    else if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
      throw Error('Choose a PNG, JPEG, WebP or SVG.');
    const url = URL.createObjectURL(blob);
    let img;
    try {
      img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(Error('Could not read this image. Try exporting a plain SVG or PNG.'));
        image.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
    if (!img.naturalWidth || !img.naturalHeight) throw Error('The image has no dimensions.');
    const scale = Math.min(1, 960 / Math.max(img.naturalWidth, img.naturalHeight)),
      canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL('image/webp', 0.85);
    const saved = api.transact(() => {
      const pr = api.getProject().props.find(x => x.id === target);
      if (!pr) throw Error('The prop was removed.');
      pr.reference = data;
      pr.referenceName = file.name.slice(0, 200);
    });
    if (saved) api.toast('Reference imported. Use Edit individual pixels to mark or adjust positions.');
  } catch (err) {
    api.toast(err.message);
  }
}
