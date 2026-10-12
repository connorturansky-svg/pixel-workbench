import assert from 'node:assert/strict';
import { referenceFixture } from './fixtures.mjs';
import {
  ensureInstallation,
  exposedPorts,
  resizeButtonBox,
  saveBoxTemplate,
  addBoxFromTemplate,
  updateBoxFromTemplate,
  affectedConnections,
  connectionProblem,
  perimeterAnchor,
  routeSpecs,
  routeGeometry,
  syncBoxStandards,
  billOfMaterials,
  projectCapacity,
  validateLibrary,
  templateConnectionChanges,
  routeIssues,
  connectionWarnings,
  makeBox
} from '../dist/installation-model.mjs';
const { project: p, library: lib } = referenceFixture();
ensureInstallation(p);
const [box, hub, buttons] = p.installation.boxes;
const original = structuredClone(p);
ensureInstallation(p);
assert.deepEqual(p, original, 'normalisation is repeatable');
const input = { boxId: box.id, componentId: 'four-7', portId: 'in1' };
const button = { boxId: buttons.id, componentId: 'button-0', portId: 'signal' };
assert.equal(connectionProblem(p, button, input), '');
assert.match(connectionProblem(p, button, { ...input, portId: 'p1' }), /Incompatible/);
p.installation.connections.push({
  id: 'button-link',
  boxId: buttons.id,
  fromKey: 'box:buttons',
  fromComponent: 'button-0',
  fromPort: 'signal',
  toKey: 'box:four',
  toComponent: 'four-7',
  toPort: 'in1'
});
assert.match(connectionProblem(p, button, input), /already connected/);
assert.equal(projectCapacity(p).used.digitalInputs, 1, 'cross-box links count only their receiving input');
const enabled = exposedPorts(buttons).map(e => e.component.id);
buttons.interfacePorts[1].visible = false;
resizeButtonBox(buttons, 5);
assert.equal(buttons.components[0].id, enabled[0]);
assert.equal(buttons.interfacePorts[1].visible, false, 'resize does not reactivate disabled controls');
const shrink = structuredClone(buttons);
resizeButtonBox(shrink, 1);
assert.equal(affectedConnections(p, buttons, shrink).length, 0, 'unrelated retained button stays wired');
resizeButtonBox(shrink, 1);
shrink.components[0].snapshot.ports = [];
assert.equal(affectedConnections(p, buttons, shrink).length, 1, 'referenced port removal is reported');
const template = saveBoxTemplate(lib, buttons, p);
const instance = addBoxFromTemplate(p, template);
assert.equal(instance.kind, 'button');
assert.notEqual(instance.components[0].id, buttons.components[0].id);
const ids = instance.components.map(c => c.id);
const interfaces = structuredClone(instance.interfacePorts);
const physical = instance.components.map(c => [c.x, c.y]);
instance.name = 'Placed override';
instance.components[0].schematic = { x: 33, y: 44 };
template.version++;
template.components[0].snapshot.name = 'Illuminated button';
template.components[0].buttonType = 'illuminated';
updateBoxFromTemplate(instance, template);
assert.deepEqual(
  instance.components.map(c => c.id),
  ids
);
assert.deepEqual(instance.interfacePorts, interfaces);
assert.equal(instance.name, 'Placed override');
assert.deepEqual(
  instance.components.map(c => [c.x, c.y]),
  physical
);
assert.deepEqual(instance.components[0].schematic, { x: 33, y: 44 });
assert.equal(instance.components[0].buttonType, 'illuminated');
instance.components[0].buttonOverrides = { type: true, colour: true };
instance.components[0].buttonColour = 'Red';
instance.components[0].snapshot.color = '#e76452';
template.version++;
template.components[0].buttonType = 'push';
template.components[0].snapshot.name = 'Push button';
template.components[0].buttonColour = 'Green';
updateBoxFromTemplate(instance, template);
assert.equal(instance.components[0].buttonType, 'push', 'inherited template fields receive explicit updates');
assert.equal(
  instance.components[0].buttonColour,
  'Red',
  'genuine instance edits override updated template defaults'
);
const legacyButtonTemplate = structuredClone(template);
delete legacyButtonTemplate.kind;
assert.equal(
  addBoxFromTemplate(p, legacyButtonTemplate).kind,
  'button',
  'legacy button templates keep builder semantics'
);
const spec = routeSpecs(p).find(s => s.id === 'custom:button-link');
const anchor = perimeterAnchor(p, 'four', 'four-7', 'in1');
const geometry = routeGeometry(p, spec);
assert.ok(geometry, 'automatic route exists around endpoint boxes');
p.installation.showLabels = false;
assert.deepEqual(perimeterAnchor(p, 'four', 'four-7', 'in1'), anchor);
assert.deepEqual(routeGeometry(p, spec), geometry, 'labels cannot change cable length');
p.scene.placements['box:four'].rotation = 90;
const rotated = perimeterAnchor(p, 'four', 'four-7', 'in1');
assert.notDeepEqual(rotated, anchor);
const custom = box.interfacePorts.find(e => e.componentId === 'four-7' && e.portId === 'in1');
custom.label = 'Door switch';
custom.customLabel = true;
const def = lib.components.find(d => d.name === 'BaldrickInput8');
def.version++;
def.color = '#123456';
const idsBeforeSync = box.components.map(c => c.id);
syncBoxStandards(box, lib);
assert.deepEqual(
  box.components.map(c => c.id),
  idsBeforeSync
);
assert.equal(custom.label, 'Door switch');
assert.equal(p.installation.connections[0].toComponent, 'four-7');
assert.ok(billOfMaterials(p).some(row => row.name.includes('button')));
assert.equal(hub.components[0].snapshot.ports.filter(p => p.type === 'ethernet').length, 5);
hub.components[0].portOverrides = structuredClone(hub.components[0].snapshot.ports);
const networkTemplate = saveBoxTemplate(lib, hub, p);
const inheritedHub = addBoxFromTemplate(p, networkTemplate);
const customHub = addBoxFromTemplate(p, networkTemplate);
customHub.components[0].portOverrides = customHub.components[0].snapshot.ports.slice(0, 2);
customHub.components[0].snapshot.ports = structuredClone(customHub.components[0].portOverrides);
customHub.components[0].snapshot.resources.ethernetPorts = 2;
networkTemplate.version++;
networkTemplate.components[0].portOverrides = networkTemplate.components[0].snapshot.ports.slice(0, 4);
networkTemplate.components[0].snapshot.ports = structuredClone(networkTemplate.components[0].portOverrides);
networkTemplate.components[0].snapshot.resources.ethernetPorts = 4;
networkTemplate.interfacePorts = networkTemplate.interfacePorts.filter(edge =>
  networkTemplate.components[0].snapshot.ports.some(port => port.id === edge.portId)
);
updateBoxFromTemplate(inheritedHub, networkTemplate);
updateBoxFromTemplate(customHub, networkTemplate);
assert.equal(
  inheritedHub.components[0].snapshot.ports.length,
  4,
  'inherited Ethernet counts follow explicit template updates'
);
assert.equal(
  customHub.components[0].snapshot.ports.length,
  2,
  'local Ethernet count remains an instance override'
);
assert.equal(
  customHub.components[0].snapshot.resources.ethernetPorts,
  2,
  'local Ethernet resource count remains consistent'
);
const ethernet = {
  boxId: hub.id,
  fromKey: 'box:three',
  fromComponent: 'hub',
  fromPort: 'eth1',
  toKey: 'box:four',
  toComponent: 'four-2',
  toPort: 'uplink1'
};
assert.deepEqual(connectionWarnings(p, ethernet), [], 'legacy Ethernet directions remain interoperable');
const controllerTemplate = saveBoxTemplate(lib, box, p);
const reused = addBoxFromTemplate(p, controllerTemplate);
controllerTemplate.version++;
controllerTemplate.connections.push({
  id: 'template-usb',
  fromComponent: 'four-1',
  fromPort: 'usb1',
  toComponent: 'four-3',
  toPort: 'usb1',
  kind: 'other'
});
updateBoxFromTemplate(reused, controllerTemplate);
const changes = templateConnectionChanges(p, reused, controllerTemplate);
assert.equal(changes.additions.length, 1, 'explicit update includes new internal template wiring');
assert.deepEqual(changes.conflicts, []);
p.installation.connections.push(...changes.additions);
assert.equal(
  templateConnectionChanges(p, reused, controllerTemplate).additions.length,
  0,
  'repeat update does not duplicate wiring'
);
const newWired = addBoxFromTemplate(p, controllerTemplate);
assert.ok(
  p.installation.connections.some(
    link =>
      link.boxId === newWired.id &&
      link.fromComponent === newWired.components[1].id &&
      link.toComponent === newWired.components[3].id
  ),
  'new template instance remaps internal endpoints'
);
validateLibrary(lib);
const invalidLibrary = structuredClone(lib);
invalidLibrary.boxTemplates[0].components[0].snapshot.ports[0].type = 'invalid-port-type';
assert.throws(() => validateLibrary(invalidLibrary), /Invalid library/);
const legacy = structuredClone(original);
legacy.installation.boxes.forEach(b => {
  delete b.schematicLayoutVersion;
  b.components.forEach(c => delete c.schematic);
});
const oldPositions = legacy.installation.boxes.flatMap(b => b.components.map(c => [c.id, c.x, c.y]));
ensureInstallation(legacy);
const migrated = structuredClone(legacy);
ensureInstallation(legacy);
assert.deepEqual(legacy, migrated, 'legacy migration does not repeat or lose custom data');
assert.deepEqual(
  legacy.installation.boxes.flatMap(b => b.components.map(c => [c.id, c.x, c.y])),
  oldPositions
);
const obstacle = makeBox('Routing cache obstacle');
obstacle.id = 'cache-obstacle';
p.installation.boxes.push(obstacle);
p.scene.placements['box:cache-obstacle'] = { x: 20, y: 12, width: 0.25, height: 0.25, rotation: 0 };
const unobstructed = routeGeometry(p, spec);
assert.ok(unobstructed);
const longest = unobstructed.points
  .slice(1)
  .map((b, i) => {
    const a = unobstructed.points[i];
    return { a, b, distance: Math.hypot(a.x - b.x, a.y - b.y) };
  })
  .sort((a, b) => b.distance - a.distance)[0];
