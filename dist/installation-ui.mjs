import {
  PORT_TYPES,
  RESOURCE_LABELS,
  ensureInstallation,
  makeBox,
  makeInstance,
  addBoxFromTemplate,
  saveBoxTemplate,
  updateBoxFromTemplate,
  connectionWarnings,
  boxCapacity,
  projectCapacity,
  billOfMaterials,
  componentPlacement,
  componentSearch,
  componentSizeGuides,
  deleteRoute
} from './installation-model.mjs?v=0.36.0';

let api,
  boxId = '',
  partId = '',
  wireFrom = null,
  wirePoint = null,
  drag = null,
  bomScope = '',
  boxMode = 'schematic',
  schematicZoom = 1,
  showTickets = false,
  boxDetailsOpen = false;
const E = s =>
  String(s ?? '').replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
const B = (label, action, cls = 'btn') =>
  `<button type="button" class="${cls}" data-install="${action}">${label}</button>`;
const F = (label, value, key, type = 'text', extra = '') =>
  `<label>${E(label)}<input data-install-field="${key}" type="${type}" value="${E(value ?? '')}" ${extra}></label>`;
const S = (label, value, key, opts) =>
  `<label>${E(label)}<select data-install-field="${key}">${opts.map(([v, t]) => `<option value="${E(v)}" ${String(v) === String(value) ? 'selected' : ''}>${E(t)}</option>`).join('')}</select></label>`;
const catalogBar = (scope, items) =>
  `<div class="catalog-tools"><input type="search" data-catalog-search="${scope}" placeholder="Search name, model, type or tag" aria-label="Search ${scope}"><select data-catalog-category="${scope}" aria-label="Filter category"><option value="">All categories</option>${[
    ...new Set(items.map(d => d.category))
  ]
    .sort()
    .map(c => `<option value="${E(c)}">${E(c)}</option>`)
    .join('')}</select></div>`;
const resources = v =>
  Object.entries(RESOURCE_LABELS)
    .map(([key, label]) => {
      const capacity = v.capacity[key] || 0,
        used = v.used[key] || 0,
        ref = v.reference[key] || capacity;
      if (!capacity && !used) return '';
      return `<div class="capacity-row ${used > capacity ? 'over' : capacity && used / capacity >= 0.8 ? 'near' : ''}"><div><strong>${label}</strong><span>${used} / ${capacity}${ref !== capacity ? ` (reference ${ref})` : ''}</span></div><div class="meter"><i style="width:${capacity ? Math.min(100, (used / capacity) * 100) : 100}%"></i></div></div>`;
    })
    .join('') || '<p class="micro">No rated resources in this box yet.</p>';
const sources = p => [
  ['', 'Unlinked component'],
  ...p.controllers.map(x => ['controller:' + x.id, x.name + ' · controller']),
  ...p.psus.map(x => ['psu:' + x.id, x.name + ' · PSU']),
  ...p.distros.map(x => ['distro:' + x.id, x.name + ' · distro']),
  ...p.aux.map(x => ['aux:' + x.id, x.name + ' · I/O board'])
];
function current(p) {
  ensureInstallation(p);
  if (!p.installation.boxes.some(x => x.id === boxId)) boxId = p.installation.boxes[0]?.id || '';
  const box = p.installation.boxes.find(x => x.id === boxId);
  if (!box?.components.some(x => x.id === partId)) partId = box?.components[0]?.id || '';
  return box;
}
const physicalSize = c => {
  const q = c.snapshot.physical || {},
    rot = (c.rotation || 0) % 180 !== 0,
    w = +(rot ? q.depthMm : q.widthMm),
    h = +(rot ? q.widthMm : q.depthMm);
  return { w, h, known: w > 0 && h > 0 };
};
export const physicalIssues = box => {
  if (!box) return [];
  const bw = box.physicalWidthMm || 400,
    bh = box.physicalDepthMm || 250,
    issues = [];
  for (const c of box.components) {
    const s = physicalSize(c);
    if (!s.known) {
      issues.push({ type: 'size', part: c, text: `Please confirm the size of ${c.snapshot.name}.` });
      continue;
    }
    const l = (c.x / 100) * bw,
      t = (c.y / 100) * bh;
    if (l + s.w > bw || t + s.h > bh)
      issues.push({ type: 'bounds', part: c, text: `${c.snapshot.name} extends outside the enclosure.` });
    for (const d of box.components) {
      if (d === c || String(d.id) < String(c.id) || (d.stackLevel || 0) !== (c.stackLevel || 0)) continue;
      const z = physicalSize(d);
      if (!z.known) continue;
      const dl = (d.x / 100) * bw,
        dt = (d.y / 100) * bh;
      if (l < dl + z.w && l + s.w > dl && t < dt + z.h && t + s.h > dt)
        issues.push({
          type: 'overlap',
          part: c,
          text: `${c.snapshot.name} overlaps ${d.snapshot.name} on layer ${(c.stackLevel || 0) + 1}.`
        });
    }
  }
  return issues;
};
const physicalPart = (c, box) => {
  const s = physicalSize(c),
    bw = box.physicalWidthMm || 400,
    bh = box.physicalDepthMm || 250,
    w = s.known ? (s.w / bw) * 100 : 20,
    h = s.known ? (s.h / bh) * 100 : 20,
    kind =
      c.snapshot.category === 'Power'
        ? 'psu'
        : c.snapshot.name.startsWith('Baldrick') ||
            ['Controller', 'Input board', 'DMX', 'Relay board', 'Signal board'].includes(c.snapshot.category)
          ? 'board'
          : 'generic';
  return `<button type="button" class="physical-part ${kind} ${c.id === partId ? 'selected' : ''} ${s.known ? '' : 'unknown'}" data-box-part="${E(c.id)}" style="left:${c.x}%;top:${c.y}%;width:${w}%;height:${h}%;z-index:${1 + (c.stackLevel || 0)}" aria-label="${E(c.snapshot.name)}${c.subname ? `, ${E(c.subname)}` : ''}, ${s.known ? `${s.w} by ${s.h} millimetres` : 'size needed'}"><span class="physical-mark">${kind === 'psu' ? '<i class="fan"></i>' : kind === 'board' ? '<i class="pcb"></i>' : E(c.snapshot.icon)}</span><strong>${E(c.snapshot.name)}</strong>${c.subname ? `<small class="part-subname">(${E(c.subname)})</small>` : ''}<small>${s.known ? `${s.w} × ${s.h} mm · layer ${(c.stackLevel || 0) + 1}` : '? size needed'}</small></button>`;
};
const visualKind = c => {
  if (c.snapshot.category === 'Power') return 'power';
  if (['Network', 'Computer'].includes(c.snapshot.category)) return 'network';
  if (['Audio', 'Relay board'].includes(c.snapshot.category)) return 'module';
  if (
    c.snapshot.name.startsWith('Baldrick') ||
    ['Controller', 'Input board', 'DMX', 'Signal board'].includes(c.snapshot.category)
  )
    return 'board';
  return 'generic';
};
const portKind = type => {
  if (type.includes('power')) return 'power';
  if (type === 'pixel_output' || type === 'pixel_data') return 'pixel';
  if (type === 'ethernet') return 'ethernet';
  if (type === 'usb') return 'usb';
  if (type === 'audio') return 'audio';
  if (type === 'dmx') return 'dmx';
  if (type.includes('input') || type === 'gpio') return 'input';
  return 'generic';
};
const hardwareDetail = kind =>
  kind === 'power'
    ? '<i class="hardware-fan"></i><i class="hardware-vent"></i>'
    : kind === 'network'
      ? '<i class="hardware-socket"></i><i class="hardware-chip"></i>'
      : kind === 'module'
        ? '<i class="hardware-coil"></i><i class="hardware-chip"></i>'
        : '<i class="hardware-chip"></i><i class="hardware-capacitor"></i>';
