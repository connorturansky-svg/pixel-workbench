// Physical installation planning. Definitions live in the device-local library;
// projects retain snapshots so later library edits never rewrite old plans.
export const PORT_TYPES = [
  'pixel_data',
  'pixel_output',
  'digital_input',
  'analogue_input',
  'relay_output',
  'ethernet',
  'dmx',
  'audio',
  'usb',
  'low_voltage_power',
  'low_voltage_ac_power',
  'mains_power',
  'gpio',
  'generic'
];
export const BUTTON_COLOURS = [
  ['Red', '#dc654f'],
  ['Amber', '#f1c75b'],
  ['Green', '#55a66f'],
  ['Blue', '#4d8fd1'],
  ['White', '#e8eeeb'],
  ['Black', '#29322f']
];
export function portTypeColour(type) {
  if (type === 'pixel_output' || type === 'pixel_data') return '#55c978';
  if (type === 'digital_input' || type === 'analogue_input' || type === 'gpio') return '#4da3ff';
  if (type === 'audio') return '#f1c84b';
  if (type === 'mains_power') return '#ef5a5a';
  if (type === 'dmx' || type === 'relay_output') return '#ffffff';
  return '#d8e1dc';
}
export const RESOURCE_LABELS = {
  pixels: 'Pixels',
  pixelOutputs: 'Pixel outputs',
  distroOutputs: 'Distro outputs',
  digitalInputs: 'Digital inputs',
  analogueInputs: 'Analogue inputs',
  relayOutputs: 'Relay outputs',
  dmxOutputs: 'DMX outputs',
  ethernetPorts: 'Ethernet ports',
  audioOutputs: 'Audio outputs',
  amplifierChannels: 'Amplifier channels',
  psuWatts: 'PSU watts',
  psuAmps: 'PSU amps'
};
const COMPONENT_SIZE_GUIDES = [
  {
    id: 'mean-well-lrs-100',
    kind: 'psu',
    manufacturer: 'Mean Well',
    model: 'LRS-100',
    physical: { widthMm: 129, depthMm: 97, heightMm: 30 }
  },
  {
    id: 'mean-well-lrs-150',
    kind: 'psu',
    manufacturer: 'Mean Well',
    model: 'LRS-150',
    physical: { widthMm: 159, depthMm: 97, heightMm: 30 }
  },
  {
    id: 'mean-well-lrs-200',
    kind: 'psu',
    manufacturer: 'Mean Well',
    model: 'LRS-200',
    physical: { widthMm: 215, depthMm: 115, heightMm: 30 }
  },
  {
    id: 'mean-well-lrs-350',
    kind: 'psu',
    manufacturer: 'Mean Well',
    model: 'LRS-350',
    physical: { widthMm: 215, depthMm: 115, heightMm: 30 }
  },
  {
    id: 'mean-well-lrs-600',
    kind: 'psu',
    manufacturer: 'Mean Well',
    model: 'LRS-600',
    physical: { widthMm: 225, depthMm: 124, heightMm: 41 }
  },
  {
    id: 'raspberry-pi-zero-2-w',
    kind: 'raspberry-pi',
    manufacturer: 'Raspberry Pi',
    model: 'Zero 2 W',
    physical: { widthMm: 65, depthMm: 30, heightMm: null }
  },
  {
    id: 'raspberry-pi-3-b-plus',
    kind: 'raspberry-pi',
    manufacturer: 'Raspberry Pi',
    model: '3 Model B+',
    physical: { widthMm: 85, depthMm: 56, heightMm: null }
  },
  {
    id: 'raspberry-pi-4-b',
    kind: 'raspberry-pi',
    manufacturer: 'Raspberry Pi',
    model: '4 Model B',
    physical: { widthMm: 85, depthMm: 56, heightMm: null }
  },
  {
    id: 'raspberry-pi-5',
    kind: 'raspberry-pi',
    manufacturer: 'Raspberry Pi',
    model: '5',
    physical: { widthMm: 85, depthMm: 56, heightMm: null }
  }
];
export function componentSizeGuides(def) {
  const text = componentSearch(def),
    kind =
      def.category === 'Power' && /\bpsu\b|power supply/.test(text)
        ? 'psu'
        : def.category === 'Computer' && /raspberry|\bpi\b/.test(text)
          ? 'raspberry-pi'
          : '';
  return COMPONENT_SIZE_GUIDES.filter(guide => guide.kind === kind);
}
export function componentPlacement(def) {
  if (['internal', 'field', 'both'].includes(def.placement)) return def.placement;
  return [
    'Controller',
    'Power',
    'Input board',
    'DMX',
    'Relay board',
    'Signal board',
    'Computer',
    'Audio',
    'Network'
  ].includes(def.category)
    ? 'internal'
    : 'field';
}
export function componentSearch(def) {
  return [def.name, def.category, def.manufacturer, def.model, def.notes, ...(def.tags || [])]
    .join(' ')
    .toLowerCase();
}
const copy = x => structuredClone(x),
  id = () => Math.random().toString(36).slice(2, 10);
const out = (type, n, prefix) =>
  Array.from({ length: n }, (_, i) => ({
    id: prefix + (i + 1),
    label: prefix.toUpperCase() + ' ' + (i + 1),
    type,
    direction: 'out'
  }));
const inp = (type, n, prefix) =>
  Array.from({ length: n }, (_, i) => ({
    id: prefix + (i + 1),
    label: prefix.toUpperCase() + ' ' + (i + 1),
    type,
    direction: 'in'
  }));
const port = (id, label, type, direction) => ({ id, label, type, direction });
function definition(name, category, icon, ports = [], resources = {}, notes = '', physical = null) {
  return {
    id: 'def-' + id(),
    version: 1,
    name,
    category,
    icon,
    color: '#4b8a76',
    manufacturer: '',
    model: '',
    notes,
    ports,
    resources,
    operatingLimits: {},
    physical: physical || { widthMm: null, depthMm: null, heightMm: null }
  };
}
const stepDownTransformer = () =>
  definition(
    'Step-down transformer',
    'Power',
    'ϟ',
    [...inp('mains_power', 1, 'primary'), ...out('low_voltage_ac_power', 1, 'secondary')],
    {},
    'Generic AC planning component. Confirm the primary and secondary voltages, VA rating, isolation, earthing and protection against the actual transformer before use.'
  );
