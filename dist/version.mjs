// Every change: bump APP_VERSION, add a CHANGELOG entry at the top (date DD/MM/YYYY), and review HOW_TO_USE, ARCHITECTURE_NOTES / the info.mjs diagram and SHORTCUTS.
export const APP_VERSION = '0.41.0';
export const CHANGELOG = [
  {
    version: '0.41.0',
    date: '02/10/2026',
    items: [
      'Suggest a feature now shows the total AI credits, estimated cost, tokens and builds from the last 28 days, just above the Daily build allowance meter.'
    ]
  },
  {
    version: '0.40.0',
    date: '02/10/2026',
    items: [
      'Room layout now shows a live cable growing from a controller-box port while it is dragged, with valid field-device and pixel-group destinations highlighted. (follow-up to #21)'
    ]
  },
  {
    version: '0.39.0',
    date: '02/10/2026',
    items: [
      'Controller-box schematics now hide the component wire for an inactive edge port until that port is activated. (suggested in #24)'
    ]
  },
  {
    version: '0.38.0',
    date: '02/10/2026',
    items: [
      'Controller boxes now create an inactive edge port for every component connector, with editable labels and collapsible component groups for activation. (suggested in #23)'
    ]
  },
  {
    version: '0.37.0',
    date: '02/10/2026',
    items: [
      'Controller-box schematic zoom now scales component illustrations while keeping the canvas visible, with auto-layout canvas sizing handled separately. (suggested in #22)'
    ]
  },
  {
    version: '0.36.0',
    date: '02/10/2026',
    items: [
      'Room layout now gives buttons, switches, sensors, effects and flood lights recognisable device illustrations, and joins their cables at the nearest edge facing the controller box. (follow-up to #21)'
    ]
  },
  {
    version: '0.35.0',
    date: '02/10/2026',
    items: [
      'The Wiring workspace now shows a glowing live wire while dragging, highlights connected wires and terminals on hover, and illustrates supplies, distribution, controllers and lights with breadboard-style component faces. (suggested in #21)'
    ]
  },
  {
    version: '0.34.0',
    date: '02/10/2026',
    items: [
      'Controller-box schematics now have a scrollable zoom canvas and an automatic flow-chart layout that spaces connected components while existing wire routes avoid other parts. (suggested in #20)'
    ]
  },
  {
    version: '0.33.0',
    date: '02/10/2026',
    items: [
      'Controller-box components now offer common Mean Well LRS power-supply and Raspberry Pi size guides that fill the model footprint while keeping dimensions editable. (suggested in #19)'
    ]
  },
  {
    version: '0.32.0',
    date: '02/10/2026',
    items: [
      'Controller-box hardware now includes all documented Baldrick boards with their named power, network, pixel, input, relay and DMX connectors. (suggested in #16)'
    ]
  },
  {
    version: '0.31.0',
    date: '02/10/2026',
    items: [
      'A global notification strip now groups electrical checks, room-route faults and controller-box component issues at the top of every page, with links to the relevant workspace. (suggested in #18)'
    ]
  },
  {
    version: '0.30.0',
    date: '02/10/2026',
    items: [
      'Controller boxes can now define labelled ports on any enclosure edge, wire component connectors to them and choose which ports appear as route targets in Room layout. (suggested in #17)'
    ]
  },
  {
    version: '0.29.0',
    date: '02/10/2026',
    items: [
      'Controller-box wiring now follows the pointer while dragging, routes around components where possible, fills ports that are linked and softly highlights both ends when a port or wire is hovered. (suggested in #15)'
    ]
  },
  {
    version: '0.28.0',
    date: '02/10/2026',
    items: [
      'Controller-box schematics now show each component as a basic top-down hardware illustration, with every named port drawn as a colour-coded connector that remains directly wireable. (follow-up to #12)'
    ]
  },
  {
    version: '0.27.0',
    date: '02/10/2026',
    items: [
      'Feature requests now have a Title field. The request number still leads the GitHub issue title, for example “[Feature] #15 Your title”.',
      'Answer the builder’s questions or retry a failed build straight from the Requests and build status list. Select Answer the question or Reply to retry, read the builder’s latest message and send your reply without opening GitHub.',
      'A bell in the top bar shows how many of your requests need your reply. Select it to jump to those requests.',
      'For 7 days after a request ships, select Add a follow-up to say what was missed. The builder reopens the request and builds the follow-up as a new version.',
      'A new Suggest a feature tab in the i dialog is a complete guide to requesting features, tracking them and replying to the builder.'
    ]
  },
  {
    version: '0.26.0',
    date: '02/10/2026',
    items: [
      'Automatic feature builds now use fewer AI credits. The app’s code is formatted into short, readable lines, so the build agent reads far less text to find what it needs.',
      'Each build gets a map of the app’s code, runs the release checks once quietly, and continues the same session when it needs to fix a failed check instead of starting again. The app works exactly as before.'
    ]
  },
  {
    version: '0.25.0',
    date: '02/10/2026',
    items: [
      'Box details can now be collapsed in the controller-box inspector and close automatically when a component is selected, keeping that component’s controls in view. (suggested in #14)'
    ]
  },
  {
    version: '0.24.0',
    date: '02/10/2026',
    items: [
      'Controller boxes now use reusable Small, Medium and Large enclosure sizes in centimetres. Custom sizes can be managed in the device-local Standards library, box templates retain their enclosure dimensions, and the Box details panel scrolls independently. (suggested in #12)'
    ]
  },
  {
    version: '0.23.0',
    date: '02/10/2026',
    items: [
      'Each component placed in a controller box can now have its own optional subname, shown beneath the hardware name in box and room layouts. Subnames are retained in reusable box templates. (suggested in #11)'
    ]
  },
  {
    version: '0.22.0',
    date: '02/10/2026',
    items: [
      'BaldrickInput and BaldrickInput8 are now separate options for project hardware and controller-box plans, with one or eight assignable inputs respectively. (suggested in #10)'
    ]
  },
  {
    version: '0.21.0',
    date: '02/10/2026',
    items: [
      'The hardware library now includes a step-down transformer with typed mains-primary and low-voltage AC-secondary ports, plus reminders to verify its electrical ratings and protection. Existing device libraries receive it once. (suggested in #9)'
    ]
  },
  {
    version: '0.20.0',
    date: '02/10/2026',
    items: [
      'Controller boxes now have Schematic and scale Physical layout views, with rotatable component drawings, enclosure bounds, stacking layers and overlap warnings.',
      'A measurement bell creates a ticket for every component with an unknown footprint. Confirmed dimensions are kept in the device-local hardware library for reuse across projects. (suggested in #7)'
    ]
  },
  {
    version: '0.19.0',
    date: '02/10/2026',
    items: [
      'Feature request titles now start with their number, for example “[Feature] #7 …”, on GitHub and in the Suggest a feature list.',
      'New requests are numbered as soon as they’re submitted, and the builder numbers any request that was raised directly on GitHub.'
    ]
  },
  {
    version: '0.18.0',
    date: '02/10/2026',
    items: [
      'Cable-route pivots now keep hold of the pointer throughout a room-layout drag, so they can be repositioned reliably like other movable items. (suggested in #8)'
    ]
  },
  {
    version: '0.17.0',
    date: '02/10/2026',
    items: [
      'Automatic builds now share a daily allowance of 5,000 AI credits across all requests and users, over a rolling 24 hours.',
      'A Daily build allowance meter on Suggest a feature shows how much of the allowance has been used. It turns amber at 80% and red when the limit is reached.',
      'When the limit is reached, requests stay queued and the meter shows roughly when building restarts.'
    ]
  },
  {
    version: '0.16.0',
    date: '02/10/2026',
    items: [
      'Room labels are larger, sit closer to their objects and scale with the room view; a toolbar control can hide or show all labels.',
      'Controller-box ports now protrude from the enclosure and identify their component and exact input or output.',
      'Cable routes now find live 45-degree paths around room objects as they move. Adding a pivot turns that route into an editable manual path, and pivot dragging is more reliable. (suggested in #6)'
    ]
  },
  {
    version: '0.15.0',
    date: '02/10/2026',
    items: [
      'Requests and build status now tracks AI cost. Each shipped request shows its estimated tokens, AI credits and cost. Hover over it to see the model, the token breakdown and the agent time.',
      'A counter above the stage tabs totals the AI credits, estimated cost, tokens and number of builds across every automatic build, including any that didn’t ship.',
      'Credits are shown as whole numbers. Cost uses GitHub’s rate of $0.01 per AI credit.'
    ]
  },
  {
    version: '0.14.0',
    date: '02/10/2026',
    items: [
      'Room layout now supports pointer-centred mouse-wheel zoom, click-and-drag panning on empty space, and corner controls for zooming or returning home. (suggested in #5)'
    ]
  },
  {
    version: '0.13.0',
    date: '02/10/2026',
    items: [
      'The navigation now wraps on narrow screens and compacts on short screens, so every page remains available without scrolling the navigation. The redundant device-local project label has also been removed. (suggested in #4)'
    ]
  },
  {
    version: '0.12.0',
    date: '02/10/2026',
    items: [
      'The build stages in Requests and build status are now tabs. Select All, Queued, Building, Tested or Shipped to see the requests at that stage, with a count on each.',
      'A Needs attention tab appears when a build failed or the builder asked a question.',
      'The builder now marks a request Tested once it passes every check, while it is being published.'
    ]
  },
  {
    version: '0.11.0',
    date: '02/10/2026',
    items: [
      'The sidebar is shorter and easier to scan now that project actions appear only in the top bar and the promotional tagline has been removed. (suggested in #3)'
    ]
  },
  {
    version: '0.10.0',
    date: '02/10/2026',
    items: [
      'Suggest a feature now submits from inside the app. Select Submit and the request is filed in the background, with your screenshots attached. GitHub no longer opens in a new tab.',
      'Connect GitHub once with a token that is kept only in this browser, so requests are filed under your own account. Disconnect at any time.'
    ]
  },
  {
    version: '0.9.0',
    date: '02/10/2026',
    items: [
      'Shipped feature requests now show the version they were released in, linked to that release on GitHub.',
      'Only requests from approved GitHub accounts (J-Turansky and connorturansky-svg) are built. Requests from other accounts are closed with an explanation and no longer appear in the status list.'
    ]
  },
  {
    version: '0.8.0',
    date: '02/10/2026',
    items: [
      'The Suggest a feature page now shows the total number of requests beside the build-status heading. The total updates whenever the request list loads or refreshes. (suggested in #1)'
    ]
  },
  {
    version: '0.7.0',
    date: '02/10/2026',
    items: [
      'New Suggest a feature page in the sidebar. Describe an idea and add screenshots (paste, drop or choose files). The issue title is taken from your first sentence. It opens a GitHub issue under your own account.',
      'Every request is built automatically, with no approval step. A builder on the build PC picks it up, implements it with the Copilot CLI, tests it and publishes it, usually within 30 minutes.',
      'The page lists every request with its live status: Queued, Building, Shipped, Needs info, Build failed or Declined.'
    ]
  },
  {
    version: '0.6.2',
    date: '02/10/2026',
    items: [
      'Added a small version badge under the Pixel Workbench logo. Select it to open What’s new. It replaces the version label at the bottom of the sidebar.',
      'Releases now fail to stamp if the newest changelog entry does not match the app version or is missing its date.'
    ]
  },
  {
    version: '0.6.1',
    date: '02/10/2026',
    items: [
      'Fixed the page failing to load after an update when the browser still held cached copies of older files. Every script and stylesheet is now versioned, so each release loads as one consistent set.'
    ]
  },
  {
    version: '0.6.0',
    date: '02/10/2026',
    items: [
      'Info / Help moves from the sidebar into a single i button (top bar) that opens a fixed-size dialog with How to use, What’s new, Architecture and Shortcuts tabs.',
      'Added an About summary, an architecture diagram with technical notes, and a keyboard shortcut reference. Press ? anywhere outside a text field to open it.',
      'The sidebar version label now opens What’s new. Changelog entries now show their release date.'
    ]
  },
  {
    version: '0.5.0',
    items: [
      'Controller boxes now anchor the room layout, with coloured rectangular component sections and exposed component-port nodes. Existing loose infrastructure moves into an Unassigned infrastructure box.',
      'Added field devices, port-to-device wiring, combined route warnings on the map, connection deletion and catalog search/category filters.',
      'Added a disposable demo project with real boxes, cables, capacity, warnings and Save demo as project.'
    ]
  },
  {
    version: '0.4.1',
    items: [
      'Added separate How to Use and What’s New tabs, duplicate box parts and clearer capacity bands.',
      'Added port-to-room targets, clearer internal port routing, custom resources and operating limits.',
      'Added a measured physical cable schedule to the wiring guide.'
    ]
  },
  {
    version: '0.4.0',
    items: [
      'Physical room cable routes with draggable pivots and endpoints, scale-based lengths, slack and cable-fit warnings.',
      'Reusable cable standards and hardware definitions, controller-box builder, typed ports and capacity summaries.',
      'Project bill of materials, route visibility and optional signal-flow animation.',
      'Info / Help with usage guidance and version history.'
    ]
  },
  {
    version: '0.3.0',
    items: [
      'Terminal-based visual wiring map with separate PSU, distro, controller and device cards.',
      'Drag connections to reassign supplies, data chains and power injection.',
      'Blank-project action and prop drawing controls.'
    ]
  },
  {
    version: '0.2.0',
    items: [
      '2D room layout with draggable hardware and pixel groups.',
      'Reusable props with image/SVG references and custom pixel positions.'
    ]
  },
  {
    version: '0.1.0',
    items: ['Baldrick pixel, power and injection planning; wiring guide and project export.']
  }
];
export const HOW_TO_USE = [
  [
    'Open the demo',
    'Choose Open demo to explore a sample installation without changing your project. Exit demo restores your project; Save demo as project keeps an editable copy.'
  ],
  [
    'Start with a box',
    'Create a Controller box, then add internal hardware in its editor or choose the destination box in Hardware & power. Older loose components are placed in an Unassigned infrastructure box for review.'
  ],
  [
    'Connect field devices',
    'In Room layout, add a field device from the searchable library. Click a coloured node on a box edge, then click the field device or pixel group. The node identifies its box, internal component and exact port.'
  ],
  [
    'Inspect cable warnings',
    'Select a route for cable length, slack, pivots and the full issue list. A highlighted line and ! indicate short or incompatible wiring; an unassigned physical length is neutral. Delete a custom cable or injection from the route inspector.'
  ],
  [
    'Start a plan',
    'Use Hardware & power to add supplies, distros, Baldrick controllers, BaldrickInput or BaldrickInput8 boards. Add outputs in the Wiring workspace. Data entry and Visual stay in sync.'
  ],
  [
    'Wire the system',
    'Drag between the illustrated component terminals in Visual and follow the glowing wire to its destination. Hover a completed wire or terminal to highlight both ends. Use Split / inject here for a separately fed section. Review capacity and voltage warnings before building.'
  ],
  [
    'Lay out the room',
    'Switch to Room layout. Set room dimensions in metres, drag objects, use the mouse wheel to zoom and drag empty space to pan. Drag a coloured controller-box port to a field device or pixel group and follow the live cable to its highlighted destination; clicking the port and destination still works too. Field devices and flood lights use recognisable plan symbols, with automatic cable endpoints on the nearest logical edge facing the controller box. The corner controls zoom or return the view home. Auto route finds a live 45-degree path around room objects; double-click a route or use Add pivot to make and edit a manual path. Drag pivots and endpoints to follow the real cable, and use Labels to hide or show object and box-port labels.'
  ],
  [
    'Choose physical cables',
    'In Standards, edit your cable colours, connectors and actual lengths. Assign a standard to a room route. Route length, optional slack and spare/shortfall are shown separately.'
  ],
  [
    'Build controller boxes',
    'Create a box and arrange components in Schematic, choosing reusable hardware such as controllers, PSUs, step-down transformers and any documented Baldrick board from the library. Use the zoom controls or mouse wheel for a larger scrollable canvas, and Auto layout to arrange connected parts as a spaced flow chart. Baldrick components show their named real-world power, network, pixel, input, relay and DMX connectors. Every component connector gets a matching inactive box edge port; expand its component group to edit the label or edge and activate only the ports that should become route targets in Room layout and show their component wire. Drag an exact connector to see its wire follow the pointer and route around other parts, then drop it on a destination; linked connectors are filled, and hovering a connector or wire highlights both ends. Expand Box details to apply a reusable enclosure size in centimetres; it collapses when you select a component so that component’s controls take priority. Edit Small, Medium, Large or custom sizes in Standards. Give a placed component an optional subname, such as “12 V feed”; it appears beneath the hardware name. For a generic PSU or Raspberry Pi, choose a common Mean Well LRS or Pi model from Common size guide to fill its reference dimensions, then confirm the exact variant and any case, connector or airflow allowance. Switch to Physical layout for a scale enclosure plan. Use the bell to answer missing-size tickets; confirmed measurements are reused from the device library. Rotate parts, use stacking layers for intentional overlap and resolve enclosure-bound or same-layer overlap warnings. Return to Schematic to connect typed ports and room targets.'
  ],
  [
    'Review and pack',
    'Review the notification strip at the top of any page for grouped electrical, Room layout and component issues; use each category link to open the relevant workspace. Check per-box and project capacity, then open the Bill of materials. Export project JSON for backup and use the Wiring guide and planning CSV in the field.'
  ],
  [
    'Get help',
    'Use the i button in the top bar for this guide, the change log, the Suggest a feature manual, the architecture and keyboard shortcuts. The version badge under the logo opens What’s new.'
  ]
];
// The Suggest a feature manual (i dialog → Suggest a feature). Keep in step with suggest.mjs and automation/builder.py.
export const SUGGEST_GUIDE = [
  [
    'What it is',
    'Suggest a feature lets you ask for a change to Pixel Workbench in plain words. Your request becomes a GitHub issue. An automatic builder then writes the change, tests it and publishes a new version of the app, usually within about half an hour. No coding is needed on your part.'
  ],
  [
    'Who can use it',
    'Requests are built automatically only for the approved GitHub accounts (J-Turansky and connorturansky-svg). Requests from any other account are closed without a build. Anyone can view the request list.'
  ],
  [
    '1. Connect GitHub (once)',
    'The first time you submit, select Connect GitHub. Create a token on the GitHub page that opens (the public_repo permission is pre-selected), copy it and paste it into the app. The token is kept only in this browser and is sent only to GitHub. Your requests and replies are posted under your own account. Disconnect removes it from this browser.'
  ],
  [
    '2. Write your request',
    'Open Suggest a feature in the sidebar. Give it a short Title (at least 5 characters), for example “Voltage drop on room cable routes”. Under What should it do?, describe the idea in a sentence or more: what you want, where in the app and why. Add screenshots by pasting, dropping or choosing files if they help. Submit becomes available once both the title and description are filled in.'
  ],
  [
    '3. Submit',
    'Select Submit. The request is filed in the background and given a number. On GitHub its title becomes “[Feature] #15 Your title”, with the number always first. The same number identifies it everywhere in the app.'
  ],
  [
    '4. Follow its progress',
    'The Requests and build status list on the same page shows every request. Filter it with the tabs. Queued means waiting its turn. Building means the builder is working on it now. Tested means it has passed the checks and is being published. Shipped means it is live, with a link to the version it arrived in and its AI cost. The builder checks for work every 5 minutes and builds one request at a time, oldest first. Reload the page to see the newest version once a request ships.'
  ],
  [
    '5. When the builder needs you',
    'Sometimes the builder needs more detail, or a build fails its checks. The request then moves to Needs attention, and a bell with a number appears in the top bar. Select the bell to jump to those requests. Select Answer the question (or Reply to retry for a failed build), read the builder’s message, type your reply and select Send. Within 5 minutes the builder reads your reply and puts the request back in the queue. The bell clears once you have replied. A request is retried automatically up to 3 times.'
  ],
  [
    '6. Follow-ups after it ships',
    'If a shipped request missed something, you don’t need a new request. For 7 days after it ships, select Add a follow-up on it and describe what is still missing or wrong. The builder reopens the request, builds only your follow-up on top of what is already live and ships it as a new version. Its AI cost is added to the same request. Each request can have up to 5 follow-ups. After 7 days, or for a different idea, submit a new request instead.'
  ],
  [
    'Replying on GitHub',
    'Replies and follow-ups can also be posted as comments on the issue on GitHub; they work the same way. Only comments from the person who raised the request count. Other people’s comments are ignored by the builder.'
  ],
  [
    'Declined requests',
    'The builder declines requests that are out of scope or unsafe, such as anything that would send your data elsewhere. The request is closed with a comment that explains why.'
  ],
  [
    'Costs and the daily allowance',
    'Each build uses AI credits. The counter above the tabs totals the AI credits, estimated cost and tokens of every build, and each shipped request shows its own. A Last 28 days line totals the same figures for recent builds. All requests from all users share an allowance of 5,000 AI credits in any rolling 24 hours, shown by the Daily build allowance meter. When it is full, requests wait in the queue until older builds drop out of the 24-hour window.'
  ],
  [
    'Tips for a good request',
    'Ask for one change per request. Say where in the app it belongs and what should happen, and include examples or numbers if they matter. A screenshot of the area you mean helps the builder find it. If you have two ideas, submit two requests.'
  ]
];
export const ABOUT =
  'Pixel Workbench is a device-local planner for 12 V pixel systems built on Baldrick controllers and FPP. Use it to lay out a room, size power and injection, design controller boxes and produce a wiring guide, bill of materials and channel CSV. Calculations are planning estimates. Confirm ratings and wiring against the actual equipment.';
