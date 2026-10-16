export const ABOUT =
  'Pixel Workbench is a device-local planner for 12 V pixel systems built on Baldrick controllers and FPP. Use it to lay out a room, size power and injection, design controller boxes and produce a wiring guide, bill of materials and channel CSV. Calculations are planning estimates. Confirm ratings and wiring against the actual equipment.';
export const APP_VERSION = '0.98.0';
export const ARCHITECTURE_NOTES = [
  'Room component tiles use their configured snapshot colour as a solid fill, retaining the existing fallback. Luminance selects black or white names and symbols for contrast; hover and keyboard focus change only the border, and box selection keeps its separate outline. Zoom visibility, layout and saved settings are unchanged.',
  'Room presentation uses roomPresentationLayout for the enclosure title/content grid and exterior port label areas. roomPortGeometry supplies unchanged exact perimeter markers to drawing, overlay pointer targets, wire previews and paint-only cable extensions. Physical departures, saved pivots, dimensions and cable quantities remain separate and unchanged; deliberately offset open ends retain their physical coordinates.',
  'Room names wrap in dedicated screen-space areas with a 10-pixel footprint gap and try nearby alternatives before hiding. Selected names reserve space first. Exterior port callouts reveal independently from component detail at six-pixel marker spacing, expand into ordered readable rows and use configuration-derived unique compact identifiers. Leaders associate each callout with its unchanged exact marker; full identities remain in inspection controls. Reservations avoid equipment, other labels and displayed cable lanes.',
  'Room decoration metrics are transient: name wrapping and compact-port widths are cached across renders, screen transforms are read before caption writes, and queued paints coalesce. Ordinary panning retains world-anchored captions between 80-pixel viewport refreshes and refreshes alternatives on release; fitting forces fresh decoration bounds. None of these caches enters project storage.',
  'Room component tiles and their existing hardware symbols appear when projected cells reach 32 by 24 screen pixels, with lower exit thresholds for stable transitions. Each bounded 14-pixel component name reveals independently; a long or crowded name never collapses the collection. Exact port markers depend on edge spacing, not component names. Port labels retain their independent spacing and collision checks. Component content replaces the equipment summary immediately. The title/content grid, screen-space reservations and semantic detail decisions are transient and never enter saved project geometry.',
  'Room cables retain world-space geometry and saved endpoint offsets. Screen-sized endpoint/pivot markers use a separate overlay above equipment; exact port tips remain interactive above it. Transparent hit regions are separate from paint. Screen-space proximity checks offer an exact-connection chooser for overlapping cable targets without moving paths. Nonzero saved endpoint offsets remain deliberate open ends, shown with dashed markers and accessible unconnected descriptions.',
  'Box builder side-panel toggles retain session-only visibility independently for the hardware library and box/component inspector. Hidden panels leave the grid and keyboard navigation; responsive columns give the space to the editor. Toggling updates the existing DOM and redraws schematic wires without changing project data, canvas zoom, selection or panel contents.',
  'Box builder Port list reads the same exact installation connections and edge-port mappings as Schematic. Compatible internal links are validated before atomic replacement and both endpoint dropdowns derive from one saved link. Generated edge mappings stay fixed; activation is shared with Schematic and Room layout. Room-connected endpoints are read-only in the list. Native component and edge disclosures retain session-only expansion state.',
  'button-help.mjs adds short native hover titles using the existing button action hooks. Delegated pointer and focus events cover page renders, dialogs and in-place controls without observing room drawing mutations; authored titles and all actions remain unchanged. Help is device-local and does not alter saved data.',
  'Room wire-flow markers use the existing inverse camera scale (--room-unit) for a constant 5 px screen diameter. Animation paths, route geometry, colours and reduced-motion handling are unchanged.',
  'Standards uses native disclosures, initially closed, with session-only expansion state. Field edits persist through libraryTransact without rebuilding the app; card headings, versions and search metadata update in place with inline pending/saved feedback. Structural library changes still render the views, and persistence failures roll back visibly. Project snapshots remain unchanged until explicit Sync/Update.',
  'Room layout adds blank controller boxes or saved box templates through the existing project transaction. Template instances reuse installation-model copying of hardware, exact ports and internal links; ensureScene keeps measured enclosure sizes, and the new box is selected at the room centre. Templates remain in the shared device-local library.',
  'Room camera Fit all frames rotated physical footprints. Fit Selected iteratively measures the enclosure, external name, port callouts and selection targets after each scale change, with padding below camera controls and within the scroll viewport beside the inspector. Transient canvas gutters allow framing decorations near site boundaries; only the drawing SVG permits overflow, still clipped by its scroll container. Camera changes never alter placements or cable measurements.',
  'Room port symbols, wiring previews and measured cable anchors share roomPortGeometry, with an explicit presentation mode for visible perimeter markers and unchanged physical mode for measurements, including box rotation. A tip layer keeps perimeter dots visible and selectable above neighbouring object drawings, forwarding interaction to their original keyboard-accessible exact ports and following movement. Automatic routes check endpoint enclosures and padded obstacles, retain clear direct paths and use outward box departures plus nearby clear grid cells for detours; unavailable paths show warning markers without crossing wires. Manual pivots and the Auto route off setting retain user control.',
  'With Labels on, room equipment names remain external at every scale without truncation or duplicate internal titles. Component names fit individually without shrinking screen-sized text. Labels off hides names and callouts but keeps component symbols and exact markers. The inspector retains full identities at every scale. The dashed selection outline has a screen-sized gap and does not represent an enclosure or change its measured footprint.',
  'installation-room shows a hovered, focused or selected route’s assigned cable snapshot name beside its longest segment when Labels is on. Labels follow route and pivot movement with screen-sized text on a light text surface; they do not change geometry, measurements or saved cable assignments.',
  'The native Project summary disclosure starts closed on each load and keeps its open/closed state across page renders in the current session. Its coloured bars distinguish statistics, not warning severity; project notifications remain separate and visible.',
  'A static, no-build web app: plain ES modules, HTML and CSS served from dist/. Pushing to main publishes dist/ to GitHub Pages through the Actions workflow.',
  'Calculation and data modules are UI-free. installation-model separates logical schematic coordinates from measured physical placement, validates exact typed endpoints across boxes and routes around physical obstacles. Camera and Labels changes do not affect cable lengths. Cached routes are invalidated by moved endpoints and intersecting obstacles. Node model checks and real Chromium workflows exercise these contracts.',
  'Project data stays device-local in localStorage. Save project backs up the project and its used snapshots; Standards > Back up library separately includes unused global components, sizes, cables and templates. Restore library validates the complete file before replacing it. Project and library changes render successfully before persistence. ?test=1 does not save the project.',
  'Explicit release rollback bypasses Copilot: the trusted builder resolves the latest allowed target against this repository’s remote tags, checks main ancestry, restores the release’s app files (not the builder, checks or ledger) with a data-loss warning, and applies a new monotonic version and dated target changelog. Current request UI, infrastructure and cost accounting are preserved. Unclear or ambiguous targets need information; normal feature requests still use the restricted agent and the same release checks.',
  'app.js owns the shared project and library. All planning views read that state; supported box-contained controllers contribute electrical assignments without double counting. room.js maps a normalized configured-box drawing onto measured footprints and selects stable detail by projected size. Strokes/text are bounded in screen space; active port nodes and physical anchors persist. Dense overlapping targets use an anchored exact-port chooser with keyboard access. installation-ui keeps controller/button builders and logical schematic positions separate from physical coordinates, rotation and stacking. Explicit Sync/Update preserves stable identities, supported overrides and links; removals/conflicts require confirmation. Automatic routing avoids physical obstacles independently of labels and reports unsolved paths; manual pivots, cable standards and slack remain saved.',
  'layout-model seeds pixel rows using the visible room entities, not the number of hardware items contained inside boxes. It repairs negative pixel-row coordinates from the earlier initializer in the current scene; nonnegative saved placements stay unchanged and project validation remains strict.',
  'Box-builder schematic routing compares left and right anchors at each exact component connector and selects the shortest clear orthogonal path around parts and active edge ports. Completed wires and drag previews share this routing; direction/type compatibility, saved logical endpoints and physical cable measurements do not change.',
  'Power assignments can be explicitly unassigned while planning. Adding or linking controllers and distros uses existing free PSU terminals without creating supplies. Shared PSU removal clears assignments and linked components/cables while preserving loads; missing power remains an electrical error warning, not a structural validation failure.',
  'Suggest a feature (suggest.mjs) files a [Feature] GitHub issue, titled with its number and the requester’s title, in the background under the requester’s own account, using a token they connect once (stored in this browser, sent only to api.github.com). Screenshots are uploaded to the repo’s feature-assets branch, which is never deployed. It reads request status from the public GitHub issues API and maps shipped requests to versions from builder commit titles (vX.Y.Z: … (#n)); It also reads build-costs.json from the site itself for the AI cost figures, and usage.json from the feature-assets branch for the daily allowance meter. It reads the builder’s latest issue comment and posts the requester’s replies and follow-ups as issue comments; a top-bar bell counts the requester’s requests that need a reply. Together these are the only network calls the app makes. Only allowlisted authors (ALLOWED_AUTHORS) are listed.',
  'The scheduled builder receives complete issue bodies and paginated allowed-author threads through CLI stdin. The restricted worker has file/shell tools, no Git/history, web, MCP or browser-control tools, and cannot edit tests. Maintainers handle broader investigation. Trusted release code rejects forbidden changes and runs check.mjs, including behavioural and performance regressions, plus screenshot smoke checks. Tested denotes checks only. After verified Pages deployment the builder marks shipped but leaves the issue open for requester acceptance; follow-ups remain available while open or seven days after closure. Existing author restrictions, release/rollback verification, accounting, 5,000-credit daily budget and separate screenshot publication remain in place.',
  'version.mjs is the single source for the version, changelog, help text and shortcuts. info.mjs renders the i dialog.'
];
export const CHANGELOG = [
  {
    version: '0.98.0',
    date: '16/10/2026',
    items: [
      'Restored solid configured colours on room component tiles with contrasting names and symbols, retaining their fills during focus and selection at every component-detail scale (suggested in #70).'
    ]
  },
  {
    version: '0.97.0',
    date: '15/10/2026',
    items: [
      'Added spaced, wrapping equipment names and earlier independent compact port callouts with exact-marker leaders; Fit Selected now measures external labels and usable canvas space without changing physical layout or wiring (suggested in #69).'
    ]
  },
  {
    version: '0.96.0',
    date: '15/10/2026',
    items: [
      'Kept overview box names visible during selection and revealed component tiles, hardware symbols, names and exact port detail independently at smaller projected sizes, without changing enclosure footprints or cable geometry (suggested in #68).'
    ]
  },
  {
    version: '0.95.0',
    date: '15/10/2026',
    items: [
      'Coordinated room box title and content space with exterior port labels, suppressed crowded labels and overview count badges, and replaced unreadable component mosaics with the existing equipment symbol without changing physical geometry or exact cable endpoints (suggested in #67).'
    ]
  },
  {
    version: '0.94.0',
    date: '14/10/2026',
    items: [
      'Attached room side and bottom port markers to their enclosure perimeter, moved labels to the box side and joined displayed cables to the exact markers without changing saved physical routes or cable measurements (suggested in #66).'
    ]
  },
  {
    version: '0.93.0',
    date: '13/10/2026',
    items: [
      'Made room names readable without shrinking text, wrapped component names at detail scale, added meaningful compact port identifiers and keyboard-accessible full names in the inspector, and kept cable metadata quiet until highlighted (suggested in #65).'
    ]
  },
  {
    version: '0.92.0',
    date: '13/10/2026',
    items: [
      'Replaced tiny room-box mosaics with enclosure symbols and compact equipment summaries, revealing configured components only when projected space is readable. Added stable detail thresholds and exact-port group cues while retaining physical cable anchors (suggested in #64).'
    ]
  },
  {
    version: '0.91.0',
    date: '13/10/2026',
    items: [
      'Kept room cable strokes and port/pivot markers small through zoom, raised endpoint markers above equipment, identified open ends and added an exact-connection chooser for overlapping cable targets without moving saved paths (suggested in #63).'
    ]
  },
  {
    version: '0.90.0',
    date: '13/10/2026',
    items: [
      'Added independent menu buttons to hide and restore the hardware library and box/component details, giving the box editor more room across its views (suggested in #62).'
    ]
  },
  {
    version: '0.89.0',
    date: '13/10/2026',
    items: [
      'Added a collapsible controller-box port list with reciprocal connection dropdowns, connected/outstanding colours and box edge activation synchronized with Schematic (suggested in #61).'
    ]
  },
  {
    version: '0.88.0',
    date: '13/10/2026',
    items: [
      'Added short hover explanations to buttons across planning views, dialogs and feature requests while keeping existing port details (suggested in #59).'
    ]
  },
  {
    version: '0.87.0',
    date: '13/10/2026',
    items: [
      'Reduced room wire-flow markers to a fixed 5 px screen diameter so they stay small when zooming in (suggested in #60).'
    ]
  },
  {
    version: '0.86.0',
    date: '13/10/2026',
    items: [
      'Grouped Standards into initially closed expandable sections. Edits now save in place without refreshing the page, keep focus and expanded cards, and show inline pending, saved or invalid-field feedback.'
    ]
  },
  {
    version: '0.85.0',
    date: '13/10/2026',
    items: [
      'Added a Controller box button in Room layout with a dropdown for an empty box or saved box template, placing and selecting the new enclosure at the room centre (suggested in #57).'
    ]
  },
  {
    version: '0.84.0',
    date: '13/10/2026',
    items: [
      'Added Fit all to the room camera and zoom stops at the all-object overview and selected-object detail view; pause the wheel gesture or press zoom again to continue past a stop (suggested in #56).'
    ]
  },
  {
    version: '0.83.0',
    date: '13/10/2026',
    items: [
      'Moved room wires to the outer tips of their exact box nodes and improved automatic detours around objects, including rotated boxes and blocked grid points near endpoints. Unavailable paths show a warning marker instead of a crossing wire; manual pivots remain editable (suggested in #55).'
    ]
  },
  {
    version: '0.82.0',
    date: '13/10/2026',
    items: [
      'Improved room box label readability across zoom levels, kept box names visible in overview and detail, and replaced the oversized rounded selection outline with a compact dashed indicator (suggested in #54).'
    ]
  },
  {
    version: '0.81.0',
    date: '13/10/2026',
    items: [
      'Added the assigned physical cable standard name beside the selected room route, following route edits and respecting the Labels toggle (suggested in #52).'
    ]
  },
  {
    version: '0.80.0',
    date: '13/10/2026',
    items: [
      'Made the project statistics collapsible and closed by default, explained the decorative category colours, and added space between the bars and readable labels. Notifications remain visible when the summary is closed (suggested in #50).'
    ]
  },
  {
    version: '0.79.0',
    date: '13/10/2026',
    items: [
      'Box-builder schematic wires now compare both sides of each component and use the shortest clear route, including drag previews and connections to box edge ports. Port types and logical connections remain unchanged (suggested in #49).'
    ]
  },
  {
    version: '0.78.0',
    date: '12/10/2026',
    items: [
      'Stopped automatic PSU creation when adding hardware or linking box controllers. Supplies can be removed even when in use or the last one; loads remain in the plan with unassigned supplies and missing-power warnings. Hardware supply selectors now include Unassigned (suggested in #48).'
    ]
  },
  {
    version: '0.77.0',
    date: '12/10/2026',
    items: [
      'Fixed negative initial pixel-room coordinates after hardware moves into boxes, which blocked edge-port activation, component placement and internal wiring through shared project validation. Existing negative pixel rows in the current scene are repaired without moving valid placements (suggested in #47).'
    ]
  },
  {
    version: '0.76.0',
    date: '12/10/2026',
    items: [
      'Forward repair of configured room boxes, measured scaling, deep zoom, readable labels and precise individual-port wiring. Dense targets use a real-port chooser; camera and Labels changes preserve physical routes.',
      'Restored separate controller/button builders, per-button types, colours, sizes and names, and immediate Ethernet-count updates. Existing identities and unrelated wires survive edits; connected removals require confirmation.',
      'Separated schematic and physical placement. Explicit template/standards updates preserve supported instance overrides and identities, remap internal links and report conflicts. Added a separate validated global-library backup.',
      'Fixed cross-box capacity and save-after-render consistency. Reduced large-installation redraw/routing work with measured interaction performance gates.',
      'Added deterministic model regressions and 25 real browser workflows covering wiring, inspector edits, cancellation/removal, standards/templates, cyclic schematics, measured physical layout, zoom, routing, exports and persistence, alongside existing electrical and smoke checks.',
      'Long feature requests and complete issue threads are no longer silently truncated. Build checks are not represented as requester acceptance; shipped requests remain open for verification, and requests beyond worker capabilities need maintainer investigation.'
    ]
  },
  {
    version: '0.75.0',
    date: '12/10/2026',
    items: [
      'Restored the app from v0.70.0 (suggested in #46).',
      'Warning: Projects saved by a newer version may lose data fields this restored version does not support. Export your project as JSON before reloading the app.'
    ]
  },
  {
    version: '0.74.0',
    date: '06/10/2026',
    items: [
      'Roll-forward requests now work: “Roll forward to v0.70.0”, “go forward”, “upgrade to” or “move to” a released version restore that release as a new version, just like a rollback. A release newer than the live one carries no data-loss warning. Requests such as “upgrade to dark mode” or “restore a deleted prop” remain ordinary feature requests.'
    ]
  },
  {
    version: '0.73.0',
    date: '06/10/2026',
    items: [
      'Every release’s test screenshots (all pages, info tabs and mobile) are now kept per version on the screenshots branch of the GitHub repository, with an index README and links to the commit and request. Not deployed to the live site; the app itself is unchanged.'
    ]
  },
  {
    version: '0.72.0',
    date: '06/10/2026',
    items: [
      'Restored the app from v0.52.0 (suggested in #45).',
      'Warning: Projects saved by a newer version may lose data fields this restored version does not support. Export your project as JSON before reloading the app.'
    ]
  },
  {
    version: '0.71.0',
    date: '06/10/2026',
    items: [
      'Restored the app from v0.61.0 (suggested in #44).',
      'Warning: Projects saved by a newer version may lose data fields this restored version does not support. Export your project as JSON before reloading the app.'
    ]
  },
  {
    version: '0.70.0',
    date: '06/10/2026',
    items: [
      'Rollback requests are now honoured as asked, even when the target version has a different data model: the app is restored from the release tag as a new version. Shorthand such as “version 61”, “v61” or “0.61” works when exactly one release matches. (suggested in #44)',
      'Warning: projects saved by a newer version may lose data fields the restored version does not support. Export your project as JSON before reloading the app after a rollback.'
    ]
  },
  {
    version: '0.69.0',
    date: '06/10/2026',
    items: [
      'Approved requesters can ask for an explicit released-version rollback. The trusted builder restores that release as a new release, keeps the current request tools and accounting, warns that newer saved projects may lose data, and asks for clarification when a target is missing or ambiguous.'
    ]
  },
  {
    version: '0.68.0',
    date: '06/10/2026',
    items: [
      'Configured room boxes again show a contained name and port summary, readable full component names and symbols, exact colour-coded edge ports, and drag wiring between real ports; unconfigured migrated boxes now clearly identify inactive edge ports instead of inventing them. (follow-up to #43)'
    ]
  },
  {
    version: '0.67.0',
    date: '06/10/2026',
    items: [
      'Room layout now fits whole sites or selected equipment, zooms from real scene dimensions into small boxes, keeps every typed edge port usable at all scales and magnifies the exact focused port without changing physical geometry. (suggested in #43)'
    ]
  },
  {
    version: '0.66.0',
    date: '06/10/2026',
    items: [
      'Room layout now uses projected-size detail levels with readable box ports and screen-space line weights, so site overviews stay clear while close editing reveals internals without oversized outlines. (suggested in #42)'
    ]
  },
  {
    version: '0.65.0',
    date: '02/10/2026',
    items: [
      'Measured controller boxes now scale their outlines, internal controls, text and port labels together, keeping the drawing in proportion at every room zoom level. (follow-up to #40)'
    ]
  },
  {
    version: '0.64.0',
    date: '02/10/2026',
    items: [
      'Saved controller boxes now receive the current non-overlapping schematic layout, not only boxes created after the routing update. (follow-up to #36)'
    ]
  },
  {
    version: '0.63.0',
    date: '02/10/2026',
    items: [
      'Placed network switches now update their schematic connectors when their Ethernet port count changes, and Room layout can cable compatible ports between separate boxes. (suggested in #41)'
    ]
  },
  {
    version: '0.62.0',
    date: '02/10/2026',
    items: [
      'Room layout objects can now be removed from the inspector, and boxes and field devices start at measured or practical plan sizes. (suggested in #40)'
    ]
  },
  {
    version: '0.61.0',
    date: '02/10/2026',
    items: [
      'Box schematic wires now stay in clear lanes around every component and use a faster router for smooth editing. (follow-up to #36)'
    ]
  },
  {
    version: '0.60.0',
    date: '02/10/2026',
    items: [
      'The Room layout inspector now scrolls and groups its controls into collapsed, toggleable sections. (suggested in #39)'
    ]
  },
  {
    version: '0.59.0',
    date: '02/10/2026',
    items: [
      'Room plans draw every button-box control as a recognisable push button using its colour from the box builder. (suggested in #38)'
    ]
  },
  {
    version: '0.58.0',
    date: '02/10/2026',
    items: [
      'Each control in a button box has a colour dropdown, with its selection shown in room plans and itemised in the bill of materials. (suggested in #37)'
    ]
  },
  {
    version: '0.57.0',
    date: '02/10/2026',
    items: [
      'Box schematics prevent component overlap and use type-coloured edge connections that route around components and their text. (suggested in #36)'
    ]
  },
  {
    version: '0.56.0',
    date: '02/10/2026',
    items: [
      'BaldrickInput8 now supplies its two pixel outputs, room pixels can be placed before connection with a visible warning, and top statistics include controller-box pixel, PSU, input and audio capacity. (follow-up to #34)'
    ]
  },
  {
    version: '0.55.0',
    date: '02/10/2026',
    items: [
      'Room layout uses lighter compact labels, evenly spaces visible box ports and routes cables around controls and their labels with fewer turns. (suggested in #35)'
    ]
  },
  {
    version: '0.54.0',
    date: '02/10/2026',
    items: [
      'Baldrick8 and Baldrick17 controllers added directly inside a controller box now provide usable pixel outputs for room floods, strings and props. (suggested in #34)'
    ]
  },
  {
    version: '0.53.0',
    date: '02/10/2026',
    items: [
      'Box builder now separates controller and button-box tools, with custom 1–5 button enclosures, individual ports and Small, Medium or Large controls. (follow-up to #29)'
    ]
  },
  {
    version: '0.52.0',
    date: '02/10/2026',
    items: [
      'Room layout now uses one controller-box title, labelled pill-shaped edge ports, port-matched cable colours and button endpoints that meet the visible symbol. (suggested in #33)'
    ]
  },
  {
    version: '0.51.0',
    date: '02/10/2026',
    items: [
      'Controller-box schematics now open on a larger scrollable canvas, keeping labels readable while leaving more space between components. (suggested in #32)'
    ]
  },
  {
    version: '0.50.0',
    date: '02/10/2026',
    items: [
      'Pixel strings, individual floods, saved presets and prop models can now be added directly from Room layout. (suggested in #31)'
    ]
  },
  {
    version: '0.49.0',
    date: '02/10/2026',
    items: [
      'Inactive box edge ports are now hidden from the controller-box schematic, leaving only activated route targets around the layout. (suggested in #30)'
    ]
  },
  {
    version: '0.47.0',
    date: '02/10/2026',
    items: [
      'Distinct accent colours, stronger borders and softly tinted work areas now separate summaries, editors, inspectors and card groups across the planning tools. (follow-up to #26)'
    ]
  },
  {
    version: '0.46.0',
    date: '02/10/2026',
    items: [
      'Room-layout buttons now have a colour selector, carry that colour into the bill of materials and show their connected box port beneath the device name. (suggested in #29)'
    ]
  },
  {
    version: '0.45.0',
    date: '02/10/2026',
    items: [
      'Room layout controller boxes now use compact component names with their icons, shorter edge-port labels and colour-coded port-type rings while retaining full details on hover. (suggested in #28)'
    ]
  },
  {
    version: '0.44.0',
    date: '02/10/2026',
    items: [
      'Long text and data panels now scroll independently, useful headings can collapse, and stronger colour accents and borders make each section easier to scan. (suggested in #26)'
    ]
  },
  {
    version: '0.43.0',
    date: '02/10/2026',
    items: [
      'Controller-box edge ports now keep their labels inside the schematic and use the matching component-standard colour. (suggested in #27)'
    ]
  },
  {
    version: '0.42.0',
    date: '02/10/2026',
    items: [
      'Each controller box can now sync changed hardware names, colours, ports and other component standards while keeping its layout and connections. (suggested in #25)'
    ]
  },
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
    'Read button help',
    'Pause the pointer over a button to see a short explanation of its action. Existing detailed port tooltips are preserved. Buttons still work with Tab and Enter or Space; hovering does not activate them.'
  ],
  [
    'Edit shared standards',
    'Open Standards and expand Enclosure sizes, Physical cable standards or Hardware & accessories. All sections start closed on a fresh load; expanded sections and hardware cards stay open during this session. Leave an edited field to save it on this device and check its inline saved confirmation. Invalid fields show Not saved. Editing does not refresh the page or move focus; existing project snapshots still require explicit Sync/Update. Demo edits are not saved to your library.'
  ],
  [
    'Show project statistics',
    'Expand Project summary above any planning page to see device capacity, estimated load, PSU budget, input/audio ports and plan-check counts. It starts closed to save space; your choice is kept while moving between pages until you reload. Coloured bars distinguish statistics only, not status or limits. Review Plan checks and project notifications for warnings; notifications stay visible when the summary is closed.'
  ],
  [
    'Open the demo',
    'Choose Open demo to explore a sample installation without changing your project. Exit demo restores your project; Save demo as project keeps an editable copy.'
  ],
  [
    'Start with a box',
    'In Room layout, choose + Controller box, then select a new empty box or a saved box template from the dropdown. The box is placed and selected at the room centre; drag it into position and use Edit box internals to configure its hardware. Save as template in Box builder makes reusable boxes available in this dropdown. You can also create boxes in Box builder or choose the destination box in Hardware & power. Older loose components are placed in an Unassigned infrastructure box for review.'
  ],
  [
    'Connect field devices',
    'In Room layout, add a field device from the searchable library. Click a coloured node on a box edge, then click the field device or pixel group. The node identifies its box, internal component and exact port.'
  ],
  [
    'Reveal room box detail',
    'With Labels on, equipment names wrap outside their footprints with breathing room and try alternative positions when crowded; selected names take priority. Component tiles use their configured solid colours with contrasting symbols and names whenever visible; selecting a box preserves those fills and adds a separate outline. Individual port callouts appear independently of component detail, using unique compact identifiers and leaders to their exact markers. Full names remain available by focusing components or using the inspector and Ports control. Fit selected frames the enclosure, external names and port interface with padding below the camera controls. Detail depends on projected spacing, not a universal zoom percentage. Labels off hides names while preserving symbols and exact endpoints.'
  ],
  [
    'Inspect cable warnings',
    'Select a route for cable length, slack, pivots and the full issue list. Only the selected cable shows editable pivots; endpoint markers remain visible above equipment. Dashed endpoint markers identify deliberately offset, unconnected cable ends. Overlapping cable click regions open Choose connection rather than selecting an arbitrary wire; the inspector Connection dropdown is also available. A dashed line and ! indicate short or incompatible wiring; an unassigned physical length is neutral. Delete a custom cable or injection from the route inspector. Wire flow shows small moving markers that stay the same screen size when zooming; turn it off to hide them.'
  ],
  [
    'Route around room objects',
    'Room wires and wiring previews meet the exact coloured marker on the enclosure perimeter. Port callouts try clear outward positions or an anchored alternative near viewport edges; crowded labels hide without moving endpoints. This display projection preserves saved physical anchors, cable measurements and manual pivots. Dashed open cable ends remain at their saved physical positions. Keep Auto route on for automatic detours around equipment; moving an object recalculates affected routes. Select Add pivot to keep a detour as editable manual points. Existing manual pivots and Auto route off remain intentional overrides. If no clear route is available, a ! marker replaces the wire: select it to review the warning and move equipment rather than treating it as a valid cable path.'
  ],
  [
    'Start a plan',
    'Use Hardware & power to add supplies, distros, Baldrick controllers, BaldrickInput or BaldrickInput8 boards. Supplies are only added explicitly; hardware can remain Unassigned when no free PSU terminal is available. You can remove an in-use or last PSU: its linked box components and cables are removed, but loads remain with missing-power warnings. Choose Unassigned in a supply selector to disconnect a load without deleting the PSU. Resolve all power and safety warnings before physical wiring. Add outputs in the Wiring workspace. Data entry and Visual stay in sync.'
  ],
  [
    'Wire the system',
    'Drag between the illustrated component terminals in Visual and follow the glowing wire to its destination. Hover a completed wire or terminal to highlight both ends. Use Split / inject here for a separately fed section. Review capacity and voltage warnings before building.'
  ],
  [
    'Lay out the room',
    'Set room dimensions in metres, drag equipment, wheel-zoom around the pointer and drag empty space to pan. Fit site frames the measured site; Fit selected reveals the actual configured box without changing its footprint. Detail responds to projected size with stable thresholds. Labels are bounded; long compact names retain full accessible details. All active exact ports remain available; disabled ports stay disabled. Drag or click real endpoints, or use Tab and Enter/Space. Crowded targets open an anchored chooser rather than silently selecting the wrong port. Inputs are blue, pixels green, audio yellow, mains red and Ethernet/DMX/relay outputs white. Add floods, strings, presets or props before connecting them; a visible ! marks an unconnected item. Supported box-contained pixel outputs can connect them later. Inspector edits and deletion preserve unrelated work, with confirmation for affected links. Automatic 45-degree paths avoid physical objects and report unavailable paths; Labels, zoom and selection do not alter physical measurements. Add pivot retains automatic detours as editable manual points. Assign physical cables and service slack separately from electrical wire-drop inputs.'
  ],
  [
    'Read room labels',
    'Keep Labels on to identify boxes where space permits. Overview shows the enclosure, equipment symbol and exact cable attachment dots without component mosaics or count badges. At intermediate scales a short summary appears when it fits. The entire component mosaic appears only when all names fit readable content cells below the title; otherwise use the inspector or Box builder for full configuration. Port labels occupy areas outside the enclosure beside cable departure lanes. Crowded, incomplete or overlapping labels hide rather than shrinking or substituting an identifier. Hover or Tab to an exact port to inspect its full name, even with Labels off. Ports opens the existing keyboard-accessible list of exact component and port names. Cable names appear beside the wire on hover, focus or selection only where clear. The dashed outline identifies selection, not physical clearance. Labels, zoom and selection do not change footprints, connections or cable lengths.'
  ],
  [
    'Check a configured room box',
    'Save a project backup, note the box dimensions, exact connected ports, manual pivots and cable totals, then inspect the same box at Fit all, an intermediate scale and Fit selected or a deeper zoom. Check that labels are outside the enclosure and do not overlap text, cards, markers or cable lanes; each cable must meet its exact marker except deliberately offset open ends. Overview must have no count badges or miniature mosaic, and detailed names must be fully readable. Reload and compare dimensions, connections, pivots and totals with the backup. Release checks and page smoke do not establish visual acceptance of your saved configuration; these visual checks must be performed manually.'
  ],
  [
    'Frame all room components',
    'Use Fit all beside Fit site and Fit selected to frame every placed room object, including rotated equipment and pixel groups. With no objects it fits the site. Zooming out pauses at this overview; zooming in pauses at the selected object’s detail view. Pause scrolling for more than a quarter-second, reverse direction, or activate a zoom button again to continue past the stop. Fit controls remain available by keyboard, and camera changes do not change physical measurements.'
  ],
  [
    'Choose physical cables',
    'In Standards, edit your cable colours, connectors and actual lengths. Assign a standard to a room route. With Labels on, the selected route shows its assigned cable standard name beside the wire; unassigned routes have no cable name label. The label follows endpoint and pivot movement. Route length, optional slack and spare/shortfall are shown separately.'
  ],
  [
    'Build controller boxes',
    'Open Box builder and keep Controller boxes selected to create a box and arrange components in Schematic, choosing reusable hardware such as controllers, PSUs, step-down transformers and any documented Baldrick board from the library. A Baldrick8, Baldrick17 or BaldrickInput8 added directly to a box also appears in Hardware & power and makes its pixel outputs available when adding room floods, strings or props. The summary above every planning page totals pixel, PSU, input and audio capacity from complete boxes as well as loose hardware. Use Sync standards on a box to pull in changed hardware names, colours, ports and other library details while keeping that box’s placement, subnames, limits and connections. The large schematic canvas scrolls on smaller screens so labels remain readable; components cannot overlap, while Auto layout arranges connected parts as a spaced flow chart. Saved boxes from older versions receive this current layout once when opened. Use the zoom controls or mouse wheel to change its scale. Baldrick components show their named real-world power, network, pixel, input, relay and DMX connectors. For a placed network switch, set its Ethernet port count in Component details; its schematic connectors and matching box edge ports update immediately. Every component connector gets a matching inactive box edge port; expand its component group to edit the label or edge and activate only the ports that should appear around the Schematic, show their component wire and become route targets in Room layout. Active ports are outlined in that component standard’s colour, while inactive ports remain available only in the editor. Drag an exact connector to see its type-coloured wire leave the component edge and route around other parts and their text, then drop it on a destination; linked connectors are filled, and hovering a connector or wire highlights both ends. Expand Box details to apply a reusable enclosure size in centimetres; it collapses when you select a component so that component’s controls take priority. Edit Small, Medium, Large or custom sizes in Standards. Give a placed component an optional subname, such as “12 V feed”; it appears beneath the hardware name. For a generic PSU or Raspberry Pi, choose a common Mean Well LRS or Pi model from Common size guide to fill its reference dimensions, then confirm the exact variant and any case, connector or airflow allowance. Switch to Physical layout for a scale enclosure plan. Use the bell to answer missing-size tickets; confirmed measurements are reused from the device library. Rotate parts, use stacking layers for intentional overlap and resolve enclosure-bound or same-layer overlap warnings. Return to Schematic to connect typed ports and room targets.'
  ],
  [
    'Make room in the box builder',
    'Use the three-line Hardware library and Box and component details buttons above the editor to hide either side panel independently. The editor uses the freed space in Schematic, Port list and Physical layout. Press the same button to restore the panel; its contents are retained. Both panels start visible and remember your choice while the app stays open. On narrow screens the library sits above the editor and details below it, so hiding them also reduces scrolling. The buttons work with Tab and Enter or Space.'
  ],
  [
    'Connect ports in a list',
    'In Box builder, choose Port list and expand a component. Each connector has a dropdown of compatible free ports; choosing one updates both ends and Schematic. Choose Not connected to remove an internal link, or choose its matching Box edge to activate that edge. Expand Box edge ports to review their fixed matching connectors, edit labels and edges, and toggle Active. Generated edge mappings cannot be reassigned. Green rows mean connected or active; outstanding or inactive rows have an orange border and a text status. Colours do not indicate electrical safety. Existing room connections are read-only here: edit them in Room layout or Connections. Groups start closed and retain their expansion during this session.'
  ],
  [
    'Route schematic wires',
    'In Box builder, connect the exact component connectors by drag or by selecting the source and destination. Wires automatically use either the left or right side of each component for the shortest clear schematic route; drag previews also choose a side automatically. Moving components recalculates the route without changing its logical ports or physical cable length. If neither side has a clear path, move components or use Auto layout.'
  ],
  [
    'Build button boxes',
    'In Box builder, switch to Button boxes and create a custom enclosure with 1–5 buttons. Set each control’s label, push/illuminated type, colour and Small/Medium/Large size. Changes immediately appear in the preview, room and BOM. Wire each individual active port by drag, click or keyboard. Reducing a connected count lists affected wires and requires confirmation; retained buttons keep their IDs and links. Save and reuse the enclosure as a button template.'
  ],
  [
    'Review and pack',
    'Review grouped electrical, room and component warnings before building. Check box/project capacity, BOM, the wiring guide and planning CSV. Save project backs up used snapshots and placements; use Standards > Back up library separately for all global definitions, measurements, cables, sizes and reusable templates, including unused entries. Restore library validates before replacing your library. Keep both backups before upgrading or restoring an earlier release.'
  ],
  [
    'Get help',
    'Use the i button in the top bar for this guide, the change log, the Suggest a feature manual, the architecture and keyboard shortcuts. The version badge under the logo opens What’s new.'
  ]
];
export const SHORTCUTS = [
  ['?', 'Open this dialog on the Shortcuts tab (outside text fields)'],
  ['Esc', 'Cancel pending port wiring or close an open dialog'],
  ['Tab', 'Move between controls, room objects, exact ports and detailed components; inspect full names'],
  ['Enter / Space on builder menu buttons', 'Hide or restore the hardware library or box/component details'],
  ['Enter / Space on Port list headings', 'Expand or collapse component and box edge port groups'],
  ['Enter / Space on Project summary', 'Show or hide the project statistics'],
  ['Enter', 'Select the focused room object'],
  ['Space', 'Select the focused room object'],
  [
    'Enter / Space on a port',
    'Select an exact source, then connect the exact destination; crowded ports open a chooser'
  ],
  ['Enter / Space on a cable endpoint or pivot', 'Select its exact cable and inspect its route'],
  ['Enter / Space on a cable', 'Select its exact route; focus also reveals assigned cable metadata'],
  ['Esc in Choose connection', 'Close the overlapping-cable chooser'],
  ['← ↑ → ↓', 'Move the focused room object by the snap grid'],
  ['Shift + ← ↑ → ↓', 'Move the focused room object by 1 m'],
  ['Mouse wheel', 'Zoom the room layout or box schematic around the pointer'],
  [
    'Fit site / Fit all / Fit selected',
    'Frame the measured site, all placed room objects or the selected object'
  ],
  ['Drag empty room', 'Pan around the room layout'],
  ['Delete', 'Remove the focused cable-route pivot']
];
export const SUGGEST_GUIDE = [
  [
    'What it is',
    'Your request becomes a GitHub issue. The automatic worker can attempt one focused application change; it has no Git history, web, MCP or browser-control tools and cannot modify test infrastructure. Broader investigations need a maintainer. Passing automated checks is not proof that your requested experience works; verify a shipped change before closing its issue.'
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
    'Queued means waiting; Building means work is in progress. Tested means repository checks passed, not feature acceptance. Shipped means deployed, with its version and cost; the issue stays open for your verification. Reload, exercise the requested workflow and report any regression. The builder checks every 5 minutes and handles one request at a time.'
  ],
  [
    '5. When the builder needs you',
    'Sometimes the builder needs more detail, or a build fails its checks. The request then moves to Needs attention, and a bell with a number appears in the top bar. Select the bell to jump to those requests. Select Answer the question (or Reply to retry for a failed build), read the builder’s message, type your reply and select Send. Within 5 minutes the builder reads your reply and puts the request back in the queue. The bell clears once you have replied. A request is retried automatically up to 3 times.'
  ],
  [
    '6. Follow-ups after it ships',
    'Select Add a follow-up while the shipped issue remains open for verification, or within 7 days after you close it. Describe what is missing or broken. The builder handles only that follow-up on the live version, up to 5 follow-ups per request. A different idea needs a new request.'
  ],
  [
    'Restore an earlier app version',
    'Approved accounts can submit “Roll back the app to v0.65.0” or “Roll forward to v0.70.0” (also “upgrade to”), replacing the number with one released version (“version 61” works when one release matches), or use Add a follow-up within 7 days of shipping. The latest target clarification from you or an approved owner wins. The builder verifies the release and publishes that release’s app under a new, higher version number; it does not rewrite history. Going back to an older version may not understand projects saved by newer versions, so fields it lacks can be lost: export a JSON backup before reloading. Moving to a newer release than the live one carries no such risk. The request tools and costs stay current. Missing or ambiguous versions need a reply before anything is released.'
  ],
  [
    'Replying on GitHub',
    'Replies and follow-ups can also be posted as comments on the issue on GitHub; they work the same way. Comments from the requester or another approved owner can clarify a request. Comments from other accounts are ignored by the builder.'
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
