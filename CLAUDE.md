# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repository.

## Stack & Conventions

**Hard constraint: vanilla HTML, CSS, and JavaScript only — no frameworks, no build step.**

- No frontend frameworks or libraries (React, Vue, Svelte, jQuery, etc.).
- No CSS frameworks or preprocessors (Tailwind, Sass, Less, Bootstrap, etc.).
- No bundlers, transpilers, or build tooling (Webpack, Vite, Babel, TypeScript, npm scripts that compile anything).
- No package.json-driven build pipeline — pages must run by opening the `.html` file or serving the static files as-is.
- Write plain `.html`, `.css`, and `.js` files that run directly in the browser with no compilation step.

## Feature Plan

A single-page portal where students browse and use a growing collection of small
learning tools. Home view shows a catalog of tool cards; picking one switches
the page to that tool's view (hash-routed, e.g. `#fuel-system-overview`)
without a page reload. Built to keep growing: adding tool N+1 never touches existing
tools' code.

### Structure

- `index.html` — the one page: header, catalog view (default), one tool view
  container, footer.
- `tools/<tool-id>/` — one folder per tool (its markup fragment, `.js`, `.css`).
- `tools.js` — shared registry: plain array of `{ id, name, description, entry }`
  metadata. Catalog view renders cards by iterating it; tool views mount by id.
- **Adding a tool later**: create its folder, add one entry to `tools.js`,
  and link its `.css`/`.js` files in `index.html` (plain script/link tags —
  no bundler). Each tool calls `TM.registerTool(id, { mount })` at load time;
  the router calls `mount(container)` when its hash is active. No existing
  tool's files change.

### Data model (localStorage, prefixed `tm.*`)

- None currently — no tool stores anything. `storage.js` (the shared helper
  module) was removed with the Quiz Generator; re-add it if a future tool
  needs persisted state, following the `tm.*`-prefixed key convention.

### Visual direction

Bright Lab, now always dark: the shell (`styles.css` `:root`) permanently
uses the dark navy palette that used to be its `@media (prefers-color-
scheme: dark)` variant — `--bg: #0b1c2c`, `--surface: #0f2033`,
`--text: #eaf3fb`, `--text-muted: #9db6cc`, `--border: #2f5a7d` — chosen
to match the Oil System tool's own palette (by request: "dark background
for all my pages similar to Oil system page"). There is no light theme
or `prefers-color-scheme` branch anymore; `color-scheme: dark` is set
unconditionally. Coral accent (`#ff7b88` on this dark bg, was `#ff5c6c`
on the old light one), pill-shaped buttons and inputs, Fredoka (display)
+ Karla (body) via Google Fonts.

**Catalog tool cards are the one deliberate exception** — kept on their
original light pastel look (coral/teal/amber tints cycling per card)
even though everything else went dark, by explicit follow-up request
("the tools look at the front page to remain unchange[d]"). This needed
a second, separate token set so the cards don't follow the page's own
dark tokens: `--card-tint-1/2/3` (the original light pastel values,
unused anywhere else now that `--tint-1/2/3` no longer exist),
`--card-badge-bg` (back to its original translucent white), and
`--card-text: #16181d` (a fixed dark color for `.tool-card`/
`.tool-card-icon`/`.tool-card p`, since using the page's own `--text`
— now light — would be unreadable on a light pastel card). `.placeholder-
tool` (the three Phase 2 stub pages) is NOT part of this exception and
did go dark along with everything else — only the catalog's own cards
kept the light look.

