# Pixel Workbench

A device-local 12 V pixel-system planner for Baldrick controllers and FPP channel scheduling.

## Run locally

Serve `dist/` using an HTTP server, for example `python -m http.server 8765 --directory dist`, then open http://localhost:8765. No build or package installation is required. Modern browsers are required. Google Fonts is optional; system fonts are used offline.

Project state is saved in this browser's local storage. Export/import JSON for backups and moving devices. The hosted and localhost copies have separate browser storage. Use `?test=1` for an isolated, non-saving demonstration session.

## Included

- A terminal-aligned wiring canvas with separate PSU, distro, Baldrick and pixel/flood nodes. PSU enclosures show three planned DC terminals, distros show their configured fused outputs, and data/power/injection routes have distinct colours and line styles.
- Drag or click terminals to reassign PSU bank feeds, PSU-to-distro feeds, controller data ports and distro injection outputs. Wiring changes update the form, calculations and guide.
- A Blank project action clears the current plan after confirmation; prop drawing can reset to one point and show or hide lines between pixels.
- A third, 2D room-layout view with draggable controllers, PSUs, distros and pixel groups; room dimensions, snap grid, zoom, rotation and editable size/colour labels.
- A Props tab with smiley, circle, star, line and grid templates; custom points in wiring order; image/SVG references; placement on free ports or existing chains.
- SVG references are sanitised and rasterised. All reference images are embedded in project JSON; no image is uploaded to a third-party image service. Imports are references, not automatic pixel tracing.
- Colours carry between the room and wiring views. Room cable routes are measured in metres, with draggable pivots and endpoints, optional slack, assigned physical cable standards, and shortfall/spare readouts. Physical routes do not automatically change the electrical wire-drop inputs.
- Controller boxes contain draggable hardware, typed ports, internal and external planning connections, capacity readouts, and reusable templates. Hardware can be duplicated; custom resources and operating limits can be defined in Standards. The device-local standards library holds cable and hardware definitions. Project instances retain versioned snapshots until explicitly updated.
- Bill of materials, a physical cable schedule in the wiring guide, project and per-box resource summaries, route filters and optional flow animation.
- A single **i** button (top bar) opens the info dialog with How to use (About summary first), What's new, Architecture (diagram and technical notes) and Shortcuts tabs. Press `?` to open Shortcuts. The version badge under the logo opens What's new.

- Baldrick8 and Baldrick17 port/bank mapping; editable inputs and Switchy/Input1 connection labels.
- Independent data chains and isolated power sections, multiple PSUs and configurable fused distros.
- Seeds, bullets, 10/20/30 W floods, custom presets and ordered mixed chains.
- Linked visual and form views, copper wire-drop estimates including string pitch, and injection suggestions.
- PSU/branch/distro/bank/channel checks, configurable planning brightness and full-white checks.
- Printable guide, channel/port CSV and validated JSON export/import.

## Limits

This is a planning model, not an electrical certification. Pixel ratings, distro ratings and unknown controller bank limits must be verified. The provisional Mean Well 320 W entry must be replaced with the actual model; RSP-320-12 (320.4 W) and LRS-350-12 (348 W) are available.

Brightness is a linear load estimate. Pixel idle draw, controller consumption, connector losses, temperature effects and cable heating are excluded. Full-white load is checked separately. AWG is not an ampacity rating. FPP export is a human-readable CSV schedule, not a configuration file; no controller is contacted or configured.

Every injection starts a V+-isolated radial power section. Continuous positive wiring with multiple feeds is not solved. Switched relay loads and button lamps are labelled but not sized. Suggestions meet the selected voltage-drop/branch-fuse target; aggregate capacities are checked separately after applying.

Generic box-port links are permissive and warn on mismatches. They are documentation, not electrical assignments, and do not configure or control hardware. Box resource limits are user-editable planning references; verify model-specific ratings. Physical cable fit measures the 2D route rather than vertical height or hidden service loops. Back up the standards library on the same device; project JSON preserves its used snapshots but does not export unused global standards.

