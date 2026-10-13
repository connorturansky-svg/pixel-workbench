const HELP = {
  action: {
    export: 'Download a JSON backup of this project and its used standards.',
    import: 'Open a saved project JSON file.',
    'open-demo': 'Explore a sample installation without changing your project.',
    'exit-demo': 'Leave the demo and restore your project.',
    'save-demo': 'Download an editable JSON copy of the demo to open as a project.',
    'blank-project': 'Start an empty project after confirmation. Back up your current project first.',
    notifications: 'Show or hide project warnings and assumptions.',
    notice: 'Open the planning view related to these notifications.',
    select: 'Select this output to inspect and edit its wiring.',
    segment: 'Select this segment to edit its pixels, cable and power settings.',
    'add-chain': 'Add a controller output and its pixel chain.',
    'add-segment': 'Add a pixel or flood segment to the selected output.',
    'auto-inject': 'Suggest power-injection sections for the selected output.',
    split: 'Split the selected segment into separate sections.',
    'save-preset': 'Save this segment as a reusable pixel preset.',
    'remove-chain': 'Remove the selected output and its segments after confirmation.',
    move: 'Move this segment earlier or later in the data order.',
    'remove-segment': 'Remove the selected segment after confirmation.',
    'new-box-main': 'Create a controller enclosure for this project.',
    'add-controller': 'Add a controller to the chosen box.',
    'add-psu': 'Add a power supply to the chosen box.',
    'add-distro': 'Add a fused power-distribution board to the chosen box.',
    'add-aux': 'Add an auxiliary board to the chosen box.',
    'remove-psu': 'Remove this supply after confirmation; its loads become unassigned.',
    'remove-distro': 'Remove this distribution board after confirmation.',
    'remove-controller': 'Remove this controller after confirmation.',
    'remove-aux': 'Remove this auxiliary board after confirmation.',
    'new-preset': 'Create a reusable pixel-segment preset.',
    'remove-preset': 'Remove this preset after confirmation.',
    'use-preset': 'Add a copy of this preset to the selected output.',
    print: 'Open the print dialog to print the wiring guide or save it as PDF.',
    csv: 'Download the channel and port assignments as CSV.',
    'close-modal': 'Close this dialog without continuing.'
  },
  room: {
    'zoom-out': 'Zoom out of the room layout.',
    'zoom-in': 'Zoom into the room layout.',
    'fit-site': 'Frame the whole measured site.',
    'fit-all': 'Frame all visible placed objects.',
    'fit-selected': 'Frame the selected room object.',
    ports: 'Show the exact ports of the selected box.',
    grid: 'Show or hide the room layout grid.',
    'add-box': 'Place an empty controller box or a saved box template in the room.',
    'add-pixels': 'Add a pixel group or flood to the room and electrical plan.',
    'field-library': 'Choose a field device from the hardware library.',
    'open-box': 'Open this box in Box builder to edit its internal hardware.',
    wire: 'Open the wiring settings for this pixel group.',
    'delete-object': 'Remove the selected room object after confirmation.',
    colour: 'Apply this colour to the selected object.',
    prop: 'Select this reusable prop template for editing.',
    'new-prop': 'Create a reusable pixel-layout template.',
    'place-prop': 'Place this prop on a controller output in the room.',
    'upload-reference': 'Import a local image or SVG as a prop drawing reference.',
    'pixel-lines': 'Show or hide the lines between prop pixels.',
    'reset-points': 'Reset this prop layout to one pixel point.',
    'undo-pixel': 'Remove the most recently marked pixel.',
    'clear-pixels': 'Clear the marked pixel points.',
    'make-custom': 'Convert this layout to individually editable pixel points.',
    'remove-reference': 'Remove the imported reference image from this prop.',
    'duplicate-prop': 'Create a copy of this prop template.',
    'delete-prop': 'Delete this prop template after confirmation.',
    'close-ports': 'Close the exact-port chooser.'
  },
  install: {
    'builder-mode': 'Switch between controller-box and button-box builders.',
    'new-button-box': 'Create a custom button box.',
    'delete-button-box': 'Delete this button box after confirmation.',
    'save-button-template': 'Save this button box as a reusable template.',
    'update-button-template': 'Update this button box from its saved template.',
    'add-template': 'Add a box from the selected saved template.',
    'new-box': 'Create an empty controller enclosure.',
    'save-template': 'Save this box and its internal hardware as a reusable template.',
    'update-template': 'Review and apply the latest version of this box template.',
    'sync-standards': 'Review and apply current library standards to this box.',
    'delete-box': 'Delete this box after confirmation.',
    'box-mode': 'Switch between logical wiring and measured physical placement.',
    'box-zoom': 'Adjust the schematic zoom; the percentage button resets it.',
    'auto-layout': 'Arrange the schematic parts automatically.',
    'save-size': 'Save this component footprint to its shared library definition.',
    'rotate-part': 'Rotate the selected physical part by 90 degrees.',
    'external-route': 'Create a room cable route from the selected port.',
    'duplicate-part': 'Create a copy of the selected part in this box.',
    'update-part': 'Review and update the selected part from its library definition.',
    'delete-part': 'Remove the selected part and review any affected connections.',
    'select-part': 'Select this part to inspect and edit its settings.',
    'add-part': 'Add this library component to the current box.',
    tickets: 'Show or hide parts that need confirmed physical measurements.',
    'add-interface-port': 'Add an unassigned enclosure edge port.',
    'export-library': 'Download all shared standards and templates as a separate JSON backup.',
    'import-library': 'Restore the shared library from a validated JSON backup.',
    'new-box-size': 'Add reusable enclosure dimensions to the library.',
    'delete-box-size': 'Delete this enclosure-size standard from the shared library.',
    'new-cable': 'Add a physical cable standard to the library.',
    'delete-cable': 'Delete this cable standard from the shared library.',
    'new-component': 'Create a custom hardware definition in the library.',
    'add-port': 'Add a connector to this hardware definition.',
    'delete-port': 'Remove this connector from the hardware definition.',
    'delete-interface-port': 'Remove this enclosure edge port.',
    'new-resource': 'Add a capacity resource to this hardware definition.',
    'delete-def': 'Delete this hardware definition from the shared library.',
    ack: 'Toggle acknowledgement of this connection warning; the warning is not fixed.',
    'delete-connection': 'Remove this internal wire.',
    'bom-csv': 'Download the bill of materials as CSV.',
    'bom-print': 'Open the print dialog for the bill of materials.'
  },
  routeAction: {
    filter: 'Show or hide this category of room cables.',
    'auto-route': 'Toggle automatic cable detours around room objects.',
    labels: 'Show or hide object and cable labels.',
    animate: 'Show or hide animated wire-flow markers.',
    'add-pivot': 'Add an editable manual bend to the selected route.',
    'delete-pivot': 'Remove the selected route bend.',
    'update-standard': 'Update this cable snapshot from its current library standard.',
    'delete-route': 'Remove the selected cable route or injection.'
  },
  sg: {
    stage: 'Filter feature requests by this status.',
    disconnect: 'Disconnect the GitHub account saved in this browser.',
    connect: 'Show the one-time GitHub connection instructions.',
    'save-token': 'Check and save the GitHub connection in this browser.',
    remove: 'Remove this screenshot from the request draft.',
    reply: 'Open a reply or follow-up for this feature request.',
    'send-reply': 'Post this reply to the feature request on GitHub.',
    'reply-cancel': 'Close the reply editor without posting.',
    submit: 'Submit this feature request and its attachments to GitHub.',
    refresh: 'Reload the feature-request list and statuses.'
  }
};