const baldrickBoards = () => [
  definition(
    'Baldrick8',
    'Controller',
    '▦',
    [
      ...Array.from({ length: 8 }, (_, i) =>
        port('p' + (i + 1), 'Pixel output ' + (i + 1), 'pixel_output', 'out')
      ),
      ...Array.from({ length: 3 }, (_, i) =>
        port('in' + (i + 1), 'Turniput ' + (i + 1), 'digital_input', 'in')
      ),
      port('bank1', 'Left power jack', 'low_voltage_power', 'in'),
      port('bank2', 'Right power jack', 'low_voltage_power', 'in'),
      port('eth1', 'Ethernet', 'ethernet', 'bidirectional')
    ],
    { pixelOutputs: 8, pixels: 6000, digitalInputs: 3, ethernetPorts: 1 },
    '750 pixels per output is the current planning reference.'
  ),
  definition(
    'Baldrick17',
    'Controller',
    '▦',
    [
      ...Array.from({ length: 17 }, (_, i) =>
        port('p' + (i + 1), 'Pixel output ' + (i + 1), 'pixel_output', 'out')
      ),
      ...Array.from({ length: 3 }, (_, i) =>
        port('in' + (i + 1), 'Turniput ' + (i + 1), 'digital_input', 'in')
      ),
      ...Array.from({ length: 4 }, (_, i) =>
        port('bank' + (i + 1), '10AWG power bank ' + (i + 1), 'low_voltage_power', 'in')
      ),
      port('bank5', 'Port 17 power', 'low_voltage_power', 'in'),
      port('eth1', 'Ethernet 1', 'ethernet', 'bidirectional'),
      port('eth2', 'Ethernet 2', 'ethernet', 'bidirectional'),
      port('rtc', 'RTC battery', 'low_voltage_power', 'in')
    ],
    { pixelOutputs: 17, pixels: 12750, digitalInputs: 3, ethernetPorts: 2 },
    '750 pixels per output is the current planning reference.'
  ),
  definition(
    'BaldrickInput',
    'Input board',
    '◎',
    [
      port('in1', 'Turniput 1', 'digital_input', 'in'),
      port('power', 'Power jack', 'low_voltage_power', 'in'),
      port('eth1', 'Ethernet', 'ethernet', 'bidirectional')
    ],
    { digitalInputs: 1, ethernetPorts: 1 }
  ),
  definition(
    'BaldrickInput8',
    'Input board',
    '◎',
    [
      ...Array.from({ length: 8 }, (_, i) =>
        port('in' + (i + 1), 'Turniput ' + (i + 1), 'digital_input', 'in')
      ),
      port('p1', 'Pixel output 1', 'pixel_output', 'out'),
      port('p2', 'Pixel output 2', 'pixel_output', 'out'),
      port('pixel-power', 'Pixel power jack', 'low_voltage_power', 'in'),
      port('lamp-power', 'Lamp power', 'low_voltage_power', 'in'),
      port('eth1', 'Ethernet 1', 'ethernet', 'bidirectional'),
      port('eth2', 'Ethernet 2', 'ethernet', 'bidirectional'),
      port('rtc', 'RTC battery', 'low_voltage_power', 'in')
    ],
    { digitalInputs: 8, pixelOutputs: 2, pixels: 1500, ethernetPorts: 2 }
  ),
  definition(
    'BaldrickDMX',
    'DMX',
    '◇',
    [
      port('dmx-rj45', 'DMX output RJ45', 'dmx', 'out'),
      port('dmx-3pin', 'DMX output 3-pin XLR', 'dmx', 'out'),
      port('dmx-5pin', 'DMX output 5-pin XLR', 'dmx', 'out'),
      port('power-barrel', 'Barrel power input', 'low_voltage_power', 'in'),
      port('power-phoenix', 'Phoenix power input', 'low_voltage_power', 'in'),
      port('eth1', 'Ethernet', 'ethernet', 'bidirectional')
    ],
    { dmxOutputs: 3, ethernetPorts: 1 },
    'The three DMX connectors carry the same single universe. Use only one of the alternative power inputs.'
  ),
  definition(
    'BaldrickSwitchy',
    'Relay board',
    '⌁',
    [
      ...Array.from({ length: 4 }, (_, i) => port('r' + (i + 1), 'Relay ' + (i + 1), 'relay_output', 'out')),
      port('power-barrel', 'Barrel power input', 'low_voltage_power', 'in'),
      port('power-phoenix', 'Phoenix power input', 'low_voltage_power', 'in'),
      port('eth1', 'Ethernet', 'ethernet', 'bidirectional')
    ],
    { relayOutputs: 4, ethernetPorts: 1 },
    'The power inputs supply the board, not the switched devices.'
  ),
  definition(
    'BaldrickSignals',
    'Signal board',
    '◈',
    [
      port('power-barrel', 'Barrel power input', 'low_voltage_power', 'in'),
      port('power-phoenix', 'Phoenix power input', 'low_voltage_power', 'in'),
      port('eth1', 'Ethernet', 'ethernet', 'bidirectional'),
      port('rtc', 'RTC battery', 'low_voltage_power', 'in')
    ],
    { ethernetPorts: 1 }
  ),
  definition(
    'BaldrickBadge',
    'Controller',
    '▦',
    [port('p1', 'Pixel output', 'pixel_output', 'out'), port('usb-power', 'USB-C power', 'usb', 'in')],
    { pixelOutputs: 1, pixels: 95 }
  )
];
const defaultBoxSizes = () =>
  [
    ['Small', 30, 20],
    ['Medium', 40, 25],
    ['Large', 60, 40]
  ].map(([name, widthCm, depthCm]) => ({ id: 'box-size-' + id(), name, widthCm, depthCm }));
