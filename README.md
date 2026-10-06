# Pixel Workbench

A device-local 12 V pixel-system planner for Baldrick controllers and FPP channel scheduling.

## Run locally

Serve `dist/` using an HTTP server, for example `python -m http.server 8765 --directory dist`, then open http://localhost:8765. No build or package installation is required. Modern browsers are required. Google Fonts is optional; system fonts are used offline.

Project state is saved in this browser's local storage. Export/import JSON for backups and moving devices. The hosted and localhost copies have separate browser storage. Use `?test=1` for an isolated, non-saving demonstration session.

## Included

- A terminal-aligned wiring canvas with separate PSU, distro, Baldrick and pixel/flood nodes. PSU enclosures show three planned DC terminals, distros show their configured fused outputs, and data/power/injection routes have distinct colours and line styles.
- Drag or click terminals to reassign PSU bank feeds, PSU-to-distro feeds, controller data ports and distro injection outputs. Wiring changes update the form, calculations and guide.
- A Blank project action clears the current plan after confirmation; prop drawing can reset to one point and show or hide lines between pixels.
- A third, 2D room-layout view with draggable controllers, PSUs, distros and pixel groups; pointer-centred mouse-wheel zoom, drag-to-pan and corner camera controls; room dimensions, snap grid, rotation, scalable labels with a visibility control, labelled controller-box ports and live 45-degree cable routing around objects.
- A Props tab with smiley, circle, star, line and grid templates; custom points in wiring order; image/SVG references; placement on free ports or existing chains.
- SVG references are sanitised and rasterised. All reference images are embedded in project JSON; no image is uploaded to a third-party image service. Imports are references, not automatic pixel tracing.
- Colours carry between the room and wiring views. Room cable routes are measured in metres, with draggable pivots and endpoints, optional slack, assigned physical cable standards, and shortfall/spare readouts. Physical routes do not automatically change the electrical wire-drop inputs.
- Controller boxes contain draggable hardware with optional per-instance subnames, typed ports, internal and external planning connections, capacity readouts, and reusable templates. Box details collapse when a component is selected so its controls take priority. Enclosure dimensions use centimetres and can be selected from editable Small, Medium, Large or custom device-local standards. The hardware library includes a step-down transformer with distinct mains-primary and low-voltage AC-secondary ports. A second, scale physical view draws boards and PSUs inside the enclosure, supports rotation and stacking layers, and reports bounds or same-layer overlaps. Missing component dimensions appear as measurement tickets; confirmed sizes are retained in the device-local standards library. Hardware can be duplicated; custom resources and operating limits can be defined in Standards. Project instances retain versioned snapshots until explicitly updated.
- Bill of materials, a physical cable schedule in the wiring guide, project and per-box resource summaries, route filters and optional flow animation.
- A single **i** button (top bar) opens the info dialog with How to use (About summary first), Suggest a feature (a full user manual for requests), What's new, Architecture (diagram and technical notes) and Shortcuts tabs. Press `?` to open Shortcuts. The version badge under the logo opens What's new.

- Baldrick8 and Baldrick17 port/bank mapping; editable controller inputs and connection labels for Switchy, BaldrickInput and BaldrickInput8 boards.
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

Every change bumps `APP_VERSION` in `dist/version.mjs` and adds a `CHANGELOG` entry at the top with its date in DD/MM/YYYY format. On each change, also review `HOW_TO_USE`, `SUGGEST_GUIDE`, `SHORTCUTS`, `ARCHITECTURE_NOTES` and the diagram in `dist/info.mjs`. When CSS or JS changes, run `node stamp-version.mjs`. It stamps `?v=<APP_VERSION>` onto every module import and asset link so browsers don't mix cached and new files. Pushing to `main` publishes `dist/` to GitHub Pages.

## Feature requests (automatic builds)

The **Suggest a feature** page lets anyone give an idea a title, describe it and add screenshots. Selecting **Submit** files a `[Feature]` GitHub issue in the background under the requester's own account, titled `[Feature] #n Title` so the number always comes first. Each user connects GitHub once by pasting a classic token with only the `public_repo` scope. It's kept only in that browser's localStorage and sent only to api.github.com. A classic token is needed because fine-grained tokens can't reach a repository you collaborate on but don't own. Screenshots are uploaded to the `feature-assets` branch, which Pages never deploys, and linked in the issue. The same page lists each allowed request and its build status from the public GitHub API, with the total request count in the heading. Shipped requests show the version they were released in, read from the builder's `vX.Y.Z: … (#n)` commit titles. They also show their estimated tokens, AI credits (whole numbers) and cost, from `dist/build-costs.json`. A counter totals the AI credits, cost, tokens and builds across every automatic build, and a **Last 28 days** line totals the same for recent builds. A **Daily build allowance** meter shows how much of the shared limit of 5,000 AI credits per rolling 24 hours has been used. When the limit is reached it shows roughly when building restarts.

