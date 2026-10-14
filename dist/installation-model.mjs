// Physical installation planning. Definitions live in the device-local library;
// projects retain snapshots so later library edits never rewrite old plans.
export const SCHEMATIC_LAYOUT_VERSION = 2;
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
const initializedInstallations = new WeakSet();
function requireInstallation(p) {
  if (!initializedInstallations.has(p)) ensureInstallation(p);
}
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
export function validateLibrary(lib) {
  const fail = () => {
      throw Error('Invalid library backup. No existing library data was changed.');
    },
    text = value => typeof value === 'string' && value.length <= 5000,
    key = value => text(value) && /^[a-zA-Z0-9_-]{1,200}$/.test(value),
    number = (value, min = 0, max = 10000000) => Number.isFinite(value) && value >= min && value <= max,
    list = (value, limit = 10000) => Array.isArray(value) && value.length <= limit,
    unique = value => new Set(value.map(v => v.id)).size === value.length,
    ratings = value =>
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.entries(value).every(([k, v]) => key(k) && (v == null || number(v))),
    definition = d =>
      d &&
      key(d.id) &&
      text(d.name) &&
      text(d.category) &&
      list(d.ports, 128) &&
      unique(d.ports) &&
      d.ports.every(
        port =>
          key(port.id) &&
          text(port.label) &&
          PORT_TYPES.includes(port.type) &&
          ['in', 'out', 'bidirectional'].includes(port.direction)
      ) &&
      ratings(d.resources) &&
      (d.operatingLimits == null || ratings(d.operatingLimits)) &&
      (d.physical == null ||
        ['widthMm', 'depthMm', 'heightMm'].every(
          k => d.physical[k] == null || number(d.physical[k], 1, 5000)
        ));
  if (
    !lib ||
    !Number.isInteger(lib.version) ||
    lib.version < 1 ||
    !list(lib.components) ||
    !unique(lib.components) ||
    !lib.components.every(definition) ||
    !list(lib.cables) ||
    !unique(lib.cables) ||
    !lib.cables.every(
      c =>
        key(c.id) &&
        text(c.name) &&
        text(c.type) &&
        number(c.lengthM, 0, 10000) &&
        number(c.pins, 1, 128) &&
        /^#[0-9a-f]{6}$/i.test(c.color)
    ) ||
    !list(lib.boxTemplates) ||
    !unique(lib.boxTemplates) ||
    !list(lib.boxSizes) ||
    !unique(lib.boxSizes) ||
    !lib.boxSizes.every(
      s => key(s.id) && text(s.name) && number(s.widthCm, 2, 1000) && number(s.depthCm, 2, 1000)
    )
  )
    fail();
  for (const t of lib.boxTemplates) {
    if (
      !key(t.id) ||
      !text(t.name) ||
      !Number.isInteger(t.version) ||
      t.version < 1 ||
      !list(t.components, 200) ||
      !unique(t.components) ||
      !t.components.every(
        c =>
          key(c.id) &&
          number(c.x, 0, 100) &&
          number(c.y, 0, 100) &&
          definition({ ...c.snapshot, id: c.snapshot?.id || c.id })
      ) ||
      (t.interfacePorts != null &&
        (!list(t.interfacePorts, 200) ||
          !unique(t.interfacePorts) ||
          t.interfacePorts.some(
            port =>
              !key(port.id) ||
              !text(port.label) ||
              !['top', 'right', 'bottom', 'left'].includes(port.edge) ||
              typeof port.visible !== 'boolean' ||
              (port.componentId &&
                !t.components.some(
                  c => c.id === port.componentId && c.snapshot.ports.some(p => p.id === port.portId)
                ))
          ))) ||
      (t.connections != null &&
        (!list(t.connections, 10000) ||
          t.connections.some(
            link =>
              !key(link.id) ||
              !t.components.some(
                c => c.id === link.fromComponent && c.snapshot.ports.some(p => p.id === link.fromPort)
              ) ||
              !t.components.some(
                c => c.id === link.toComponent && c.snapshot.ports.some(p => p.id === link.toPort)
              )
          )))
    )
      fail();
  }
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
    if (box.width === 4 && box.height === 2.5) {
      box.width = Math.max(0.1, (box.physicalWidthMm || 400) / 1000);
      box.height = Math.max(0.1, (box.physicalDepthMm || 250) / 1000);
    } else if (box.kind === 'button' && box.width === 1.5 && box.height === 0.75) {
      box.width = Math.max(0.1, (box.physicalWidthMm || 200) / 1000);
      box.height = Math.max(0.1, (box.physicalDepthMm || 100) / 1000);
    }
    if (box.kind === 'button')
      for (const button of box.components) {
        button.buttonColour ??= 'Amber';
        button.buttonType ??= button.snapshot.name.includes('Illuminated') ? 'illuminated' : 'push';
        button.snapshot.color =
          BUTTON_COLOURS.find(([name]) => name === button.buttonColour)?.[1] || '#f1c75b';
      }
    for (const component of box.components) {
      component.schematic ??= { x: component.x, y: component.y };
    }
    syncInterfacePorts(box);
  }
  initializedInstallations.add(p);
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
    schematicLayoutVersion: SCHEMATIC_LAYOUT_VERSION,
    components: [],
    interfacePorts: [],
    width: 0.4,
    height: 0.25,
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
    buttonType: 'push',
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
    const component = box.components.find(item => item.id === interfacePort.componentId);
    if (component) interfacePort.label = component.snapshot.ports[0].label;
  }
  return box;
}
export function makeButtonBox(name = 'Button box', count = 1) {
  const box = makeBox(name);
  box.kind = 'button';
  box.description = 'Custom button box';
  box.width = 0.2;
  box.height = 0.1;
  box.physicalWidthMm = 200;
  box.physicalDepthMm = 100;
  resizeButtonBox(box, count);
  box.interfacePorts.forEach(port => (port.visible = true));
  return box;
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
    const old = component.snapshot;
    component.snapshot = copy(definition);
    if (component.portOverrides) {
      component.snapshot.ports = copy(component.portOverrides);
      component.snapshot.resources.ethernetPorts = component.portOverrides.filter(
        port => port.type === 'ethernet'
      ).length;
    }
    if (component.measurementOverride) component.snapshot.physical = copy(old.physical);
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
    if (componentPort && !port.customLabel) port.label = componentPort.label;
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
  for (const box of p.installation.boxes) {
    const template = lib.boxTemplates.find(t => t.id === box.templateRef?.id);
    if (template && !template.kind && templateKind({ components: box.components }) === 'button')
      box.kind = 'button';
  }
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
export function removePowerSupply(p, psuId) {
  ensureInstallation(p);
  const key = 'psu:' + psuId;
  if (!p.psus.some(ps => ps.id === psuId)) throw Error('Power supply not found.');
  for (const c of p.controllers)
    c.bankPsus.forEach((ps, i) => {
      if (ps !== psuId) return;
      c.bankPsus[i] = '';
      c.bankPsuPorts[i] = 1;
      delete p.installation.routes[`bank:${c.id}:${i}`];
    });
  for (const d of p.distros)
    if (d.psu === psuId) {
      d.psu = '';
      d.psuPort = 1;
      delete p.installation.routes['supply:' + d.id];
    }
  for (const a of p.aux) if (a.psu === psuId) a.psu = '';
  for (const ch of p.chains) for (const s of ch.segments) if (s.psu === psuId) s.psu = '';
  for (const box of p.installation.boxes) {
    const components = box.components.filter(c => c.sourceKey !== key);
    if (components.length === box.components.length) continue;
    const removed = new Set(box.components.filter(c => c.sourceKey === key).map(c => c.id));
    for (const link of affectedConnections(p, box, { components })) deleteRoute(p, 'custom:' + link.id);
    box.components = components;
    box.interfacePorts = box.interfacePorts.filter(port => !removed.has(port.componentId));
    syncInterfacePorts(box);
  }
  for (const link of p.installation.connections.filter(link => link.fromKey === key || link.toKey === key))
    deleteRoute(p, 'custom:' + link.id);
  p.psus = p.psus.filter(ps => ps.id !== psuId);
  if (p.scene?.placements) delete p.scene.placements[key];
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
export function boxVisualScale(width, height) {
  return Math.max(0.01, Math.min(1, width / 1, height / 0.7));
}
export function roomPortGeometry(width, height, { edge, t }, ports, presentation = false) {
  const scale = width / 400,
    horizontal = edge === 'left' || edge === 'right',
    spacing = (horizontal ? height : width) / (ports.filter(p => p.edge === edge).length + 1),
    pillW = horizontal ? 96 * scale : Math.min(90 * scale, spacing * 0.86),
    pillH = 20 * scale,
    shellX = edge === 'left' ? -width / 2 : edge === 'right' ? width / 2 : (t - 0.5) * width,
    shellY = edge === 'top' ? -height / 2 : edge === 'bottom' ? height / 2 : (t - 0.5) * height;
  return {
    x: shellX + (presentation ? 0 : edge === 'left' ? -pillW : edge === 'right' ? pillW : 0),
    y: shellY + (presentation ? 0 : edge === 'top' ? -pillH : edge === 'bottom' ? pillH : 0),
    pillX: edge === 'left' ? shellX - pillW : edge === 'right' ? shellX : shellX - pillW / 2,
    pillY: edge === 'top' ? shellY - pillH : edge === 'bottom' ? shellY : shellY - pillH / 2,
    pillW,
    pillH,
    spacing
  };
}
export function perimeterAnchor(p, boxId, componentId, portId, presentation = false) {
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
  const { x: dx, y: dy } = roomPortGeometry(v.width, v.height, node, exposedPorts(box), presentation),
    angle = ((v.rotation || 0) * Math.PI) / 180;
  return {
    x: v.x + dx * Math.cos(angle) - dy * Math.sin(angle),
    y: v.y + dx * Math.sin(angle) + dy * Math.cos(angle)
  };
}
function templateKind(t) {
  return (
    t.kind ||
    (t.components.length > 0 &&
    t.components.length <= 5 &&
    t.components.every(
      c => c.snapshot.category === 'Button' || c.snapshot.name.toLowerCase().includes('button')
    )
      ? 'button'
      : 'controller')
  );
}
function templateValues(c) {
  return copy({
    subname: c.subname || '',
    ports: c.snapshot.ports,
    physical: c.snapshot.physical,
    buttonColour: c.buttonColour,
    buttonType: c.buttonType,
    buttonSize: c.buttonSize
  });
}
export function addBoxFromTemplate(p, t) {
  ensureInstallation(p);
  const box = makeBox(t.name);
  box.description = t.description;
  box.physicalWidthMm = t.physicalWidthMm || box.physicalWidthMm;
  box.physicalDepthMm = t.physicalDepthMm || box.physicalDepthMm;
  box.kind = templateKind(t);
  box.schematicLayoutVersion = t.schematicLayoutVersion || 0;
  if (t.schematicExtent) box.schematicExtent = copy(t.schematicExtent);
  box.width = box.physicalWidthMm / 1000;
  box.height = box.physicalDepthMm / 1000;
  box.templateRef = { id: t.id, version: t.version };
  box.components = t.components.map(c => ({
    ...copy(c),
    id: 'part-' + id(),
    templateComponentId: c.id,
    templateDefaults: templateValues(c),
    sourceKey: ''
  }));
  if (Array.isArray(t.interfacePorts)) {
    const componentIds = new Map(t.components.map((c, i) => [c.id, box.components[i].id]));
    box.interfacePorts = copy(t.interfacePorts).map(x => ({
      ...x,
      id: 'interface-' + id(),
      componentId: componentIds.get(x.componentId) || '',
      templatePortId: x.id
    }));
  }
  syncInterfacePorts(box);
  p.installation.boxes.push(box);
  const ids = new Map(t.components.map((c, i) => [c.id, box.components[i].id]));
  for (const link of t.connections || [])
    p.installation.connections.push({
      ...copy(link),
      id: 'link-' + id(),
      templateConnectionId: link.id,
      boxId: box.id,
      ...(link.fromKey ? { fromKey: 'box:' + box.id, toKey: 'box:' + box.id } : {}),
      fromComponent: ids.get(link.fromComponent),
      toComponent: ids.get(link.toComponent)
    });
  return box;
}
export function saveBoxTemplate(lib, box, project) {
  const components = box.components.map(c => {
    c.templateComponentId ??= c.id;
    c.templateDefaults = templateValues(c);
    const definition = { ...copy(c), id: c.templateComponentId, sourceKey: '' };
    delete definition.templateDefaults;
    return definition;
  });
  const ids = new Map(box.components.map(c => [c.id, c.templateComponentId]));
  const interfaces = (box.interfacePorts || []).map(port => {
    port.templatePortId ??= port.id;
    return { ...copy(port), id: port.templatePortId, componentId: ids.get(port.componentId) || '' };
  });
  const connections = (project?.installation.connections || [])
    .filter(
      link =>
        link.boxId === box.id &&
        !link.fromKey &&
        !link.toKey &&
        ids.has(link.fromComponent) &&
        ids.has(link.toComponent)
    )
    .map(link => ({
      ...copy(link),
      fromComponent: ids.get(link.fromComponent),
      toComponent: ids.get(link.toComponent)
    }));
  let existing = lib.boxTemplates.find(t => t.id === box.templateRef?.id);
  if (existing) {
    existing.version++;
    existing.name = box.name;
    existing.description = box.description;
    existing.physicalWidthMm = box.physicalWidthMm;
    existing.physicalDepthMm = box.physicalDepthMm;
    existing.kind = box.kind || 'controller';
    existing.schematicLayoutVersion = box.schematicLayoutVersion;
    existing.schematicExtent = copy(box.schematicExtent);
    existing.components = components;
    existing.interfacePorts = interfaces;
    existing.connections = connections;
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
    kind: box.kind || 'controller',
    schematicLayoutVersion: box.schematicLayoutVersion,
    schematicExtent: copy(box.schematicExtent),
    components,
    interfacePorts: interfaces,
    connections
  };
  lib.boxTemplates.push(t);
  box.templateRef = { id: t.id, version: t.version };
  return t;
}
export function updateBoxFromTemplate(box, t) {
  const used = new Set(),
    componentIds = new Map();
  const components = t.components.map((definition, index) => {
    const old =
      box.components.find(
        c => !used.has(c.id) && (c.templateComponentId === definition.id || c.id === definition.id)
      ) ||
      (!box.components.some(c => c.templateComponentId) &&
      box.components[index]?.definitionId === definition.definitionId
        ? box.components[index]
        : null);
    if (old) used.add(old.id);
    const next = {
      ...copy(definition),
      id: old?.id || 'part-' + id(),
      templateComponentId: definition.id,
      sourceKey: old?.sourceKey || ''
    };
    if (old) {
      const baseline = old.templateDefaults,
        changed = (field, value) => !baseline || JSON.stringify(value) !== JSON.stringify(baseline[field]);
      for (const key of [
        'x',
        'y',
        'schematic',
        'rotation',
        'stackLevel',
        'operatingLimits',
        'buttonOverrides'
      ])
        if (key in old) next[key] = copy(old[key]);
      if (changed('subname', old.subname || '')) next.subname = old.subname;
      if (old.portOverrides && changed('ports', old.snapshot.ports)) {
        next.portOverrides = copy(old.portOverrides);
        next.snapshot.ports = copy(old.portOverrides);
        next.snapshot.resources.ethernetPorts = old.portOverrides.filter(p => p.type === 'ethernet').length;
      }
      if (old.measurementOverride && changed('physical', old.snapshot.physical)) {
        next.measurementOverride = true;
        next.snapshot.physical = copy(old.snapshot.physical);
      }
      if (old.buttonOverrides?.colour && changed('buttonColour', old.buttonColour)) {
        next.buttonColour = old.buttonColour;
        next.snapshot.color = old.snapshot.color;
      }
      if (old.buttonOverrides?.type && changed('buttonType', old.buttonType)) {
        next.buttonType = old.buttonType;
        next.snapshot.name = old.snapshot.name;
      }
      if (old.buttonOverrides?.size && changed('buttonSize', old.buttonSize)) {
        next.buttonSize = old.buttonSize;
        next.snapshot.physical = copy(old.snapshot.physical);
      }
      if (old.buttonOverrides?.label && changed('ports', old.snapshot.ports))
        next.snapshot.ports[0].label = old.snapshot.ports[0].label;
    }
    next.templateDefaults = templateValues(definition);
    componentIds.set(definition.id, next.id);
    return next;
  });
  const oldPorts = box.interfacePorts || [];
  box.components = components;
  box.kind = templateKind(t);
  box.interfacePorts = (t.interfacePorts || []).map(port => {
    const componentId = componentIds.get(port.componentId) || '';
    const old = oldPorts.find(p => p.componentId === componentId && p.portId === port.portId);
    return {
      ...copy(port),
      ...copy(old || {}),
      id: old?.id || 'interface-' + id(),
      templatePortId: port.id,
      componentId
    };
  });
  syncInterfacePorts(box);
  box.templateRef = { id: t.id, version: t.version };
}
export function templateConnectionChanges(project, box, template) {
  const ids = new Map(box.components.map(c => [c.templateComponentId, c.id])),
    working = copy(project),
    additions = [],
    conflicts = [];
  for (const definition of template.connections || []) {
    const fromComponent = ids.get(definition.fromComponent),
      toComponent = ids.get(definition.toComponent);
    if (
      working.installation.connections.some(
        link =>
          link.fromComponent === fromComponent &&
          link.fromPort === definition.fromPort &&
          link.toComponent === toComponent &&
          link.toPort === definition.toPort
      )
    )
      continue;
    const source = { boxId: box.id, componentId: fromComponent, portId: definition.fromPort },
      target = { boxId: box.id, componentId: toComponent, portId: definition.toPort },
      problem = connectionProblem(working, source, target);
    if (problem) {
      conflicts.push(`${definition.fromPort} → ${definition.toPort}: ${problem}`);
      continue;
    }
    const link = {
      ...copy(definition),
      id: 'link-' + id(),
      templateConnectionId: definition.id,
      boxId: box.id,
      fromComponent,
      toComponent,
      ...(definition.fromKey ? { fromKey: 'box:' + box.id, toKey: 'box:' + box.id } : {})
    };
    additions.push(link);
    working.installation.connections.push(link);
  }
  return { additions, conflicts };
}
export function affectedConnections(project, before, after) {
  const live = new Set(after.components.flatMap(c => c.snapshot.ports.map(port => c.id + ':' + port.id)));
  return project.installation.connections.filter(link =>
    [
      link.fromComponent && `${link.fromComponent}:${link.fromPort}`,
      link.toComponent && `${link.toComponent}:${link.toPort}`
    ].some(
      endpoint =>
        endpoint && before.components.some(c => endpoint.startsWith(c.id + ':')) && !live.has(endpoint)
    )
  );
}
function portInUse(project, endpoint) {
  return (
    project.installation.connections.some(
      link =>
        (link.fromComponent === endpoint.componentId && link.fromPort === endpoint.portId) ||
        (link.toComponent === endpoint.componentId && link.toPort === endpoint.portId)
    ) ||
    routeSpecs(project).some(spec =>
      ['from', 'to'].some(
        end =>
          spec[end] === 'box:' + endpoint.boxId &&
          (spec[end + 'Component'] || spec.connection?.[end + 'Component']) === endpoint.componentId &&
          spec[end + 'Port'] === endpoint.portId
      )
    )
  );
}
export function connectionProblem(project, source, target) {
  const resolve = endpoint =>
    project.installation.boxes
      .find(b => b.id === endpoint.boxId)
      ?.components.find(c => c.id === endpoint.componentId)
      ?.snapshot.ports.find(p => p.id === endpoint.portId);
  const a = resolve(source),
    b = resolve(target);
  if (!a || !b) return 'A selected port no longer exists.';
  if (source.componentId === target.componentId && source.portId === target.portId)
    return 'Choose a different destination port.';
  if (
    a.type !== b.type &&
    a.type !== 'generic' &&
    b.type !== 'generic' &&
    ![a.type, b.type].every(type => ['pixel_data', 'pixel_output'].includes(type))
  )
    return `Incompatible ports: ${a.type.replaceAll('_', ' ')} and ${b.type.replaceAll('_', ' ')}.`;
  if (
    a.type !== 'ethernet' &&
    !((a.direction !== 'in' && b.direction !== 'out') || (b.direction !== 'in' && a.direction !== 'out'))
  )
    return 'Choose an output and a compatible input.';
  if (portInUse(project, source) || portInUse(project, target))
    return 'A selected port is already connected. Remove its existing link first.';
  return '';
}
export function routeSpecs(p) {
  requireInstallation(p);
  const routes = [];
  for (const c of p.controllers)
    c.bankPsus.forEach((ps, i) => {
      if (!ps) return;
      routes.push({
        id: `bank:${c.id}:${i}`,
        from: `psu:${ps}`,
        to: `controller:${c.id}`,
        kind: 'power',
        name: `${c.name} bank ${i + 1}`
      });
    });
  for (const d of p.distros) {
    if (!d.psu) continue;
    routes.push({
      id: `supply:${d.id}`,
      from: `psu:${d.psu}`,
      to: `distro:${d.id}`,
      kind: 'power',
      name: `${d.name} supply`
    });
  }
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
  requireInstallation(p);
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
const automaticRouteCache = new WeakMap();
function placementBounds(v, pad = 0.04) {
  const angle = ((v.rotation || 0) * Math.PI) / 180,
    halfW = (Math.abs(v.width * Math.cos(angle)) + Math.abs(v.height * Math.sin(angle))) / 2,
    halfH = (Math.abs(v.width * Math.sin(angle)) + Math.abs(v.height * Math.cos(angle))) / 2;
  return { l: v.x - halfW - pad, r: v.x + halfW + pad, t: v.y - halfH - pad, b: v.y + halfH + pad };
}
function automaticRoute(p, spec, a, b) {
  const structure = JSON.stringify([
      p.scene?.width,
      p.scene?.depth,
      p.installation.boxes.map(box => [box.id, box.components.map(c => c.sourceKey)])
    ]),
    placements = p.scene?.placements || {},
    signature = JSON.stringify(
      Object.entries(placements).map(([key, v]) => [key, v.x, v.y, v.width, v.height, v.rotation])
    );
  let cache = automaticRouteCache.get(p);
  if (cache?.structure !== structure) {
    cache = { structure, signature, paths: new Map(), placements: copy(placements) };
    automaticRouteCache.set(p, cache);
  } else if (cache.signature !== signature) {
    const changed = [...new Set([...Object.keys(placements), ...Object.keys(cache.placements)])]
      .filter(key => JSON.stringify(placements[key]) !== JSON.stringify(cache.placements[key]))
      .flatMap(key =>
        [placements[key], cache.placements[key]].filter(Boolean).map(v => placementBounds(v, 0.4))
      );
    for (const [key, entry] of cache.paths) {
      const bounds = entry.bounds;
      if (
        !bounds ||
        changed.some(v => v.l <= bounds.r && v.r >= bounds.l && v.t <= bounds.b && v.b >= bounds.t)
      )
        cache.paths.delete(key);
    }
    cache.signature = signature;
    cache.placements = copy(placements);
  }
  const endpoints = JSON.stringify([spec.from, spec.to, a, b]);
  if (cache.paths.get(spec.id)?.endpoints !== endpoints) {
    const points = calculateAutomaticRoute(p, spec, a, b),
      bounds = points && {
        l: Math.min(...points.map(q => q.x)),
        r: Math.max(...points.map(q => q.x)),
        t: Math.min(...points.map(q => q.y)),
        b: Math.max(...points.map(q => q.y))
      };
    cache.paths.set(spec.id, { endpoints, points, bounds });
  }
  return cache.paths.get(spec.id).points?.map(point => ({ ...point })) || null;
}
function calculateAutomaticRoute(p, spec, a, b) {
  const width = p.scene?.width || 10,
    depth = p.scene?.depth || 10,
    step = Math.max(0.2, Math.max(width, depth) / 80),
    from = spec.from,
    to = spec.to,
    hidden = key => /^(controller|psu|distro|aux):/.test(key) && boxForSource(p, key),
    obstacles = Object.entries(p.scene?.placements || {})
      .filter(([key]) => !hidden(key))
      .flatMap(([placementKey, v]) => {
        const endpoint = placementKey === from || placementKey === to;
        return [
          {
            key: placementKey,
            ...placementBounds(v, endpoint ? 0 : 0.04)
          }
        ];
      }),
    intersects = (u, v, o) => {
      if (
        Math.max(u.x, v.x) < o.l + 0.00001 ||
        Math.min(u.x, v.x) > o.r - 0.00001 ||
        Math.max(u.y, v.y) < o.t + 0.00001 ||
        Math.min(u.y, v.y) > o.b - 0.00001
      )
        return false;
      let lo = 0,
        hi = 1;
      for (const [axis, min, max] of [
        ['x', o.l + 0.00001, o.r - 0.00001],
        ['y', o.t + 0.00001, o.b - 0.00001]
      ]) {
        const delta = v[axis] - u[axis];
        if (!delta) {
          if (u[axis] < min || u[axis] > max) return false;
        } else {
          const first = (min - u[axis]) / delta,
            last = (max - u[axis]) / delta;
          lo = Math.max(lo, Math.min(first, last));
          hi = Math.min(hi, Math.max(first, last));
          if (lo > hi) return false;
        }
      }
      return true;
    },
    clear = (u, v, ignored) => !obstacles.some(o => o.key !== ignored && intersects(u, v, o)),
    lead = (point, key, other) => {
      const obstacle = obstacles.find(o => o.key === key);
      if (!obstacle) return point;
      if (key.startsWith('box:')) {
        const box = p.installation.boxes.find(box => 'box:' + box.id === key),
          start = key === from,
          component = start
            ? spec.fromComponent || spec.connection?.fromComponent
            : spec.toComponent || spec.connection?.toComponent,
          port = start ? spec.fromPort : spec.toPort,
          node = box && exposedPorts(box).find(v => v.component.id === component && v.port.id === port);
        if (node) {
          const angle = ((p.scene.placements[key].rotation || 0) * Math.PI) / 180,
            normal = { left: [-1, 0], right: [1, 0], top: [0, -1], bottom: [0, 1] }[node.edge],
            dx = normal[0] * Math.cos(angle) - normal[1] * Math.sin(angle),
            dy = normal[0] * Math.sin(angle) + normal[1] * Math.cos(angle),
            distance = Math.max(
              step,
              Math.min(
                Math.abs(dx) > 0.00001 ? ((dx > 0 ? obstacle.r : obstacle.l) - point.x) / dx : Infinity,
                Math.abs(dy) > 0.00001 ? ((dy > 0 ? obstacle.b : obstacle.t) - point.y) / dy : Infinity
              ) + step
            ),
            q = { x: point.x + dx * distance, y: point.y + dy * distance };
          return q.x >= 0 && q.y >= 0 && q.x <= width && q.y <= depth && clear(point, q, key) ? q : null;
        }
      }
      const choices = [
        { x: obstacle.l - step, y: point.y },
        { x: obstacle.r + step, y: point.y },
        { x: point.x, y: obstacle.t - step },
        { x: point.x, y: obstacle.b + step }
      ].filter(q => q.x >= 0 && q.y >= 0 && q.x <= width && q.y <= depth && clear(point, q, key));
      choices.sort(
        (u, v) =>
          Math.hypot(u.x - point.x, u.y - point.y) - Math.hypot(v.x - point.x, v.y - point.y) ||
          Math.hypot(u.x - other.x, u.y - other.y) - Math.hypot(v.x - other.x, v.y - other.y)
      );
      return choices[0] || null;
    },
    first = lead(a, from, b),
    last = lead(b, to, a),
    blocked = (x, y) => obstacles.some(o => x > o.l && x < o.r && y > o.t && y < o.b),
    cell = q => {
      const x = Math.round(q.x / step),
        y = Math.round(q.y / step),
        choices = [];
      for (let dx = -2; dx <= 2; dx++)
        for (let dy = -2; dy <= 2; dy++) {
          const next = { x: x + dx, y: y + dy },
            point = { x: next.x * step, y: next.y * step };
          if (
            point.x >= 0 &&
            point.y >= 0 &&
            point.x <= width &&
            point.y <= depth &&
            !blocked(point.x, point.y) &&
            clear(q, point)
          )
            choices.push(next);
        }
      choices.sort(
        (u, v) =>
          Math.hypot(u.x * step - q.x, u.y * step - q.y) - Math.hypot(v.x * step - q.x, v.y * step - q.y)
      );
      return choices[0] || null;
    },
    start = cell(first || a),
    goal = cell(last || b),
    key = q => q.x + ',' + q.y,
    open = [],
    came = new Map(),
    cost = new Map(),
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
  if (clear(a, b)) return [a, b];
  if (!first || !last) return null;
  if (clear(first, last)) return [first, last];
  if (!start || !goal) return null;
  open.push({ ...start, g: 0, f: Math.hypot(goal.x - start.x, goal.y - start.y) });
  cost.set(key(start), 0);
  const startPoint = { x: start.x * step, y: start.y * step },
    goalPoint = { x: goal.x * step, y: goal.y * step };
  if (!clear(first, startPoint) || !clear(last, goalPoint)) return null;
  const push = entry => {
    open.push(entry);
    let index = open.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (open[parent].f <= entry.f) break;
      open[index] = open[parent];
      index = parent;
    }
    open[index] = entry;
  };
  while (open.length) {
    const cur = open[0],
      last = open.pop(),
      ck = key(cur);
    if (open.length) {
      let index = 0;
      while (index * 2 + 1 < open.length) {
        let child = index * 2 + 1;
        if (child + 1 < open.length && open[child + 1].f < open[child].f) child++;
        if (last.f <= open[child].f) break;
        open[index] = open[child];
        index = child;
      }
      open[index] = last;
    }
    if (cur.g !== cost.get(ck)) continue;
    if (cur.x === goal.x && cur.y === goal.y) {
      found = cur;
      break;
    }
    for (const [dx, dy] of dirs) {
      const next = { x: cur.x + dx, y: cur.y + dy };
      if (
        next.x < 0 ||
        next.y < 0 ||
        next.x * step > width ||
        next.y * step > depth ||
        blocked(next.x * step, next.y * step) ||
        !clear({ x: cur.x * step, y: cur.y * step }, { x: next.x * step, y: next.y * step })
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
      push({ ...next, g: nextCost, f: nextCost + Math.hypot(goal.x - next.x, goal.y - next.y) });
    }
  }
  if (!found) return null;
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
  return [first, startPoint, ...simple, last];
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
    pts = middle && [start, ...middle, end];
  if (!pts) return null;
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
  const fromBox = p.installation.boxes.find(
      b => b.id === (x.fromKey?.startsWith('box:') ? x.fromKey.slice(4) : x.boxId)
    ),
    toBox = p.installation.boxes.find(
      b => b.id === (x.toKey?.startsWith('box:') ? x.toKey.slice(4) : x.boxId)
    ),
    a = fromBox?.components.find(c => c.id === x.fromComponent),
    b = toBox?.components.find(c => c.id === x.toComponent),
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
  if (x.toKey && !x.toKey.startsWith('box:')) {
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
  if (
    ap.type !== 'ethernet' &&
    (!['out', 'bidirectional'].includes(ap.direction) || !['in', 'bidirectional'].includes(bp.direction))
  )
    result.push(`Expected output → input; got ${ap.direction} → ${bp.direction}`);
  if (ap.type !== bp.type && ap.type !== 'generic' && bp.type !== 'generic')
    result.push(`Expected ${bp.type.replaceAll('_', ' ')}; connected to ${ap.type.replaceAll('_', ' ')}`);
  return result;
}
export function externalConnectionProblem(project, source, key) {
  const box = project.installation.boxes.find(b => b.id === source.boxId),
    part = box?.components.find(c => c.id === source.componentId),
    port = part?.snapshot.ports.find(v => v.id === source.portId);
  if (!port) return 'Source port no longer exists.';
  if (!key?.startsWith('field:') && !key?.startsWith('segment:'))
    return 'Choose a field device or pixel group.';
  if (
    portInUse(project, source) ||
    project.installation.connections.some(link => link.fromKey === key || link.toKey === key) ||
    (['pixel_output', 'pixel_data'].includes(port.type) &&
      project.chains.some(ch => ch.controller && ch.segments.some(s => 'segment:' + s.id === key)))
  )
    return 'A selected port or target is already connected. Remove its existing link first.';
  const link =
    port.direction === 'in' && key.startsWith('field:')
      ? { boxId: box.id, fromKey: key, toKey: 'box:' + box.id, toComponent: part.id, toPort: port.id }
      : { boxId: box.id, fromKey: 'box:' + box.id, fromComponent: part.id, fromPort: port.id, toKey: key };
  return connectionWarnings(project, link).join('; ');
}
export function routeIssues(p, spec) {
  const geometry = routeGeometry(p, spec),
    issues = spec.connection ? connectionWarnings(p, spec.connection) : [];
  if (!geometry) issues.unshift('No clear physical route. Move obstacles or add intentional manual pivots.');
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
  for (const link of p.installation.connections.filter(
    v => v.boxId === box.id || v.fromKey === 'box:' + box.id || v.toKey === 'box:' + box.id
  )) {
    const from =
        !link.fromKey || link.fromKey === 'box:' + box.id
          ? box.components.find(c => c.id === link.fromComponent)
          : null,
      to =
        !link.toKey || link.toKey === 'box:' + box.id
          ? box.components.find(c => c.id === link.toComponent)
          : null;
    const fromPort = from?.snapshot.ports.find(v => v.id === link.fromPort),
      toPort = to?.snapshot.ports.find(v => v.id === link.toPort);
    if (
      fromPort?.type === 'ethernet' ||
      fromPort?.direction === 'out' ||
      fromPort?.direction === 'bidirectional'
    )
      track(from, fromPort);
    if (toPort?.type === 'ethernet' || toPort?.direction === 'in' || toPort?.direction === 'bidirectional')
      track(to, toPort);
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
  requireInstallation(p);
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
        c.snapshot.ports.length > 128
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