const PAGES = {
  workspace: 'Plan pixel outputs in the room, wiring graph or data-entry view.',
  hardware: 'Configure controllers, power supplies and distribution boards.',
  presets: 'Manage reusable pixel-segment presets.',
  props: 'Design and place reusable pixel shapes.',
  guide: 'Review the wiring guide and export channel assignments.',
  boxes: 'Design controller enclosures and custom button boxes.',
  standards: 'Edit reusable hardware, enclosure sizes, cables and templates.',
  bom: 'Review, print or export the bill of materials.',
  suggest: 'Submit a feature request or check and reply to existing requests.'
};

export function buttonHelp(button) {
  if (button.hasAttribute('title')) return button.getAttribute('title');
  const d = button.dataset;
  if (d.action?.startsWith('page:')) return PAGES[d.action.slice(5)];
  if (d.action?.startsWith('view:'))
    return {
      room: 'Show measured room placements and cable routes.',
      visual: 'Show the illustrated wiring graph.',
      form: 'Edit output and segment settings in the data-entry view.'
    }[d.action.slice(5)];
  for (const key of Object.keys(HELP)) {
    const action = d[key]?.split(':')[0];
    if (HELP[key][action]) return HELP[key][action];
  }
  if (d.infoTab !== undefined) return `Show the ${button.textContent.trim()} information tab.`;
  if (d.infoClose !== undefined) return 'Close the information dialog.';
  if (d.info !== undefined) return 'Open the app information and help dialog.';
  if (d.roomChoosePort !== undefined) return 'Choose this exact port for the room connection.';
  if (d.boxPart !== undefined) return 'Select this physical part to inspect or move it.';
  if (d.boxPort !== undefined) return 'Select this exact connector to start or complete an internal wire.';
  if (d.boxTarget !== undefined) return 'Choose this exact endpoint for the connection.';
  if (d.wsplit !== undefined) return 'Split this pixel segment at this point.';
  if (button.type === 'submit') return 'Continue with the choices in this dialog.';
  return button.getAttribute('aria-label') || button.textContent.trim();
}

export function installButtonHelp(root = document.body) {
  const describe = event => {
    const button = event.target.closest?.('button');
    if (!button || button.hasAttribute('title')) return;
    const help = buttonHelp(button);
    if (help) button.setAttribute('title', help);
  };
  root.addEventListener('pointerover', describe);
  root.addEventListener('focusin', describe);
}
