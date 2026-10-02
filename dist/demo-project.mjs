import { tailoredInitial, validateProject } from './model.mjs?v=0.59.0';
import { ensureScene } from './layout-model.mjs?v=0.59.0';
import {
  addFieldDevice,
  addInfrastructure,
  assignCable,
  ensureInstallation,
  makeBox,
  makeInstance,
  routeRecord,
  saveBoxTemplate
} from './installation-model.mjs?v=0.59.0';

export function createDemoProject(library) {
  const p = tailoredInitial();
  validateProject(p);
  p.name = 'Demo · Garden stage';
  p.scene = { width: 18, depth: 12, snap: 0.1, placements: {} };
  ensureInstallation(p);
  p.installation.infrastructureMigrated = true;
  p.installation.slack = { mode: 'percent', value: 10 };
  const control = makeBox('Garden control box'),
    effects = makeBox('Stage effects box');
  p.installation.boxes.push(control, effects);
  for (const ps of p.psus)
    addInfrastructure(p, library, 'psu:' + ps.id, ps.id === 'p4' ? effects.id : control.id);
  for (const d of p.distros)
    addInfrastructure(p, library, 'distro:' + d.id, d.id === 'd2' ? effects.id : control.id);
  addInfrastructure(p, library, 'controller:' + p.controllers[0].id, control.id);
  for (const [name, box, color] of [
    ['Raspberry Pi', control, '#667cbb'],
    ['Network switch', control, '#4d92b7'],
    ['USB sound card', effects, '#a278bc'],
    ['Audio amplifier', effects, '#955b9b'],
    ['BaldrickDMX', effects, '#54a49e'],
    ['BaldrickInput', effects, '#d2755a']
  ]) {
    const def = library.components.find(d => d.name === name);
    if (def) {
      const part = makeInstance(def);
      part.snapshot.color = color;
      box.components.push(part);
    }
  }
  for (const [name, x, y] of [
    ['Push button', 11, 3],
    ['Beam-break sensor', 14, 4],
    ['Speaker', 12, 9],
    ['DMX fixture', 15, 8],
    ['Smoke / fog machine', 15, 10]
  ]) {
    const def = library.components.find(d => d.name === name);
    if (def) {
      const item = addFieldDevice(p, def);
      item.demoPosition = { x, y };
    }
  }
  ensureScene(p);
  Object.assign(p.scene.placements['box:' + control.id], { x: 3.7, y: 4, width: 4.3, height: 2.6 });
  Object.assign(p.scene.placements['box:' + effects.id], { x: 6.7, y: 8, width: 3.7, height: 2.4 });
  for (const item of p.installation.fieldDevices)
    Object.assign(p.scene.placements['field:' + item.id], item.demoPosition);
  const locations = [
    [9, 2],
    [12, 5],
    [10, 8],
    [13, 10]
  ];
  p.chains.forEach((ch, i) => {
    const seg = ch.segments[0];
    Object.assign(p.scene.placements['segment:' + seg.id], {
      x: locations[i][0],
      y: locations[i][1],
      width: 2,
      height: 0.8
    });
  });
  const primary = p.chains[0].segments[0],
    second = p.chains[1].segments[0],
    third = p.chains[2].segments[0];
  assignCable(p, 'data:' + primary.id, library.cables.find(c => c.lengthM === 1) || library.cables[0]);
  routeRecord(p, 'data:' + primary.id).points = [
    { x: 6, y: 1.2 },
    { x: 8, y: 1.2 }
  ];
  assignCable(p, 'data:' + second.id, library.cables.find(c => c.lengthM === 5) || library.cables[0]);
  routeRecord(p, 'data:' + third.id).physicalM = null;
  const controller = control.components.find(c => c.sourceKey === 'controller:c1');
  const button = p.installation.fieldDevices.find(d => d.snapshot.name === 'Push button');
  const input = effects.components.find(c => c.snapshot.name === 'BaldrickInput');
  const beam = p.installation.fieldDevices.find(d => d.snapshot.name === 'Beam-break sensor');
  if (controller && button)
    p.installation.connections.push({
      id: 'demo-mismatch',
      boxId: control.id,
      fromComponent: controller.id,
      fromPort: 'p2',
      fromKey: 'box:' + control.id,
      toKey: 'field:' + button.id,
      kind: 'other',
      name: 'Deliberate type mismatch',
      acknowledged: false
    });
  if (input && beam)
    p.installation.connections.push({
      id: 'demo-input',
      boxId: effects.id,
      fromKey: 'field:' + beam.id,
      fromPort: 'signal1',
      toKey: 'box:' + effects.id,
      toComponent: input.id,
      toPort: 'in1',
      kind: 'other',
      name: 'Beam-break signal',
      acknowledged: false
    });
  p.installation.boxes.forEach(
    (box, i) => (box.description = i ? 'Audio, DMX and input hardware' : 'Pixels, power and networking')
  );
  saveBoxTemplate(library, control);
  saveBoxTemplate(library, effects);
  return p;
}