const schematicPart = (c, linkedPorts) => {
  const kind = visualKind(c);
  return `<div class="box-part ${kind} ${c.id === partId ? 'selected' : ''}" data-box-part="${E(c.id)}" style="left:${c.x}%;top:${c.y}%;--part-color:${E(c.snapshot.color || '#4b8a76')}"><div class="part-title"><span>${E(c.snapshot.icon)}</span><strong>${E(c.snapshot.name)}</strong></div><div class="hardware-face"><i class="mount-hole top-left"></i><i class="mount-hole top-right"></i><i class="mount-hole bottom-left"></i><i class="mount-hole bottom-right"></i><div class="hardware-silk"><strong>${E(c.snapshot.name)}</strong><small>${E(c.snapshot.model || c.snapshot.category)}</small></div><div class="hardware-detail" aria-hidden="true">${hardwareDetail(kind)}</div><div class="part-ports">${c.snapshot.ports
    .map(
      port =>
        `<button type="button" class="part-port ${port.direction} ${portKind(port.type)} ${linkedPorts.has(c.id + ':' + port.id) ? 'linked' : ''}" draggable="true" data-box-port="${E(c.id)}:${E(port.id)}" title="${E(port.label)} · ${E(port.type)} · ${E(port.direction)}" aria-label="${E(port.label)}, ${E(port.type)}, ${E(port.direction)}${linkedPorts.has(c.id + ':' + port.id) ? ', connected' : ''}"><i><b></b></i><span>${E(port.label)}<small>${E(port.type.replaceAll('_', ' '))}</small></span></button>`
    )
    .join(
      ''
    )}</div></div>${c.subname ? `<small class="part-subname">(${E(c.subname)})</small>` : ''}<small>${E(c.sourceKey || c.snapshot.category)}</small></div>`;
};
const interfacePorts = box => {
  if (!Array.isArray(box.interfacePorts)) return '';
  const groups = { top: [], right: [], bottom: [], left: [] };
  for (const port of box.interfacePorts) groups[port.edge].push(port);
  return box.interfacePorts
    .map(port => {
      const list = groups[port.edge],
        offset = ((list.indexOf(port) + 1) / (list.length + 1)) * 100,
        style =
          port.edge === 'top' || port.edge === 'bottom'
            ? `left:${offset}%;${port.edge}:0`
            : `top:${offset}%;${port.edge}:0`;
      return `<button type="button" draggable="true" class="interface-port ${port.edge} ${port.componentId ? 'linked' : ''}" data-box-port="@interface:${E(port.id)}" style="${style}" title="${E(port.label)} · ${E(port.edge)} edge${port.visible ? ' · visible in Room layout' : ''}">${E(port.label)}</button>`;
    })
    .join('');
};
function connectEndpoints(box, from, to) {
  const edge = from.component === '@interface' ? from : to.component === '@interface' ? to : null,
    component = edge === from ? to : from;
  if (edge) {
    if (component.component === '@interface') return;
    const source = box.components
      .find(c => c.id === component.component)
      ?.snapshot.ports.find(port => port.id === component.id);
    if (!source) return;
    api.transact(() => {
      const port = box.interfacePorts.find(x => x.id === edge.id);
      port.componentId = component.component;
      port.portId = component.id;
      if (!port.label || port.label === 'New port') port.label = source.label;
    });
    return;
  }
  api.transact(() =>
    api.getProject().installation.connections.push({
      id: 'link-' + Math.random().toString(36).slice(2, 10),
      boxId: box.id,
      fromComponent: from.component,
      fromPort: from.id,
      toComponent: to.component,
      toPort: to.id,
      acknowledged: false
    })
  );
}
export function boxesView(p, lib) {
  const box = current(p),
    cap = projectCapacity(p),
    template = lib.boxTemplates.find(t => t.id === box?.templateRef?.id),
    part = box?.components.find(c => c.id === partId),
    sizeGuides = part ? componentSizeGuides(part.snapshot) : [],
    issues = physicalIssues(box),
    tickets = issues.filter(x => x.type === 'size'),
    linkedPorts = new Set(
      [
        ...(p.installation.connections || [])
          .filter(x => x.boxId === box?.id)
          .flatMap(x => [
            x.fromComponent && x.fromPort ? x.fromComponent + ':' + x.fromPort : '',
            x.toComponent && x.toPort ? x.toComponent + ':' + x.toPort : ''
          ]),
        ...(box?.interfacePorts || []).map(x =>
          x.componentId && x.portId ? x.componentId + ':' + x.portId : ''
        )
      ].filter(Boolean)
    );
  return `<div class="install-intro">Arrange and wire components in Schematic, then use Physical layout for a scale drawing of the enclosure. Measurements stay in the device-local hardware library.</div><div class="install-toolbar">${B('+ New box', 'new-box')}${S(
    'Open box',
    boxId,
    'box-select',
    p.installation.boxes.map(b => [b.id, b.name])
  )}${lib.boxTemplates.length ? '<label>Find template<input type="search" data-template-search placeholder="Search box templates"></label>' : ''}${lib.boxTemplates.length ? S('Reusable template', '', 'template-select', [['', 'Choose template'], ...lib.boxTemplates.map(t => [t.id, t.name + ' · v' + t.version])]) : ''}${B('Add template box', 'add-template')}${B('Save as template', 'save-template')}${template && template.version > box.templateRef.version ? B(`Update to template v${template.version}`, 'update-template') : ''}${B(`🔔 ${tickets.length}`, 'tickets', 'notification-btn ' + (tickets.length ? 'has-tickets' : ''))}</div>${showTickets ? `<section class="panel measurement-tickets"><h3>Measurement tickets</h3>${tickets.map(x => `<button type="button" data-install="select-part:${E(x.part.id)}">${E(x.text)}</button>`).join('') || '<p class="micro">Every placed component has a confirmed footprint.</p>'}</section>` : ''}<div class="install-global panel"><h3>Project resource capacity</h3>${resources(cap)}</div>${
    !box
      ? '<div class="panel install-empty">Create a box to place controllers, power supplies, buttons, relays and other parts.</div>'
      : `<div class="box-layout"><aside class="panel install-palette"><h3>Hardware library</h3><p class="micro">Internal components for this enclosure. Click a part to add it.</p>${catalogBar(
          'box-palette',
          lib.components.filter(d => componentPlacement(d) !== 'field')
        )}${lib.components
          .filter(d => componentPlacement(d) !== 'field')
          .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
          .map(
            d =>
              `<button type="button" draggable="true" class="palette-item" data-catalog-item="box-palette" data-category="${E(d.category)}" data-search="${E(componentSearch(d))}" data-palette="${E(d.id)}" data-install="add-part:${E(d.id)}">${E(d.icon)} ${E(d.name)} <small>${E(d.category)}</small></button>`
          )
          .join(
            ''
          )}</aside><section class="panel box-editor"><div class="box-heading"><div><h2>${E(box.name)}</h2><p>${E(box.description || 'Drag parts to arrange them. Click one to edit.')}</p></div>${B('Delete box', 'delete-box', 'text-btn danger')}</div><div class="box-view-tabs" role="group" aria-label="Box view">${B('Schematic', 'box-mode:schematic', boxMode === 'schematic' ? 'active' : '')}${B('Physical layout', 'box-mode:physical', boxMode === 'physical' ? 'active' : '')}</div>${
          boxMode === 'physical'
            ? `<div class="physical-status"><span>${box.physicalWidthMm / 10 || 40} × ${box.physicalDepthMm / 10 || 25} cm enclosure</span><span class="${issues.length ? 'warn' : ''}">${issues.length ? `${issues.length} layout issue${issues.length === 1 ? '' : 's'}` : 'Layout fits'}</span></div><div class="box-stage physical-stage" id="box-stage" style="aspect-ratio:${box.physicalWidthMm || 400}/${box.physicalDepthMm || 250}">${box.components.map(c => physicalPart(c, box)).join('')}</div>${issues
                .filter(x => x.type !== 'size')
                .map(x => `<p class="layout-warning">⚠ ${E(x.text)}</p>`)
                .join('')}`
            : `<div class="box-canvas-toolbar"><div>${B('−', 'box-zoom:out', 'btn box-zoom-button')}${B('100%', 'box-zoom:home', 'btn box-zoom-readout')}${B('+', 'box-zoom:in', 'btn box-zoom-button')}</div>${B('Auto layout', 'auto-layout')}</div><div class="box-stage-scroll" tabindex="0" aria-label="Scrollable box schematic"><div class="box-stage" id="box-stage" style="width:${schematicZoom * 100}%;min-height:${450 * schematicZoom}px"><svg id="box-wires" aria-hidden="true"></svg>${box.components.map(c => schematicPart(c, linkedPorts)).join('')}${interfacePorts(box)}</div></div><div class="interface-editor"><div><strong>Box edge ports</strong>${B('+ Add edge port', 'add-interface-port', 'text-btn')}</div><p>Wire a component connector to an edge port. Only ports marked Room visible appear on the box in Room layout.</p>${
                Array.isArray(box.interfacePorts)
                  ? box.interfacePorts
                      .map(
                        port =>
                          `<div class="interface-row">${F('Label', port.label, `interface:${port.id}:label`, 'text', 'maxlength="80"')}${S(
                            'Edge',
                            port.edge,
                            `interface:${port.id}:edge`,
                            [
                              ['top', 'Top'],
                              ['right', 'Right'],
                              ['bottom', 'Bottom'],
                              ['left', 'Left']
                            ]
                          )}<label class="check"><input type="checkbox" data-install-field="interface:${E(port.id)}:visible" ${port.visible ? 'checked' : ''}> Room visible</label><span>${port.componentId ? 'Wired' : 'Not wired'}</span>${B('Remove', 'delete-interface-port:' + port.id, 'text-btn danger')}</div>`
                      )
                      .join('') ||
                    '<p class="micro">Component ports remain available in Room layout until you add the first explicit edge port.</p>'
                  : '<p class="micro">This older box currently exposes every component port. Add an edge port to switch to explicit room connectors.</p>'
              }</div><div class="external-targets"><strong>Room route targets</strong><p>Choose an internal port, then click or drag it to a target.</p><div>${[...p.chains.flatMap(ch => ch.segments.map(v => ['segment:' + v.id, ch.name + ' · ' + v.kind])), ...p.installation.fieldDevices.map(v => ['field:' + v.id, v.name + ' · field'])].map(([key, label]) => `<button type="button" data-box-target="${E(key)}">${E(label)}</button>`).join('')}</div></div><div class="box-wire-help">Drag from an exact hardware port to another component or box edge port. Linked ports are filled; hover a port or wire to trace its connection.</div>`
        }<h3>Connections</h3>${
          p.installation.connections
            .filter(x => x.boxId === box.id)
            .map(x => {
              const warnings = connectionWarnings(p, x);
              return `<div class="box-connection"><span>${E(box.components.find(c => c.id === x.fromComponent)?.snapshot.name)} ${E(x.fromPort)} → ${E(x.toKey || box.components.find(c => c.id === x.toComponent)?.snapshot.name)} ${E(x.toPort)}${warnings.length ? `<b title="${E(warnings.join('; '))}"> ⚠ ${E(warnings.join('; '))}${x.acknowledged ? ' · acknowledged' : ''}</b>` : ''}</span>${warnings.length ? B(x.acknowledged ? 'Unacknowledge' : 'Acknowledge', 'ack:' + x.id, 'text-btn') : ''}${B('Remove', 'delete-connection:' + x.id, 'text-btn danger')}</div>`;
            })
            .join('') || '<p class="micro">No internal connections yet.</p>'
        }<h3>Box capacity</h3>${resources(boxCapacity(p, box))}</section><aside class="panel part-inspector"><details class="box-details" ${boxDetailsOpen || !part ? 'open' : ''}><summary>Box details</summary><div class="box-details-body">${F('Box label', box.name, 'box.name')}${F('Description', box.description, 'box.description')}${S('Enclosure size', lib.boxSizes.find(s => s.widthCm * 10 === (box.physicalWidthMm || 400) && s.depthCm * 10 === (box.physicalDepthMm || 250))?.id || '', 'box-size-select', [['', 'Custom size'], ...lib.boxSizes.map(s => [s.id, `${s.name} · ${s.widthCm} × ${s.depthCm} cm`])])}${F('Enclosure width (cm)', (box.physicalWidthMm || 400) / 10, 'box.physicalWidthCm', 'number', 'min="2" max="1000" step="0.1"')}${F('Enclosure depth (cm)', (box.physicalDepthMm || 250) / 10, 'box.physicalDepthCm', 'number', 'min="2" max="1000" step="0.1"')}<p class="micro">Reusable sizes are managed in Standards.</p>${F('Room footprint width (m)', box.width, 'box.width', 'number', 'min="0.1" max="50" step="any"')}${F('Room footprint depth (m)', box.height, 'box.height', 'number', 'min="0.1" max="50" step="any"')}</div></details>${
          part
            ? `<div class="component-details"><h3>${E(part.snapshot.name)}</h3>${F('Component subname', part.subname || '', 'part.subname', 'text', 'maxlength="200" placeholder="For example, 12 V feed"')}${S('Linked project hardware', part.sourceKey, 'part.sourceKey', sources(p))}${sizeGuides.length ? S('Common size guide', sizeGuides.find(guide => guide.manufacturer === part.snapshot.manufacturer && guide.model === part.snapshot.model)?.id || '', 'size-guide', [['', 'Choose a model'], ...sizeGuides.map(guide => [guide.id, `${guide.manufacturer} ${guide.model} · ${guide.physical.widthMm} × ${guide.physical.depthMm}${guide.physical.heightMm ? ` × ${guide.physical.heightMm}` : ''} mm`])]) + '<p class="micro">Applies reference dimensions to this part. Confirm the exact variant and allow for cases, connectors and airflow.</p>' : ''}${F('Position X (%)', part.x, 'part.x', 'number', 'min="0" max="100" step="any"')}${F('Position Y (%)', part.y, 'part.y', 'number', 'min="0" max="100" step="any"')}${F('Width (mm)', part.snapshot.physical?.widthMm ?? '', 'physical.widthMm', 'number', 'min="1" max="5000" step="1"')}${F('Depth (mm)', part.snapshot.physical?.depthMm ?? '', 'physical.depthMm', 'number', 'min="1" max="5000" step="1"')}${F('Height (mm)', part.snapshot.physical?.heightMm ?? '', 'physical.heightMm', 'number', 'min="1" max="5000" step="1"')}${B('Save measurements globally', 'save-size', 'text-btn')}${B(`Rotate 90° (${part.rotation || 0}°)`, 'rotate-part', 'text-btn')}${F('Stacking layer', part.stackLevel || 0, 'part.stackLevel', 'number', 'min="0" max="20" step="1"')}<h4>Operating limits</h4><p class="micro">Set below the reference rating when you want headroom.</p>${Object.entries(
                part.snapshot.resources || {}
              )
                .map(([k, n]) =>
                  F(
                    RESOURCE_LABELS[k] || k,
                    part.operatingLimits?.[k] ?? part.snapshot.operatingLimits?.[k] ?? n,
                    'limit.' + k,
                    'number',
                    'min="0" step="any"'
                  )
                )
                .join(
                  ''
                )}${S('External route port', '', 'external-port', [['', 'Choose port'], ...part.snapshot.ports.map(v => [v.id, v.label + ' · ' + v.type])])}${S('Connect toward', '', 'external-target', [['', 'Choose room object'], ...p.chains.flatMap(ch => ch.segments.map(v => ['segment:' + v.id, ch.name + ' · ' + v.kind])), ...p.installation.fieldDevices.map(v => ['field:' + v.id, v.name + ' · field'])])}${B('Add room route from port', 'external-route', 'text-btn')}${B('Duplicate part', 'duplicate-part', 'text-btn')}${B('Update part from library', 'update-part', 'text-btn')}${B('Remove part', 'delete-part', 'text-btn danger')}</div>`
            : '<p class="micro">Select a component to adjust its link, size or operating limit.</p>'
        }</aside></div>`
  }`;
}
export function standardsView(lib) {
  return `<div class="install-intro">These standards are saved on this device and available to all projects. A cable, enclosure size or part already used in a project keeps its own measurements until explicitly updated.</div><div class="section-heading"><h2>Enclosure sizes</h2>${B('+ New size', 'new-box-size')}</div><p class="micro">Define reusable box dimensions in centimetres, then apply them from Box details.</p><div class="standards-grid">${lib.boxSizes.map(s => `<section class="panel standard-card"><div class="card-heading"><h3>${E(s.name)}</h3>${B('Delete', 'delete-box-size:' + s.id, 'text-btn danger')}</div>${F('Name', s.name, 'boxsize:' + s.id + ':name')}<div class="two">${F('Width (cm)', s.widthCm, 'boxsize:' + s.id + ':widthCm', 'number', 'min="2" max="1000" step="0.1"')}${F('Depth (cm)', s.depthCm, 'boxsize:' + s.id + ':depthCm', 'number', 'min="2" max="1000" step="0.1"')}</div></section>`).join('')}</div><div class="section-heading"><h2>Physical cable standards</h2>${B('+ New cable', 'new-cable')}</div><div class="standards-grid">${lib.cables
    .map(
      c =>
        `<section class="panel standard-card" style="border-top:4px solid ${E(c.color)}"><div class="card-heading"><h3>${E(c.name)} · v${c.version}</h3>${B('Delete', 'delete-cable:' + c.id, 'text-btn danger')}</div>${F('Name', c.name, 'cable:' + c.id + ':name')}${S(
          'Type',
          c.type,
          'cable:' + c.id + ':type',
          ['Extension', 'Dual injection', 'Power', 'Data', 'Other'].map(x => [x, x])
        )}<div class="two">${F('Length (m)', c.lengthM, 'cable:' + c.id + ':lengthM', 'number', 'min="0" max="10000" step="any"')}${F('Pins', c.pins, 'cable:' + c.id + ':pins', 'number', 'min="1" max="64" step="1"')}</div><div class="two">${F('Cable colour', c.color, 'cable:' + c.id + ':color', 'color')}${F('Connector', c.connector, 'cable:' + c.id + ':connector')}</div>${F('Notes', c.notes, 'cable:' + c.id + ':notes')}</section>`
    )
    .join(
      ''
    )}</div><div class="section-heading"><h2>Hardware & accessories</h2>${B('+ Custom component', 'new-component')}</div><p class="micro">Includes Baldrick boards, Pi, audio, switches, sensors, and effects. Dimensions are device-local standards used by the scale box layout.</p>${catalogBar('definitions', lib.components)}<div class="hardware-defs">${lib.components
    .slice()
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
    .map(
      d =>
        `<details class="panel definition-card" data-catalog-item="definitions" data-category="${E(d.category)}" data-search="${E(componentSearch(d))}"><summary><span style="color:${E(d.color)}">${E(d.icon)}</span> ${E(d.name)} <small>${E(d.category)} · v${d.version}</small></summary><div class="definition-edit">${F('Name', d.name, 'def:' + d.id + ':name')}${F('Category', d.category, 'def:' + d.id + ':category')}${F('Manufacturer', d.manufacturer, 'def:' + d.id + ':manufacturer')}${F('Model', d.model, 'def:' + d.id + ':model')}${F('Colour', d.color, 'def:' + d.id + ':color', 'color')}${F('Icon', d.icon, 'def:' + d.id + ':icon')}${F('Notes', d.notes, 'def:' + d.id + ':notes')}<h4>Physical size</h4><div class="three">${F('Width (mm)', d.physical?.widthMm ?? '', 'physical:' + d.id + ':widthMm', 'number', 'min="1" max="5000" step="1"')}${F('Depth (mm)', d.physical?.depthMm ?? '', 'physical:' + d.id + ':depthMm', 'number', 'min="1" max="5000" step="1"')}${F('Height (mm)', d.physical?.heightMm ?? '', 'physical:' + d.id + ':heightMm', 'number', 'min="1" max="5000" step="1"')}</div><h4>Ports</h4>${d.ports
          .map(
            port =>
              `<div class="def-port">${F('Label', port.label, 'port:' + d.id + ':' + port.id + ':label')}${S(
                'Type',
                port.type,
                'port:' + d.id + ':' + port.id + ':type',
                PORT_TYPES.map(t => [t, t.replaceAll('_', ' ')])
              )}${S('Direction', port.direction, 'port:' + d.id + ':' + port.id + ':direction', [
                ['in', 'Input'],
                ['out', 'Output'],
                ['bidirectional', 'Bidirectional']
              ])}${F('Resource key (optional)', port.resource || '', 'port:' + d.id + ':' + port.id + ':resource')}${B('×', 'delete-port:' + d.id + ':' + port.id, 'text-btn danger')}</div>`
          )
          .join('')}${B('+ Add port', 'add-port:' + d.id, 'text-btn')}<h4>Reference capacities</h4>${[
          ...Object.entries(RESOURCE_LABELS),
          ...Object.keys(d.resources || {})
            .filter(k => !(k in RESOURCE_LABELS))
            .map(k => [k, k])
        ]
          .map(([k, label]) =>
            F(label, d.resources?.[k] ?? 0, 'resource:' + d.id + ':' + k, 'number', 'min="0" step="any"')
          )
          .join('')}<h4>Default operating limits</h4>${Object.keys(d.resources || {})
          .map(k =>
            F(
              RESOURCE_LABELS[k] || k,
              d.operatingLimits?.[k] ?? '',
              'operating:' + d.id + ':' + k,
              'number',
              'min="0" step="any" placeholder="Use reference"'
            )
          )
          .join(
            ''
          )}${B('+ Custom resource', 'new-resource:' + d.id, 'text-btn')}${B('Delete definition', 'delete-def:' + d.id, 'text-btn danger')}</div></details>`
    )
    .join('')}</div>`;
}
export function bomView(p) {
  const boxes = p.installation.boxes,
    rows = billOfMaterials(p, bomScope || null);
  return `<div class="install-toolbar">${S('Scope', bomScope, 'bom-filter', [['', 'Whole project'], ...boxes.map(b => [b.id, b.name])])}${B('↓ Export BOM CSV', 'bom-csv')}${B('Print', 'bom-print')}</div><section class="panel"><h2>Bill of materials</h2><p class="micro">Quantities reflect planned components, pixel groups and assigned physical cables. Check mounting, fuses, connectors and spare stock before ordering.</p><div class="table-panel"><table><thead><tr><th>Category</th><th>Item</th><th>Quantity</th><th>Unit</th></tr></thead><tbody>${rows.map(r => `<tr><td>${E(r.category)}</td><td>${E(r.name)}</td><td>${r.quantity}</td><td>${E(r.unit)}</td></tr>`).join('')}</tbody></table></div></section>`;
}
export function openBox(id) {
  boxId = id;
  partId = '';
  boxDetailsOpen = false;
  schematicZoom = 1;
}
function setSchematicZoom(next, clientX, clientY) {
  const scroll = document.querySelector('.box-stage-scroll'),
    stage = scroll?.querySelector('#box-stage');
  if (!scroll || !stage) return;
  next = Math.max(0.5, Math.min(3, Math.round(next * 100) / 100));
  const rect = scroll.getBoundingClientRect(),
    x = clientX == null ? scroll.clientWidth / 2 : clientX - rect.left,
    y = clientY == null ? scroll.clientHeight / 2 : clientY - rect.top,
    ratio = next / schematicZoom;
  schematicZoom = next;
  stage.style.width = schematicZoom * 100 + '%';
  stage.style.minHeight = 450 * schematicZoom + 'px';
  scroll.scrollLeft = (scroll.scrollLeft + x) * ratio - x;
  scroll.scrollTop = (scroll.scrollTop + y) * ratio - y;
  const readout = document.querySelector('.box-zoom-readout');
  if (readout) readout.textContent = Math.round(schematicZoom * 100) + '%';
  requestAnimationFrame(drawBoxConnections);
}
function autoLayout(box, project) {
  const ids = new Set(box.components.map(c => c.id)),
    links = (project.installation.connections || []).filter(
      x => x.boxId === box.id && ids.has(x.fromComponent) && ids.has(x.toComponent)
    ),
    outgoing = new Map(box.components.map(c => [c.id, []])),
    incoming = new Map(box.components.map(c => [c.id, 0])),
    depth = new Map(box.components.map(c => [c.id, 0]));
  links.forEach(link => {
    outgoing.get(link.fromComponent).push(link.toComponent);
    incoming.set(link.toComponent, incoming.get(link.toComponent) + 1);
  });
  const queue = box.components.filter(c => incoming.get(c.id) === 0).map(c => c.id),
    visited = new Set();
  while (queue.length) {
    const id = queue.shift();
    visited.add(id);
    outgoing.get(id).forEach(next => {
      depth.set(next, Math.max(depth.get(next), depth.get(id) + 1));
      incoming.set(next, incoming.get(next) - 1);
      if (incoming.get(next) === 0) queue.push(next);
    });
  }
  const categoryLayer = category =>
    [
      'Network',
      'Computer',
      'Input board',
      'Controller',
      'Signal board',
      'DMX',
      'Relay board',
      'Power'
    ].indexOf(category);
  box.components.forEach(c => {
    if (
      !visited.has(c.id) ||
      (!links.some(x => x.fromComponent === c.id || x.toComponent === c.id) && !depth.get(c.id))
    )
      depth.set(c.id, Math.max(0, categoryLayer(c.snapshot.category)));
  });
  const values = [...new Set(depth.values())].sort((a, b) => a - b),
    groups = values.map(value =>
      box.components
        .filter(c => depth.get(c.id) === value)
        .sort(
          (a, b) =>
            a.snapshot.category.localeCompare(b.snapshot.category) ||
            a.snapshot.name.localeCompare(b.snapshot.name)
        )
    ),
    maxRows = Math.max(1, ...groups.map(group => group.length)),
    scroll = document.querySelector('.box-stage-scroll'),
    baseWidth = scroll?.clientWidth || 800;
  schematicZoom = Math.min(
    3,
    Math.max(1, (groups.length * 280 + 48) / baseWidth, (maxRows * 210 + 48) / 450)
  );
  api.render();
  requestAnimationFrame(() => {
    const stage = document.querySelector('#box-stage');
    if (!stage) return;
    const elements = new Map(
        [...stage.querySelectorAll('[data-box-part]')].map(element => [element.dataset.boxPart, element])
      ),
      tallest = Math.max(
        0,
        ...groups.map(
          group =>
            group.reduce((sum, c) => sum + (elements.get(c.id)?.offsetHeight || 180), 0) +
            (group.length - 1) * 32
        )
      );
    if (tallest + 48 > stage.clientHeight)
      setSchematicZoom(Math.min(3, schematicZoom * ((tallest + 48) / stage.clientHeight)));
    requestAnimationFrame(() => {
      const width = stage.clientWidth,
        height = stage.clientHeight,
        margin = 24;
      api.transact(() =>
        groups.forEach((group, column) => {
          const heights = group.map(c => elements.get(c.id)?.offsetHeight || 180),
            total = heights.reduce((sum, value) => sum + value, 0) + Math.max(0, group.length - 1) * 32;
          let y = Math.max(margin, (height - total) / 2);
          group.forEach((c, row) => {
            const partWidth = elements.get(c.id)?.offsetWidth || 230,
              x =
                groups.length === 1
                  ? (width - partWidth) / 2
                  : margin + (column * (width - partWidth - margin * 2)) / (groups.length - 1);
            c.x = +((Math.max(0, x) / width) * 100).toFixed(1);
            c.y = +((y / height) * 100).toFixed(1);
            y += heights[row] + 32;
          });
        })
      );
    });
  });
}
const segmentHits = (a, b, r) =>
  a.x === b.x
    ? a.x >= r.left && a.x <= r.right && Math.max(a.y, b.y) >= r.top && Math.min(a.y, b.y) <= r.bottom
    : a.y >= r.top && a.y <= r.bottom && Math.max(a.x, b.x) >= r.left && Math.min(a.x, b.x) <= r.right;