## Versioning

Every change bumps `APP_VERSION` in `dist/version.mjs` and adds a `CHANGELOG` entry at the top with its date in DD/MM/YYYY format. On each change, also review `HOW_TO_USE`, `SHORTCUTS`, `ARCHITECTURE_NOTES` and the diagram in `dist/info.mjs`. When CSS or JS changes, run `node stamp-version.mjs`. It stamps `?v=<APP_VERSION>` onto every module import and asset link so browsers don't mix cached and new files. Pushing to `main` publishes `dist/` to GitHub Pages.

## Feature requests (automatic builds)

The **Suggest a feature** page lets anyone describe an idea and add screenshots. The issue title is generated from the first sentence. Selecting **Submit** files a `[Feature]` GitHub issue in the background under the requester's own account. Each user connects GitHub once by pasting a classic token with only the `public_repo` scope. It's kept only in that browser's localStorage and sent only to api.github.com. A classic token is needed because fine-grained tokens can't reach a repository you collaborate on but don't own. Screenshots are uploaded to the `feature-assets` branch, which Pages never deploys, and linked in the issue. The same page lists each allowed request and its build status from the public GitHub API, with the total request count in the heading. Shipped requests show the version they were released in, read from the builder's `vX.Y.Z: … (#n)` commit titles.

Only requests from the GitHub accounts in `ALLOWED_AUTHORS` (`J-Turansky` and `connorturansky-svg`) are built. To change the list, edit `ALLOWED_AUTHORS` in both `automation/builder.py` and `dist/suggest.mjs`. Requests from anyone else are labelled `declined` and closed with an explanation. Allowed requests are built with no approval step, by `automation/builder.py` on the build PC:

1. Every 5 minutes (Task Scheduler), it takes the oldest open `[Feature]` issue and labels it `in-progress`.
2. It resets its own worktree (`..\pixel-workbench-build`) to `origin/main` and downloads the issue's screenshots.
3. It runs the Copilot CLI headlessly under [AGENTS.md](AGENTS.md). The agent gets only file and shell tools: no MCP servers, no web access, no git or gh, and no tokens. Request text is treated as untrusted.
4. It rejects changes outside `dist/` and `README.md` and any new network or `eval` code. Then it runs `stamp-version.mjs`, the verify scripts and `automation/smoke.py` (headless browser, every page and info tab). The agent gets two rounds to fix failures.
5. It commits, tags `vX.Y.0` and pushes to `main` as J-Turansky. It then waits for the Pages deploy, comments, labels `shipped` and closes the issue.

Other outcomes:

- If the agent needs detail, it labels the issue `needs-info` and asks a question.
- Out-of-scope or unsafe requests are labelled `declined` and closed.
- Failures are rolled back and labelled `build-failed` with the reason.
- When the requester replies, a `needs-info` or `build-failed` request is retried (up to 3 attempts). Each requester is limited to 4 builds a day.

Set up the builder once on the build PC:

```powershell
gh auth login -h github.com -w          # as J-Turansky (write access)
pip install playwright; python -m playwright install chromium
.\automation\Install-Builder.ps1          # -Remove to uninstall
```

Logs, screenshots and state are in `%LOCALAPPDATA%\PixelWorkbenchBuilder`. To run it once by hand, use `python automation\builder.py`; add `--dry-run` to build and test without publishing or changing the issue.

## Checks

Run `node verify.mjs` and `node verify-installation.mjs` for numerical and validation checks. `python automation\smoke.py dist` loads every page and info tab in headless Chromium. The app also exposes read-plan and set-planning-brightness WebMCP tools where supported.

The layout checks cover old-project migration, geometry bounds, state round-trips and rejected unsafe references. Projects remain compatible with the existing v1 JSON format through optional scene/props fields.

Manufacturer source links and detailed model assumptions are in the app's calculation notes and generated wiring guide.