Requesters reply from the status list too. A request in `needs-info` or `build-failed` shows **Answer the question** or **Reply to retry**, with the builder's latest comment, and a bell in the top bar counts the signed-in user's requests waiting on them. For 7 days after a request ships (`FOLLOW_UP_DAYS`, in both `dist/suggest.mjs` and `automation/builder.py`), **Add a follow-up** posts a comment that makes the builder reopen the issue and build just that follow-up as a new version (up to 5 per request). Replies are ordinary issue comments, so commenting on GitHub works the same. The i dialog's **Suggest a feature** tab is the user manual.

### Explicit version rollback

Allowed accounts can file a new request, or reply/follow up on an existing request, with **Roll back the app to v0.65.0** or **Roll forward to v0.70.0** (also “go forward”, “upgrade to” and “move to” a version; replace the target with a real released `vX.Y.Z`; shorthand like `version 61`, `v61` or `0.61` is accepted when exactly one release tag such as `v0.61.0` matches). The latest relevant clarification from the requester or another allowed owner wins; after a ship, only comments after the most recent authentic builder ship note can authorize another rollback. Quoted examples, attachments, hidden comments and other authors cannot authorize one. Missing, ambiguous or unknown targets receive `needs-info`, not a guessed rollback.

This is a **forward-only new release**, never a history rewrite, force-push or automatic retry through Copilot. The trusted builder verifies the exact tag against this repository's remote, checks its commit is in main's history and its `APP_VERSION` matches, then restores that release's app sources, including added and deleted files. The assigned version still exceeds all known versions, and the new dated changelog names the historical target. Current request UI, help, cost ledger, infrastructure, automation, permissions and secrets are not rolled back. There is no AI run for this operation, but its zero-credit record and pending costs still go through the normal accounting, validation and publishing path.

Restoring a release newer than the one currently live (a roll forward, for example after an earlier rollback) works the same way but carries no data-loss warning, because newer code reads older projects. Wording such as “upgrade to dark mode” or “restore a deleted prop”, with no version, stays an ordinary feature request.

A rollback is honoured as requested even when the target's data model, electrical code or saved-project format differs from the current release. Because newer projects can contain fields the restored version does not know, the new changelog entry and the issue's *Shipped in* comment carry a warning: **projects saved by a newer version may lose data fields the restored version does not support; export your project as JSON before reloading the app.** Only the builder, Suggest page (`suggest.mjs`, `suggest.css`, `info.*`), version module and cost ledger stay current, so feature requests keep working. Forbidden files (`automation/`, `.github/`, `AGENTS.md`, checks, `build-costs.json`) are never restored, the restored code may not add network calls beyond the allowed `suggest.mjs`/`usage.json` reads, and the target release's own numerical, round-trip and browser checks must pass; a failed restoration is never handed to the agent to bypass its checks. An ambiguous shorthand (no tag or more than one tag matches) gets `needs-info`. Do not request automation changes or removal of electrical warnings alongside it; those requests are declined.

### Per-version screenshots

After every verified release the builder publishes that build's smoke-test screenshots (every page, every info tab and a mobile view, named like `01-workspace.png`, `info-how.png` and `mobile.png`) to the orphan **`screenshots`** branch, which Pages never deploys: one `vX.Y.Z/` folder per version with a `manifest.json` (version, date, commit, issue, shot list), plus a `README.md` index (newest first, thumbnails, links to every shot, the changelog line and commit/issue links) and an `index.json`. Each publish is a single commit made through the Git Data API as J-Turansky with no force push; a successfully published version folder is never overwritten, PNGs are shrunk with Pillow when installed, and a problem publishing only logs a warning: it never fails or rolls back the release. Only trusted builder code writes the branch.

To cover releases from before this existed, run `python automation/backfill-shots.py` once on the build PC. For every `v*` tag without a folder it exports `dist/` at the tag with `git archive` (from a private bare cache, so no work tree is touched), runs the current `smoke.py --shots` against it and publishes. It is resumable (finished tags are skipped), carries on past a failing tag and records it as failed in the branch index; `--retry-failed` and `--only vX.Y.Z` are available. Old releases are rendered by today's smoke test, so a shot can be missing where an old page lacks a control.

### Builder operation