export const SHORTCUTS = [
  ['?', 'Open this dialog on the Shortcuts tab (outside text fields)'],
  ['Esc', 'Close this dialog or any open editor dialog'],
  ['Tab', 'Move between controls and room objects'],
  ['Enter', 'Select the focused room object'],
  ['Space', 'Select the focused room object'],
  ['← ↑ → ↓', 'Move the focused room object by the snap grid'],
  ['Shift + ← ↑ → ↓', 'Move the focused room object by 1 m'],
  ['Mouse wheel', 'Zoom the room layout or box schematic around the pointer'],
  ['Drag empty room', 'Pan around the room layout'],
  ['Delete', 'Remove the focused cable-route pivot']
];
export const ARCHITECTURE_NOTES = [
  'A static, no-build web app: plain ES modules, HTML and CSS served from dist/. Pushing to main publishes dist/ to GitHub Pages through the Actions workflow.',
  'app.js holds the project state, re-renders the whole interface and derives the global categorized notification strip from shared calculation and layout checks. Every view (wiring, room, boxes, standards, BOM, guide) reads the same project, so changes appear in every view. wiring-graph.mjs renders breadboard-style component faces, live drag wires and connected endpoint highlighting. room.js keeps the room camera zoom and pan while the layout is open, draws recognisable field-device and flood-light plan symbols, and previews box-port cables during drag-to-connect. installation-ui.mjs derives top-down component illustrations, connector states, collapsible edge-port groups, a zoomable auto-layout schematic and obstacle-aware wire paths for active edge ports from each component snapshot; installation-model.mjs supplies the named real-world connector catalog, inactive edge-port records for every component connector, nearest-edge room route anchors for field devices and lights, and common component-size guides. Controller-box instances retain their optional subnames, exact ports, schematic positions, rotation and stacking layers. Enclosure sizes and physical component dimensions are reusable device-library standards.',
  'Calculation and data modules (model, layout-model, installation-model) are UI-free. installation-model also finds live octilinear cable paths around room objects while routes have no manual pivots. verify.mjs and verify-installation.mjs exercise them under Node.',
  'Data never leaves the browser. The project and standards library are stored in localStorage. JSON export/import is the backup path, and ?test=1 runs an isolated session that does not save.',
  'Suggest a feature (suggest.mjs) files a [Feature] GitHub issue, titled with its number and the requester’s title, in the background under the requester’s own account, using a token they connect once (stored in this browser, sent only to api.github.com). Screenshots are uploaded to the repo’s feature-assets branch, which is never deployed. It reads request status from the public GitHub issues API and maps shipped requests to versions from builder commit titles (vX.Y.Z: … (#n)); It also reads build-costs.json from the site itself for the AI cost figures, and usage.json from the feature-assets branch for the daily allowance meter. It reads the builder’s latest issue comment and posts the requester’s replies and follow-ups as issue comments; a top-bar bell counts the requester’s requests that need a reply. Together these are the only network calls the app makes. Only allowlisted authors (ALLOWED_AUTHORS) are listed.',
  'automation/builder.py runs every 5 minutes on the build PC (Task Scheduler). Requests from authors outside ALLOWED_AUTHORS are declined and closed. It builds the oldest open allowed request in its own git worktree with the Copilot CLI, which runs with no web, MCP or git access and follows AGENTS.md. To keep AI use low it gives the agent a code map (automation/codemap.py), a single quiet check (check.mjs), Prettier-formatted code it reformats after each run, and resumed sessions for fix rounds. It then rejects off-limits files or new network code, runs stamp-version, verify and a headless browser smoke test, and pushes the release to main as J-Turansky. Each release also appends that build’s AI credits, tokens, model and agent time (read from the Copilot CLI usage summary) to dist/build-costs.json, along with any earlier attempts that didn’t ship. Finally it comments on the issue and closes it. A requester comment on a request shipped within the last 7 days (FOLLOW_UP_DAYS) reopens it, and the builder builds only that follow-up on top of the live version. It starts no new build once 5,000 AI credits have been used in the last 24 hours (DAILY_CREDIT_LIMIT). After each build it publishes that rolling spend to usage.json on the feature-assets branch.',
  'version.mjs is the single source for the version, changelog, help text and shortcuts. info.mjs renders the i dialog.'
];