const routePath = (a, b, obstacles) => {
  const direction = b.x >= a.x ? 1 : -1,
    start = { x: a.x + 14 * direction, y: a.y },
    finish = { x: b.x - 14 * direction, y: b.y },
    middle = (start.x + finish.x) / 2,
    direct = [a, start, { x: middle, y: start.y }, { x: middle, y: finish.y }, finish, b],
    clear = points =>
      points.slice(1).every((point, i) => !obstacles.some(rect => segmentHits(points[i], point, rect)));
  let points = direct;
  if (!clear(points) && obstacles.length) {
    const top = Math.max(8, Math.min(...obstacles.map(r => r.top)) - 14),
      bottom = Math.min(
        document.querySelector('#box-stage')?.clientHeight - 8 || 442,
        Math.max(...obstacles.map(r => r.bottom)) + 14
      ),
      candidates = [
        [a, start, { x: start.x, y: top }, { x: finish.x, y: top }, finish, b],
        [a, start, { x: start.x, y: bottom }, { x: finish.x, y: bottom }, finish, b]
      ];
    points =
      candidates.find(clear) || candidates.sort((x, y) => Math.abs(x[2].y - a.y) - Math.abs(y[2].y - a.y))[0];
  }
  return points.map((point, i) => `${i ? 'L' : 'M'}${point.x} ${point.y}`).join(' ');
};
export function drawBoxConnections() {
  const stage = document.querySelector('#box-stage'),
    svg = document.querySelector('#box-wires');
  if (!stage || !svg || !api) return;
  const p = api.getProject(),
    box = current(p);
  svg.setAttribute('viewBox', `0 0 ${stage.clientWidth} ${stage.clientHeight}`);
  const rs = stage.getBoundingClientRect(),
    rectFor = el => {
      const r = el.getBoundingClientRect();
      return {
        left: r.left - rs.left - 8,
        right: r.right - rs.left + 8,
        top: r.top - rs.top - 8,
        bottom: r.bottom - rs.top + 8
      };
    },
    center = el => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - rs.left, y: r.top + r.height / 2 - rs.top };
    },
    parts = [...stage.querySelectorAll('.box-part')];
  const records = [
    ...(p.installation.connections || []).filter(x => x.boxId === box?.id),
    ...(box?.interfacePorts || [])
      .filter(x => x.componentId && x.portId)
      .map(x => ({
        fromComponent: x.componentId,
        fromPort: x.portId,
        toComponent: '@interface',
        toPort: x.id
      }))
  ];
  const paths = records
    .map(x => {
      const a = stage.querySelector(`[data-box-port="${CSS.escape(x.fromComponent + ':' + x.fromPort)}"]`),
        b = stage.querySelector(`[data-box-port="${CSS.escape(x.toComponent + ':' + x.toPort)}"]`);
      if (!a || !b) return '';
      const endpoints = [a.closest('.box-part'), b.closest('.box-part')],
        obstacles = parts.filter(part => !endpoints.includes(part)).map(rectFor);
      const warning = x.boxId && connectionWarnings(p, x).length;
      return `<path class="box-wire" data-wire-from="${E(x.fromComponent + ':' + x.fromPort)}" data-wire-to="${E(x.toComponent + ':' + x.toPort)}" d="${routePath(center(a), center(b), obstacles)}" stroke="${warning ? '#d17944' : '#4b8a76'}"/>`;
    })
    .join('');
  let preview = '';
  if (wireFrom && wirePoint) {
    const a = stage.querySelector(`[data-box-port="${CSS.escape(wireFrom.component + ':' + wireFrom.id)}"]`);
    if (a) {
      const sourcePart = a.closest('.box-part'),
        obstacles = parts.filter(part => part !== sourcePart).map(rectFor);
      preview = `<path class="box-wire preview" d="${routePath(center(a), wirePoint, obstacles)}"/>`;
    }
  }
  svg.innerHTML = paths + preview;
}
function addExternal(box, from, toKey) {
  const p = api.getProject(),
    part = box.components.find(c => c.id === from.component),
    port = part?.snapshot.ports.find(v => v.id === from.id);
  if (!port) return;
  const kind = port.type.includes('power')
    ? 'power'
    : port.type === 'pixel_output' || port.type === 'pixel_data'
      ? 'data'
      : 'other';
  api.transact(() =>
    p.installation.connections.push({
      id: 'link-' + Math.random().toString(36).slice(2, 10),
      boxId: box.id,
      ...(port.direction === 'in' && toKey.startsWith('field:')
        ? {
            fromKey: toKey,
            fromPort: p.installation.fieldDevices.find(d => 'field:' + d.id === toKey)?.snapshot.ports[0]?.id,
            toKey: 'box:' + box.id,
            toComponent: from.component,
            toPort: from.id
          }
        : { fromComponent: from.component, fromPort: from.id, fromKey: 'box:' + box.id, toKey, toPort: '' }),
      kind,
      name: box.name + ' · ' + part.snapshot.name + ' ' + port.label + ' → ' + toKey,
      acknowledged: false
    })
  );
}
export function installInstallation(a) {
  api = a;
  document.addEventListener('click', e => {
    const details = e.target.closest('.box-details>summary');
    if (details) {
      boxDetailsOpen = !details.parentElement.open;
      return;
    }
    const port = e.target.closest('[data-box-port]');
    if (port) {
      const [component, id] = port.dataset.boxPort.split(':'),
        box = current(api.getProject());
      if (!wireFrom) {
        wireFrom = { component, id };
        const stage = port.closest('#box-stage'),
          rect = stage?.getBoundingClientRect();
        wirePoint = rect ? { x: e.clientX - rect.left, y: e.clientY - rect.top } : null;
        port.classList.add('wire-start');
        drawBoxConnections();
        api.toast('Choose a destination port.');
      } else {
        const from = wireFrom;
        wireFrom = null;
        wirePoint = null;
        if (from.component === component && from.id === id) {
          api.render();
          return;
        }
        connectEndpoints(box, from, { component, id });
      }
      e.stopPropagation();
      return;
    }
    const target = e.target.closest('[data-box-target]');
    if (target) {
      if (!wireFrom) {
        api.toast('Choose a component port first.');
        return;
      }
      const box = current(api.getProject()),
        from = wireFrom;
      wireFrom = null;
      wirePoint = null;
      addExternal(box, from, target.dataset.boxTarget);
      return;
    }
    const part = e.target.closest('[data-box-part]');
    if (part && !e.target.closest('[data-install]')) {
      partId = part.dataset.boxPart;
      boxDetailsOpen = false;
      api.render();
      return;
    }
    const el = e.target.closest('[data-install]');
    if (!el) return;
    const [action, id, sub] = el.dataset.install.split(':'),
      p = api.getProject(),
      lib = api.getLibrary(),
      box = current(p);
    if (action === 'box-mode') {
      boxMode = id;
      api.render();
    } else if (action === 'box-zoom') {
      if (id === 'home') setSchematicZoom(1);
      else setSchematicZoom(schematicZoom + (id === 'in' ? 0.25 : -0.25));
    } else if (action === 'auto-layout' && box) {
      autoLayout(box, p);
    } else if (action === 'tickets') {
      showTickets = !showTickets;
      api.render();
    } else if (action === 'select-part') {
      partId = id;
      boxDetailsOpen = false;
      showTickets = false;
      boxMode = 'physical';
      api.render();
    } else if (action === 'rotate-part')
      api.transact(() => {
        const c = box.components.find(x => x.id === partId);
        c.rotation = ((c.rotation || 0) + 90) % 360;
      });
    else if (action === 'save-size') {
      const c = box.components.find(x => x.id === partId),
        d = lib.components.find(x => x.id === c?.definitionId);
      if (!c || !d) return;
      api.libraryTransact(() => {
        d.physical = structuredClone(c.snapshot.physical);
        d.version++;
      });
      api.transact(() => {
        c.definitionVersion = d.version;
      });
      api.toast('Measurements saved to the device library.');
    } else if (action === 'new-box')
      api.transact(() => {
        const b = makeBox('Controller box ' + (p.installation.boxes.length + 1));
        p.installation.boxes.push(b);
        boxId = b.id;
        boxDetailsOpen = true;
      });
    else if (action === 'delete-box' && box)
      api.confirmAction('Delete box?', `Remove ${box.name} and its internal components?`, () => {
        p.installation.boxes = p.installation.boxes.filter(b => b.id !== box.id);
        for (const link of p.installation.connections.filter(x => x.boxId === box.id))
          deleteRoute(p, 'custom:' + link.id);
        delete p.scene?.placements?.['box:' + box.id];
        p.installation.infrastructureMigrated = false;
        boxId = '';
      });
    else if (action === 'add-part' && box) {
      const def = lib.components.find(d => d.id === id);
      if (def)
        api.transact(() => {
          const c = makeInstance(def);
          c.x = 10 + (box.components.length % 4) * 20;
          c.y = 10 + Math.floor(box.components.length / 4) * 25;
          box.components.push(c);
          partId = c.id;
          boxDetailsOpen = false;
        });
    } else if (action === 'duplicate-part' && box) {
      api.transact(() => {
        const original = box.components.find(x => x.id === partId);
        if (!original) return;
        const copy = structuredClone(original);
        copy.id = 'part-' + Math.random().toString(36).slice(2, 10);
        copy.x = Math.min(85, copy.x + 7);
        copy.y = Math.min(85, copy.y + 7);
        copy.sourceKey = '';
        box.components.push(copy);
        partId = copy.id;
        boxDetailsOpen = false;
      });
    } else if (action === 'delete-part' && box) {
      api.transact(() => {
        box.components = box.components.filter(c => c.id !== partId);
        for (const port of box.interfacePorts || [])
          if (port.componentId === partId) {
            port.componentId = '';
            port.portId = '';
          }
        for (const link of p.installation.connections.filter(
          x => x.fromComponent === partId || x.toComponent === partId
        ))
          deleteRoute(p, 'custom:' + link.id);
        p.installation.infrastructureMigrated = false;
        partId = '';
      });
    } else if (action === 'add-interface-port' && box)
      api.transact(() => {
        box.interfacePorts ??= [];
        box.interfacePorts.push({
          id: 'interface-' + Math.random().toString(36).slice(2, 10),
          label: 'New port',
          edge: 'right',
          visible: true,
          componentId: '',
          portId: ''
        });
      });
    else if (action === 'delete-interface-port' && box)
      api.transact(() => {
        box.interfacePorts = box.interfacePorts.filter(x => x.id !== id);
      });
    else if (action === 'external-route' && box) {
      const fromPort = document.querySelector('[data-install-field="external-port"]')?.value,
        toKey = document.querySelector('[data-install-field="external-target"]')?.value;
      if (!fromPort || !toKey) {
        api.toast('Choose a port and destination.');
        return;
      }
      addExternal(box, { component: partId, id: fromPort }, toKey);
    } else if (action === 'save-template' && box) {
      api.libraryTransact(() => saveBoxTemplate(lib, box));
      api.transact(() => {});
      api.toast('Box template saved to the device library.');
    } else if (action === 'add-template') {
      const t = lib.boxTemplates.find(
        t => t.id === document.querySelector('[data-install-field="template-select"]')?.value
      );
      if (t)
        api.transact(() => {
          boxId = addBoxFromTemplate(p, t).id;
          boxDetailsOpen = false;
        });
      else api.toast('Choose a template first.');
    } else if (action === 'update-template' && box) {
      const t = lib.boxTemplates.find(t => t.id === box.templateRef?.id);
      if (t)
        api.confirmAction(
          'Update this box?',
          `Replace its current components with ${t.name} v${t.version}? Existing links and positions in this box will be removed.`,
          () => {
            for (const link of p.installation.connections.filter(x => x.boxId === box.id))
              deleteRoute(p, 'custom:' + link.id);
            updateBoxFromTemplate(box, t);
            partId = '';
          }
        );
    } else if (action === 'ack')
      api.transact(() => {
        const x = p.installation.connections.find(x => x.id === id);
        x.acknowledged = !x.acknowledged;
      });
    else if (action === 'delete-connection')
      api.transact(() => {
        p.installation.connections = p.installation.connections.filter(x => x.id !== id);
        delete p.installation.routes['custom:' + id];
      });
    else if (action === 'update-part' && box) {
      const c = box.components.find(x => x.id === partId),
        d = lib.components.find(x => x.id === c?.definitionId);
      if (d)
        api.transact(() => {
          c.snapshot = structuredClone(d);
          c.definitionVersion = d.version;
        });
    } else if (action === 'new-box-size')
      api.libraryTransact(() =>
        lib.boxSizes.push({
          id: 'box-size-' + Math.random().toString(36).slice(2, 10),
          name: 'New size',
          widthCm: 40,
          depthCm: 25
        })
      );
    else if (action === 'delete-box-size')
      api.libraryTransact(() => (lib.boxSizes = lib.boxSizes.filter(x => x.id !== id)));
    else if (action === 'new-cable')
      api.libraryTransact(() =>
        lib.cables.push({
          id: 'cable-' + Math.random().toString(36).slice(2, 10),
          version: 1,
          name: 'New cable',
          type: 'Extension',
          lengthM: 1,
          pins: 3,
          color: '#5288c4',
          connector: '',
          notes: ''
        })
      );
    else if (action === 'delete-cable')
      api.libraryTransact(() => (lib.cables = lib.cables.filter(x => x.id !== id)));
    else if (action === 'new-component')
      api.libraryTransact(() =>
        lib.components.push({
          id: 'def-' + Math.random().toString(36).slice(2, 10),
          version: 1,
          name: 'Custom component',
          category: 'Custom',
          icon: '◇',
          color: '#4b8a76',
          manufacturer: '',
          model: '',
          notes: '',
          ports: [],
          resources: {},
          operatingLimits: {},
          physical: { widthMm: null, depthMm: null, heightMm: null }
        })
      );
    else if (action === 'new-resource') {
      api.modal(
        'Add custom resource',
        '<label>Resource key<input name="key" required pattern="[A-Za-z][A-Za-z0-9_]{0,39}" maxlength="40"></label><label>Reference capacity<input type="number" name="count" min="0" step="any" value="1" required></label>',
        f =>
          api.libraryTransact(() => {
            const d = lib.components.find(x => x.id === id),
              key = f.get('key');
            if (key in (d.resources || {})) throw Error('That resource already exists.');
            d.resources[key] = +f.get('count');
            d.version++;
          })
      );
    } else if (action === 'delete-def')
      api.libraryTransact(() => (lib.components = lib.components.filter(x => x.id !== id)));
    else if (action === 'add-port')
      api.libraryTransact(() => {
        const d = lib.components.find(x => x.id === id);
        d.ports.push({
          id: 'port-' + Math.random().toString(36).slice(2, 10),
          label: 'New port',
          type: 'generic',
          direction: 'out'
        });
        d.version++;
      });
    else if (action === 'delete-port')
      api.libraryTransact(() => {
        const d = lib.components.find(x => x.id === id);
        d.ports = d.ports.filter(x => x.id !== sub);
        d.version++;
      });
    else if (action === 'bom-csv') {
      const rows = billOfMaterials(p, bomScope || null);
      api.download(
        'pixel-workbench-bom.csv',
        [['Category', 'Item', 'Quantity', 'Unit'], ...rows.map(x => [x.category, x.name, x.quantity, x.unit])]
          .map(row => row.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','))
          .join('\r\n'),
        'text/csv'
      );
    } else if (action === 'bom-print') window.print();
  });
  document.addEventListener('change', e => {
    const t = e.target,
      key = t.dataset.installField;
    if (!key) return;
    if (key === 'box-select') {
      boxId = t.value;
      partId = '';
      boxDetailsOpen = false;
      api.render();
      return;
    }
    if (key === 'box-size-select') {
      const size = api.getLibrary().boxSizes.find(s => s.id === t.value),
        box = current(api.getProject());
      if (size && box)
        api.transact(() => {
          box.physicalWidthMm = size.widthCm * 10;
          box.physicalDepthMm = size.depthCm * 10;
        });
      return;
    }
    if (key === 'size-guide') {
      const box = current(api.getProject()),
        part = box?.components.find(c => c.id === partId),
        guide = componentSizeGuides(part?.snapshot || {}).find(guide => guide.id === t.value);
      if (part && guide)
        api.transact(() => {
          part.snapshot.manufacturer = guide.manufacturer;
          part.snapshot.model = guide.model;
          part.snapshot.physical = structuredClone(guide.physical);
        });
      return;
    }
    if (
      key === 'template-select' ||
      key === 'external-port' ||
      key === 'external-target' ||
      key === 'bom-filter'
    ) {
      if (key === 'bom-filter') {
        bomScope = t.value;
        api.render();
      }
      return;
    }
    if (!t.checkValidity()) {
      t.reportValidity();
      return;
    }
    const [kind, id, field, sub] = key.split(':'),
      p = api.getProject(),
      lib = api.getLibrary(),
      box = current(p);
    if (key.startsWith('box.'))
      api.transact(() => {
        const field = key.slice(4);
        if (field === 'physicalWidthCm') box.physicalWidthMm = +t.value * 10;
        else if (field === 'physicalDepthCm') box.physicalDepthMm = +t.value * 10;
        else box[field] = t.type === 'number' ? +t.value : t.value;
      });
    else if (key.startsWith('part.'))
      api.transact(() => {
        const c = box.components.find(x => x.id === partId);
        c[key.slice(5)] = t.type === 'number' ? +t.value : t.value;
      });
    else if (key.startsWith('physical.'))
      api.transact(() => {
        const c = box.components.find(x => x.id === partId);
        c.snapshot.physical ??= { widthMm: null, depthMm: null, heightMm: null };
        c.snapshot.physical[key.slice(9)] = +t.value;
      });
    else if (key.startsWith('limit.'))
      api.transact(() => {
        const c = box.components.find(x => x.id === partId);
        c.operatingLimits[key.slice(6)] = +t.value;
      });
    else if (kind === 'interface')
      api.transact(() => {
        const port = box.interfacePorts.find(x => x.id === id);
        port[field] = field === 'visible' ? t.checked : t.value;
      });
    else if (
      kind === 'cable' ||
      kind === 'boxsize' ||
      kind === 'def' ||
      kind === 'resource' ||
      kind === 'operating' ||
      kind === 'port' ||
      kind === 'physical'
    )
      api.libraryTransact(() => {
        const obj =
          kind === 'cable'
            ? lib.cables.find(x => x.id === id)
            : kind === 'boxsize'
              ? lib.boxSizes.find(x => x.id === id)
              : lib.components.find(x => x.id === id);
        if (!obj) return;
        if (kind === 'resource') obj.resources[field] = +t.value;
        else if (kind === 'port') obj.ports.find(x => x.id === field)[sub] = t.value;
        else if (kind === 'physical') {
          obj.physical ??= {};
          obj.physical[field] = +t.value;
        } else obj[field] = t.type === 'number' ? +t.value : t.value;
        if (kind !== 'boxsize') obj.version++;
      });
  });
  document.addEventListener('dragstart', e => {
    const palette = e.target.closest('[data-palette]'),
      port = e.target.closest('[data-box-port]');
    if (palette) e.dataTransfer.setData('application/x-pixel-part', palette.dataset.palette);
    else if (port) {
      wireFrom = { component: port.dataset.boxPort.split(':')[0], id: port.dataset.boxPort.split(':')[1] };
      const stage = port.closest('#box-stage'),
        rect = stage?.getBoundingClientRect();
      wirePoint = rect ? { x: e.clientX - rect.left, y: e.clientY - rect.top } : null;
      e.dataTransfer.setData('application/x-pixel-port', port.dataset.boxPort);
      requestAnimationFrame(drawBoxConnections);
    }
  });
  document.addEventListener('dragover', e => {
    if (e.target.closest('#box-stage,[data-box-target],[data-box-port]')) {
      e.preventDefault();
      const stage = document.querySelector('#box-stage'),
        rect = stage?.getBoundingClientRect();
      if (wireFrom && rect) {
        wirePoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        drawBoxConnections();
      }
    }
  });
  document.addEventListener('drop', e => {
    const stage = e.target.closest('#box-stage'),
      target = e.target.closest('[data-box-target]'),
      port = e.target.closest('[data-box-port]'),
      box = current(api.getProject());
    if (stage && e.dataTransfer.getData('application/x-pixel-part')) {
      e.preventDefault();
      const def = api
          .getLibrary()
          .components.find(d => d.id === e.dataTransfer.getData('application/x-pixel-part')),
        rect = stage.getBoundingClientRect();
      if (def)
        api.transact(() => {
          const c = makeInstance(def);
          c.x = +Math.min(85, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)).toFixed(1);
          c.y = +Math.min(85, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100)).toFixed(1);
          box.components.push(c);
          partId = c.id;
          boxDetailsOpen = false;
        });
    } else if (target && wireFrom) {
      e.preventDefault();
      const from = wireFrom;
      wireFrom = null;
      wirePoint = null;
      addExternal(box, from, target.dataset.boxTarget);
    } else if (port && wireFrom) {
      e.preventDefault();
      const [toComponent, toPort] = port.dataset.boxPort.split(':'),
        from = wireFrom;
      wireFrom = null;
      wirePoint = null;
      if (from.component !== toComponent || from.id !== toPort)
        connectEndpoints(box, from, { component: toComponent, id: toPort });
    }
  });
  document.addEventListener('dragend', e => {
    if (!e.target.closest('[data-box-port]')) return;
    wireFrom = null;
    wirePoint = null;
    drawBoxConnections();
  });
  const highlightConnection = (target, on) => {
    const keys = target.matches('[data-box-port]')
      ? [target.dataset.boxPort]
      : [target.dataset.wireFrom, target.dataset.wireTo].filter(Boolean);
    const paths = [...document.querySelectorAll('.box-wire:not(.preview)')].filter(
      path => keys.includes(path.dataset.wireFrom) || keys.includes(path.dataset.wireTo)
    );
    const connected = new Set(keys);
    paths.forEach(path => {
      path.classList.toggle('connection-highlight', on);
      connected.add(path.dataset.wireFrom);
      connected.add(path.dataset.wireTo);
    });
    connected.forEach(key =>
      document
        .querySelector(`[data-box-port="${CSS.escape(key)}"]`)
        ?.classList.toggle('connection-highlight', on)
    );
  };
  document.addEventListener('pointerover', e => {
    const target = e.target.closest('[data-box-port],.box-wire:not(.preview)');
    if (target) highlightConnection(target, true);
  });
  document.addEventListener('pointerout', e => {
    const target = e.target.closest('[data-box-port],.box-wire:not(.preview)');
    if (target && !target.contains(e.relatedTarget)) highlightConnection(target, false);
  });
  document.addEventListener('pointerdown', e => {
    const el = e.target.closest('.box-part .part-title,.physical-part');
    if (!el || e.button !== 0) return;
    const part = el.closest('[data-box-part]'),
      stage = part.closest('#box-stage');
    partId = part.dataset.boxPart;
    drag = { part, stage, pointer: e.pointerId };
    part.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  document.addEventListener('pointermove', e => {
    if (!drag || drag.pointer !== e.pointerId) {
      const stage = document.querySelector('#box-stage'),
        rect = stage?.getBoundingClientRect();
      if (wireFrom && rect) {
        wirePoint = {
          x: Math.max(0, Math.min(rect.width, e.clientX - rect.left)),
          y: Math.max(0, Math.min(rect.height, e.clientY - rect.top))
        };
        drawBoxConnections();
      }
      return;
    }
    const rect = drag.stage.getBoundingClientRect(),
      maxX = 100 - (drag.part.offsetWidth / rect.width) * 100,
      maxY = 100 - (drag.part.offsetHeight / rect.height) * 100,
      x = Math.min(maxX, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)),
      y = Math.min(maxY, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    drag.part.style.left = x.toFixed(1) + '%';
    drag.part.style.top = y.toFixed(1) + '%';
    drawBoxConnections();
  });
  document.addEventListener('pointerup', e => {
    if (!drag || drag.pointer !== e.pointerId) return;
    const d = drag;
    drag = null;
    const c = current(api.getProject())?.components.find(x => x.id === partId);
    if (c)
      api.transact(() => {
        c.x = +parseFloat(d.part.style.left).toFixed(1);
        c.y = +parseFloat(d.part.style.top).toFixed(1);
      });
  });
  document.addEventListener(
    'wheel',
    e => {
      if (!e.target.closest('.box-stage-scroll') || boxMode !== 'schematic') return;
      e.preventDefault();
      setSchematicZoom(schematicZoom + (e.deltaY < 0 ? 0.1 : -0.1), e.clientX, e.clientY);
    },
    { passive: false }
  );
}