const blocker = p.scene.placements['box:cache-obstacle'];
blocker.x = (longest.a.x + longest.b.x) / 2;
blocker.y = (longest.a.y + longest.b.y) / 2;
const detour = routeGeometry(p, spec);
assert.ok(detour, 'a clear detour is available on the open site');
assert.notDeepEqual(
  detour.points,
  unobstructed.points,
  'moving an obstacle invalidates an affected cached route'
);
for (let i = 1; i < detour.points.length; i++)
  for (let step = 0; step <= 20; step++) {
    const a = detour.points[i - 1],
      b = detour.points[i],
      t = step / 20,
      x = a.x + (b.x - a.x) * t,
      y = a.y + (b.y - a.y) * t;
    assert.ok(
      !(x > blocker.x - 0.125 && x < blocker.x + 0.125 && y > blocker.y - 0.125 && y < blocker.y + 0.125),
      'routed path cannot enter the moved physical obstacle'
    );
  }
Object.assign(blocker, { x: 20, y: 12 });
assert.deepEqual(
  routeGeometry(p, spec),
  unobstructed,
  'moving the obstacle away restores the shorter clear route'
);
Object.assign(blocker, { x: 12, y: 8, width: 24, height: 16 });
assert.equal(
  routeGeometry(p, spec),
  null,
  'a blocked route cannot draw a false connection through equipment'
);
assert.ok(
  routeIssues(p, spec).issues.some(issue => /route|path/i.test(issue)),
  'an unsolved path must report its blocker'
);
console.log(
  'REPAIR MODEL OK: migration, identity, templates, explicit sync, disabled ports, routing invariants'
);