Only requests from the GitHub accounts in `ALLOWED_AUTHORS` (`J-Turansky` and `connorturansky-svg`) are built. To change the list, edit `ALLOWED_AUTHORS` in both `automation/builder.py` and `dist/suggest.mjs`. Requests from anyone else are labelled `declined` and closed with an explanation. Allowed requests are built with no approval step, by `automation/builder.py` on the build PC:

1. Every 5 minutes (Task Scheduler), it takes the oldest open `[Feature]` issue and labels it `in-progress`.
2. It resets its own worktree (`..\pixel-workbench-build`) to `origin/main` and downloads the issue's screenshots and attached text documents (`.md`, `.txt`, `.csv`, `.json` and similar files added with GitHub's "Attach files"), which the build agent can read but not copy into the app.
3. Normal feature requests run the Copilot CLI headlessly under [AGENTS.md](AGENTS.md). The agent gets only file and shell tools: no MCP servers, no web access, no git or gh, and no tokens. Request text is treated as untrusted. Explicit version rollbacks instead use the trusted restoration path described above, without invoking Copilot or downloading request attachments.
4. It rejects changes outside `dist/` and `README.md` and any new network or `eval` code. Then it runs `stamp-version.mjs`, the verify scripts and `automation/smoke.py` (headless browser, every page and info tab). The agent gets two rounds to fix failures, continuing its own Copilot session (`--resume`) so it doesn't re-read the code.
   To keep AI credits low, the prompt includes a code map (`automation/codemap.py`), the agent runs one quiet `node check.mjs`, and the builder formats changed files with Prettier (`.prettierrc`) so lines stay short.
5. It labels the issue `tested`, then appends the build's AI usage to `dist/build-costs.json`: credits, tokens, model and agent time, from the Copilot CLI usage summary. Usage from earlier attempts that didn't ship is included too. Cost is estimated at $0.01 per AI credit. It then commits, tags `vX.Y.0` and pushes to `main` as J-Turansky. It then waits for the Pages deploy, comments, labels `shipped` and closes the issue.

Other outcomes:

- If the agent needs detail, it labels the issue `needs-info` and asks a question.
- Out-of-scope or unsafe requests are labelled `declined` and closed.
- Failures are rolled back and labelled `build-failed` with the reason.
- If a release has already been pushed but Pages fails or cannot be verified live, the request remains open with `build-failed` and a precise deployment blocker. It is not falsely labelled shipped, and published history is never reset.
- When the requester or an allowed owner replies, a `needs-info` or `build-failed` request is retried (up to 3 attempts). Such a comment on a request shipped in the last 7 days reopens it, removes `shipped` and builds the follow-up on top of the live version (`MAX_FOLLOW_UPS` = 5 per request). Each requester is limited to 100 builds a day.
- Every build gets the whole issue thread in order: the original request, then each builder question or outcome, the requester's replies and notes from the project owner (other allowlisted accounts). Only "Building this now" status notes and comments from other accounts are left out. A follow-up build is told to build only what was asked after the latest "Shipped in" note. Very long threads drop their oldest comments first (`THREAD_CHARS`).
- Across all requests and users, no new build starts once 5,000 AI credits (`DAILY_CREDIT_LIMIT`) have been used in the last 24 hours. A build already running always finishes, so the total can go slightly over. Requests stay queued until older builds drop out of the window. After each build the builder publishes the rolling spend to `usage.json` on the `feature-assets` branch, and the app reads it from there.

Set up the builder once on the build PC:

```powershell
gh auth login -h github.com -w          # as J-Turansky (write access)
pip install playwright; python -m playwright install chromium
.\automation\Install-Builder.ps1          # -Remove to uninstall
```

Logs, screenshots and state are in `%LOCALAPPDATA%\PixelWorkbenchBuilder`. To run it once by hand, use `python automation\builder.py`; add `--dry-run` to build and test without publishing or changing the issue.

## Checks

Run `node check.mjs` to run every check quietly, or `node verify.mjs` and `node verify-installation.mjs` for numerical and validation checks. `python automation\smoke.py dist` loads every page and info tab in headless Chromium. The app also exposes read-plan and set-planning-brightness WebMCP tools where supported.

Run `python -m unittest discover -s automation -p test_builder.py` for offline builder regressions. GitHub, issue mutations, Copilot and publishing are mocked; restoration filesystem tests use disposable repositories, never the installed builder or its shared worktree.

The layout checks cover old-project migration, geometry bounds, state round-trips and rejected unsafe references. Projects remain compatible with the existing v1 JSON format through optional scene/props fields.

Manufacturer source links and detailed model assumptions are in the app's calculation notes and generated wiring guide.