A second, narrower light-background exception was added later by
request ("for all mouse over explanatory or label boxes, use a light
background in all pages"): every tool's cursor-following tooltip
(`.oil-tooltip`/`.fd-tooltip`/`.ss-tooltip`/`.air-sys-tooltip`/
`.apu-sys-tooltip`/`.fs-tooltip`/`.vlab-tooltip`/`.tf-tooltip`), fixed
`.explain`/`.fd-explain`/`.ss-explain` panel, and permanent reference-
list item box (`.comp-list-item`/`.fd-list-item`/`.ss-list-item`/
`.air-sys-list-item`/`.apu-sys-list-item`/`.fs-list-item`/
`.vlab-edit-parts-item`) now has a light background with dark text,
rather than following the page's own dark `--panel`/`--page`/
`--surface`/`--card` tokens — these are the boxes whose whole job is
showing a part's name/description, so a light background reads like a
label/index-card next to the dark diagram, the same reasoning as the
catalog cards' own exception. Two tools (Air System's
`.air-sys-tooltip`, Virtual Lab's `.vlab-tooltip`) already happened to
use `background: var(--text)` (light, since `--text` is the page's
light foreground color on this dark theme) with `color: var(--bg)`
(dark) and needed no change; every other tool's tooltip/explain/list-
item had been using the dark `--panel`/`--page`/`--card`/`--surface`
tokens and got hardcoded light hex values instead (not new CSS
variables, since each occurrence only needed a background/border/text-
color override, not a reusable token) — a cream/amber tint (`#fffaf0`
background, `#8a5a00` title text) for tools whose accent is amber/
yellow (Oil, APU, Fire, Turbofan System), a pale blue tint (`#f2f8fc`
background, `#1f5c82` title text) for Fuel/Starting System's blue
accent, and a warm pale tint (`#fdf6f0` background, `#a6303f` title
text) for Air System's red accent — body text `#1a2330` (dark navy)
and dimmed/placeholder text `#6b7686`/`#51607a` (gray) throughout,
regardless of each tool's own accent hue. Signal/comparison cards and
other always-visible (not hover-triggered, not a reference-list
item) content panels were left on the page's own dark palette — this
exception is scoped to "explain what I'm pointing at" boxes
specifically, not every piece of static content.

Every tool other than the catalog cards followed the shell dark, either
automatically or by hand:
- **Virtual Lab, Air System, and the placeholder tools** needed no
  changes at all — their CSS already referenced the shared `var(--bg)`/
  `var(--surface)`/`var(--text)`/etc. tokens rather than hardcoding
  colors, so they picked up the new dark values for free. (`.placeholder-
  icon`/`.placeholder-badge` did need their own small fix: they'd
  referenced the now-removed `var(--tint-1)`/`var(--tint-2)` directly;
  repointed to `var(--surface)`/`rgba(255, 123, 136, 0.15)`.)
- **Oil System and Turbofan Engine** already had their own dark reference-
  sheet palette (hardcoded in each tool's own CSS `:root`-equivalent, not
  the shared tokens) and didn't need recoloring — only a font-size pass
  (every `font-size` in both files bumped by exactly +2px), since the
  user flagged the Oil System tool's own small text (10–13.5px range) as
  "a bit too small" once it became the reference for the rest of the site.
- **Fuel System Overview** was the one tool still on a hardcoded *light*
  palette (`--card: #fff`, `--page: #f4f3ee`, box fill `#fff`, text fill
  `#222`, etc.) and needed a full manual repaint to the same Oil-System-
  matching dark navy values, keeping the same custom-property names
  (`--ink`/`--muted`/`--line`/`--card`/`--page`/`--box`) so the rest of
  the file and the JS (which only ever reference these tokens, plus a
  few literal green/red/gray hex codes for valve and pipe state that got
  brightened to match — `#4ade80`/`#f87171`/`#7e93a8`) didn't need
  touching beyond what the tokens now point to. Also got the same +2px
  font-size pass as Oil/Turbofan.

### Phase 1 — Portal shell + 4 tools (current)

- Shell: header, catalog view, hash-routed tool view, footer, tool registry.
- **Fuel System Overview**: interactive SVG diagram of a jet engine's fuel
  system (adapted from a supplied reference file). Toggle between start and
  shutdown flow states; hover a component for its title and description.
  No stored state — purely explanatory, no localStorage key.
- **Oil System Overview**: interactive SVG diagram of a turbofan oil system
  (adapted from a supplied reference file). Switch spool configuration
  (single/twin/triple), toggle supply/scavenge/return circuits on and off,
  hover a component for its title and description. No stored state.
  Both diagram tools keep their own reference-sheet visual style (not the
  portal's Bright Lab palette) since their colors are semantic — e.g. green
  = open/flowing, red = closed or a return line, amber = active selection.
  Both show the hovered component's title/description in a fixed
  `.explain` panel below the diagram (not edit-gated, no stored state —
  just a hover-driven display) rather than a tooltip that follows the
  mouse — replaced the Fuel tool's `.fd-tooltip` and the Oil tool's
  `.tooltip` (position: fixed, repositioned on every `mousemove`) with
  this, by request, since a fixed on-page panel is easier to read than
  text chasing the cursor. Each tool keeps one `.explain`/`.fd-explain`
  element with an `.e-title`/`.e-desc` pair, a default "Hover a
  component" prompt shown via a `:not(.has-value)` dimmed state, and the
  same mouseenter/mouseleave swap the old tooltip code used — only the
  display target changed, not the hover-detection logic.

  (Fuel System's `.fd-explain` and Starting System's `.ss-explain`
  existed in name/description here but had actually dropped out of
  `fuel-system-overview.js`/`starting-system.js` at some point without
  this doc catching up — both tools' `.box`/`.ss-box` hover handlers
  only toggled `.is-hovered` highlighting, with no title/description
  shown anywhere except the static reference list below. Re-added by
  follow-up request — "for ... 'Fuel system flow' and 'Engine Starting
  System — Twin-Spool Start Sequence': I want mouse over explanation on
  all parts based on rectangular block" (sent together with the Oil
  System tool, which already had this working correctly and needed no
  change) — both now call the same `showExplain(key)`/`hideExplain()`
  pair from their existing `mouseenter`/`mouseleave` handlers, so no
  hover-detection code changed, only the missing display logic.)

  A further follow-up request ("I want mouse over explanation display
  near my mouse cursor on all parts based on rectangular block" for
  Oil, then "Do the same for" Fuel System and Starting System) added a
  cursor-following tooltip (`.oil-tooltip`/`.fd-tooltip`/`.ss-tooltip`,
  one shared tooltip element appended once per tool, `position: fixed`
  and positioned from the mouse event's own `clientX`/`clientY`
  directly — written correctly from the start per-tool here, having
  already hit and fixed the root-rect-offset version of this bug
  everywhere else) **alongside** the existing `.explain`/`.fd-explain`/
  `.ss-explain` fixed panel in all three diagram tools, rather than
  replacing it — the fixed panel stays as a persistent "what did I last
  hover" readout, the tooltip is additive so the explanation also
  appears right next to the cursor. Each tool's existing hover handlers
  (Oil's delegated `mouseover`/`mouseout` on the whole `svgEl`, Fuel/
  Starting's per-element `mouseenter`/`mouseleave` on each `.box`/
  `.ss-box`) gained a `mousemove` listener (delegated the same way for
  Oil) to reposition the tooltip while the cursor moves within a
  hovered part, plus `showTip()`/`hideTip()` calls alongside the
  existing `setActive()`/explain-panel calls — no hover-detection logic
  changed, same pattern as the explain-panel addition above.

  Both also show every component's name/description at once, in a
  permanent reference list below that hover panel (by follow-up request
  — "I want to see all the explanation below the diagram") — the single
  `.explain`/hover panel stayed (still useful as a quick "what am I
  pointing at" readout), the list is additive.
  - **Fuel System Overview**: `.fd-list`, one `<li data-comp="key">` per
    entry in the `titles`/`descriptions` objects, in their insertion
    order (already matches the diagram's logical flow, so no separate
    ordering was needed) — a fixed list, since Fuel's component set
    never changes.
  - **Oil System Overview**: `.comp-list`, rebuilt by `renderCompList()`
    inside `render()` every time the spool config changes, since the
    diagram's own component set isn't fixed here — a triple-spool build
    has bearing columns (IPC/IPT) a single-spool one doesn't. Built by
    walking the just-rendered `.comp` elements themselves (their
    `data-title`/`data-desc`, already present for the hover panel) rather
    than a separate hardcoded list, deduped by title so a part that
    repeats once per bearing column (Last-Chance Filter, MCD) shows once,
    not N times.
  - Both lists share one hover-highlight mechanism, `setActive(key,
    active)`, that toggles `.is-hovered` on every element carrying a
    matching key (`data-comp` for Fuel, `data-title` for Oil, since Oil's
    dedup means several `.comp` elements can share one list entry) —
    hovering either a diagram box/`.comp` or its list entry highlights
    both directions, and for Oil also drives the existing `.explain`
    panel the same way a direct diagram hover does.
- **Virtual Lab on Engine Practical** (`virtual-physical-lab`): a static
  reference cutaway image (`tools/virtual-physical-lab/engine-diagram.png`,
  now 1747×900 — a third user-supplied centrifugal-compressor turbojet
  diagram, swapped in by request ("change the engine image to the
  attached file") to replace the previous 1229×684 one; its 4 station
  labels, "Inlet"/"P1/T1"/"P2/T2"/"P3/T3"/"P4/T4", are baked into the
  art and kept as-is, same as every prior image in this slot — unlike
  the very first image's leader-lines-and-dots strip, which needed
  OpenCV-inpainting cleanup — see git history for that approach if a
  future replacement image needs it again) with a throttle slider driving
  RPM, and animation
  overlaid on top of the picture rather than drawn into it: an SVG layer
  (`viewBox="0 0 1747 900"`, i.e. `IMG_W`×`IMG_H`, matched to the image's
  actual pixel size — update these constants together with all waypoint/
  marker/glow coordinates if the reference image is ever swapped again,
  since every position in this tool is pixel- or percentage-anchored to
  this specific picture) holds airflow arrows that travel two mirrored
  routes (upper traced over the picture's own gas path — straight
  through the intake, up through the centrifugal compressor to its
  diffuser exit, down the short elbow into the turbine inlet, then
  rearward through the annular passage around the nozzle centerbody,
  converging back to the shaft centerline (`CENTER_Y`) at the
  centerbody's tip; lower is the same route mirrored about the
  centerline). The route is stored as waypoints (`UPPER_WAYPOINTS`, 11 of
  them — more than the minimum needed, by request, for finer drag
  control over the route's shape) rather than a fixed path string,
  smoothed into a curve with a Catmull-Rom-to-Bezier conversion
  (`pathFromPoints`) so it can be reshaped in edit mode (see below)
  without separate bezier-handle bookkeeping. Each arrow is an SVG
  `<path>` positioned and rotated every frame via `getPointAtLength`/
  tangent-angle sampling on a corresponding guide `<path>`
  (`.vlab-flow-path-upper`/`-lower`, queried only for its geometry,
  rebuilt whenever a waypoint moves); speed scales with RPM and color
  shifts cool→hot→exhaust by fraction of path length travelled. These
  two guide paths were originally `fill/stroke: none` (invisible,
  geometry-only), then given a visible dashed stroke by follow-up
  request ("change from only arrow to constant stream of broken lines
  with arrow") — a pure-CSS marching-dashes animation
  (`stroke-dasharray` + `@keyframes vlab-flowmove`, the same technique
  Fuel/Oil/Air System/APU System's own flow lines use), independent of
  RPM/throttle so it's always flowing, giving a continuous broken-line
  stream underneath the discrete arrow particles rather than just
  arrows with visible gaps between them (stroke-width 5, thickened to
  7 by follow-up request — "thicken a bit on the airflow line");
  frozen in edit mode (`.vlab-edit .vlab-flow-path-upper/-lower
  { animation: none; }`) like the combustor flicker, for the same
  reason (a moving diagram fights precise handle dragging).
  Two independent pulsing combustor glows (`GLOWS`, one per duct, both
  scale with fuel flow) sit over the top and bottom red ducts; an exhaust
  jet gradient scales with thrust. The image can't show literal blade
  rotation (no shapes to animate in a raster picture), so that part of
  the original animated-SVG version (before either reference image) was
  dropped — rotation reads only through the flow/glow/jet. 5 big, always-
  visible red circles (`PARTS`, holding position + size + the tooltip
  name/desc together — `rPct` is the circle's diameter as a % of the
  image's displayed width, kept a true circle regardless of the image's
  own aspect ratio via CSS `aspect-ratio: 1/1` rather than a height
  percentage) pinpoint the inlet / compressor exit / combustor / turbine
  / exhaust stations for tooltips, the same marker-overlay pattern as the
  Air System tool; a list below the diagram shows the same 5 parts'
  name/description permanently (not
  edit-gated — added by request so the explanations are visible without
  unlocking edit mode), each entry also hoverable for the same tooltip.

  Has the same password-gated "✎ Edit" button as Air System (password
  `APP`, casual click-guard only). Unlocked, it also freezes the whole
  simulation (RPM ramp, airflow arrows, combustor flicker) so a moving
  picture doesn't fight you while dragging small handles — `frame()`
  short-circuits to a no-op (just keeps the rAF loop alive) while
  `editUnlocked` is true, and `.vlab-edit .vlab-combustor-flicker`
  cancels the separate CSS flicker animation. It also adds: the 5 red
  circle markers become draggable from anywhere inside them, and get a
  small white-on-red resize handle at their edge (drag it to change
  `rPct`, computed from the handle's distance from the circle's own
  center, converted back to a % of image width) — the marker's own
  pointerdown handler ignores clicks that land on the resize handle
  (`evt.target === resizeHandle`) so the two drags never fight each
  other; their name/description (in that same always-shown list) become
  retypable (`contenteditable`); the flow route's waypoints become
  draggable diamond handles, each numbered 1-11 in flow order (a
  same-indexed `<text class="vlab-waypoint-label">` sibling per handle,
  `pointer-events: none` so it never steals the drag, repositioned
  alongside its handle on every move rather than via a full
  `renderWaypointHandles()` re-render, for the same reason as below) —
  dragging one rebuilds just that route's own path (see next paragraph
  for why "just that route's", not "both, via auto-mirroring" as
  originally built); the 2 combustor glow
  centers become draggable dashed-circle handles. Waypoint/glow handles
  are plain SVG shapes positioned by converting pointer coordinates
  through the overlay `<svg>`'s own `getScreenCTM()` rather than by
  percentage math, since they live in the SVG's pixel space, not the
  HTML marker layer. Because a waypoint or glow handle can land exactly
  on top of a part marker (the compressor exit waypoint does, by
  design), the overlay `<svg>` is pointer-events: none by default with
  only `.vlab-waypoint-handle`/`.vlab-glow-handle` opted back in, and
  edit mode raises the whole overlay's z-index above the marker layer —
  otherwise the marker (on top in DOM order) always wins the drag and
  the handle underneath becomes unreachable. A floating panel (like Air
  System's) shows the live, paste-ready `PARTS`/`UPPER_WAYPOINTS`/
  `LOWER_WAYPOINTS`/`GLOWS` source to copy back into the file. A
  waypoint-drag handler must never re-render the handle layer
  (`renderWaypointHandles()`) from inside its own `pointermove` callback
  — that replaces the `<rect>` the pointer is captured on mid-drag,
  which silently ends the drag after one move since a removed element
  can't keep pointer capture; update the dragged handle's own
  attributes in place instead (glow handles already did this correctly
  — only the waypoint handler had the bug).

  The lower route was originally *not* independently stored at all —
  `flowPathLower` was just `pathFromPoints(mirrorPoints(UPPER_WAYPOINTS))`,
  recomputed from the upper array on every change, with no handles of
  its own. By follow-up request ("I have no control to edit the bottom
  half of the airflow... allow me to edit the airflow at the bottom
  with yellow boxes in numbers"), it became its own array,
  `LOWER_WAYPOINTS` — seeded once from `mirrorPoints(UPPER_WAYPOINTS)`
  at load (so the two routes still start out visually symmetric) but
  never recomputed from the upper array again afterward.
  `renderWaypointHandles()` was generalized to build and wire both
  routes' numbered yellow-box handles in one shared SVG layer
  (`data-set="upper"`/`"lower"` tags picking which array a given
  handle's drag updates), rather than being hardcoded to
  `UPPER_WAYPOINTS` — both sets still number 1-11 independently (lower
  isn't a continuation like 12-22), since they're two separate routes,
  not one continuous numbered sequence. Persists to its own
  `localStorage` key (`tm.vlab.lowerWaypoints`, same
  `restoreArray`/`persistArray` pattern) and is included in the
  Copy-changes panel.

  Every PARTS/UPPER_WAYPOINTS/LOWER_WAYPOINTS/GLOWS edit is also
  auto-saved to `localStorage` (`tm.vlab.parts`/`waypoints`/
  `lowerWaypoints`/`glows`, restored over the hardcoded defaults on
  mount via `restoreArray`/`persistArray`) so it survives a reload in
  the editor's own browser without needing to be redone — same
  reasoning and same one-browser-only caveat as Air System's copy of
  this (see above); the Copy-changes panel is still how an edit becomes
  the new default for every visitor, by landing in this file. These
  keys all carry a `.v2` suffix (bumped when the reference image was
  swapped — see that image's own entry above for why) rather than the
  bare names this paragraph uses for readability.
  `PARTICLE_COUNT` is 24 (was 10, raised by request for a denser
  flow of arrows). 4 of the 11 default `UPPER_WAYPOINTS` were originally
  pixel-identical to a PARTS marker's center (the route is meant to pass
  through those stations) and are nudged a few px off-exact so a dead-
  center click on the marker isn't always shadowed by the waypoint
  handle drawn on top of it in edit mode — the route's shape is
  unaffected at that scale; this is a minor robustness nicety; dragging
  from anywhere else on the marker already worked regardless.
  `.vlab-image-wrap` caps at `max-width: 1100px` (below the image's
  1229px native width) so it's never upscaled past its own resolution.
  Panel widened to `max-width: 1500px` and all text sized up (headings,
  tile labels/values, tooltip, controls) for legibility at that width.
  Live readouts for RPM, thrust, T1–T4/P1–P4 per stage, fuel flow, and
  Compressor Pressure Ratio (CPR = P2/P1, unchanged by unit mode since
  it's a ratio) — only 4 of the 5 PARTS carry a live tile (the 5th,
  "turbine", is tooltip/list-only) since the underlying real dataset has
  only 4 measured stations; a 5th number was never fabricated to fill it.
  A Mode 1/Mode 2 toggle switches every readout's units: Mode 1 is as-logged
  (PSIG, °C, Gal/hr, lbf — the default), Mode 2 is SI (Pa, K, L/hr, thrust
  shown as both N and kgf). Hover a stage or the CPR tile for its
  purpose/explanation (text sourced from the supplied lab answer key,
  `Lab_1_Engine_Run_ANS_v8.0.docx`). The RPM→readout model is 22 real
  anchor points extracted from the ascending throttle sweep in the
  supplied `Engine_Run_Sample_Result.xlsx`, linearly interpolated; column
  mapping (P4=nozzle exit press, T4=EGT, not the sheet's own same-named
  columns) and the unit conversions were both verified against the answer
  key's worked peak-RPM figures (near-exact match, e.g. fuel flow converts
  to 18.66 L/hr in Mode 2 vs the key's 18.66 L/HR). Unlike the Fuel/Oil
  diagram tools, this one uses the portal's own Bright Lab chrome (fonts/
  accent/tiles) around the reference image. Uses the portal's
  `TM.registerTool`/`mount` pattern plus one addition: returns an
  `unmount` (cancels its `requestAnimationFrame` loop) — `app.js` was
  patched to call the outgoing tool's `unmount` on direct hash-to-hash
  tool switches, not just when returning to the catalog (a latent gap that
  only mattered once a tool had a continuous animation loop).
- Quiz Generator and Flashcard Trainer were both built for Phase 1, then
  removed by request — see git history if either is wanted back. Quiz
  Generator: static Web Basics question bank, scored, saved attempt history
  to `tm.quizAttempts` via `storage.js` (also removed). Flashcard Trainer:
  BYOK Anthropic key, called directly from client JS with the
  `anthropic-dangerous-direct-browser-access: true` header, no backend.
- **Air System** (`air-system`): static engine cutaway diagram
  (`tools/air-system/engine-diagram.png`, a real turbojet cutaway image
  supplied by the user, who confirmed ownership/rights to use it) shared
  by both modes, with an Internal/External toggle. Each mode overlays its
  own set of colored markers (blue=internal, red=external) at
  percentage-based positions on the image, plus a synced list of the same
  items beside the diagram — hovering either a marker or its list entry
  highlights both; marker positions scale with the image responsively
  since they're plain `%`-positioned `<span>`s over a `position: relative`
  wrapper, not SVG coordinates. 6 internal functions (turbine blade/disc/
  NGV/combustor-liner cooling, labyrinth seal, thrust bearing load relief)
  and 7 external (customer bleed, nacelle ventilation, generator/EEC/
  igniter cooling, turbine case cooling/ACC, anti-icing). List/description
  content sourced from the supplied deck `Chapter_11_Air_System_v1_2hr.pptx`.
  Uses the portal's Bright Lab chrome like the Virtual Lab (not a
  reference-sheet style). Has a password-gated "✎ Edit" button (password
  `APP`, hardcoded client-side — a casual gate against accidental edits,
  not real auth) that, once unlocked, makes every marker draggable and
  every list name/description directly retypable (`contenteditable`) for
  both modes; a floating panel shows the live, ready-to-paste
  `INTERNAL_ITEMS`/`EXTERNAL_ITEMS` source so changes made by dragging/
  retyping in the browser can be copied back into `air-system.js` (no
  backend — this is how content gets edited without writing code by
  hand, but someone still has to paste the result into the file and
  redeploy). Every edit is also auto-saved to `localStorage`
  (`tm.airSystem.internalItems`/`externalItems`, restored over the
  hardcoded defaults on mount via `restoreItems`/`persistItems`) so it
  survives a reload in the editor's own browser without needing to be
  redone — added by request after resetting-on-reload made editing feel
  like it kept undoing itself. This only reaches the one browser that
  made the edit, not other visitors to the deployed site; the Copy-
  changes panel is still how a change becomes the new default for
  everyone, by landing in this file.

  Each mode also has its own airflow route (`INTERNAL_FLOW`/
  `EXTERNAL_FLOW`, independent of `INTERNAL_ITEMS`/`EXTERNAL_ITEMS` —
  different purpose: these aren't functions to look up, just a path),
  drawn as straight dashed-and-animated yellow segments (CSS
  `@keyframes air-sys-flowmove`, same marching-dashes technique as the
  Oil System tool) with an arrowhead on each segment, through small
  numbered yellow boxes (`.air-sys-flow-box`, labelled 1..N in route
  order) placed at percentage positions like the circle markers. Always
  visible (not edit-gated) since the route itself is teaching content;
  only the boxes' positions are draggable, and only in edit mode. The
  line segments live in an SVG overlay (`viewBox="0 0 100 100"`,
  `preserveAspectRatio="none"` so a point's 0–100 coordinate maps
  directly onto the wrapper's `xPct`/`yPct` percentages, matching the
  image-overlay markers' own percentage math instead of switching to
  pixel/SVG-space math); the numbered boxes are plain `%`-positioned
  `<span>`s, reusing the exact same `makeDraggable()` the circle markers
  use (it's generic over anything with `xPct`/`yPct`). Dragging a box
  calls `renderFlowPath()` (rebuilds only the SVG line layer) rather
  than re-rendering the box layer itself on every move — re-rendering
  the box layer from inside its own drag handler would replace the
  `<span>` mid-drag and silently end the drag after one move, the same
  pointer-capture bug the Virtual Lab's waypoint handles had; box
  elements are only (re)built once per mode switch
  (`renderFlowBoxes()`), never during a drag. Also had to add an
  explicit `pointer-events: none` to `.air-sys-image-markers` (with
  `pointer-events: auto` restored on the individual `.air-sys-img-marker`
  spans) once the flow boxes were added underneath it in DOM order —
  without that, the marker layer's own empty space (it covers the full
  image, same as every other overlay layer here) silently swallowed
  clicks meant for the flow boxes sitting below it, since an
  unstyled-for-pointer-events absolutely-positioned div still intercepts
  hit-testing across its whole box. Flow points persist to `localStorage`
  (`tm.airSystem.internalFlow`/`externalFlow`) the same way the items do,
  and are included in the Copy-changes panel's textarea
  (`formatFlow()`, alongside `formatItems()`) so a dragged route can be
  pasted back into this file too. Default waypoints are rough
  placeholders (not sourced from the supplied deck, unlike the items) —
  meant to be dragged into an accurate shape for the real bleed-air
  routing once that reference is available.

- **Turbofan Engine** (`turbofan-engine`): interactive schematic teaching
  spool count, N-number naming, and bypass ratio — distinct from the
  Fuel/Oil/Virtual-Lab tools above in that its engine diagram is drawn
  entirely in SVG (no reference image for the main diagram; adapted from
  a self-contained HTML/JS animation the user supplied), with one
  supporting static reference image for the concentric-shaft section
  (see below). An "Engine configuration" toggle (Triple spool / Twin
  spool / Single spool) switches both the schematic's visible shafts/
  stages and every other section's content to match:
  - **Engine schematic**: a static nacelle/core cutaway (shell, bypass
    duct, combustor) with up to 3 concentric shaft `<rect>`s (`LP`/`IP`/
    `HP`, hidden per mode) and per-stage compressor/turbine blade groups
    positioned by fixed pixel coordinates (`SPOOLS[].stages[]`, in a
    1180×475 viewBox) — a plainer, non-animated-airflow sibling of the
    Virtual Lab's SVG-over-image approach, chosen here because the
    diagram itself (not a photo) needed to gain/lose whole shafts
    between modes. Rotation is cosmetic: each stage's white highlight
    band and each rotor-view's blade fan (`.tf-spin`, one per visible
    spool, 20 blades each) spin every frame via a plain
    `requestAnimationFrame` loop keyed to that spool's independent
    `speed` (0–100%, draggable per-spool sliders, reset button, a Pause
    toggle, and a "Show one rotating spool at a time" isolate toggle
    that cycles through the visible spools one at a time) — no gas-path
    particle system like the Virtual Lab, since this diagram's teaching
    point is spool/shaft relationships, not flow routing. Top labels
    (LP FAN / IP COMPRESSOR / HP COMPRESSOR / COMBUSTOR / HP·IP·LP
    TURBINE) and the stage column widths are computed per mode from
    each visible component's own geometry (`componentCenter`/
    `componentSpan`) rather than hardcoded per mode, so the three modes
    share one label-layout function; single-spool mode is the one
    special case (one combined "FAN / COMPRESSOR" label instead of a
    separate LP FAN label, since there's only one stage to name).
    Returns an `unmount` (cancels the rAF loop) via the same
    `window.TM.toolModules['turbofan-engine'].unmount = …` pattern as
    the Virtual Lab, for the same reason (a continuous animation loop
    must stop on tool-switch, not just on return-to-catalog).
  - **N-number naming**: deliberately NOT a fixed LP=N1/IP=N2/HP=N3
    table, since that mapping only holds in triple-spool mode — a
    twin-spool engine's HP spool is N2, not N3, because N-numbering
    counts outward-to-inward among whichever spools are actually
    present, not a fixed per-spool label. `nNumberFor(spool)` computes
    this as the spool's 1-based index within the current mode's visible-
    spool list (already in LP→IP→HP order), so the rotor-view labels,
    speed-control headers, and the "Naming convention" panel's cards all
    relabel automatically when the mode changes — e.g. HP reads "N3" in
    triple-spool mode and "N2" in twin-spool mode with no special-casing
    beyond that one function.
  - **Shaft arrangement**: a static supporting image, full panel width
    (edge to edge, not capped like the other tools' reference images),
    with its explanation stacked below it rather than beside it — this
    full-bleed layout is specific to this one panel (`.tf-cutaway-wrap`
    is `flex-direction: column`, not the row layout other image+text
    panels in this codebase use), chosen because this image is dense
    enough (labels, call-outs) that it needed the extra width rather
    than sharing a row with prose. Explains how the mode's shafts nest
    inside one another — this
    physical nesting isn't visible in the flat schematic above (its
    shafts are drawn as parallel bars, not a true cross-section), so a
    real reference image carries this specific point instead. One image
    per mode, not one triple-spool image reused throughout:
    `spool-cutaway.png` (triple, HP/IP/LP nested, 1448×1086),
    `twin-spool-cutaway.png` (twin, HP inside LP), and
    `single-spool-cutaway.png` (single, one shaft, no nesting) — all
    converted from user-supplied cutaway references via `ffmpeg` since
    the local Pillow install was broken. `SHAFT_INFO[currentMode]` holds
    each mode's image/alt/title/intro/bullet-list/closing-note together,
    and `renderShaftPanel()` (called from `applyMode()` like the other
    per-mode renders) swaps all of it in one pass — e.g. twin-spool's
    panel title drops back to "Concentric shaft arrangement" (two nested
    shafts) while single-spool's reads "Shaft arrangement" (no nesting to
    be "concentric" about). This panel itself has no retypable
    descriptions or draggable content of its own — see the next bullet
    for the edit mode this tool gained later, scoped to the schematic's
    part-label markers.
  - **Part-label hover markers** (added by follow-up request — "I want
    mouse over to label parts such as fan blade, LP compressor, IP
    compressor, HP compressor, LP turbine, IP turbine, and HP
    turbine"): 7 circles (`PART_LABELS`) overlaid directly on the
    engine schematic, one per listed part, each showing a name/
    description tooltip on hover (the same `showTip`/`positionTip`/
    `hideTip` pattern as Air System/APU System/Virtual Lab/Fire System,
    with `positionTip()` using the mouse event's own `clientX`/
    `clientY` since `.tf-tooltip` is `position: fixed` — written
    correctly from the start here, having already hit and fixed that
    bug in every other tool). Unlike those tools, this schematic has no
    reference image to overlay percentage-positioned markers onto —
    it's pure SVG — so `PART_LABELS` positions (`x`/`y`/`r`) are plain
    numbers in the same raw SVG user-space coordinates (viewBox `0 0
    1180 475`) every other shape in this diagram already uses, not a
    `%`-of-image convention. Each marker's `spool` field (`LP`/`IP`/
    `HP`) ties its visibility to `MODES[currentMode].visible` via
    `applyPartMarkerVisibility()` (called from `applyMode()`), so e.g.
    the IP Compressor/IP Turbine markers only show in triple-spool
    mode, matching the IP shaft/stages' own visibility. The schematic
    originally had no separate LP-compressor shape of its own (the LP
    spool's only drawn stage was the fan), so `lpCompressor`'s default
    marker position was just placed aft of the fan with nothing drawn
    under it; a follow-up request ("Add LP compressor blade with
    yellow colour") added a real blade stage for it — a fourth entry
    in `SPOOLS[0].stages` (`{ x: 205, wide: 23, size: 78, component:
    'lpCompressor' }`, sized like a single IP-compressor column) that
    automatically renders yellow and spins with the rest of the LP
    spool, since stage color/rotation/animation all key off `spool.color`/
    `spool.speed` generically rather than being hardcoded per stage —
    adding the array entry was the entire change. Its `x: 205` already
    matched `PART_LABELS.lpCompressor`'s existing default position, so
    the hover marker now sits right over its own real blade stage
    rather than empty shaft, with no marker reposition needed.
    - **Edit mode**: a password-gated "✎ Edit" button (password `APP`,
      same casual click-guard as every other tool), in a new
      `.tf-header-row` next to the title (this tool previously had no
      edit mode of any kind). Unlocked, each marker's circle becomes
      draggable from its body (repositioning `x`/`y`) and gets a small
      white edge handle (`.tf-part-resize`, hidden outside edit mode)
      draggable to resize `r` — both drags convert pointer coordinates
      through `svg.getScreenCTM().inverse()` (`svgPoint()`, the same
      technique the Virtual Lab's waypoint/glow handles use), since
      these markers live in the SVG's own coordinate space rather than
      a percentage-positioned HTML overlay. The handle's own
      `pointerdown` calls `evt.stopPropagation()` and the body's own
      handler ignores clicks landing on the handle, so the two drags
      never fight, matching every other tool's marker-plus-resize-
      handle convention. Edits persist to `localStorage`
      (`tm.turbofanEngine.partLabels`, one `{x, y, r}` per marker id)
      and a fixed bottom-right Copy-changes panel (`.tf-edit-panel`,
      same `right: 20px; bottom: 20px; width: 320px` layout as APU/Fire
      System's) shows live, paste-ready position/size data — same
      one-browser-only caveat as every other tool's copy of this.
  - **High bypass vs. low bypass**: a separate static two-card
    comparison (not tied to the spool-count toggle, since bypass ratio
    and spool count are independent design choices) — each card a small
    schematic nacelle/fan/core SVG built by one parameterized
    `bypassSvg({fanR, coreR})` helper (only the fan radius differs
    between the two), plus typical BPR/fan-size/core-share stats and a
    short explanation (military/supersonic low-bypass vs. commercial
    high-bypass).
  - Uses the portal's `TM.registerTool`/`mount` pattern. Like the Fuel/
    Oil diagram tools (and unlike Virtual Lab/Air System), it keeps its
    own dark reference-sheet visual style rather than the portal's Bright
    Lab chrome, since its spool colors are semantic (LP=yellow/N1,
    IP=green/N2, HP=orange/N3, held consistent across every section).

- **Starting System** (`starting-system`): a step-through (not
  hover-only) teaching tool for a twin-spool engine start sequence —
  distinct from every other tool here in that its diagram doesn't
  explore freely (no spool/mode toggle, no hover-driven flow); instead
  a linear 10-step sequence (`STEPS[]`, text sourced from the supplied
  "Start Sequence for a Twin Spool Engine (Part 1)" slide, each step's
  key term(s) bolded to match the slide's own bolding) drives which
  block-diagram components and connecting arrows are "live" at that
  point in the start — reusing Fuel/Oil's dark reference-sheet palette
  and box/pipe-flow visual language (same `--ink`/`--muted`/`--line`/
  `--card`/`--page`/`--box` custom properties as Fuel System, same
  dashed-and-animated-flow technique as Oil/Fuel/Air System) rather than
  inventing a new look.
  - **Block diagram**: redrawn in SVG from the supplied reference block
    diagram (which was itself photos of real parts, not a clean
    schematic) as 9 labelled boxes (`COMPONENTS`, each with a name/desc
    pair reused below for both the hover behavior and the permanent
    reference list) connected by 8 fixed-path arrows (`a1`–`a8`,
    hand-plotted elbow paths, not computed layout, since the diagram
    never changes shape) split into four "circuits" by color — electrical
    (`elec`, amber: Electrical Supply → EEC → Ignition Unit → Igniter
    Plug, and
    EEC → ECAM page), spark (`spark`, orange: Igniter Plug → Engine),
    pneumatic (`pneu`, blue: Starter Air Supply → Starter Control Valve →
    Starter Motor), and mechanical (`mech`, light gray: Starter Motor →
    Engine) — one SVG `<marker>` arrowhead per circuit color, reused by
    every arrow of that circuit via `marker-end`.
  - **Step-through, not free exploration**: each `STEPS[]` entry lists
    which component ids and arrow ids are "live" for that step; `
    applyStep(index)` toggles an `active` class on exactly those
    `.ss-box`/`.ss-arrow` elements (inactive arrows sit dim and static,
    active ones brighten to their circuit color and run the marching-
    dashes flow animation) — e.g. the pneumatic+mechanical arrows and
    Starter Control Valve/Motor light up from step 2 (valve opens)
    through step 8 (RPM/EGT rising), then go dark at step 9 ("starter
    cut-out"), matching the slide's own text. Controls: Prev/Next,
    a row of 10 clickable step dots, and a Play/Pause that auto-advances
    one step every 3.2s (stops at the last step rather than looping,
    since this is a one-way sequence, not a cycle) — any manual Prev/
    Next/dot click stops auto-play first, so the two controls can't
    fight over `current`. Returns an `unmount` (clears the play
    interval) via the same `window.TM.toolModules[...].unmount = …`
    pattern as Virtual Lab/Turbofan, for the same reason (a live timer
    must stop on tool-switch).
  - **Readout row**: three on/off badges (Starter / Ignition / Fuel,
    derived per-step from the same narrative — e.g. both go off together
    at the cut-out step) plus an N2 readout showing each step's
    approximate RPM language straight from the slide ("~15% N2", "20–25%
    N2", etc.) rather than a continuous simulated number, since the
    source is discrete step text, not a dataset like the Virtual Lab's.
  - **Component reference list**: `.ss-list`, same fixed-list-plus-
    two-way-hover-highlight pattern Fuel System just got (`data-comp`
    keys, `setActive()` toggling `.is-hovered` on both the diagram box
    and its list entry) — listed in `COMPONENTS` object order, which
    doesn't change with the step (unlike Oil System's list, Starting
    System's component set is fixed, so no per-step rebuild is needed).

- **APU System** (`apu-system`): explains Auxiliary Power Unit operation
  from the supplied deck (`Chapter_14_Auxiliary_Power_Units_APU_v1.pptx`)
  and its reference block diagram. First built as a from-scratch SVG
  redraw of the diagram (box-and-arrow, like Starting System), then
  rebuilt by explicit request ("I want you to use this exact
  diagram!!!") to use the user's own reference image verbatim —
  `tools/apu-system/apu-diagram.png` (1286×744) — with everything
  overlaid at percentage positions, the same image-plus-overlay pattern
  Air System uses, not the from-scratch SVG approach the other
  diagram tools (Fuel/Oil/Starting System/Turbofan) use. Combines three
  things on top of that one shared image: two tinted background
  regions, a two-route editable airflow overlay, and permanent red
  "key component" rings.
  - **Power Section / Load Section regions**: two absolutely-positioned
    `%`-width overlay `<div>`s (`.apu-sys-region.load` at `left: 0;
    width: REGION_SPLIT%`, `.apu-sys-region.power` filling the rest),
    `pointer-events: none` so they never block marker hover — the
    default 27% split lines up with the reference image's own internal
    dashed divider between the Load Section's components (Bleed Valve/
    GEN/Accessory Gearbox/Load Compressor/Flow Sensor/IGV/IGVA/ECB) and
    the Power Section's (Surge Control Valve/Compressor/Combustor/
    Turbine/Metering). `REGION_SPLIT` is draggable in edit mode via
    `.apu-sys-divider`, a thin full-height handle with a visible grip
    in the middle (`display: none` outside edit mode, like the flow
    boxes) — dragging it updates both region `<div>`s' width/left and
    persists to `localStorage` (`tm.apuSystem.regionSplit`), by request
    ("let me edit the dividing line of the box to differentiate load
    and power section"). A `SECTIONS` object (`power`/`load`, name/desc
    from slide 11) renders as two colored cards below the diagram
    explaining what each section is for — Load card first (left),
    Power card second (right), matching the diagram's own left-to-
    right layout (Load Section's blue-tinted region sits left of the
    divider, Power Section's orange-tinted region to its right); the
    cards were originally in the reverse, power-then-load order and
    swapped by request to match.
  - **Airflow overlay**: `POWER_FLOW` (now 6 points: inlet →
    compressor → combustor → turbine → exhaust) and `LOAD_FLOW` (now 5
    points: inlet → load compressor → accessory gearbox) — each gained
    one more waypoint at the very start, by request ("add one more
    point zero for air flow"), so numbering is 0-based throughout
    (point 0 is the inlet, upstream of where the two routes visually
    diverge) rather than starting at 1. Rendered as separate per-
    segment `<path>` elements (`renderFlowSegs()`, one per waypoint
    pair, each with its own `marker-end` arrowhead) rather than one
    continuous path — by request ("the line need to be much thicker...
    do add arrow to the airflow too"), since a single long path only
    gets one arrowhead at its very end; per-segment paths put a visible
    arrow on every leg of the route. Segment stroke-width went from 0.9
    to 2.2 for the same reason, then back down to 1.1 ("half the
    thickness") once the thicker line made the airflow look heavier
    than intended once arrowheads were added. The arrowhead markers needed
    `markerUnits="userSpaceOnUse"` added once the stroke got thicker —
    the default `markerUnits="strokeWidth"` scales the marker by the
    path's own stroke-width, so thickening the line without this
    suddenly made the arrowheads enormous (a multiple of the marker's
    own size times the new stroke-width); `userSpaceOnUse` keeps
    arrowhead size independent of stroke thickness. Numbered yellow
    handles (`.apu-sys-flow-box`) are `display: none` by default and
    only shown via `.apu-sys-edit .apu-sys-flow-box` (explicit request:
    "under edit mode, I want to see the yellow boxes"), borrowing the
    Virtual Lab's hidden-until-edit convention instead of Air System's
    always-visible one; each also gets a thin colored ring
    (`.apu-sys-flow-box.power`/`.load`) so the two 0-indexed routes'
    handles stay visually distinguishable now that both start
    numbering from 0. Password-gated "✎ Edit" (password `APP`), a
    Copy-changes panel with paste-ready `POWER_FLOW`/`LOAD_FLOW`/
    `REGION_SPLIT` source, and `localStorage` persistence
    (`tm.apuSystem.powerFlow`/`loadFlow`) otherwise match Air System's
    flow-box pattern. `POWER_FLOW` (the orange circuit) got one more
    waypoint by request ("I need an extra yellow box for the orange
    airflow") — inserted at `{ xPct: 69, yPct: 47 }`, the midpoint of
    its longest unbroken leg (compressor-exit corner → turbine), for
    finer control over that segment's shape; `LOAD_FLOW` is unchanged
    at 5 points.
  - **Key components, circled in red**: `COMPONENTS[id].key` flags the
    3 components the reference image itself circles in red — Bleed
    Valve, Surge Control Valve, and the Inlet Guide Vane (the small
    oval next to the IGVA box, physically distinct from IGVA, which
    actuates it) — each gets a larger marker (3.3% of image width vs
    the other components' 2%) with a red border instead of the default
    blue, a dedicated "Key components" sub-list above the full "every
    other component" reference list below the diagram (both lists
    share the same hover-highlight/tooltip wiring Air System's marker-
    plus-list pattern uses). Descriptions for all three, and for IGVA,
    are drawn close to verbatim from the deck's own per-component
    slides (14–17), since the user asked specifically for these three
    to be explained. Every marker's size (`rPct`, a % of image width,
    same `aspect-ratio: 1/1` convention as the Virtual Lab's `PARTS` so
    it stays a true circle) is resizable in edit mode via a small
    white-on-blue (or white-on-red for key markers) corner handle —
    `.apu-sys-marker-resize`, same drag-to-resize mechanics as the
    Virtual Lab's marker handles (radius computed from the handle's
    distance from the marker's own center, converted back to a % of
    image width; `evt.stopPropagation()` on the handle's own
    `pointerdown` so it doesn't also trigger the marker's hover/tooltip
    logic) — by request ("allow me to change the size of the red and
    blue circle"). A follow-up request ("allow me to change the
    location of the red and blue circle in edit mode") added position-
    dragging too: the marker body itself now has its own `pointerdown`
    handler (ignored when `evt.target === resizeHandle`, so the two
    drags never fight — the resize handle's own handler already
    `stopPropagation()`s) that drags `xPct`/`yPct` the same way the
    flow-route boxes do. Position and size now persist together in
    `localStorage` (`tm.apuSystem.components`, one `{rPct, xPct, yPct}`
    per component id — widened from `{rPct}` alone) and are both
    included in the Copy-changes panel (`formatComponents()`, listing
    every component's current `xPct`/`yPct`/`rPct` with its id as a
    trailing comment, appended after the flow/REGION_SPLIT output).
  - Had to add `pointer-events: none` to `.apu-sys-flow-boxes` (with
    `pointer-events: auto` restored on the individual `.apu-sys-flow-
    box` spans) once the divider handle was added underneath it in DOM
    order — the exact same bug Air System's marker layer had: an
    unstyled-for-pointer-events absolutely-positioned div (`inset: 0`)
    silently swallows clicks over its whole empty area for whatever
    sits beneath it, here the divider drag handle.
  - All marker/region/waypoint positions are pixel-anchored to this one
    specific image the same way Air System's and Virtual Lab's are —
    swapping the reference image means re-deriving every `xPct`/`yPct`
    in `COMPONENTS`, `POWER_FLOW`, and `LOAD_FLOW` against the new
    picture.

- **Fire Protection System** (`fire-system`, display name renamed by
  request from the earlier placeholder's "Fire Protection System"
  wording — the folder/id stayed `fire-system`): explains engine/APU
  fire detection and extinguishing from the supplied lab answer key
  (`Lab_5_Engine_Fire_Protection_ANS_v7.0.docx`) and its two reference
  images, used verbatim like Air System/APU System —
  `fire-panel-overview.jpg` (the 20VU fire panel, its overhead-panel
  location, and the 115VU engine master/mode panel) and
  `fdu-dual-loop.jpg` (the APU's Loop A/Loop B dual-loop circuit into
  its FDU).
  - **Hover markers + reference lists**: both images get the same
    image-plus-overlay treatment as Air System/APU System —
    `PANEL_MARKERS` (17 points: each engine's FIRE pushbutton/Agent 1/
    Agent 2/TEST, the APU's single Agent button, the overhead/pedestal
    location call-outs, and the 115VU panel's master switches/MODE
    selector/FIRE-FAULT lights) and `LOOP_MARKERS` (Loop A, Loop B, the
    sensing element, the FDU box) — each with a permanent reference
    list below its image, sharing one `setActive()`/tooltip
    implementation across both images (a single shared `.fs-tooltip`
    element appended once in `mount()`, not per-image, since only one
    marker can be hovered at a time). `positionTip()` places it using
    the mouse event's own `clientX`/`clientY` directly, since
    `.fs-tooltip` is `position: fixed` (viewport-relative) — an earlier
    version computed the offset against `.fs-diagram`'s own bounding
    rect instead and then applied that as a fixed-position left/top,
    which put the tooltip nowhere near the cursor whenever the
    centered, `max-width`-capped `.fs-diagram` wasn't flush against the
    viewport's left edge — caught by request ("the mouse explanation
    should be somewhere near the cursor"). The same bug existed in
    every other tool with a cursor-following tooltip (Air System, APU
    System, Virtual Lab — each had copied the same root-rect-offset
    math) and was fixed the same way site-wide by a follow-up request
    ("The mouse over explanation should be somewhere near the curser
    for every page") — the diagram tools (Fuel/Oil/Starting System)
    were never affected, since they use a fixed `.explain` panel
    instead of a cursor-following tooltip (see Phase 1 intro above).
  - **Edit mode** (added by follow-up request — "allow me to edit the
    size and location of the circle in edit mode for fire protection"
    — reversing the tool's original "no edit mode, nothing here is
    user-editable" stance): a password-gated "✎ Edit" button (password
    `APP`, same casual click-guard as every other tool's edit mode) in
    a `.fs-toolbar` next to the title. Unlocked, every `PANEL_MARKERS`/
    `LOOP_MARKERS` circle becomes draggable from its body (to
    reposition `xPct`/`yPct`) and gets a small white corner resize
    handle (`.fs-marker-resize`, same drag-to-resize mechanics as APU
    System/Virtual Lab — radius from the handle's distance to the
    marker's own center, converted to a % of image width, with
    `evt.stopPropagation()`/an `evt.target === resizeHandle` check on
    the body's own drag handler so the two drags never fight). Marker
    size (`rPct`, default 2.2 for every marker — close to the previous
    fixed 22px at this image's ~1024px width) uses the same `aspect-
    ratio: 1/1` convention as APU/Virtual Lab rather than a hardcoded
    pixel size, so it can shrink/grow in edit mode. Edits persist to
    `localStorage` (`tm.fireSystem.panelMarkers`/`loopMarkers`, one
    `{xPct, yPct, rPct}` per marker id, restored over the hardcoded
    defaults on mount) and a floating Copy-changes panel shows live,
    paste-ready position/size data for both marker sets — same
    one-browser-only caveat as every other tool's copy of this pattern.
    The panel is `position: fixed` in the bottom-right corner (APU
    System's exact `.apu-sys-edit-panel` layout: `right: 20px; bottom:
    20px; width: 320px`), not `position: sticky` spanning the content
    column — an initial sticky version sat high enough at common
    viewport heights to overlap Panel 1's own markers and silently
    swallow the pointerdown drag was supposed to reach, caught by
    Playwright testing before it shipped.
  - **"Try It" buttons stay in sync with the reference markers**: the
    `BUTTONS` config (used by the "Try It" panel below, see its own
    entry further down) no longer duplicates its own `xPct`/`yPct` —
    it looks up each button's position from the matching
    `PANEL_MARKERS[id]` entry at render time, and `refreshButtonPositions()`
    re-reads that position after every marker drag. So dragging, say,
    the `eng1-fire-pb` circle in the first "Fire Panel & Cockpit
    Location" panel immediately moves the corresponding FIRE switch
    button in "Try It" to match, with no page reload — keeping "Try
    It" an accurate copy of wherever the reference panel says the real
    control sits, rather than a second, independently-editable set of
    positions that could drift out of sync. Button *size* is not
    affected by a marker's `rPct` — it stays fixed per button type
    (fire switches bigger than test/agent buttons), since that size
    difference encodes what kind of control it is, not a per-instance
    style choice.
  - **Main Engine vs. APU comparison**: a plain `<table>` built from
    `COMPARISON` (Location of Bottle, Extinguishing Method, Warning
    Signal, Number of Bottles — each row's answer taken directly from
    the lab key, e.g. APU extinguishing is automatic on the ground but
    manual in flight, main engine is always manual), sitting right
    below the first reference image so the pictorial context and the
    table read together.
  - **Dual-loop explanation**: the `fdu-dual-loop.jpg` reference is
    specific to the APU, but the accompanying text is explicit that
    every main engine has the identical arrangement (its own FDU wired
    to its own Loop A/Loop B) — one individual detection system per
    engine/APU, 2 identical loops wired in parallel (not series), so a
    single damaged loop degrades to a fault condition rather than
    silently losing fire detection.
  - **Fire vs. Fault signal**: a two-card comparison (`SIGNALS.fire`/
    `fault`, same two-colored-card pattern as the APU tool's Power/Load
    section cards) — Fire signal means a genuine detected fire
    (warning lights/alarms); Fault signal means the detection system
    itself is malfunctioning (alerts maintenance, not the fire drill).
  - **Try It: Operate the Fire Panel** (interactive, replaced an earlier
    hover-only Prev/Next step-through by follow-up request — "I want
    students to press 'button' and see what will happen"): a second copy
    of the fire-panel-overview image with 11 real `<button>` elements
    (`BUTTONS`) positioned at the exact same `xPct`/`yPct` as the
    matching `PANEL_MARKERS` entries ("replicate the same position as
    the airplane overhead panel for fire switch") — 3 red FIRE switches
    (ENG 1 / ENG 2 / APU), 3 amber TEST buttons, and 5 grey AGENT/squib
    buttons (Agent 1 + Agent 2 for each engine, one Agent for the APU).
    Each button keeps the hover tooltip too (reusing the same
    `PANEL_MARKERS` description it's positioned over), but clicking now
    drives a small per-unit state machine (`state.eng1`/`eng2`/`apu`,
    each `{pushed, agent1, agent2, testing}`):
    - **FIRE switch** toggles `pushed` — pushing in arms the system and
      (per the status message) cuts fuel/hydraulic/bleed/electrical
      supplies to that engine (fuel+electrical only for the APU),
      visually sinking the button (`.is-pushed`, red fill + inset
      shadow) and turning on that unit's "ARMED" badge; pushing again
      resets it back out, which also clears both agent states for that
      unit (realistic re-arm-from-scratch behavior for a teaching tool).
    - **AGENT buttons** are inert/dim (`opacity: 0.65`) until that
      unit's FIRE switch is pushed — clicking one before that gives a
      "push the FIRE switch first" status message and does nothing
      else; once armed (`.is-armed`, red outline) a click "discharges"
      it (`.is-discharged`, turns green), sets that unit's badge on, and
      is a one-way action until Reset (clicking again just repeats "already
      discharged"). Clicking Agent 2 before Agent 1 still works (no hard
      gating — a locked-out action would block exploring "what if") but
      adds a note in the status message that normal procedure tries
      Agent 1 first.
    - **TEST buttons** just toggle `testing` on/off, each time updating
      the status message ("simulates a fire condition... without an
      actual fire") — while active, the main engines' (not APU's, since
      it has no separate FIRE/FAULT light marker) `eng1-fire-fault`/
      `eng2-fire-fault` markers on the panel also get
      `.fs-step-active-marker` (the same amber pulsing style the old
      step-through used for its single active marker) so the light
      itself visibly "illuminates" during test.
    - A single `<p class="fs-status-msg" aria-live="polite">` below the
      image carries all click feedback (replacing per-marker tooltips as
      the primary feedback channel for this section), plus a row of
      pill badges (`fs-unit-badge`, one ARMED badge and one-or-two AGENT
      badges per unit) that light up (`.on`, amber fill) to mirror
      `state` at a glance. A "⟲ Reset All" button clears every unit back
      to its initial state and resets the status message.
    - `refreshButtons()`/`refreshBadges()` are called after every state
      change and just re-derive every button's/badge's classes from
      `state` in one pass, rather than patching individual elements per
      action — simplest to keep correct given how many classes depend on
      more than one state field (an agent button's look depends on both
      `pushed` and its own discharged flag).
  - **Recommended Real-World Order (Main Engine Fire)**: the original
    7-step walkthrough text (fire warning appears → thrust lever idle →
    engine master OFF → ENG FIRE pushbutton pushed → Agent 1 if the
    warning persists → Agent 2 if it still persists → outcome) is kept,
    but now rendered as a plain static `<ol>` (`STEPS[]`, text only, no
    Prev/Next/step-dots controls and no per-step marker highlighting)
    directly below the interactive panel — reference material for the
    correct real-world sequence, intentionally decoupled from the
    free-form button interaction above it rather than gating the button
    clicks to this order.

### MCQ gate on life loss (6 games), unlimited lives (all stages)

By request ("In all games I want to add for every 1 live gone. Student
need to answer 1 mcq question relating to air power plants module in
order to continue. There will be unlimited lives for all game on all
stage. Student can have unlimited try on the same mcq until they got it
right. There should be 10 mcq for each game. For editor mode I can
change the questions and the answer.") — applied to the 6 games that had
a "lives"/game-over concept: Engine Emergency, Jump Challenge (`exam-
platformer`), Maze Muncher (`pacman-arcade`), Super Bomberman, Saloon
Shootout, Barrel Climb. **Crossword Challenge is out of scope** — it has
no lives/life-loss mechanic (a timed puzzle with Check/Reveal, not an
arcade life), so nothing changed there.

- **Unlimited lives, no Game Over from running out of lives**: each
  game's life-loss handler (`fail()`/`died()`/`loseLife()`/
  `hurtPlayer()`, or the civilian-hit branch inside Saloon Shootout's
  `fire()`) no longer checks a remaining-lives count to decide whether
  to end the game — that branch, the `gameOver()` function itself (now
  unreachable), and the "Game Over"/"Stage failed" overlay screens it
  used to show were removed outright from all 6 files (not just left
  dead), along with the `lives` field in each game's `DIFFICULTY_SETTINGS`
  (now functionless once lives are unlimited on every tier). The HUD's
  "Lives" hearts/dots stat was replaced with a plain "Misses" counter
  (`misses`, increments forever, no cap, no game-ending threshold) in
  every one of the 6 games, so the display can't be misread as "you're
  about to lose" — a jump/exam/jump challenge still only has a "Stage
  complete"/"Maze clear"/"Stage clear"/"Rescue complete" win condition
  where one existed before; Engine Emergency and Saloon Shootout had no
  win condition even before this change (endless survival) and still
  don't — they just no longer terminate on lives either, so they run
  indefinitely. High-score saving, previously done only inside
  `gameOver()`, was moved into each game's `updateHud()` (already called
  after every score change) so it keeps being captured correctly now
  that `gameOver()` never fires; the pre-existing `stageClear()`/
  `levelClear()` high-score saves were left in place too, redundant but
  harmless. Jump Challenge's difficulty picker (Settings panel/Easy-
  Normal-Hard) was removed entirely rather than left as a no-op — its
  *only* tunable effect in `DIFFICULTY_SETTINGS` had been the lives
  count ("the jump physics and stage layouts stay the same at every
  level so they stay fair"), so once lives became unlimited it had
  nothing left to do; every other game's difficulty picker still tunes
  something else (speed, spawn rate, time budget) and was kept, just
  with its `lives` key dropped.
- **MCQ gate**: every life-loss event (ghost/barrel/enemy touch, bomb
  blast, time-out, civilian hit, spike/fall) now calls a per-game
  `showMcqGate(onCorrect)` instead of immediately respawning — it pauses
  the game (reusing each game's own existing `running`/`rafId`/
  `lastTime` pause-and-resume plumbing, the same one `gameOver()` used
  to use; safe to flip `running` mid-frame from inside an `update()`-
  called handler since every `loop(now)` already only checks `running`
  once at the very top, a pattern already proven elsewhere in this
  codebase), shows a full-screen overlay (new `.xx-mcq-overlay`/
  `.xx-mcq-card`, one per game, `position: fixed` so it covers the whole
  viewport the same way the Virtual Lab/Air System tooltips do) with one
  random question from that game's own 10-question bank, 4 answer
  buttons in a freshly **shuffled display order** (so the correct
  answer's on-screen position never gives it away even on a repeat
  question), and a feedback line. A wrong answer flashes "❌ Not quite —
  try again." and leaves the same question up for another attempt — no
  limit, no penalty, matching "unlimited try on the same mcq until they
  got it right" exactly. A correct answer flashes "✅ Correct!", plays a
  short two-note success beep (`playMcqRight`, reusing each game's
  existing oscillator-beep sound helper, no new audio tech), waits
  500ms, hides the overlay, and invokes the `onCorrect` callback — which
  is each game's own pre-existing respawn/continue logic (`resetPlayer()`
  / `resetPositions()` / resuming `startRound()`), so the exact "what
  happens when you get to keep going" behavior is unchanged from before
  this feature, just gated behind a correct answer first. Super Bomberman
  needed one extra guard `hurtPlayer()` didn't need elsewhere: its
  `explode()` can recursively re-trigger `hurtPlayer()` for a chained
  bomb blast within the same synchronous call, before the player's
  `invulnerableUntil` is refreshed (that only happens in `resetPlayer()`,
  which now runs much later, after the MCQ is answered) — so `hurtPlayer()`
  first checks whether the MCQ overlay is already open and no-ops if so,
  rather than incrementing `misses` and re-rendering a second gate on
  top of itself. Bomberman's time-out path in `checkTimer()` also needed
  its stage-time reset moved to happen *before* calling `hurtPlayer()`
  rather than after (gated on `if (running)`, which used to be true in
  the common case but is now always false the instant `hurtPlayer()`
  pauses the game) — otherwise `timeLeft` would stay stuck at 0 and
  re-trigger `hurtPlayer()` every frame once the gate closed.
- **10 questions per game, aircraft-power-plant subject matter**: each
  of the 6 games got its own distinct `DEFAULT_MCQS` array (`{ q,
  choices: [4 strings], answer: <index> }`), themed loosely to fit
  variety across the site rather than to each game's own visual genre —
  Engine Emergency: fire/emergency systems; Jump Challenge: oil/fuel/
  general engine fundamentals; Maze Muncher: turbofan basics (spool,
  intake, thrust, blade, shaft); Super Bomberman: fuel/APU systems;
  Saloon Shootout: air system (bleed, anti-ice, cooling); Barrel Climb:
  starting-system/spool fundamentals. 60 questions total, none shared
  between games.
- **Editor mode**: reuses the established password-gated convention
  (`MCQ_EDIT_PASSWORD`/`EDIT_PASSWORD = 'APP'`, the same casual click-
  guard every other tool's edit mode uses) rather than inventing a new
  one. Jump Challenge folds its MCQ editor into the *same* existing
  password-gated panel its exam-clue editor already used (one unlock,
  both sections) since that tool already had an edit button; the other
  5 games — which had no edit mode before this feature — gained a new
  "✎" HUD button that unlocks a dedicated `#xxMcqEdit` panel. Each
  question renders as one text input (the question) plus 4 text inputs
  (the choices) with a radio-button group marking which one is correct
  — editing any field updates the in-memory `mcqs` array directly via
  its own `input`/`change` listener (no separate "apply" step beyond
  that), a Save button persists the whole array to `localStorage`
  (`tm.<game>.mcqs`, merged-over-defaults the same way `loadClues()`
  already did for Jump Challenge's clues: a saved array is only used if
  its length matches `DEFAULT_MCQS.length`, otherwise the hardcoded
  defaults are used untouched), and a read-only textarea shows live,
  paste-ready `DEFAULT_MCQS` source (`formatMcqs()`) so an edit made in
  one browser can be copied into that game's own `.js` file to become
  the default for every visitor — same one-browser-only caveat as every
  other editable-content feature in this codebase (Air System's items,
  APU System's components, Virtual Lab's parts/waypoints, Jump
  Challenge's own clues).
- Verified per-game with Playwright: a `debugForce*()` hook
  (`debugForceFail`/`debugForceDeath`/`debugForceLoseLife`/
  `debugForceHurt`/`debugForceCivilianHit`, matching each game's own
  death-function name) triggers a life-loss event without needing to
  actually play; `debugState()` reports `misses` and `mcqGateOpen`; a
  `debugAnswerMcq(correct)` hook finds the rendered choice button whose
  `data-correct` attribute (set from the shuffled `opt.correct` flag at
  render time, read-only — not a gameplay change) matches the requested
  outcome and clicks it. Confirmed for every game: a miss always opens
  the gate; a wrong answer leaves it open for retry; a correct answer
  closes it and resumes play exactly where it left off; no game ever
  reaches a Game Over state no matter how many times it's forced to
  fail in a row; Bomberman's chained-hit guard holds `misses` at +1
  (not +2) when `hurtPlayer()` is called twice back-to-back while the
  gate is already open.

### "Match the Definition" second game, all 8 study-chapter tools; oil/fuel panel moved to top + randomized

By request ("Place the option for game challenge for oil system and fuel
system at the top. Set random challenges for the oil and fuel system
each time. Add the second game that is the match the definition with
the right word for all the other study chapters including fuel and oil
system"):

- **Oil/fuel existing drag game — moved up, randomized**: the "Label
  the Bearings"/"Label the Fuel System" drag-and-drop panel (title,
  intro, HUD, Start button, word bank) now sits right after each tool's
  controls/subhead row, before the diagram, instead of below it and the
  full reference list, so the option to play is visible without
  scrolling. Each Start now picks a random subset of that configuration's
  components (never fewer than 3, or the whole set if there are 3 or
  fewer) instead of always using every one; `gameTargets()` in both
  files filters to just the round's chosen ids, so a component left out
  of a round stays fully visible/unmasked in the reference list, as if
  the challenge weren't running.
- **"Match the Definition" — a second, independent game, added to all 8
  study-chapter tools** (virtual-physical-lab, turbofan-engine,
  oil-system-overview, fuel-system-overview, air-system,
  starting-system, apu-system, fire-system — Crossword Challenge and
  the 6 arcade games are out of scope, they're not reference/study
  tools): a click-to-pair matching challenge, independent of each
  tool's own drag game or step-through/edit mode. Click a term tile,
  then its matching description tile (or the other way round) — a
  correct pair locks in green and scores time-weighted points
  (`Math.round(100 * (0.4 + 0.6 * remainingFrac))`), a wrong pair just
  flashes red and resets with no penalty and no limit on retries. Each
  round draws a random subset of that tool's components (a `shuffled()`
  Fisher-Yates helper, same randomization convention as the drag game),
  runs on a countdown (`MATCH_SECONDS_PER_ITEM = 14` seconds per item in
  the round), and reveals any unsolved pairs in place if the clock runs
  out. While a round is running, every masked component's entry in that
  tool's permanent reference list (and its hover tooltip) is replaced
  with a `🔒 ?????` placeholder so the list can't be used as an answer
  key, restored to normal the instant the round ends (cleared, timed
  out, or reset). Best score persists to `localStorage`
  (`tm.<tool>.matchBest`, namespaced per-mode where a tool has one —
  e.g. `tm.oilSystem.matchBest.<spool>`,
  `tm.airSystem.matchBest.internal`/`.external` — since a different
  mode's component set makes scores incomparable). Self-contained Web
  Audio beep helpers (`playMatchRight`/`playMatchWrong`/`playMatchClear`)
  are duplicated per tool rather than shared, matching this codebase's
  established no-shared-code-between-tools, no-audio-files convention.
  Debug hooks `debugMatchState`/`debugForceMatchTimeout` were added to
  every tool for headless testing.
  - **Mutual exclusion**: a running match round blocks whatever else
    that tool lets you do at the same time, and vice versa — oil/fuel's
    drag game and match game share one `*Active`-style guard so only one
    can run at once; Virtual Lab and Air System's password-gated edit
    mode refuses to unlock while a match round is active (and starting a
    round refuses while edit mode is unlocked) — e.g. Virtual Lab's
    `startMatch()` checks `editUnlocked` and its edit button handler
    checks `matchActive`, popping an alert ("Finish the current Match
    the Definition round first.") rather than silently doing nothing.
  - **Mode/config-dependent pools reset cleanly**: on any tool whose
    diagram has a mode toggle that changes which components are even
    relevant (oil's spool config, turbofan's engine configuration,
    air-system's Internal/External toggle), switching modes mid-round
    calls `endMatch('reset')` before applying the new mode, so a round
    never survives into a mode whose component pool no longer matches
    what's on screen; the pool itself is recomputed from whatever the
    now-active mode actually shows (e.g. turbofan's pool is
    `PART_LABELS` filtered through the same visible-spool logic
    `applyPartMarkerVisibility()` already used).
  - **Per-tool pool and masking specifics** (varies with how each tool's
    pre-existing reference list is built):
    - **oil-system-overview**: pool is every currently-rendered
      component (tank, pumps, valve, filters, FOHE, breather, MCDs, and
      the current spool's own bearing/gearbox columns), reusing the
      same dedupe-by-title walk `renderCompList()` already does, so it
      stays correct automatically as the spool config changes.
    - **fuel-system-overview**: pool is the same 14-component set its
      drag game already uses.
    - **virtual-physical-lab**: pool is the 5 `PARTS` markers plus the
      CPR tile (`CPR_INFO`). Masking covers the retypable edit-mode
      parts list (`renderEditPartsList()`, `🔒 ?????` placeholder item
      text, tooltip suppressed) as well as the CPR tile and the live
      marker tooltips.
    - **turbofan-engine**: pool is `PART_LABELS` (the 7 part-label hover
      markers added over the schematic), filtered to the current mode's
      visible spools (2/6/7 markers for single/twin/triple).
    - **air-system**: pool is `INTERNAL_ITEMS`(6)/`EXTERNAL_ITEMS`(7),
      whichever mode is active; masking is inline in the existing
      `render(mode)` function, which already rebuilds `.air-sys-list`
      from scratch on every mode switch, so no separate extraction was
      needed.
    - **starting-system**: pool is all 9 `COMPONENTS` entries (stored as
      `[name, desc]` array pairs here, not objects). The previously-
      inline `.ss-list` build inside `mount()` was extracted into a new
      mask-aware `renderCompList()` function so the list can be rebuilt
      mid-session; the diagram's own `.ss-box` hover also gained a mask
      guard. The pre-existing step-through sequence is unaffected by a
      match round.
    - **apu-system**: pool is all 12 `COMPONENTS` entries (the 3
      red-ringed "key component" markers included, with no special
      treatment). The previously-inline `.key-list`/`.other-list` build
      was extracted into `renderLists()` plus a shared `wireListHover()`.
      The pre-existing region-divider drag and both flow-box edit modes
      (7 power + 5 load) are unaffected.
    - **fire-system**: pool is the merged `PANEL_MARKERS`(17) +
      `LOOP_MARKERS`(4) = 21 candidates (ids prefixed `panel:`/`loop:`
      to avoid collisions across the two reference images). Both
      reference lists are baked once into `mount()`'s innerHTML rather
      than built by a re-callable render function, so masking here works
      by in-place DOM text mutation instead of a rebuild — a
      `maskListItem(poolId, masked)` helper finds the existing
      `.fs-list-item[data-marker="rawId"]` and swaps its name/desc text,
      restoring the originals (looked up back from
      `PANEL_MARKERS`/`LOOP_MARKERS`) when the round ends. The
      pre-existing interactive "Try It" fire-panel button simulator is
      unaffected.

### Shared leaderboard (`leaderboard.js`), per-chapter Game Mode pages, persistent MCQ gate, settings lock

By request ("Place the cross word puzzle in each of the study chapters as
well... Subsequently remove the cross word puzzle from the game section...
For every game played. The overal best score must remain and safe in the
system along the user name for the top player... Allow name of up to 10
characters. No profanity words. I can choose to reset with a user
password. Game sttings must also be locked but user password. For the
study page add the word Game Mode [once] game mode is press it goes onto
a new page for game play... Change the title from someone shooting to
shooting. For that game there must be finished within a certain time and
showing the clock on the screen. After losing one life, and answer the
mcq. Do not let the screen disappear. User press cross to exit... There
should be a top score for jump challenge based on timing to complete the
stage.", plus a follow-up clarifying "Add a box called Game Mode. And
when the game mode is pressed it will enter a new web page for all the
game. And for the matching of words vs definition. Use a max of 3 words
and 3 definition. Use random combination."):

- **`leaderboard.js`** (shared chrome at the repo root, loaded once in
  `index.html` like `app.js`/`tools.js`): a site-wide "forever" top-score
  record per game, `window.TM.Leaderboard`. Still per-browser
  `localStorage` only (`tm.leaderboard.<gameId>`, `{name, score}`) — this
  site has a hard no-backend/vanilla-only constraint (see top of this
  file), so a genuinely shared-across-every-device leaderboard isn't
  possible without real infrastructure; confirmed with the user, who
  chose this over adding a backend. `submitScore(gameId, score, {
  higherIsBetter })` compares against the stored best (`higherIsBetter`
  defaults `true`; pass `false` for a timing leaderboard where a lower
  number wins) and, only when beaten, prompts via `window.prompt()` for a
  name (prefilled with the last name used on this browser,
  `tm.leaderboard.lastName`), trims it to 10 characters, and rejects it
  (re-prompting) if it matches a short hardcoded profanity blocklist —
  plain `window.prompt`/`window.alert` rather than a custom modal, by
  deliberate choice, matching this codebase's existing low-fi
  `window.prompt()`-based password gates rather than inventing new UI
  chrome for something this casual. `resetBest(gameId)` and
  `checkPassword(message)` both gate on the same shared settings
  password, `'APP'` — reusing the arcade games' existing
  `MCQ_EDIT_PASSWORD` value (confirmed with the user) rather than adding
  a second password to remember. `formatTime(seconds)` and
  `bestLabel(gameId, formatScore)` (→ "🏆 Name — 420" or "--") are the
  two small shared formatting helpers every caller uses.

- **Game Mode pages — one per study chapter** (virtual-physical-lab,
  turbofan-engine, oil-system-overview, fuel-system-overview, air-system,
  starting-system, apu-system, fire-system): each study tool's header
  gained a `<a class="game-mode-btn">🎮 Game Mode</a>` link (shared
  `.game-mode-btn` pill style added once to the root `styles.css`) to a
  new hidden tool `<chapter>-game-mode` — hidden meaning it has a
  `tools.js` entry with `hidden: true` (skipped by `app.js`'s catalog
  render loop) and is reachable only by that link, never a catalog card.
  Each Game Mode page is a thin per-chapter wrapper
  (`tools/<chapter>/<chapter>-game-mode.js`) that calls
  `TM.mountGameModeHub(root, { title, backHash, backLabel, games: [...] })`
  — a shared hub (`tools/game-mode-hub/`) that tab-switches between that
  chapter's own mini-games, each mounted by a shared engine:
  - **`tools/crossword-engine/`**: the auto-layout crossword algorithm
    and UI from the now-removed standalone Crossword Challenge game (see
    below), generalized into `TM.mountCrossword(root, { gameId, title,
    intro, words })` — one word bank per call instead of the old game's
    Term 1/Term 2 tabs, since each chapter already *is* one term. Still
    has the Easy/Normal/Hard reveal-density picker, now gated behind
    `TM.Leaderboard.checkPassword()` the first time its settings panel
    is opened (satisfying "Game settings must also be locked"), and a
    "Reset top score…" button wired to `TM.Leaderboard.resetBest()`. Its
    "Best" stat is now the shared leaderboard's named `bestLabel()`
    instead of a bare anonymous number.
  - **`tools/match-game-engine/`**: a new, smaller shared engine,
    `TM.mountMatchGame(root, { gameId, title, intro, pairs })`,
    replacing each chapter's own previously-duplicated inline "Match the
    Definition" implementation (added last session, one copy per tool).
    Capped at a max of **3 terms and 3 definitions per round** (down
    from "a random 3-or-more subset" — tightened by the user's explicit
    follow-up), still a fresh random pick every round. No masking logic
    exists here at all (unlike the old inline version, which had to hide
    the chapter's own reference list and hover tooltips while a round
    ran) — since Game Mode is now a *separate page* with no live diagram
    on screen, there is nothing on the current page that could leak the
    answer, so the whole masking mechanism from last session's rollout
    was deliberately dropped rather than ported over.
  - Every chapter's `<chapter>-game-mode.js` supplies its own `WORDS`
    (crossword, single uppercase token + clue) and `PAIRS` (match game,
    full term + definition) as plain data arrays, duplicated from that
    chapter's own real content (component names/descriptions already
    used elsewhere in that tool) rather than imported from the study
    tool's own closures — Game Mode is a separate page/mount with no
    access to the study tool's private variables, and duplicating a
    small, curated content list per chapter matches this codebase's
    standing "no shared code between tools, only shared chrome"
    convention (the three engines above are the shared chrome; the
    content is each chapter's own, same as everywhere else in this site).
  - **Removed from every one of the 8 study tools**: the entire inline
    "Match the Definition" panel added last session (HTML block, JS
    implementation, debug hooks, and any mutual-exclusion check it had
    against that tool's own edit mode or other game) — moved to its
    chapter's Game Mode page instead, per the user's explicit follow-up
    ("it will enter a new web page for all the game"). Oil System and
    Fuel System's own separate drag-and-drop "Label the Bearings"/"Label
    the Fuel System" game was **not** moved — it stays on the study page
    unchanged, since relocating it would mean rebuilding it without the
    live diagram it drags labels onto, which Game Mode's separate page
    doesn't have; only Match the Definition (which never depended on the
    diagram, just a word list) made sense to relocate.

- **Standalone "Crossword Challenge" removed from the games section**
  (`tools/exam-crossword/` deleted, its `tools.js` entry and
  `index.html` script/link tags removed) — its Term 1/Term 2 word banks
  and auto-layout algorithm live on as the shared `crossword-engine.js`
  described above, now called once per chapter instead of once globally
  with two hardcoded terms.

- **Persistent MCQ gate — a ✕ button, not a timeout, dismisses it** (all
  6 arcade games: Engine Emergency, Jump Challenge, Maze Muncher, Super
  Bomberman, Shooting, Barrel Climb): every `showMcqGate(onCorrect)`
  previously auto-hid the overlay and resumed play 500ms after a correct
  answer (`setTimeout(() => { overlay.hide(); onCorrect(); }, 500)`) —
  by request ("Do not let the screen disappear. User press cross to
  exit"), that timeout is gone. A correct answer now disables every
  choice button (so a lucky second click can't re-trigger anything) and
  reveals a small `✕` button (new, `position: absolute` top-right of the
  MCQ card) that was hidden until that moment; only clicking it hides
  the overlay and invokes the stored `onCorrect` callback. A wrong
  answer is unchanged — flash, stays open, unlimited retries. Each
  game's own `showMcqGate` now holds the pending callback in a local
  `pendingOnCorrect`-style variable for the ✕ handler (registered once,
  outside `showMcqGate`) to read.

- **Game settings password-locked** (Engine Emergency, Maze Muncher,
  Super Bomberman, Shooting, Barrel Climb — the 5 of the 6 MCQ-gated
  games that still have a difficulty picker; Jump Challenge's own
  picker was removed in an earlier session once lives became unlimited
  and had nothing left to tune, so there is no settings panel there to
  lock): each settings-panel toggle button now calls
  `TM.Leaderboard.checkPassword()` the first time it is about to open
  the (until-then-hidden) panel, remembered via a local
  `settingsUnlocked` flag for the rest of that page view so it only
  prompts once per visit, not on every toggle.

- **Named leaderboard wired into all 6 arcade games** (`engineEmergency`,
  `examPlatformer.<stageId>`, `pacmanArcade`, `bombermanArcade`,
  `westernSaloon`, `barrelClimb` leaderboard ids): each keeps its
  existing plain per-browser numeric "High score" stat untouched (cheap,
  immediate, no name prompt) and gains a second "Top score" stat driven
  by `TM.Leaderboard.bestLabel()`. Submission timing differs by whether
  the game has a natural stopping point: Maze Muncher/Super
  Bomberman/Shooting/Barrel Climb submit at their own
  `levelClear()`/`stageClear()`-equivalent win moment; Engine Emergency
  has no win condition (endless survival, by design, unchanged) so it
  instead gained a manual "🏆 Save my score" HUD button the student
  clicks whenever they want to bank their current score without ending
  the run. Each also gained a password-gated "Reset top score…" control
  (inside its settings panel) calling `TM.Leaderboard.resetBest()`.

- **Shooting** (`western-saloon`, catalog display name changed from
  "Saloon Shootout" to "Shooting" by request — id/folder/internal
  `ws-*` class prefixes unchanged): gained a 60-second round timer with
  a visible on-screen clock (ticks down once a second, paused for the
  exact duration the MCQ gate is open so a slow quiz answer never eats
  into play time — the same pause/resume plumbing the MCQ gate already
  used). Reaching 0 pauses the game, shows a "⏰ Time's up!" result
  overlay with the final score (and "— new top score!" when beaten), and
  a "Play Again" button that starts a fresh timed round — this is also
  this game's new natural "run end" checkpoint for the leaderboard
  submission above, something it never had before (previously endless
  survival, like Engine Emergency still is).

- **Jump Challenge per-stage completion-TIME leaderboard** (separate
  from, and in addition to, the "Top score" points-based one every other
  arcade game just got above — `exam-platformer` has no point score at
  all, so its leaderboard is pure timing): `TM.Leaderboard.submitScore(
  'examPlatformer.' + stage.id, elapsedSeconds, { higherIsBetter: false
  })`, one leaderboard entry per stage id, lower time wins. Timing starts
  when a stage opens (`stageStartTime`) and stops at `completeStage()`;
  every death-and-respawn within that same attempt stays inside the
  timed window (unlimited lives already meant the student just keeps
  playing the same stage after a death, so a "re-live" costs real time
  exactly like it would in person) — but the time spent on the MCQ gate
  itself is subtracted back out (`mcqPausedMs`, accumulated every time
  the gate opens and closes) so a slow quiz answer never counts against
  the student's stage time, matching the request precisely ("timing
  include all the re-live but not inclusive of quiz time"). The
  stage-complete overlay shows both the student's own time and the
  current best ("🏆 Name — m:ss" or "No record yet").

### Phase 2 — Scaffolded topics, content pending

No tools remain as placeholders — every catalog entry now has real
content.

Catalog order (set by request, `tools.js` array order): Virtual Lab on
Engine Practical, Turbofan Engine, Oil System Overview, Fuel System
Overview, Air System, Starting System, Virtual Lab on APU System,
Virtual Lab on Fire Protection System. The last two's catalog names
were renamed by request from "APU System"/"Fire Protection System" —
first to "Virtual Lab on System"/"Virtual Lab on Fire Protection
System", then "Virtual Lab on System" renamed again to "Virtual Lab on
APU System" by follow-up request — ids (`apu-system`/`fire-system`)
and every in-tool heading/doc reference
below are unchanged; only the `tools.js` card name (and so the catalog
card + browser hash's displayed label) changed.

### Future phases

- Add further tools via the registry pattern above; scope and specifics TBD
  per tool when planned.
