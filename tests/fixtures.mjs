import { tailoredInitial } from '../dist/model.mjs';
import {
  defaultLibrary,
  ensureInstallation,
  makeBox,
  makeInstance,
  makeButtonBox,
  syncInterfacePorts
} from '../dist/installation-model.mjs';
import { ensureScene } from '../dist/layout-model.mjs';

// Reconstructed from the request-35 screenshot, not the owner's original saved project.
export function referenceFixture() {
  const library = defaultLibrary(),
    project = tailoredInitial();
  project.controllers = [];
  project.psus = [];
  project.distros = [];
  project.aux = [];
  project.chains = [];
  ensureInstallation(project);
  project.installation.infrastructureMigrated = true;
  const box = makeBox('BOX FOUR: 8 IN / 4 OUT');
  box.id = 'four';
  const names = [
    '12 V PSU',
    'Raspberry Pi',
    'Network switch',
    'USB sound card',
    'Fused distro',
    'Fused distro',
    'Fused distro',
    'BaldrickInput8',
    'Audio amplifier',
    'BaldrickSwitchy',
    'Step-down transformer'
  ];
  box.components = names.map((name, i) => {
    const definition = library.components.find(d => d.name === name);
    if (!definition) throw Error(`Missing fixture definition: ${name}`);
    const component = makeInstance(definition);
    component.id = 'four-' + i;
    component.x = 5 + (i % 4) * 22;
    component.y = 5 + Math.floor(i / 4) * 28;
    return component;
  });
  syncInterfacePorts(box);
  for (const edge of box.interfacePorts) {
    const part = box.components.find(c => c.id === edge.componentId),
      port = part.snapshot.ports.find(p => p.id === edge.portId);
    edge.id = 'four-edge-' + part.id + '-' + port.id;
    edge.visible =
      (part.snapshot.name === 'BaldrickInput8' && ['digital_input', 'pixel_output'].includes(port.type)) ||
      (part.snapshot.name === 'BaldrickSwitchy' && port.type === 'relay_output') ||
      (part.snapshot.name === 'Network switch' && port.id === 'uplink1') ||
      (part.snapshot.name === 'Audio amplifier' && port.direction === 'out') ||
      (part.snapshot.name === 'Step-down transformer' && port.type === 'mains_power');
    if (part.snapshot.name === 'BaldrickInput8') edge.edge = 'right';
    if (part.snapshot.name === 'BaldrickSwitchy') edge.edge = 'bottom';
  }
  const hub = makeBox('BOX THREE: Network hub');
  hub.id = 'three';
  hub.components = [makeInstance(library.components.find(d => d.name === 'Network switch'))];
  hub.components[0].id = 'hub';
  syncInterfacePorts(hub);
  hub.interfacePorts.forEach((edge, i) => {
    edge.id = 'hub-edge-' + i;
    edge.visible = true;
    edge.edge = 'right';
  });
  const buttons = makeButtonBox('Mixed button box', 3);
  buttons.id = 'buttons';
  buttons.components.forEach((b, i) => (b.id = 'button-' + i));
  buttons.interfacePorts = [];
  syncInterfacePorts(buttons);
  buttons.interfacePorts.forEach((edge, i) => {
    edge.id = 'button-edge-' + i;
    edge.visible = true;
    edge.edge = 'left';
  });
  project.installation.boxes = [box, hub, buttons];
  project.scene = { width: 24, depth: 16, snap: 0.05, placements: {} };
  ensureScene(project);
  Object.assign(project.scene.placements['box:four'], { x: 8, y: 6 });
  Object.assign(project.scene.placements['box:three'], { x: 6.5, y: 6 });
  Object.assign(project.scene.placements['box:buttons'], { x: 9.5, y: 6 });
  return { project, library };
}

export function largeFixture(wired = false) {
  const fixture = referenceFixture(),
    p = fixture.project,
    originals = p.installation.boxes;
  p.installation.boxes = [];
  p.scene.placements = {};
  for (let group = 0; group < 8; group++) {
    const ids = new Map();
    for (const original of originals) {
      const box = structuredClone(original);
      box.id = `large-${group}-${original.id}`;
      box.name += ` / ${group + 1}`;
      for (const component of box.components) {
        ids.set(component.id, `${group}-${component.id}`);
        component.id = ids.get(component.id);
      }
      for (const port of box.interfacePorts) {
        port.id = `${group}-${port.id}`;
        port.componentId = ids.get(port.componentId);
      }
      p.installation.boxes.push(box);
    }
    if (wired) {
      for (let button = 0; button < 3; button++)
        p.installation.connections.push({
          id: `large-${group}-button-${button}`,
          boxId: `large-${group}-buttons`,
          fromKey: `box:large-${group}-buttons`,
          fromComponent: `${group}-button-${button}`,
          fromPort: 'signal',
          toKey: `box:large-${group}-four`,
          toComponent: `${group}-four-7`,
          toPort: `in${button + 1}`,
          kind: 'other'
        });
      p.installation.connections.push({
        id: `large-${group}-ethernet`,
        boxId: `large-${group}-three`,
        fromKey: `box:large-${group}-three`,
        fromComponent: `${group}-hub`,
        fromPort: 'eth1',
        toKey: `box:large-${group}-four`,
        toComponent: `${group}-four-2`,
        toPort: 'uplink1',
        kind: 'other'
      });
    }
  }
  ensureScene(p);
  for (let group = 0; group < 8; group++) {
    const x = 3 + (group % 4) * 6,
      y = 4 + Math.floor(group / 4) * 7;
    Object.assign(p.scene.placements[`box:large-${group}-four`], { x, y });
    Object.assign(p.scene.placements[`box:large-${group}-three`], { x: x - 1.5, y });
    Object.assign(p.scene.placements[`box:large-${group}-buttons`], { x: x + 1.5, y });
  }
  return fixture;
}
if (process.argv.includes('--large-json'))
  console.log(JSON.stringify(largeFixture(process.argv.includes('--wired'))));
else if (process.argv.includes('--json')) console.log(JSON.stringify(referenceFixture()));