export function defaultLibrary() {
  const cable = (name, type, lengthM, pins, color) => ({
    id: 'cable-' + id(),
    version: 1,
    name,
    type,
    lengthM,
    pins,
    color,
    connector: '',
    notes: ''
  });
  const components = [
    ...baldrickBoards(),
    definition(
      '12 V PSU',
      'Power',
      'ϟ',
      out('low_voltage_power', 3, 'dc'),
      {},
      'Enter the actual PSU rating before using power capacity.'
    ),
    stepDownTransformer(),
    definition(
      'Fused distro',
      'Power',
      '▤',
      [...inp('low_voltage_power', 1, 'in'), ...out('low_voltage_power', 6, 'f')],
      { distroOutputs: 6 },
      'Set the actual output count on the placed component.'
    ),
    definition(
      'Raspberry Pi',
      'Computer',
      '▣',
      [...out('ethernet', 1, 'eth'), ...out('usb', 4, 'usb')],
      {},
      'Standard full-size Raspberry Pi board footprint. Confirm the case dimensions if one is fitted.',
      { widthMm: 85, depthMm: 56, heightMm: null }
    ),
    definition('USB sound card', 'Audio', '♫', [...inp('usb', 1, 'usb'), ...out('audio', 2, 'out')], {
      audioOutputs: 2
    }),
    definition('Audio amplifier', 'Audio', '◖', [...inp('audio', 2, 'in'), ...out('audio', 2, 'out')], {
      amplifierChannels: 2
    }),
    definition(
      'Network switch',
      'Network',
      '≋',
      [...inp('ethernet', 1, 'uplink'), ...out('ethernet', 4, 'eth')],
      { ethernetPorts: 5 }
    )
  ];
  const sensors = [
    'Push button',
    'Illuminated button',
    'Wireless button / remote',
    'Toggle switch',
    'Limit switch',
    'Reed switch',
    'Magnetic / Hall sensor',
    'Beam-break sensor',
    'PIR sensor',
    'Motion sensor',
    'IR sensor',
    'Proximity sensor',
    'Ultrasonic distance sensor',
    'Pressure mat',
    'FSR / force sensor',
    'Load cell / weight sensor',
    'RFID reader',
    'NFC reader',
    'Capacitive touch sensor',
    'Rotary encoder',
    'Potentiometer',
    'Light sensor',
    'Microphone / sound trigger'
  ];
  const effects = [
    'Relay',
    'Solenoid',
    'Electromagnet',
    'Maglock',
    'Servo',
    'DC motor',
    'Stepper motor',
    'Linear actuator',
    'Fan',
    'Speaker',
    'Projector',
    'Display',
    'DMX fixture',
    'Moving light',
    'Smoke / fog machine',
    'Haze machine',
    'Bubble machine',
    'Snow / effect machine'
  ];
  for (const name of sensors)
    components.push(
      definition(
        name,
        'Sensor',
        '○',
        out(
          ['Load cell / weight sensor', 'FSR / force sensor', 'Potentiometer', 'Light sensor'].includes(name)
            ? 'analogue_input'
            : 'digital_input',
          1,
          'signal'
        )
      )
    );
  for (const name of effects)
    components.push(
      definition(
        name,
        'Output / effect',
        '◆',
        inp(
          name.includes('DMX') || name === 'Moving light'
            ? 'dmx'
            : name === 'Speaker'
              ? 'audio'
              : 'relay_output',
          1,
          'control'
        )
      )
    );
  return {
    version: 5,
    cables: [
      cable('Grey 3m 4 pin EXT', 'Extension', 3, 4, '#899096'),
      cable('Blue 3m 3 pin EXT', 'Extension', 3, 3, '#5288c4'),
      cable('Yellow 5m 3 pin EXT', 'Extension', 5, 3, '#deb83f'),
      cable('Red 5m 4 pin EXT', 'Extension', 5, 4, '#cc5b58'),
      cable('Orange Dual Inject 4 pin', 'Dual injection', 1, 4, '#e1944d'),
      cable('Green 1m 4 pin EXT', 'Extension', 1, 4, '#539c6c')
    ],
    components,
    boxTemplates: [],
    boxSizes: defaultBoxSizes()
  };
}
export function ensureLibrary(lib) {
  lib.components ??= [];
  lib.boxTemplates ??= [];
  if ((lib.version || 1) < 2) {
    if (!lib.components.some(d => d.name === 'Step-down transformer'))
      lib.components.push(stepDownTransformer());
    lib.version = 2;
  }
  if ((lib.version || 1) < 3) {
    const input8 = baldrickBoards().find(d => d.name === 'BaldrickInput8');
    if (!lib.components.some(d => d.name === 'BaldrickInput8')) lib.components.push(input8);
    lib.version = 3;
  }
  if ((lib.version || 1) < 4) {
    lib.boxSizes = defaultBoxSizes();
    lib.version = 4;
  }
  if ((lib.version || 1) < 5) {
    for (const standard of baldrickBoards()) {
      const current = lib.components.find(d => d.name === standard.name);
      if (!current) {
        lib.components.push(standard);
        continue;
      }
      if (current.version === 1) {
        current.ports = standard.ports;
        current.resources = standard.resources;
        current.notes = standard.notes;
        current.version = 2;
      } else {
        for (const standardPort of standard.ports)
          if (!current.ports.some(existing => existing.id === standardPort.id))
            current.ports.push(standardPort);
        current.resources ??= {};
        for (const [key, value] of Object.entries(standard.resources))
          if (!(key in current.resources)) current.resources[key] = value;
        current.version++;
      }
    }
    lib.version = 5;
  }
  lib.boxSizes ??= defaultBoxSizes();
  for (const d of lib.components) d.physical ??= { widthMm: null, depthMm: null, heightMm: null };
  return lib;
}
export function ensureInstallation(p) {
  p.installation ??= {
    slack: { mode: 'off', value: 0 },
    routes: {},
    boxes: [],
    connections: [],
    fieldDevices: [],
    animate: false,
    autoRoute: true,
    showLabels: true,
    filters: { data: true, power: true, inject: true, other: true }
  };
  const a = p.installation;
  a.slack ??= { mode: 'off', value: 0 };
  a.routes ??= {};
  a.boxes ??= [];
  a.connections ??= [];
  a.fieldDevices ??= [];
  a.animate ??= false;
  a.autoRoute ??= true;
  a.showLabels ??= true;
  a.filters ??= { data: true, power: true, inject: true, other: true };
  for (const device of a.fieldDevices) {
    if (device.snapshot.name.toLowerCase().includes('button')) {
      device.buttonColour ??= device.snapshot.name.includes('Illuminated') ? 'Amber' : 'Red';
      device.buttonColor ??= BUTTON_COLOURS.find(([name]) => name === device.buttonColour)?.[1] || '#dc654f';
    }
  }
  for (const box of a.boxes) {
    if (box.kind === 'button')
      for (const button of box.components) {
        button.buttonColour ??= 'Amber';
        button.snapshot.color =
          BUTTON_COLOURS.find(([name]) => name === button.buttonColour)?.[1] || '#f1c75b';
      }
    syncInterfacePorts(box);
  }
  return p;
}
export function addFieldDevice(p, def, name = def.name) {
  ensureInstallation(p);
  const isButton = def.name.toLowerCase().includes('button'),
    buttonColour = def.name.includes('Illuminated') ? 'Amber' : 'Red';
  const device = {
    id: 'field-' + id(),
    name,
    definitionId: def.id,
    definitionVersion: def.version,
    snapshot: copy(def),
    ...(isButton
      ? { buttonColour, buttonColor: BUTTON_COLOURS.find(([name]) => name === buttonColour)[1] }
      : {})
  };
  p.installation.fieldDevices.push(device);
  return device;
}
export function makeBox(name = 'Controller box') {
  return {
    id: 'box-' + id(),
    name,
    description: '',
    templateRef: null,
    components: [],
    interfacePorts: [],
    width: 4,
    height: 2.5,
    physicalWidthMm: 400,
    physicalDepthMm: 250
  };
}
const BUTTON_SIZES = {
  small: { label: 'Small', mm: 30 },
  medium: { label: 'Medium', mm: 45 },
  large: { label: 'Large', mm: 60 }
};
const makeButtonInstance = number => {
  const size = BUTTON_SIZES.medium;
  return {
    id: 'part-' + id(),
    definitionId: 'button-box-button',
    definitionVersion: 1,
    snapshot: {
      id: 'button-box-button',
      version: 1,
      name: 'Push button',
      category: 'Sensor',
      icon: '○',
      color: '#f1c75b',
      manufacturer: '',
      model: '',
      notes: 'Custom button-box control.',
      ports: [port('signal', 'Button ' + number, 'digital_input', 'out')],
      resources: {},
      operatingLimits: {},
      physical: { widthMm: size.mm, depthMm: size.mm, heightMm: null }
    },
    sourceKey: '',
    subname: 'Button ' + number,
    buttonSize: 'medium',
    buttonColour: 'Amber',
    x: 10 + ((number - 1) % 3) * 30,
    y: 15 + Math.floor((number - 1) / 3) * 45,
    rotation: 0,
    stackLevel: 0,
    operatingLimits: {}
  };
};
export function resizeButtonBox(box, count) {
  count = Math.max(1, Math.min(5, Math.round(count)));
  while (box.components.length < count) box.components.push(makeButtonInstance(box.components.length + 1));
  if (box.components.length > count) box.components.splice(count);
  syncInterfacePorts(box);
  for (const interfacePort of box.interfacePorts) {
    interfacePort.visible = true;
    const component = box.components.find(item => item.id === interfacePort.componentId);
    if (component) interfacePort.label = component.snapshot.ports[0].label;
  }
  return box;
}
export function makeButtonBox(name = 'Button box', count = 1) {
  const box = makeBox(name);
  box.kind = 'button';
  box.description = 'Custom button box';
  box.width = 1.5;
  box.height = 0.75;
  box.physicalWidthMm = 200;
  box.physicalDepthMm = 100;
  return resizeButtonBox(box, count);
}
export function makeInstance(def, sourceKey = '') {
  return {
    id: 'part-' + id(),
    definitionId: def.id,
    definitionVersion: def.version,
    snapshot: copy(def),
    sourceKey,
    subname: '',
    x: 15,
    y: 15,
    rotation: 0,
    stackLevel: 0,
    operatingLimits: {}
  };
}
const interfaceEdge = (port, pixelIndex = 0) => {
  const type = port.type;
  return type === 'pixel_output' || type === 'pixel_data'
    ? pixelIndex % 2
      ? 'bottom'
      : 'right'
    : type.includes('power')
      ? 'bottom'
      : type.includes('input')
        ? 'left'
        : type === 'audio' || type === 'dmx' || type === 'ethernet' || type === 'usb'
          ? 'top'
          : port.direction === 'in'
            ? 'left'
            : 'right';
};
export function syncInterfacePorts(box) {
  box.interfacePorts ??= [];
  const existing = new Set(
    box.interfacePorts
      .filter(port => port.componentId && port.portId)
      .map(port => `${port.componentId}:${port.portId}`)
  );
  let pixelIndex = 0;
  for (const component of box.components)
    for (const port of component.snapshot.ports) {
      const pixelPort = port.type === 'pixel_output' || port.type === 'pixel_data',
        key = `${component.id}:${port.id}`;
      if (!existing.has(key)) {
        box.interfacePorts.push({
          id: 'interface-' + id(),
          label: port.label,
          edge: interfaceEdge(port, pixelIndex),
          visible: false,
          componentId: component.id,
          portId: port.id,
          generated: true
        });
        existing.add(key);
      }
      if (pixelPort) pixelIndex++;
    }
  const liveComponents = new Map(box.components.map(component => [component.id, component]));
  box.interfacePorts = box.interfacePorts.filter(port => {
    if (!port.generated) return true;
    return liveComponents
      .get(port.componentId)
      ?.snapshot.ports.some(componentPort => componentPort.id === port.portId);
  });
  return box.interfacePorts;
}
export function syncBoxStandards(box, lib) {
  let updated = 0;
  for (const component of box.components) {
    const definition = lib.components.find(item => item.id === component.definitionId);
    if (!definition || definition.version === component.definitionVersion) continue;
    component.snapshot = copy(definition);
    component.definitionVersion = definition.version;
    updated++;
  }
  if (!updated) return 0;
  syncInterfacePorts(box);
  const components = new Map(box.components.map(component => [component.id, component]));
  for (const port of box.interfacePorts) {
    if (!port.generated) continue;
    const componentPort = components
      .get(port.componentId)
      ?.snapshot.ports.find(componentPort => componentPort.id === port.portId);
    if (componentPort) port.label = componentPort.label;
  }
  return updated;
}
export function boxForSource(p, key) {
  return p.installation?.boxes?.find(b => b.components.some(c => c.sourceKey === key)) || null;
}
export function addInfrastructure(p, lib, key, boxId) {
  ensureInstallation(p);
  let box = p.installation.boxes.find(b => b.id === boxId) || p.installation.boxes[0];
  if (!box) {
    box = makeBox('Infrastructure box 1');
    p.installation.boxes.push(box);
  }
  const [type, id] = key.split(':'),
    item = { controller: p.controllers, psu: p.psus, distro: p.distros, aux: p.aux }[type]?.find(
      v => v.id === id
    );
  if (!item) return box;
  const name =
    type === 'controller'
      ? item.model === 'b17'
        ? 'Baldrick17'
        : 'Baldrick8'
      : type === 'psu'
        ? '12 V PSU'
        : type === 'distro'
          ? 'Fused distro'
          : item.model === 'switchy'
            ? 'BaldrickSwitchy'
            : item.model === 'input8'
              ? 'BaldrickInput8'
              : 'BaldrickInput';
  const def = lib.components.find(d => d.name === name);
  if (def && !box.components.some(c => c.sourceKey === key)) {
    const c = makeInstance(def, key);
    if (type === 'controller' && !c.snapshot.ports.some(v => v.id === 'bank1'))
      c.snapshot.ports.push(...inp('low_voltage_power', item.model === 'b17' ? 5 : 2, 'bank'));
    if (type === 'distro') {
      c.snapshot.ports = [
        ...c.snapshot.ports.filter(v => !/^f[0-9]+$/.test(v.id)),
        ...out('low_voltage_power', item.outputs, 'f')
      ];
      c.snapshot.resources.distroOutputs = item.outputs;
    }
    c.snapshot.color = { controller: '#b85b58', psu: '#d19a4c', distro: '#6588aa', aux: '#9b75bd' }[type];
    c.x = 12 + (box.components.length % 4) * 21;
    c.y = 12 + Math.floor(box.components.length / 4) * 25;
    box.components.push(c);
    syncInterfacePorts(box);
  }
  return box;
}
export function migrateInfrastructure(p, lib) {
  ensureInstallation(p);
  if (p.installation.infrastructureMigrated) return false;
  const linked = new Set(
    p.installation.boxes.flatMap(b => b.components.map(c => c.sourceKey).filter(Boolean))
  );
  const keys = [
    ...p.controllers.map(x => 'controller:' + x.id),
    ...p.psus.map(x => 'psu:' + x.id),
    ...p.distros.map(x => 'distro:' + x.id),
    ...p.aux.map(x => 'aux:' + x.id)
  ].filter(k => !linked.has(k));
  if (keys.length) {
    let box = p.installation.boxes.find(b => b.legacyUnassigned);
    if (!box) {
      box = makeBox('Unassigned infrastructure');
      box.legacyUnassigned = true;
      box.description =
        'Migrated from the earlier loose-hardware layout. Review this box and split it into physical enclosures when ready.';
      p.installation.boxes.push(box);
    }
    for (const key of keys) addInfrastructure(p, lib, key, box.id);
    const old = p.scene?.placements?.[keys[0]];
    if (old && p.scene?.placements)
      p.scene.placements['box:' + box.id] = { ...copy(old), width: 2.4, height: 1.7 };
  }
  p.installation.infrastructureMigrated = true;
  return !!keys.length;
}
export function exposedPorts(box) {
  if (box.interfacePorts?.length)
    return box.interfacePorts
      .filter(x => x.visible && x.componentId && x.portId)
      .map(x => {
        const component = box.components.find(c => c.id === x.componentId),
          source = component?.snapshot.ports.find(port => port.id === x.portId),
          same = box.interfacePorts.filter(
            port => port.visible && port.componentId && port.portId && port.edge === x.edge
          ),
          i = same.indexOf(x);
        return component && source
          ? {
              component,
              port: { ...source, label: x.label || source.label },
              edge: x.edge,
              t: (i + 1) / (same.length + 1)
            }
          : null;
      })
      .filter(Boolean);
  const entries = box.components.flatMap(c => c.snapshot.ports.map(port => ({ component: c, port })));
  const groups = { top: [], right: [], bottom: [], left: [] };
  let pixelIndex = 0;
  for (const entry of entries) {
    const edge = interfaceEdge(entry.port, pixelIndex);
    if (entry.port.type === 'pixel_output' || entry.port.type === 'pixel_data') pixelIndex++;
    groups[edge].push(entry);
  }
  return Object.entries(groups).flatMap(([edge, list]) =>
    list.map((entry, i) => ({ ...entry, edge, t: (i + 1) / (list.length + 1) }))
  );
}
export function perimeterAnchor(p, boxId, componentId, portId) {
  const box = p.installation?.boxes.find(b => b.id === boxId),
    v = p.scene?.placements?.['box:' + boxId],
    explicit = box?.interfacePorts?.find(port => port.componentId === componentId && port.portId === portId),
    same =
      explicit &&
      box.interfacePorts.filter(
        port =>
          port.edge === explicit.edge &&
          (!explicit.visible || (port.visible && port.componentId && port.portId))
      ),
    source = box?.components
      .find(component => component.id === componentId)
      ?.snapshot.ports.find(port => port.id === portId),
    node =
      box &&
      (exposedPorts(box).find(e => e.component.id === componentId && e.port.id === portId) ||
        (explicit &&
          source && {
            edge: explicit.edge,
            t: (same.indexOf(explicit) + 1) / (same.length + 1)
          }));
  if (!v || !node) return null;
  const { edge, t } = node,
    labelled = p.installation?.showLabels !== false,
    label = node.port?.label || source?.label || '',
    gap = labelled
      ? edge === 'left' || edge === 'right'
        ? Math.max(0.18, label.length * 0.045 + 0.14)
        : 0.2
      : 0.06;
  return {
    x:
      v.x +
      (edge === 'left' ? -v.width / 2 - gap : edge === 'right' ? v.width / 2 + gap : (t - 0.5) * v.width),
    y:
      v.y +
      (edge === 'top' ? -v.height / 2 - gap : edge === 'bottom' ? v.height / 2 + gap : (t - 0.5) * v.height)
  };
}
export function addBoxFromTemplate(p, t) {
  ensureInstallation(p);
  const box = makeBox(t.name);
  box.description = t.description;
  box.physicalWidthMm = t.physicalWidthMm || box.physicalWidthMm;
  box.physicalDepthMm = t.physicalDepthMm || box.physicalDepthMm;
  box.templateRef = { id: t.id, version: t.version };
  box.components = t.components.map(c => ({ ...copy(c), id: 'part-' + id(), sourceKey: '' }));
  if (Array.isArray(t.interfacePorts)) {
    const componentIds = new Map(t.components.map((c, i) => [c.id, box.components[i].id]));
    box.interfacePorts = copy(t.interfacePorts).map(x => ({
      ...x,
      id: 'interface-' + id(),
      componentId: componentIds.get(x.componentId) || ''
    }));
  }
  syncInterfacePorts(box);
  p.installation.boxes.push(box);
  return box;
}
export function saveBoxTemplate(lib, box) {
  let existing = lib.boxTemplates.find(t => t.id === box.templateRef?.id);
  if (existing) {
    existing.version++;
    existing.name = box.name;
    existing.description = box.description;
    existing.physicalWidthMm = box.physicalWidthMm;
    existing.physicalDepthMm = box.physicalDepthMm;
    existing.components = copy(box.components).map(c => ({ ...c, sourceKey: '' }));
    existing.interfacePorts = copy(box.interfacePorts || []);
    box.templateRef = { id: existing.id, version: existing.version };
    return existing;
  }
  const t = {
    id: 'template-' + id(),
    version: 1,
    name: box.name,
    description: box.description,
    physicalWidthMm: box.physicalWidthMm,
    physicalDepthMm: box.physicalDepthMm,
    components: copy(box.components).map(c => ({ ...c, sourceKey: '' })),
    interfacePorts: copy(box.interfacePorts || [])
  };
  lib.boxTemplates.push(t);
  box.templateRef = { id: t.id, version: t.version };
  return t;
}
export function updateBoxFromTemplate(box, t) {
  box.name = t.name;
  box.description = t.description;
  box.physicalWidthMm = t.physicalWidthMm || box.physicalWidthMm;
  box.physicalDepthMm = t.physicalDepthMm || box.physicalDepthMm;
  const oldComponents = t.components,
    components = copy(oldComponents).map(c => ({ ...c, id: 'part-' + id(), sourceKey: '' })),
    componentIds = new Map(oldComponents.map((c, i) => [c.id, components[i].id]));
  box.components = components;
  box.interfacePorts = copy(t.interfacePorts || []).map(x => ({
    ...x,
    id: 'interface-' + id(),
    componentId: componentIds.get(x.componentId) || ''
  }));
  syncInterfacePorts(box);
  box.templateRef = { id: t.id, version: t.version };
}
export function routeSpecs(p) {
  ensureInstallation(p);
  const routes = [];
  for (const c of p.controllers)
    c.bankPsus.forEach((ps, i) =>
      routes.push({
        id: `bank:${c.id}:${i}`,
        from: `psu:${ps}`,
        to: `controller:${c.id}`,
        kind: 'power',
        name: `${c.name} bank ${i + 1}`
      })
    );
  for (const d of p.distros)
    routes.push({
      id: `supply:${d.id}`,
      from: `psu:${d.psu}`,
      to: `distro:${d.id}`,
      kind: 'power',
      name: `${d.name} supply`
    });
  for (const ch of p.chains)
    ch.segments.forEach((s, i) => {
      if (i || ch.controller)
        routes.push({
          id: `data:${s.id}`,
          from: i ? `segment:${ch.segments[i - 1].id}` : `controller:${ch.controller}`,
          to: `segment:${s.id}`,
          kind: 'data',
          name: `${ch.name} · data ${i + 1}`,
          port: i ? null : `P${ch.port}`
        });
      if (s.inject)
        routes.push({
          id: `inject:${s.id}`,
          from: `distro:${s.distro}`,
          to: `segment:${s.id}`,
          kind: 'inject',
          name: `${ch.name} · injection ${i + 1}`,
          port: `F${s.distroPort || '?'}`
        });
    });
  for (const x of p.installation.connections)
    if (x.fromKey && x.toKey) {
      routes.push({
        id: `custom:${x.id}`,
        from: x.fromKey,
        to: x.toKey,
        kind: x.kind || 'other',
        name: x.name || 'Custom connection',
        fromPort: x.fromPort,
        toPort: x.toPort,
        connection: x
      });
    }
  return routes
    .map(spec => {
      for (const end of ['from', 'to']) {
        const key = spec[end],
          box = boxForSource(p, key);
        if (!box) continue;
        const part = box.components.find(c => c.sourceKey === key);
        spec[end] = 'box:' + box.id;
        spec[end + 'Component'] = part.id;
        if (end === 'from') {
          if (spec.id.startsWith('data:')) spec.fromPort = 'p' + String(spec.port || 'P1').slice(1);
          else if (spec.id.startsWith('inject:')) spec.fromPort = 'f' + String(spec.port || 'F1').slice(1);
          else if (key.startsWith('psu:')) {
            let terminal = 1;
            if (spec.id.startsWith('bank:')) {
              const bits = spec.id.split(':'),
                ctrl = p.controllers.find(c => c.id === bits[1]);
              terminal = ctrl?.bankPsuPorts[+bits[2]] || 1;
            } else if (spec.id.startsWith('supply:'))
              terminal = p.distros.find(d => d.id === spec.id.slice(7))?.psuPort || 1;
            spec.fromPort = 'dc' + terminal;
          }
        } else if (spec.id.startsWith('supply:')) spec.toPort = 'in1';
        else if (spec.id.startsWith('bank:'))
          spec.toPort =
            part.snapshot.name === 'BaldrickInput8'
              ? 'pixel-power'
              : 'bank' + (+spec.id.split(':').at(-1) + 1);
      }
      return spec;
    })
    .filter(spec => spec.from !== spec.to || spec.from.startsWith('segment:'));
}
export function routeRecord(p, id) {
  ensureInstallation(p);
  return (p.installation.routes[id] ??= {
    points: [],
    startOffset: { x: 0, y: 0 },
    endOffset: { x: 0, y: 0 },
    cableRef: null,
    cableSnapshot: null,
    physicalM: null,
    slackOverride: null
  });
}
export function boxPortOffset(part, portId, width, height) {
  const port = part.snapshot.ports.find(v => v.id === portId);
  if (!port) return null;
  const same = part.snapshot.ports.filter(v => v.direction === port.direction),
    index = same.findIndex(v => v.id === portId);
  return {
    x: (part.x / 100 - 0.5) * width + (port.direction === 'in' ? -0.12 : 0.12),
    y: (part.y / 100 - 0.5) * height + (index - (same.length - 1) / 2) * 0.035
  };
}
function nearestPlacementEdge(v, target) {
  const angle = (-(v.rotation || 0) * Math.PI) / 180,
    cos = Math.cos(angle),
    sin = Math.sin(angle),
    dx = target.x - v.x,
    dy = target.y - v.y,
    local = { x: dx * cos - dy * sin, y: dx * sin + dy * cos },
    half = { x: v.width / 2, y: v.height / 2 };
  let x = Math.max(-half.x, Math.min(half.x, local.x)),
    y = Math.max(-half.y, Math.min(half.y, local.y));
  if (Math.abs(local.x) < half.x && Math.abs(local.y) < half.y) {
    const gapX = half.x - Math.abs(local.x),
      gapY = half.y - Math.abs(local.y);
    if (gapX < gapY) x = (local.x < 0 ? -1 : 1) * half.x;
    else y = (local.y < 0 ? -1 : 1) * half.y;
  }
  const back = -angle;
  return {
    x: v.x + x * Math.cos(back) - y * Math.sin(back),
    y: v.y + x * Math.sin(back) + y * Math.cos(back)
  };
}
function nearestFieldVisualEdge(p, key, v, target) {
  const device = p.installation?.fieldDevices.find(item => 'field:' + item.id === key),
    name = device?.snapshot.name.toLowerCase() || '';
  if (!name.includes('button')) return nearestPlacementEdge(v, target);
  const size = Math.min(v.width, v.height),
    visible = {
      ...v,
      x: v.x,
      y: v.y - size * 0.01,
      width: size * 0.56,
      height: size * 0.62
    };
  return nearestPlacementEdge(visible, target);
}
export function routeAnchor(p, spec, end) {
  const key = end === 'start' ? spec.from : spec.to,
    v = p.scene?.placements?.[key];
  if (!v) return null;
  let x = v.x,
    y = v.y;
  if (key.startsWith('box:')) {
    const component =
        end === 'start'
          ? spec.fromComponent || spec.connection?.fromComponent
          : spec.toComponent || spec.connection?.toComponent,
      port = end === 'start' ? spec.fromPort : spec.toPort,
      node = component && port && perimeterAnchor(p, key.slice(4), component, port);
    if (node) {
      x = node.x;
      y = node.y;
    } else x += end === 'start' ? v.width / 2 : -v.width / 2;
  } else if (key.startsWith('field:') || key.startsWith('segment:')) {
    const otherKey = end === 'start' ? spec.to : spec.from,
      otherEnd = end === 'start' ? 'end' : 'start',
      otherPlacement = p.scene?.placements?.[otherKey];
    let target = otherPlacement;
    if (otherKey?.startsWith('box:')) {
      const component =
          otherEnd === 'start'
            ? spec.fromComponent || spec.connection?.fromComponent
            : spec.toComponent || spec.connection?.toComponent,
        port = otherEnd === 'start' ? spec.fromPort : spec.toPort;
      target = (component && port && perimeterAnchor(p, otherKey.slice(4), component, port)) || target;
    }
    if (target)
      ({ x, y } = key.startsWith('field:')
        ? nearestFieldVisualEdge(p, key, v, target)
        : nearestPlacementEdge(v, target));
    else x += end === 'start' ? v.width / 2 : -v.width / 2;
  } else if (end === 'start') x += v.width / 2;
  else x -= v.width / 2;
  if (key.startsWith('controller:') && spec.id.startsWith('data:') && end === 'start') {
    const m = /P(\d+)/.exec(spec.port || '');
    if (m) y += ((+m[1] - 4.5) / 9) * v.height;
  }
  if (key.startsWith('controller:') && spec.id.startsWith('bank:') && end === 'end') {
    const bank = +spec.id.split(':').at(-1);
    y += (bank - 0.5) * v.height * 0.55;
  }
  return { x, y };
}
function placementLabel(p, key) {
  const [type, id] = key.split(':');
  if (type === 'field') return p.installation?.fieldDevices.find(item => item.id === id)?.snapshot.name || '';
  if (type === 'segment') {
    for (const chain of p.chains)
      for (const segment of chain.segments)
        if (segment.id === id)
          return (segment.propId && p.props?.find(prop => prop.id === segment.propId)?.name) || chain.name;
    return '';
  }
  const collection = { controller: p.controllers, psu: p.psus, distro: p.distros, aux: p.aux }[type];
  return collection?.find(item => item.id === id)?.name || '';
}
function automaticRoute(p, spec, a, b) {
  const width = p.scene?.width || 10,
    depth = p.scene?.depth || 10,
    step = Math.max(0.2, Math.max(width, depth) / 80),
    cols = Math.ceil(width / step) + 1,
    rows = Math.ceil(depth / step) + 1,
    from = spec.from,
    to = spec.to,
    hidden = key => /^(controller|psu|distro|aux):/.test(key) && boxForSource(p, key),
    labels = p.installation?.showLabels !== false,
    obstacles = Object.entries(p.scene?.placements || {})
      .filter(([key]) => !hidden(key))
      .flatMap(([placementKey, v]) => {
        const endpoint = placementKey === from || placementKey === to;
        if (endpoint && !placementKey.startsWith('box:')) return [];
        const result = [
          {
            l: v.x - v.width / 2 - 0.12,
            r: v.x + v.width / 2 + 0.12,
            t: v.y - v.height / 2 - 0.12,
            b: v.y + v.height / 2 + 0.12
          }
        ];
        if (!labels || endpoint) return result;
        if (placementKey.startsWith('box:')) {
          const box = p.installation.boxes.find(item => 'box:' + item.id === placementKey);
          for (const { component, port, edge } of box ? exposedPorts(box) : []) {
            const point = perimeterAnchor(p, box.id, component.id, port.id);
            if (!point) continue;
            const halfW =
                edge === 'top' || edge === 'bottom' ? Math.max(0.12, port.label.length * 0.0225 + 0.07) : 0,
              halfH = edge === 'left' || edge === 'right' ? 0.06 : 0,
              innerX = edge === 'left' ? v.x - v.width / 2 : edge === 'right' ? v.x + v.width / 2 : point.x,
              innerY = edge === 'top' ? v.y - v.height / 2 : edge === 'bottom' ? v.y + v.height / 2 : point.y;
            result.push({
              l: Math.min(point.x, innerX) - halfW - 0.06,
              r: Math.max(point.x, innerX) + halfW + 0.06,
              t: Math.min(point.y, innerY) - halfH - 0.06,
              b: Math.max(point.y, innerY) + halfH + 0.06
            });
          }
        } else {
          const nameLength = Math.min(30, placementLabel(p, placementKey).length),
            detail = placementKey.startsWith('field:') || placementKey.startsWith('segment:');
          result.push({
            l: v.x - nameLength * 0.038 - 0.06,
            r: v.x + nameLength * 0.038 + 0.06,
            t: v.y + v.height / 2 + 0.02,
            b: v.y + v.height / 2 + (detail ? 0.36 : 0.22)
          });
        }
        return result;
      }),
    blocked = (x, y) => obstacles.some(o => x > o.l && x < o.r && y > o.t && y < o.b),
    cell = q => ({
      x: Math.max(0, Math.min(cols - 1, Math.round(q.x / step))),
      y: Math.max(0, Math.min(rows - 1, Math.round(q.y / step)))
    }),
    start = cell(a),
    goal = cell(b),
    key = q => q.x + ',' + q.y,
    open = [start],
    came = new Map(),
    cost = new Map([[key(start), 0]]),
    score = new Map([[key(start), Math.hypot(goal.x - start.x, goal.y - start.y)]]),
    dirs = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1]
    ];
  let found = null;
  while (open.length) {
    open.sort((u, v) => (score.get(key(v)) ?? Infinity) - (score.get(key(u)) ?? Infinity));
    const cur = open.pop(),
      ck = key(cur);
    if (cur.x === goal.x && cur.y === goal.y) {
      found = cur;
      break;
    }
    for (const [dx, dy] of dirs) {
      const next = { x: cur.x + dx, y: cur.y + dy };
      if (
        next.x < 0 ||
        next.y < 0 ||
        next.x >= cols ||
        next.y >= rows ||
        blocked(next.x * step, next.y * step)
      )
        continue;
      if (
        dx &&
        dy &&
        (blocked((cur.x + dx) * step, cur.y * step) || blocked(cur.x * step, (cur.y + dy) * step))
      )
        continue;
      const prev = came.get(ck),
        turn = prev && (Math.sign(cur.x - prev.x) !== dx || Math.sign(cur.y - prev.y) !== dy) ? 0.75 : 0,
        nk = key(next),
        nextCost = cost.get(ck) + Math.hypot(dx, dy) + turn;
      if (nextCost >= (cost.get(nk) ?? Infinity)) continue;
      came.set(nk, cur);
      cost.set(nk, nextCost);
      score.set(nk, nextCost + Math.hypot(goal.x - next.x, goal.y - next.y));
      if (!open.some(q => q.x === next.x && q.y === next.y)) open.push(next);
    }
  }
  if (!found) return [];
  const result = [];
  for (let q = found; q.x !== start.x || q.y !== start.y; q = came.get(key(q)))
    result.push({ x: +(q.x * step).toFixed(3), y: +(q.y * step).toFixed(3) });
  result.reverse();
  const simple = [];
  for (const q of result) {
    const n = simple.length;
    if (n > 1) {
      const u = simple[n - 2],
        v = simple[n - 1],
        dx1 = Math.sign(v.x - u.x),
        dy1 = Math.sign(v.y - u.y),
        dx2 = Math.sign(q.x - v.x),
        dy2 = Math.sign(q.y - v.y);
      if (dx1 === dx2 && dy1 === dy2) {
        simple[n - 1] = q;
        continue;
      }
    }
    simple.push(q);
  }
  return simple.slice(0, -1);
}
export function routeGeometry(p, spec) {
  const a = routeAnchor(p, spec, 'start'),
    b = routeAnchor(p, spec, 'end'),
    r = routeRecord(p, spec.id);
  if (!a || !b) return null;
  const start = { x: a.x + (r.startOffset?.x || 0), y: a.y + (r.startOffset?.y || 0) },
    end = { x: b.x + (r.endOffset?.x || 0), y: b.y + (r.endOffset?.y || 0) },
    middle =
      r.points.length || p.installation.autoRoute === false ? r.points : automaticRoute(p, spec, start, end),
    pts = [start, ...middle, end];
  let length = 0;
  for (let i = 1; i < pts.length; i++) length += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  const slack = r.slackOverride || p.installation.slack,
    allowance =
      slack.mode === 'percent' ? (length * slack.value) / 100 : slack.mode === 'fixed' ? slack.value : 0,
    required = length + allowance,
    physical = r.cableSnapshot?.lengthM ?? r.physicalM,
    spare = physical == null ? null : physical - required;
  return {
    points: pts,
    routeM: length,
    allowanceM: allowance,
    requiredM: required,
    physicalM: physical,
    spareM: spare,
    shortByM: spare != null && spare < 0 ? -spare : 0
  };
}
export function assignCable(p, routeId, standard) {
  const r = routeRecord(p, routeId);
  r.cableRef = standard ? { id: standard.id, version: standard.version } : null;
  r.cableSnapshot = standard ? copy(standard) : null;
}
export function connectionWarnings(p, x) {
  const box = p.installation.boxes.find(b => b.id === x.boxId),
    a = box?.components.find(c => c.id === x.fromComponent),
    b = box?.components.find(c => c.id === x.toComponent),
    ap = a?.snapshot.ports.find(v => v.id === x.fromPort),
    bp = b?.snapshot.ports.find(v => v.id === x.toPort);
  const result = [];
  if (x.fromKey?.startsWith('field:') && x.toKey?.startsWith('box:')) {
    const field = p.installation.fieldDevices.find(d => 'field:' + d.id === x.fromKey),
      source = field?.snapshot.ports.find(v => v.id === x.fromPort) || field?.snapshot.ports[0];
    if (!source || !bp) return ['Port no longer exists'];
    if (source.direction === 'in' || bp.direction === 'out')
      result.push('Expected field output to box input');
    if (source.type !== bp.type && source.type !== 'generic' && bp.type !== 'generic')
      result.push(
        'Expected ' + bp.type.replaceAll('_', ' ') + '; connected to ' + source.type.replaceAll('_', ' ')
      );
    return result;
  }
  if (x.toKey) {
    if (!ap) return ['Source port no longer exists'];
    if (ap.direction === 'in') result.push('External route starts at an input port');
    if (x.toKey.startsWith('field:')) {
      const field = p.installation.fieldDevices.find(d => 'field:' + d.id === x.toKey),
        target = field?.snapshot.ports[0];
      if (target && ap.type !== target.type && ap.type !== 'generic' && target.type !== 'generic')
        result.push(
          'Expected ' + target.type.replaceAll('_', ' ') + '; connected to ' + ap.type.replaceAll('_', ' ')
        );
    }
    if (
      x.toKey.startsWith('segment:') &&
      !['pixel_output', 'pixel_data', 'low_voltage_power', 'generic'].includes(ap.type)
    )
      result.push(`Pixel group expects pixel data or low-voltage power; got ${ap.type.replaceAll('_', ' ')}`);
    return result;
  }
  if (!ap || !bp) return ['Port no longer exists'];
  if (ap.direction !== 'out' || bp.direction !== 'in')
    result.push(`Expected output → input; got ${ap.direction} → ${bp.direction}`);
  if (ap.type !== bp.type && ap.type !== 'generic' && bp.type !== 'generic')
    result.push(`Expected ${bp.type.replaceAll('_', ' ')}; connected to ${ap.type.replaceAll('_', ' ')}`);
  return result;
}
export function routeIssues(p, spec) {
  const geometry = routeGeometry(p, spec),
    issues = spec.connection ? connectionWarnings(p, spec.connection) : [];
  if (geometry?.shortByM > 0) issues.unshift('Cable is ' + geometry.shortByM.toFixed(2) + ' m too short');
  return {
    state: geometry?.physicalM == null ? 'unknown' : geometry.shortByM > 0 ? 'short' : 'valid',
    issues,
    geometry
  };
}
export function deleteRoute(p, routeId) {
  ensureInstallation(p);
  if (routeId.startsWith('custom:'))
    p.installation.connections = p.installation.connections.filter(x => x.id !== routeId.slice(7));
  else if (routeId.startsWith('inject:')) {
    const seg = p.chains.flatMap(ch => ch.segments).find(s => s.id === routeId.slice(7));
    if (seg) seg.inject = false;
  } else return false;
  delete p.installation.routes[routeId];
  return true;
}
function addResource(target, key, n) {
  target[key] = (target[key] || 0) + n;
}
function psuLoad(p, id) {
  let watts = 0;
  for (const ch of p.chains) {
    const c = p.controllers.find(v => v.id === ch.controller);
    if (!c) continue;
    const bank = Math.min(
      c.bankPsus.length - 1,
      Math.floor((ch.port - 1) / Math.ceil((c.model === 'b17' ? 17 : 8) / c.bankPsus.length))
    );
    let source = c.bankPsus[bank];
    for (const seg of ch.segments) {
      if (seg.inject) source = seg.psu;
      if (source === id) watts += (seg.count * seg.watts * p.brightness) / 100;
    }
  }
  for (const aux of p.aux) if (aux.psu === id) watts += aux.watts;
  return watts;
}
function distroUse(p, id) {
  return p.chains.reduce((n, ch) => n + ch.segments.filter(s => s.inject && s.distro === id).length, 0);
}
export function boxCapacity(p, box) {
  const capacity = {},
    reference = {},
    used = {};
  const perPart = new Map();
  for (const item of box.components) {
    const def = item.snapshot,
      usage = {};
    perPart.set(item.id, usage);
    for (const [key, n] of Object.entries(def.resources || {})) {
      if (typeof n !== 'number') continue;
      const limit = item.operatingLimits?.[key] ?? def.operatingLimits?.[key] ?? n;
      addResource(capacity, key, limit);
      addResource(reference, key, n);
    }
    if (item.sourceKey?.startsWith('controller:')) {
      const id = item.sourceKey.slice(11),
        chains = p.chains.filter(ch => ch.controller === id),
        ctrl = p.controllers.find(c => c.id === id);
      usage.pixelOutputs = chains.length;
      usage.pixels = chains.reduce((v, ch) => v + ch.segments.reduce((a, s) => a + s.count, 0), 0);
      usage.digitalInputs = ctrl?.io.filter(Boolean).length || 0;
    } else if (item.sourceKey?.startsWith('psu:')) {
      const id = item.sourceKey.slice(4),
        ps = p.psus.find(v => v.id === id);
      if (ps) {
        if (!('psuWatts' in (def.resources || {}))) {
          addResource(capacity, 'psuWatts', item.operatingLimits?.psuWatts ?? ps.watts);
          addResource(reference, 'psuWatts', ps.watts);
        }
        if (!('psuAmps' in (def.resources || {}))) {
          addResource(
            capacity,
            'psuAmps',
            item.operatingLimits?.psuAmps ?? (item.operatingLimits?.psuWatts ?? ps.watts) / ps.voltage
          );
          addResource(reference, 'psuAmps', ps.watts / ps.voltage);
        }
        usage.psuWatts = psuLoad(p, id);
        usage.psuAmps = usage.psuWatts / ps.voltage;
      }
    } else if (item.sourceKey?.startsWith('distro:')) {
      const id = item.sourceKey.slice(7),
        d = p.distros.find(v => v.id === id);
      if (d) {
        if (!('distroOutputs' in (def.resources || {}))) {
          addResource(capacity, 'distroOutputs', item.operatingLimits?.distroOutputs ?? d.outputs);
          addResource(reference, 'distroOutputs', d.outputs);
        }
        usage.distroOutputs = distroUse(p, id);
      }
    }
  }
  const generic = new Map(),
    seenPorts = new Set();
  const track = (item, port) => {
    if (!item || !port) return;
    const resource =
      port.resource ||
      {
        pixel_output: 'pixelOutputs',
        digital_input: 'digitalInputs',
        analogue_input: 'analogueInputs',
        relay_output: 'relayOutputs',
        dmx: 'dmxOutputs',
        ethernet: 'ethernetPorts',
        audio: 'audioOutputs'
      }[port.type];
    if (!resource || !item.snapshot.resources?.[resource]) return;
    const key = item.id + ':' + port.id;
    if (seenPorts.has(key)) return;
    seenPorts.add(key);
    const counts = generic.get(item.id) || {};
    addResource(counts, resource, 1);
    generic.set(item.id, counts);
  };
  for (const link of p.installation.connections.filter(v => v.boxId === box.id)) {
    const from = box.components.find(c => c.id === link.fromComponent),
      to = box.components.find(c => c.id === link.toComponent);
    const fromPort = from?.snapshot.ports.find(v => v.id === link.fromPort),
      toPort = to?.snapshot.ports.find(v => v.id === link.toPort);
    if (fromPort?.direction === 'out' || fromPort?.direction === 'bidirectional') track(from, fromPort);
    if (toPort?.direction === 'in' || toPort?.direction === 'bidirectional') track(to, toPort);
    if (link.toKey?.startsWith('segment:') && fromPort?.type === 'pixel_output' && from) {
      const segment = p.chains.flatMap(ch => ch.segments).find(s => 'segment:' + s.id === link.toKey);
      if (segment) {
        const counts = generic.get(from.id) || {};
        addResource(counts, 'pixels', segment.count);
        generic.set(from.id, counts);
      }
    }
  }
  for (const item of box.components) {
    const bound = perPart.get(item.id),
      links = generic.get(item.id) || {};
    for (const key of new Set([...Object.keys(bound), ...Object.keys(links)]))
      addResource(used, key, Math.max(bound[key] || 0, links[key] || 0));
  }
  return { capacity, reference, used };
}
export function projectCapacity(p) {
  ensureInstallation(p);
  const total = { capacity: {}, reference: {}, used: {} };
  const linked = new Set();
  for (const box of p.installation.boxes) {
    const v = boxCapacity(p, box);
    for (const k of ['capacity', 'reference', 'used'])
      for (const [key, n] of Object.entries(v[k])) addResource(total[k], key, n);
    for (const c of box.components) if (c.sourceKey) linked.add(c.sourceKey);
  }
  for (const c of p.controllers)
    if (!linked.has('controller:' + c.id)) {
      const count = c.model === 'b17' ? 17 : 8;
      addResource(total.capacity, 'pixelOutputs', count);
      addResource(total.reference, 'pixelOutputs', count);
      addResource(total.capacity, 'pixels', count * 750);
      addResource(total.reference, 'pixels', count * 750);
      addResource(total.capacity, 'digitalInputs', 3);
      addResource(total.reference, 'digitalInputs', 3);
      const chains = p.chains.filter(ch => ch.controller === c.id);
      addResource(total.used, 'pixelOutputs', chains.length);
      addResource(
        total.used,
        'pixels',
        chains.reduce((v, ch) => v + ch.segments.reduce((a, s) => a + s.count, 0), 0)
      );
      addResource(total.used, 'digitalInputs', c.io.filter(Boolean).length);
    }
  for (const ps of p.psus)
    if (!linked.has('psu:' + ps.id)) {
      addResource(total.capacity, 'psuWatts', ps.watts);
      addResource(total.reference, 'psuWatts', ps.watts);
      addResource(total.used, 'psuWatts', psuLoad(p, ps.id));
      addResource(total.capacity, 'psuAmps', ps.watts / ps.voltage);
      addResource(total.reference, 'psuAmps', ps.watts / ps.voltage);
      addResource(total.used, 'psuAmps', psuLoad(p, ps.id) / ps.voltage);
    }
  for (const d of p.distros)
    if (!linked.has('distro:' + d.id)) {
      addResource(total.capacity, 'distroOutputs', d.outputs);
      addResource(total.reference, 'distroOutputs', d.outputs);
      addResource(total.used, 'distroOutputs', distroUse(p, d.id));
    }
  return total;
}
export function billOfMaterials(p, boxId = null) {
  ensureInstallation(p);
  const rows = new Map(),
    add = (category, name, qty = 1, unit = 'pcs') => {
      const key = category + '|' + name + '|' + unit,
        v = rows.get(key) || { category, name, quantity: 0, unit };
      v.quantity += qty;
      rows.set(key, v);
    };
  const boxes = boxId ? p.installation.boxes.filter(b => b.id === boxId) : p.installation.boxes,
    linked = new Set();
  for (const b of boxes) {
    add(b.kind === 'button' ? 'Button boxes' : 'Controller boxes', b.name);
    for (const c of b.components) {
      add(
        'Hardware',
        b.kind === 'button'
          ? `${c.buttonColour || 'Amber'} ${BUTTON_SIZES[c.buttonSize]?.label || 'Medium'} ${c.snapshot.name.toLowerCase()}`
          : c.snapshot.name
      );
      if (c.sourceKey) linked.add(c.sourceKey);
    }
  }
  if (boxId) {
    for (const spec of routeSpecs(p).filter(s => s.from === 'box:' + boxId || s.to === 'box:' + boxId)) {
      const rec = p.installation.routes[spec.id];
      if (rec?.cableSnapshot) add('Cables', rec.cableSnapshot.name);
      else if (rec?.physicalM != null) add('Cables', 'Custom cable ' + rec.physicalM + ' m');
    }
  }
  if (!boxId) {
    for (const field of p.installation.fieldDevices || [])
      add(
        'Field devices',
        field.snapshot.name.toLowerCase().includes('button')
          ? `${field.buttonColour} ${field.snapshot.name.toLowerCase()}`
          : field.snapshot.name
      );
    for (const c of p.controllers)
      if (!linked.has('controller:' + c.id)) add('Hardware', c.model === 'b17' ? 'Baldrick17' : 'Baldrick8');
    for (const ps of p.psus) if (!linked.has('psu:' + ps.id)) add('Power', ps.name);
    for (const d of p.distros) if (!linked.has('distro:' + d.id)) add('Power', d.name);
    for (const a of p.aux) if (!linked.has('aux:' + a.id)) add('Hardware', a.name);
    for (const ch of p.chains)
      for (const s of ch.segments)
        add('Pixels / lights', s.kind === 'flood' ? `${s.watts} W flood` : s.kind + ' pixel', s.count);
    for (const spec of routeSpecs(p)) {
      const rec = p.installation.routes[spec.id];
      if (rec?.cableSnapshot) add('Cables', rec.cableSnapshot.name);
      else if (rec?.physicalM != null) add('Cables', 'Custom cable ' + rec.physicalM + ' m');
    }
  }
  return [...rows.values()].sort(
    (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
  );
}
export function validateInstallation(p) {
  if (!p.installation) return;
  const x = p.installation,
    fail = () => {
      throw Error('Invalid installation planning data.');
    },
    num = (v, a, b) => typeof v === 'number' && Number.isFinite(v) && v >= a && v <= b,
    key = v => typeof v === 'string' && /^[\w:-]{1,200}$/.test(v),
    txt = v => typeof v === 'string' && v.length <= 200;
  if (
    !x.slack ||
    !['off', 'percent', 'fixed'].includes(x.slack.mode) ||
    !num(x.slack.value, 0, 1000) ||
    !x.routes ||
    Array.isArray(x.routes) ||
    !Array.isArray(x.boxes) ||
    x.boxes.length > 200 ||
    !Array.isArray(x.connections) ||
    x.connections.length > 2000 ||
    !Array.isArray(x.fieldDevices || []) ||
    (x.fieldDevices || []).length > 2000 ||
    typeof x.animate !== 'boolean'
  )
    fail();
  for (const [k, r] of Object.entries(x.routes)) {
    if (
      !key(k) ||
      !Array.isArray(r.points) ||
      r.points.length > 100 ||
      r.points.some(q => !num(q.x, -100, 200) || !num(q.y, -100, 200)) ||
      !r.startOffset ||
      !r.endOffset ||
      [r.startOffset, r.endOffset].some(q => !num(q.x, -100, 100) || !num(q.y, -100, 100)) ||
      (r.physicalM != null && !num(r.physicalM, 0, 10000))
    )
      fail();
    if (
      r.cableSnapshot &&
      (!txt(r.cableSnapshot.name) ||
        !num(r.cableSnapshot.lengthM, 0, 10000) ||
        !/^#[0-9a-f]{6}$/i.test(r.cableSnapshot.color))
    )
      fail();
  }
  for (const b of x.boxes) {
    if (
      !key(b.id) ||
      !txt(b.name) ||
      !txt(b.description) ||
      !Array.isArray(b.components) ||
      b.components.length > 200 ||
      !num(b.width, 0.1, 50) ||
      !num(b.height, 0.1, 50) ||
      (b.physicalWidthMm != null && !num(b.physicalWidthMm, 20, 10000)) ||
      (b.physicalDepthMm != null && !num(b.physicalDepthMm, 20, 10000))
    )
      fail();
    if (
      b.interfacePorts != null &&
      (!Array.isArray(b.interfacePorts) ||
        b.interfacePorts.length > 200 ||
        b.interfacePorts.some(
          port =>
            !key(port.id) ||
            !txt(port.label) ||
            !['top', 'right', 'bottom', 'left'].includes(port.edge) ||
            typeof port.visible !== 'boolean' ||
            (port.componentId && !key(port.componentId)) ||
            (port.portId && !key(port.portId))
        ))
    )
      fail();
    for (const c of b.components)
      if (
        !key(c.id) ||
        (c.subname != null && !txt(c.subname)) ||
        !num(c.x, 0, 100) ||
        !num(c.y, 0, 100) ||
        (c.rotation != null && !num(c.rotation, 0, 359)) ||
        (c.stackLevel != null && !num(c.stackLevel, 0, 20)) ||
        !c.snapshot ||
        !txt(c.snapshot.name) ||
        !Array.isArray(c.snapshot.ports) ||
        c.snapshot.ports.length > 100
      )
        fail();
  }
  for (const field of x.fieldDevices || [])
    if (
      !key(field.id) ||
      !txt(field.name) ||
      !field.snapshot ||
      !txt(field.snapshot.name) ||
      (field.buttonColour != null && !txt(field.buttonColour)) ||
      (field.buttonColor != null && !/^#[0-9a-f]{6}$/i.test(field.buttonColor))
    )
      fail();
}
