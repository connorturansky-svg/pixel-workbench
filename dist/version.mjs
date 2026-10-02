// Every change: bump APP_VERSION, add a CHANGELOG entry at the top (date DD/MM/YYYY), and review HOW_TO_USE, ARCHITECTURE_NOTES / the info.mjs diagram and SHORTCUTS.
export const APP_VERSION='0.7.0';
export const CHANGELOG=[
 {version:'0.7.0',date:'02/10/2026',items:['New Suggest a feature page in the sidebar. Describe an idea and add screenshots (paste, drop or choose files). The issue title is taken from your first sentence. It opens a GitHub issue under your own account.','Every request is built automatically, with no approval step. A builder on the build PC picks it up, implements it with the Copilot CLI, tests it and publishes it, usually within 30 minutes.','The page lists every request with its live status: Queued, Building, Shipped, Needs info, Build failed or Declined.']},
 {version:'0.6.2',date:'02/10/2026',items:['Added a small version badge under the Pixel Workbench logo. Select it to open What’s new. It replaces the version label at the bottom of the sidebar.','Releases now fail to stamp if the newest changelog entry does not match the app version or is missing its date.']},
 {version:'0.6.1',date:'02/10/2026',items:['Fixed the page failing to load after an update when the browser still held cached copies of older files. Every script and stylesheet is now versioned, so each release loads as one consistent set.']},
 {version:'0.6.0',date:'02/10/2026',items:['Info / Help moves from the sidebar into a single i button (top bar) that opens a fixed-size dialog with How to use, What’s new, Architecture and Shortcuts tabs.','Added an About summary, an architecture diagram with technical notes, and a keyboard shortcut reference. Press ? anywhere outside a text field to open it.','The sidebar version label now opens What’s new. Changelog entries now show their release date.']},
 {version:'0.5.0',items:['Controller boxes now anchor the room layout, with coloured rectangular component sections and exposed component-port nodes. Existing loose infrastructure moves into an Unassigned infrastructure box.','Added field devices, port-to-device wiring, combined route warnings on the map, connection deletion and catalog search/category filters.','Added a disposable demo project with real boxes, cables, capacity, warnings and Save demo as project.']},
 {version:'0.4.1',items:['Added separate How to Use and What’s New tabs, duplicate box parts and clearer capacity bands.','Added port-to-room targets, clearer internal port routing, custom resources and operating limits.','Added a measured physical cable schedule to the wiring guide.']},
 {version:'0.4.0',items:['Physical room cable routes with draggable pivots and endpoints, scale-based lengths, slack and cable-fit warnings.','Reusable cable standards and hardware definitions, controller-box builder, typed ports and capacity summaries.','Project bill of materials, route visibility and optional signal-flow animation.','Info / Help with usage guidance and version history.']},
 {version:'0.3.0',items:['Terminal-based visual wiring map with separate PSU, distro, controller and device cards.','Drag connections to reassign supplies, data chains and power injection.','Blank-project action and prop drawing controls.']},
 {version:'0.2.0',items:['2D room layout with draggable hardware and pixel groups.','Reusable props with image/SVG references and custom pixel positions.']},
 {version:'0.1.0',items:['Baldrick pixel, power and injection planning; wiring guide and project export.']}
];
export const HOW_TO_USE=[
 ['Open the demo','Choose Open demo to explore a sample installation without changing your project. Exit demo restores your project; Save demo as project keeps an editable copy.'],
 ['Start with a box','Create a Controller box, then add internal hardware in its editor or choose the destination box in Hardware & power. Older loose components are placed in an Unassigned infrastructure box for review.'],
 ['Connect field devices','In Room layout, add a field device from the searchable library. Click a coloured node on a box edge, then click the field device or pixel group. The node identifies its box, internal component and exact port.'],
 ['Inspect cable warnings','Select a route for cable length, slack, pivots and the full issue list. A highlighted line and ! indicate short or incompatible wiring; an unassigned physical length is neutral. Delete a custom cable or injection from the route inspector.'],
 ['Start a plan','Use Hardware & power to add supplies, distros and Baldrick boards. Add outputs in the Wiring workspace. Data entry and Visual stay in sync.'],
 ['Wire the system','Drag between terminals in Visual. Use Split / inject here for a separately fed section. Review capacity and voltage warnings before building.'],
 ['Lay out the room','Switch to Room layout. Set room dimensions in metres, drag objects, then select a cable route. Double-click the route or use Add pivot; drag pivots and endpoints to follow the real path.'],
 ['Choose physical cables','In Standards, edit your cable colours, connectors and actual lengths. Assign a standard to a room route. Route length, optional slack and spare/shortfall are shown separately.'],
 ['Build controller boxes','Create a box, drag components from the library into it, position or duplicate them, then click or drag between their typed ports. Choose a port and a room target for an external cable route. Link real project hardware to count its use, and save reusable templates.'],
 ['Review and pack','Check per-box and project capacity, then open the Bill of materials. Export project JSON for backup and use the Wiring guide and planning CSV in the field.'],
 ['Suggest a feature','Open Suggest a feature, describe your idea and add any screenshots, then select Create the GitHub issue. Check it on GitHub, paste in the copied screenshots and select Create. You need a free GitHub account. Every request is built, tested and published automatically, and its status shows on the same page.'],
 ['Get help','Use the i button in the top bar for this guide, the change log, the architecture and keyboard shortcuts. The version badge under the logo opens What’s new.']
];
export const ABOUT='Pixel Workbench is a device-local planner for 12 V pixel systems built on Baldrick controllers and FPP. Use it to lay out a room, size power and injection, design controller boxes and produce a wiring guide, bill of materials and channel CSV. Calculations are planning estimates. Confirm ratings and wiring against the actual equipment.';
export const SHORTCUTS=[
 ['?','Open this dialog on the Shortcuts tab (outside text fields)'],
 ['Esc','Close this dialog or any open editor dialog'],
 ['Tab','Move between controls and room objects'],
 ['Enter','Select the focused room object'],
 ['Space','Select the focused room object'],
 ['← ↑ → ↓','Move the focused room object by the snap grid'],
 ['Shift + ← ↑ → ↓','Move the focused room object by 1 m'],
 ['Delete','Remove the focused cable-route pivot']
];
export const ARCHITECTURE_NOTES=[
 'A static, no-build web app: plain ES modules, HTML and CSS served from dist/. Pushing to main publishes dist/ to GitHub Pages through the Actions workflow.',
 'app.js holds the project state and re-renders the whole interface from it. Every view (wiring, room, boxes, standards, BOM, guide) reads the same project, so changes appear in every view.',
 'Calculation and data modules (model, layout-model, installation-model) are UI-free. verify.mjs and verify-installation.mjs exercise them under Node.',
 'Data never leaves the browser. The project and standards library are stored in localStorage. JSON export/import is the backup path, and ?test=1 runs an isolated session that does not save.',
 'Suggest a feature (suggest.mjs) drafts a [Feature] GitHub issue that the requester files under their own account. It reads request status from the public GitHub issues API, the only network call the app makes.',
 'automation/builder.py runs every 5 minutes on the build PC (Task Scheduler). It builds the oldest open request in its own git worktree with the Copilot CLI, which runs with no web, MCP or git access and follows AGENTS.md. It then rejects off-limits files or new network code, runs stamp-version, verify and a headless browser smoke test, and pushes the release to main as J-Turansky. Finally it comments on the issue and closes it.',
 'version.mjs is the single source for the version, changelog, help text and shortcuts. info.mjs renders the i dialog.'
];
