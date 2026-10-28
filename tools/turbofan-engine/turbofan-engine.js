(function () {
  var ICON = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.5"></circle><path d="M12 9.5c0-3 1-5.5 3.5-6.5"></path><path d="M14.3 10.3c2.4-1.7 5-2.2 7-1.2"></path><path d="M14.3 13.7c2.4 1.7 3.7 4 3.7 6.2"></path><path d="M9.7 13.7c-2.4 1.7-5 2.2-7 1.2"></path><path d="M9.7 10.3C7.3 8.6 6 6.3 6 4.1"></path></svg>';

  var ns = 'http://www.w3.org/2000/svg';
  function elt(tag, atts, parent) {
    var e = document.createElementNS(ns, tag);
    Object.keys(atts || {}).forEach(function (k) { e.setAttribute(k, atts[k]); });
    if (parent) parent.appendChild(e);
    return e;
  }

  // Spool definitions: position/geometry for the schematic engine cutaway,
  // adapted from the user-supplied reference animation. `order` fixes the
  // physical LP/IP/HP hierarchy; the N-number shown to students is NOT this
  // fixed order but the spool's 1-based position within whichever spools
  // are visible in the current mode (see nNumberFor) — e.g. HP is N3 in
  // triple-spool mode but N2 in twin-spool mode, since N-numbering counts
  // outward-to-inward among the spools actually present, not a fixed label.
  var SPOOLS = [
    {
      id: 'LP', order: 1, color: '#f6c83c', speed: 36, defaultSpeed: 36,
      name: 'Low-Pressure (LP) spool', parts: 'LP fan / LP compressor and LP turbine',
      note: 'LP spool drives the LP fan/compressor and LP turbine',
      stages: [
        { x: 112, wide: 28, size: 260, yOff: -1, component: 'lpFan' },
        // Shared by triple/twin (one compact LP-compressor stage, matching
        // the IP/HP compressor stages' own fit against the core duct
        // lines). Single-spool mode swaps this out for its own 7-stage
        // run below instead, since it has no separate IP/HP compressor to
        // share the load with. `yOff` recenters each stage on the core
        // duct's own local centerline (sampled from the rendered
        // `tf-core` path) rather than the fixed y=240 the rect math uses
        // — the duct's top/bottom aren't symmetric about 240 everywhere,
        // so a size alone (no yOff) let later stages' blades poke past
        // the bottom boundary line.
        { x: 205, wide: 23, size: 185, yOff: -6, component: 'lpCompressor', modes: ['triple'] },
        // Twin-spool's own 7-stage LPC run (distinct from triple's single
        // compact stage above and single-spool's 7-stage run below) —
        // compacted into a tighter span (was 5 stages spread 190-460) so
        // a clear gap opens up before the HP compressor's first stage at
        // x:494, per request ("increase the number of stages to 7 and
        // compact the LPC together, leave a gap between LPC and HPC").
        { x: 180, wide: 20, size: 188, yOff: -5, component: 'lpCompressor', modes: ['twin'] },
        { x: 217, wide: 20, size: 184, yOff: -6, component: 'lpCompressor', modes: ['twin'] },
        { x: 254, wide: 20, size: 178, yOff: -8, component: 'lpCompressor', modes: ['twin'] },
        { x: 291, wide: 20, size: 171, yOff: -8, component: 'lpCompressor', modes: ['twin'] },
        { x: 328, wide: 20, size: 163, yOff: -9, component: 'lpCompressor', modes: ['twin'] },
        { x: 365, wide: 20, size: 154, yOff: -10, component: 'lpCompressor', modes: ['twin'] },
        { x: 402, wide: 20, size: 145, yOff: -10, component: 'lpCompressor', modes: ['twin'] },
        { x: 190, wide: 23, size: 187, yOff: -5, component: 'lpCompressor', modes: ['single'] },
        { x: 235, wide: 23, size: 181, yOff: -7, component: 'lpCompressor', modes: ['single'] },
        { x: 280, wide: 23, size: 173, yOff: -8, component: 'lpCompressor', modes: ['single'] },
        { x: 325, wide: 23, size: 164, yOff: -9, component: 'lpCompressor', modes: ['single'] },
        { x: 370, wide: 23, size: 153, yOff: -10, component: 'lpCompressor', modes: ['single'] },
        { x: 415, wide: 23, size: 141, yOff: -10, component: 'lpCompressor', modes: ['single'] },
        { x: 460, wide: 23, size: 135, yOff: -10, component: 'lpCompressor', modes: ['single'] },
        { x: 1001, wide: 28, size: 141, yOff: -16, component: 'lpTurbine', modes: ['triple', 'single'] },
        { x: 1037, wide: 28, size: 125, yOff: -14, component: 'lpTurbine', modes: ['triple', 'single'] },
        // Twin-spool's own 3-stage LPT run, spread into the extra room
        // left by the IP turbine's absence ("3 stages of LPT").
        { x: 950, wide: 28, size: 144, yOff: -15, component: 'lpTurbine', modes: ['twin'] },
        { x: 994, wide: 28, size: 144, yOff: -16, component: 'lpTurbine', modes: ['twin'] },
        { x: 1037, wide: 28, size: 125, yOff: -14, component: 'lpTurbine', modes: ['twin'] },
      ],
    },
    {
      id: 'IP', order: 2, color: '#34d38a', speed: 61, defaultSpeed: 61,
      name: 'Intermediate-Pressure (IP) spool', parts: 'IP compressor and IP turbine',
      note: 'IP spool drives the IP compressor and IP turbine',
      stages: [
        { x: 288, wide: 23, size: 172, yOff: -8, component: 'ipCompressor' },
        { x: 321, wide: 23, size: 165, yOff: -9, component: 'ipCompressor' },
        { x: 354, wide: 23, size: 157, yOff: -10, component: 'ipCompressor' },
        { x: 387, wide: 23, size: 149, yOff: -10, component: 'ipCompressor' },
        { x: 912, wide: 29, size: 144, yOff: -15, component: 'ipTurbine' },
        { x: 947, wide: 29, size: 144, yOff: -15, component: 'ipTurbine' },
      ],
    },
    {
      id: 'HP', order: 3, color: '#fa873b', speed: 85, defaultSpeed: 85,
      name: 'High-Pressure (HP) spool', parts: 'HP compressor and HP turbine',
      note: 'HP spool drives the HP compressor and HP turbine',
      stages: [
        { x: 494, wide: 22, size: 137, yOff: -10, component: 'hpCompressor' },
        { x: 526, wide: 22, size: 139, yOff: -10, component: 'hpCompressor' },
        { x: 558, wide: 22, size: 141, yOff: -10, component: 'hpCompressor' },
        { x: 833, wide: 25, size: 144, yOff: -13, component: 'hpTurbine', modes: ['triple'] },
        { x: 867, wide: 25, size: 144, yOff: -14, component: 'hpTurbine', modes: ['triple'] },
        // Twin-spool's own 3-stage HPT run ("3 stages for HPT"), spread a
        // bit further aft than triple's 2 since there's no IP turbine
        // immediately after it to leave room for.
        { x: 833, wide: 25, size: 144, yOff: -13, component: 'hpTurbine', modes: ['twin'] },
        { x: 870, wide: 25, size: 144, yOff: -14, component: 'hpTurbine', modes: ['twin'] },
        { x: 907, wide: 25, size: 144, yOff: -14, component: 'hpTurbine', modes: ['twin'] },
      ],
    },
  ];

  // Hover-labeled part markers over the schematic — 7 circles the
  // student can mouse over for a name/description, added by request
  // ("I want mouse over to label parts such as fan blade, LP
  // compressor, IP compressor, HP compressor, LP turbine, IP turbine,
  // and HP turbine"). Positioned in the same raw SVG user-space
  // coordinates (viewBox 0 0 1180 475) as every other shape in this
  // diagram, not a percentage-of-image overlay like Air System/APU
  // System/Virtual Lab use — there's no reference image here, it's all
  // drawn SVG, so plain x/y/r in the viewBox's own units is the natural
  // fit. `spool` ties each marker's visibility to the same
  // MODES[mode].visible list the shaft/stage geometry already uses
  // (e.g. the IP markers only show in triple-spool mode). `lpCompressor`'s
  // default position (x: 205) lines up with the LP spool's own second
  // drawn stage of the same name (see SPOOLS[0].stages below) — exact
  // placement is still for edit mode to refine if that stage ever
  // moves, by request ("allow me to edit the location and size of the
  // label circle").
  var PART_LABELS = {
    fanBlade: {
      name: 'Fan Blade', spool: 'LP', x: 112, y: 240, r: 75,
      desc: 'The large forward blades that draw air into the engine. In a high-bypass turbofan, most of that air is accelerated straight past the core through the bypass duct, producing most of the engine’s thrust directly.',
    },
    lpCompressor: {
      name: 'LP Compressor', spool: 'LP', x: 205, y: 240, r: 38,
      desc: 'Raises the pressure of the air that continues into the engine core (as opposed to the bypass air the fan diverts around it), driven by the LP turbine through the long LP shaft.',
    },
    ipCompressor: {
      name: 'IP Compressor', spool: 'IP', x: 338, y: 240, r: 55,
      desc: 'A middle compression stage between the LP and HP compressors, driven by its own IP turbine via the IP shaft. Only present in triple-spool engines — twin- and single-spool engines go straight from LP to HP compression (or have no separate stages at all).',
    },
    hpCompressor: {
      name: 'HP Compressor', spool: 'HP', x: 526, y: 240, r: 42,
      desc: 'The final, highest-pressure compression stage right before the combustor, driven by the HP turbine next to it through the short HP shaft.',
    },
    hpTurbine: {
      name: 'HP Turbine', spool: 'HP', x: 850, y: 240, r: 32,
      desc: 'The first turbine stage the combustor’s hot gas reaches — extracts just enough energy to drive the HP compressor, which sits right next to it on the same short shaft.',
    },
    ipTurbine: {
      name: 'IP Turbine', spool: 'IP', x: 930, y: 240, r: 32,
      desc: 'Extracts energy to drive the IP compressor via the IP shaft. Only present in triple-spool engines.',
    },
    lpTurbine: {
      name: 'LP Turbine', spool: 'LP', x: 1019, y: 240, r: 42,
      desc: 'The last turbine stage(s) — extracts the remaining energy from the gas stream to drive the fan and LP compressor at the front of the engine, via the long outer LP shaft.',
    },
  };

  var TF_EDIT_PASSWORD = 'APP';
  var STORAGE_KEY_PART_LABELS = 'tm.turbofanEngine.partLabels';

  function restorePartLabels() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY_PART_LABELS);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object') return;
      Object.keys(PART_LABELS).forEach(function (id) {
        var s = saved[id];
        if (!s) return;
        if (typeof s.x === 'number') PART_LABELS[id].x = s.x;
        if (typeof s.y === 'number') PART_LABELS[id].y = s.y;
        if (typeof s.r === 'number') PART_LABELS[id].r = s.r;
      });
    } catch (e) { /* corrupt/blocked storage — keep defaults */ }
  }
  function persistPartLabels() {
    var out = {};
    Object.keys(PART_LABELS).forEach(function (id) {
      out[id] = { x: PART_LABELS[id].x, y: PART_LABELS[id].y, r: PART_LABELS[id].r };
    });
    try { window.localStorage.setItem(STORAGE_KEY_PART_LABELS, JSON.stringify(out)); } catch (e) { /* storage full/blocked */ }
  }
  restorePartLabels();

  // Per-mode content for the "shaft arrangement" panel — a reference
  // cutaway matched to the mode's own shaft count (not a single
  // triple-spool image reused for every mode), since the nesting it
  // shows is different each time: 3 shafts, 2 shafts, or none at all.
  var SHAFT_INFO = {
    triple: {
      image: 'tools/turbofan-engine/spool-cutaway.png',
      alt: 'Cutaway of a triple-spool turbofan showing the HP, IP, and LP shafts nested inside one another',
      title: 'Concentric shaft arrangement',
      intro: 'The spools aren’t side by side — they’re nested, one shaft inside another, all turning independently on their own bearings:',
      items: [
        '<b>HP spool (N3):</b> the innermost shaft — short, solid, and the fastest-spinning, since it only has to connect the HP compressor to the HP turbine right next to the combustor.',
        '<b>IP spool (N2):</b> a hollow shaft that passes over the HP shaft, connecting the IP compressor further forward to the IP turbine further aft.',
        '<b>LP spool (N1):</b> the outermost hollow shaft, passing over both the IP and HP shafts, connecting the fan at the very front to the LP turbine at the very back — the longest shaft and the slowest-spinning.',
      ],
      closing: 'A twin-spool engine is the same idea with the IP shaft removed — just an inner HP shaft inside an outer LP shaft. A single-spool engine has no nesting at all: one shaft, one speed.',
    },
    twin: {
      image: 'tools/turbofan-engine/twin-spool-cutaway.png',
      alt: 'Cutaway of a twin-spool turbofan showing the HP shaft nested inside the LP shaft',
      title: 'Concentric shaft arrangement',
      intro: 'Two shafts here, one inside the other:',
      items: [
        '<b>HP spool (N2):</b> the inner shaft — shorter, and the faster-spinning of the two, connecting the HP compressor to the HP turbine right next to the combustor.',
        '<b>LP spool (N1):</b> the outer hollow shaft, surrounding the HP shaft, connecting the LP fan/compressor at the front to the LP turbine at the back — the longer shaft and the slower-spinning of the two.',
      ],
      closing: 'Add a third, independent IP shaft between these two — its own compressor, its own turbine, its own speed — and you get a triple-spool engine.',
    },
    single: {
      image: 'tools/turbofan-engine/single-spool-cutaway.png',
      alt: 'Cutaway of a single-spool turbofan showing one shaft driving the fan, compressor, and turbine',
      title: 'Shaft arrangement',
      intro: 'No nesting here — just one shaft:',
      items: [
        '<b>Single spool (N1):</b> the only shaft in the engine, directly connecting the fan/compressor at the front to the turbine at the back. Every rotating stage turns at exactly the same speed.',
      ],
      closing: 'Add a second, independent HP shaft inside this one and you get a twin-spool engine; a third gets you triple-spool.',
    },
  };

  var MODES = {
    triple: {
      title: 'Triple-Spool Turbofan Engine',
      subtitle: 'Three concentric shafts — each spool links its own compressor and turbine',
      description: 'Showing all three concentric shafts: LP, IP, and HP.',
      note: 'Triple-spool mode: the LP spool drives the LP fan/compressor and LP turbine; the IP spool drives the IP compressor and IP turbine; the HP spool drives the HP compressor and HP turbine. Example: Rolls-Royce Trent, RB211.',
      visible: ['LP', 'IP', 'HP'],
    },
    twin: {
      title: 'Twin-Spool Turbofan Engine',
      subtitle: 'Two concentric shafts — LP and HP systems shown separately',
      description: 'Showing LP and HP spools only. The IP spool is removed.',
      note: 'Twin-spool mode: the LP spool drives the LP fan/compressor and LP turbine; the HP spool drives the HP compressor and HP turbine — there is no IP spool, so N-numbering stops at N2. Example: CFM56, V2500, most airliner engines.',
      visible: ['LP', 'HP'],
    },
    single: {
      title: 'Single-Spool Jet Engine',
      subtitle: 'One shaft — compressor and turbine rotate together on a single spool',
      description: 'Showing a simplified single-spool arrangement using one shaft only.',
      note: 'Single-spool mode: one shaft links the front compressor/fan section to the rear turbine section, so every rotating stage turns at the same speed — there is only one N-number to read. Example: early turbojets, small APU gas generators.',
      visible: ['LP'],
    },
  };

  function mount(container) {
    container.innerHTML =
      '<div class="turbofan-diagram">' +

      '<div class="tf-panel">' +
      '<div class="tf-header-row">' +
      '<div>' +
      '<h1 class="tf-title">Triple-Spool Turbofan Engine</h1>' +
      '<p class="tf-subtitle">Interactive schematic — compare single, twin, and triple spool arrangements</p>' +
      '</div>' +
      '<button type="button" class="tf-edit-btn" title="Edit part-label markers">✎ Edit</button>' +
      '</div>' +
      '<div class="tf-toolbar" style="margin-top:14px">' +
      '<span class="tf-pill">Engine configuration</span>' +
      '<button type="button" class="tf-mode-btn tf-active" data-mode="triple">Triple spool</button>' +
      '<button type="button" class="tf-mode-btn" data-mode="twin">Twin spool</button>' +
      '<button type="button" class="tf-mode-btn" data-mode="single">Single spool</button>' +
      '<span class="tf-spacer"></span>' +
      '<span class="tf-note tf-mode-desc"></span>' +
      '</div>' +

      '<svg class="tf-engine-svg" viewBox="0 0 1180 475" role="img" aria-label="Animated schematic of a selectable single, twin, or triple spool turbofan engine">' +
      '<defs>' +
      '<linearGradient id="tf-shell" x2="0" y2="1"><stop stop-color="#6c859a"/><stop offset=".3" stop-color="#263d52"/><stop offset="1" stop-color="#5e798b"/></linearGradient>' +
      '<linearGradient id="tf-core" x2="0" y2="1"><stop stop-color="#1e3b4d"/><stop offset=".5" stop-color="#0e1e29"/><stop offset="1" stop-color="#304c5c"/></linearGradient>' +
      '<linearGradient id="tf-flame" x2="0" y2="1"><stop stop-color="#fdbe45"/><stop offset=".5" stop-color="#fb5b22"/><stop offset="1" stop-color="#ffcf55"/></linearGradient>' +
      '<pattern id="tf-stripeLP" width="23" height="14" patternUnits="userSpaceOnUse"><path d="M0 0L16 14" stroke="#ffeb8c" stroke-width="5" opacity=".75"/></pattern>' +
      '<pattern id="tf-stripeIP" width="19" height="14" patternUnits="userSpaceOnUse"><path d="M0 0L15 14" stroke="#abffce" stroke-width="4" opacity=".75"/></pattern>' +
      '<pattern id="tf-stripeHP" width="15" height="14" patternUnits="userSpaceOnUse"><path d="M0 0L12 14" stroke="#ffd3ae" stroke-width="4" opacity=".75"/></pattern>' +
      '</defs>' +

      '<path d="M58 73Q76 30 139 37L465 64Q550 72 630 60L1000 65L1120 130L1120 322L1000 390L630 405Q560 397 465 407L140 428Q72 422 58 380Z" fill="url(#tf-shell)" stroke="#abc4d6" stroke-width="3"></path>' +
      '<path d="M69 103L140 94L425 128L1000 112L1100 151L1100 304L1000 344L425 352L140 388L69 368" fill="#0a273c" stroke="#4a7c9b" stroke-width="3"></path>' +
      '<path d="M171 133Q290 133 440 155L627 150L996 144L1090 171L1090 287L996 304L627 311L440 305Q290 327 171 338Z" fill="url(#tf-core)" stroke="#b9cada" stroke-width="4"></path>' +

      '<g fill="none" stroke="#6abce9" stroke-width="5" opacity=".78">' +
      '<path d="M4 127H50M170 95Q430 95 650 90L1025 95"></path>' +
      '<path d="M170 377Q440 375 650 380L1025 375"></path>' +
      '<path d="M1045 98l-14 -8m14 8l-14 8M1045 375l-14 -8m14 8l-14 8"></path>' +
      '</g>' +

      '<path d="M608 178L805 176L859 205L859 263L805 284L608 279Z" fill="#55251d" stroke="#e88948" stroke-width="3"></path>' +
      '<path d="M645 209L802 205L839 229L802 249L645 251" fill="url(#tf-flame)" opacity=".88"></path>' +
      '<text x="721" y="232" fill="#361307" text-anchor="middle" font-size="16" font-weight="800">COMBUSTOR</text>' +

      '<g class="tf-shaftLP">' +
      '<rect x="145" y="217" width="885" height="46" rx="7" fill="#be9725" stroke="#fbe089" stroke-width="2"></rect>' +
      '<rect x="145" y="220" width="885" height="40" fill="url(#tf-stripeLP)" opacity=".45"></rect>' +
      '</g>' +
      '<g class="tf-shaftIP">' +
      '<rect x="338" y="227" width="601" height="27" rx="5" fill="#119b63" stroke="#6ff3ad" stroke-width="2"></rect>' +
      '<rect x="338" y="227" width="601" height="27" fill="url(#tf-stripeIP)" opacity=".4"></rect>' +
      '</g>' +
      '<g class="tf-shaftHP">' +
      '<rect x="525" y="233" width="342" height="16" rx="3" fill="#e7772d" stroke="#ffc39e" stroke-width="2"></rect>' +
      '<rect x="525" y="233" width="342" height="16" fill="url(#tf-stripeHP)" opacity=".5"></rect>' +
      '</g>' +

      '<g class="tf-stages"></g>' +
      '<g class="tf-top-labels"></g>' +
      '<g class="tf-part-markers"></g>' +
      '</svg>' +

      '<div class="tf-tooltip"><span class="t-title"></span><span class="t-desc"></span></div>' +

      '<div class="tf-legend">' +
      '<span><i class="tf-key" style="background:#f6c83c"></i>LP / N1 (yellow)</span>' +
      '<span><i class="tf-key" style="background:#34d38a"></i>IP / N2 (green)</span>' +
      '<span><i class="tf-key" style="background:#fa873b"></i>HP / N3 (orange)</span>' +
      '</div>' +
      '</div>' +

      '<div class="tf-panel">' +
      '<div class="tf-section-title">Front-facing rotor views — actual visual rotation</div>' +
      '<div class="tf-rotors"></div>' +
      '<p class="tf-note">Each spool’s compressor section and turbine section rotate together because they are connected by the same shaft. Use the engine configuration buttons above to compare single-, twin-, and triple-spool arrangements.</p>' +
      '</div>' +

      '<div class="tf-panel">' +
      '<div class="tf-section-title">Independent spool speed controls</div>' +
      '<div class="tf-controls"></div>' +
      '<div class="tf-toolbar">' +
      '<button type="button" class="tf-pause">⏸ Pause</button>' +
      '<button type="button" class="tf-reset">↺ Reset speeds</button>' +
      '<button type="button" class="tf-isolate">Show one rotating spool at a time: Off</button>' +
      '<span class="tf-note tf-status" aria-live="polite">All visible spools rotating</span>' +
      '</div>' +
      '<p class="tf-note tf-mode-note"></p>' +
      '</div>' +

      '<div class="tf-panel">' +
      '<div class="tf-section-title">Naming convention — N1 / N2 / N3 and spool names</div>' +
      '<p class="tf-note" style="margin-bottom:12px">Each spool has two names: a physical name (LP / IP / HP, for the pressure stage it drives) and an instrument reading (N1, N2, N3…). The N-number always counts from the slowest, outermost spool inward to the fastest, innermost spool — so which letter gets which number depends on how many spools the engine actually has.</p>' +
      '<div class="tf-naming-grid"></div>' +
      '</div>' +

      '<div class="tf-panel tf-cutaway-panel">' +
      '<div class="tf-section-title tf-cutaway-title"></div>' +
      '<div class="tf-cutaway-wrap">' +
      '<img class="tf-cutaway-img" src="" alt="" loading="lazy">' +
      '<div class="tf-cutaway-text">' +
      '<p class="tf-note tf-cutaway-intro"></p>' +
      '<ul class="tf-cutaway-list"></ul>' +
      '<p class="tf-note tf-cutaway-closing" style="margin-top:10px"></p>' +
      '</div>' +
      '</div>' +
      '</div>' +

      '<div class="tf-panel">' +
      '<div class="tf-section-title">High bypass vs. low bypass</div>' +
      '<p class="tf-note" style="margin-bottom:12px">Bypass ratio (BPR) = the mass of air that goes around the core (through the fan duct) ÷ the mass of air that goes through the core (compressors, combustor, turbines). It’s a separate idea from spool count — an engine can be twin-spool or triple-spool and still be either high or low bypass.</p>' +
      '<div class="tf-bypass-grid"></div>' +
      '</div>' +

      '<div class="tf-edit-panel" hidden>' +
      '<p>Drag a part-label circle to move it, or its small edge handle to resize it. When done:</p>' +
      '<button type="button" class="tf-edit-copy">Copy changes</button>' +
      '<textarea readonly></textarea>' +
      '</div>' +

      '</div>';

    var wrap = container.querySelector('.turbofan-diagram');
    var svg = wrap.querySelector('.tf-engine-svg');
    var stageRoot = wrap.querySelector('.tf-stages');
    var topLabelsRoot = wrap.querySelector('.tf-top-labels');
    var partMarkerRoot = wrap.querySelector('.tf-part-markers');
    var rotorsRoot = wrap.querySelector('.tf-rotors');
    var controlsRoot = wrap.querySelector('.tf-controls');
    var namingRoot = wrap.querySelector('.tf-naming-grid');
    var bypassRoot = wrap.querySelector('.tf-bypass-grid');
    var tooltip = wrap.querySelector('.tf-tooltip');
    var tTitle = tooltip.querySelector('.t-title');
    var tDesc = tooltip.querySelector('.t-desc');
    var editBtn = wrap.querySelector('.tf-edit-btn');
    var editPanel = wrap.querySelector('.tf-edit-panel');
    var editPanelText = editPanel.querySelector('textarea');
    var editCopyBtn = editPanel.querySelector('.tf-edit-copy');

    var currentMode = 'triple';
    var paused = false;
    var isolateIndex = 0;
    var rafId = null;
    var editUnlocked = false;

    // --- part-label tooltip (same pattern as the other tools', fixed
    // to the cursor's own viewport coordinates since .tf-tooltip is
    // position: fixed) ---
    function showTip(evt, info) {
      tTitle.textContent = info.name;
      tDesc.textContent = info.desc;
      tooltip.style.display = 'block';
      positionTip(evt);
    }
    function positionTip(evt) {
      if (tooltip.style.display !== 'block') return;
      var x = evt.clientX + 16;
      var y = evt.clientY + 16;
      var maxX = window.innerWidth - 300;
      if (x > maxX) x = evt.clientX - 296;
      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';
    }
    function hideTip() {
      tooltip.style.display = 'none';
    }

    // Converts a pointer event's viewport coordinates into the SVG's
    // own user-space (viewBox) coordinates — same technique the
    // Virtual Lab's waypoint/glow handles use, needed because this
    // diagram's markers live directly in SVG space, not a percentage-
    // of-image overlay.
    function svgPoint(evt) {
      var pt = svg.createSVGPoint();
      pt.x = evt.clientX; pt.y = evt.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    }

    function formatPartLabels() {
      var lines = Object.keys(PART_LABELS).map(function (id) {
        var p = PART_LABELS[id];
        return '    ' + id + ': { x: ' + Math.round(p.x) + ', y: ' + Math.round(p.y) + ', r: ' + Math.round(p.r) + ' },';
      });
      return '  // PART_LABELS positions/sizes:\n' + lines.join('\n');
    }
    function updateEditPanel() {
      if (!editUnlocked) return;
      editPanelText.value = formatPartLabels();
      persistPartLabels();
    }

    function renderPartMarkers() {
      partMarkerRoot.innerHTML = '';
      Object.keys(PART_LABELS).forEach(function (id) {
        var p = PART_LABELS[id];
        var g = elt('g', { 'class': 'tf-part-marker ' + p.spool.toLowerCase(), 'data-part': id }, partMarkerRoot);
        var circle = elt('circle', { cx: p.x, cy: p.y, r: p.r, 'class': 'tf-part-circle' }, g);
        var handle = elt('circle', { cx: p.x + p.r, cy: p.y, r: 8, 'class': 'tf-part-resize' }, g);
        p.groupEl = g;

        g.addEventListener('mouseenter', function (evt) { if (!editUnlocked) showTip(evt, p); });
        g.addEventListener('mousemove', positionTip);
        g.addEventListener('mouseleave', hideTip);

        circle.addEventListener('pointerdown', function (evt) {
          if (!editUnlocked) return;
          evt.preventDefault();
          hideTip();
          circle.setPointerCapture(evt.pointerId);
          circle.classList.add('dragging');
          function onMove(moveEvt) {
            var pt = svgPoint(moveEvt);
            p.x = pt.x; p.y = pt.y;
            circle.setAttribute('cx', p.x);
            circle.setAttribute('cy', p.y);
            handle.setAttribute('cx', p.x + p.r);
            handle.setAttribute('cy', p.y);
            updateEditPanel();
          }
          function onUp(upEvt) {
            circle.classList.remove('dragging');
            circle.releasePointerCapture(upEvt.pointerId);
            circle.removeEventListener('pointermove', onMove);
            circle.removeEventListener('pointerup', onUp);
          }
          circle.addEventListener('pointermove', onMove);
          circle.addEventListener('pointerup', onUp);
        });

        handle.addEventListener('pointerdown', function (evt) {
          if (!editUnlocked) return;
          evt.preventDefault();
          evt.stopPropagation();
          hideTip();
          handle.setPointerCapture(evt.pointerId);
          handle.classList.add('dragging');
          function onMove(moveEvt) {
            var pt = svgPoint(moveEvt);
            var dx = pt.x - p.x, dy = pt.y - p.y;
            p.r = Math.max(10, Math.min(120, Math.sqrt(dx * dx + dy * dy)));
            circle.setAttribute('r', p.r);
            handle.setAttribute('cx', p.x + p.r);
            updateEditPanel();
          }
          function onUp(upEvt) {
            handle.classList.remove('dragging');
            handle.releasePointerCapture(upEvt.pointerId);
            handle.removeEventListener('pointermove', onMove);
            handle.removeEventListener('pointerup', onUp);
          }
          handle.addEventListener('pointermove', onMove);
          handle.addEventListener('pointerup', onUp);
        });
      });
    }
    renderPartMarkers();

    function applyPartMarkerVisibility() {
      var visibleSpools = MODES[currentMode].visible;
      Object.keys(PART_LABELS).forEach(function (id) {
        var p = PART_LABELS[id];
        p.groupEl.style.display = visibleSpools.indexOf(p.spool) !== -1 ? '' : 'none';
      });
    }

    editBtn.addEventListener('click', function () {
      if (editUnlocked) {
        editUnlocked = false;
        editBtn.textContent = '✎ Edit';
        editBtn.classList.remove('tf-active');
        editPanel.hidden = true;
        wrap.classList.remove('tf-edit');
        return;
      }
      var pw = window.prompt('Enter the edit password:');
      if (pw === null) return;
      if (pw === TF_EDIT_PASSWORD) {
        editUnlocked = true;
        editBtn.textContent = '✓ Editing (click to stop)';
        editBtn.classList.add('tf-active');
        editPanel.hidden = false;
        wrap.classList.add('tf-edit');
        updateEditPanel();
      } else {
        window.alert('Incorrect password.');
      }
    });

    editCopyBtn.addEventListener('click', function () {
      editPanelText.focus();
      editPanelText.select();
      try { document.execCommand('copy'); } catch (e) { /* text stays selected for manual copy */ }
    });

    // --- stage geometry (built once; shown/hidden per mode) ---
    SPOOLS.forEach(function (spool) {
      spool.stageEls = [];
      spool.stages.forEach(function (st, idx) {
        var group = elt('g', {}, stageRoot);
        var x = st.x, y = 240 + (st.yOff || 0), H = st.size, w = st.wide;
        elt('rect', { x: x - w / 2, y: y - H / 2, width: w, height: H, rx: 5, fill: spool.color, opacity: 0.2 }, group);
        for (var z = 0; z < 6; z++) {
          var yy = y - H / 2 + z * (H / 6) + 2;
          elt('path', {
            d: 'M' + (x - w / 2 + 2) + ' ' + yy + ' L' + (x + w / 2 - 2) + ' ' + (yy + 8) + ' L' + (x + w / 2 - 6) + ' ' + (yy + H / 6 - 2) + ' L' + (x - w / 2 + 3) + ' ' + (yy + H / 6 - 7) + 'Z',
            fill: spool.color, stroke: '#122137', 'stroke-width': 1,
          }, group);
        }
        elt('line', { x1: x - w / 2 - 1, x2: x - w / 2 - 1, y1: y - H / 2 - 2, y2: y + H / 2 + 2, stroke: '#e1e6ed', 'stroke-width': 3, opacity: 0.7 }, group);
        var mark = elt('rect', { x: x - w / 2, y: y - H / 2, width: w, height: 11, fill: '#fff', opacity: 0.28, rx: 2 }, group);
        spool.stageEls.push({ group: group, mark: mark, st: st, index: idx });
      });
    });

    function getVisibleSpools() {
      return SPOOLS.filter(function (s) { return MODES[currentMode].visible.indexOf(s.id) !== -1; });
    }
    function nNumberFor(spool) {
      return getVisibleSpools().indexOf(spool) + 1;
    }

    function stageActiveInMode(st) {
      return !st.modes || st.modes.indexOf(currentMode) !== -1;
    }
    function componentCenter(names) {
      var xs = [];
      SPOOLS.forEach(function (spool) { spool.stages.forEach(function (st) { if (names.indexOf(st.component) !== -1 && stageActiveInMode(st)) xs.push(st.x); }); });
      return xs.reduce(function (a, b) { return a + b; }, 0) / xs.length;
    }
    function componentSpan(names, pad) {
      pad = pad == null ? 18 : pad;
      var xs = [];
      SPOOLS.forEach(function (spool) { spool.stages.forEach(function (st) { if (names.indexOf(st.component) !== -1 && stageActiveInMode(st)) xs.push({ left: st.x - st.wide / 2, right: st.x + st.wide / 2 }); }); });
      return { left: Math.min.apply(null, xs.map(function (v) { return v.left; })) - pad, right: Math.max.apply(null, xs.map(function (v) { return v.right; })) + pad };
    }
    function makeTopLabel(center, lines, span) {
      var g = elt('g', {}, topLabelsRoot);
      var y1 = 23, y2 = 42;
      var t = elt('text', { x: center, y: y1, fill: '#e9f4ff', 'font-size': lines.length > 1 ? 17 : 16, 'font-weight': '700', 'text-anchor': 'middle' }, g);
      if (lines.length === 1) {
        t.textContent = lines[0];
      } else {
        lines.forEach(function (line, i) {
          var ts = elt('tspan', { x: center, y: i ? y2 : y1 }, t);
          ts.textContent = line;
        });
      }
      elt('path', { d: 'M' + span.left + ' 56H' + span.right, stroke: '#bdd0df', 'stroke-width': '1.4', fill: 'none' }, g);
    }
    function renderTopLabels() {
      topLabelsRoot.innerHTML = '';

      if (currentMode === 'single') {
        makeTopLabel(componentCenter(['lpFan', 'lpCompressor']), ['FAN /', 'COMPRESSOR'], componentSpan(['lpFan', 'lpCompressor']));
        makeTopLabel(721, ['COMBUSTOR'], { left: 640, right: 802 });
        makeTopLabel(componentCenter(['lpTurbine']), ['TURBINE'], componentSpan(['lpTurbine']));
        return;
      }
      makeTopLabel(componentCenter(['lpFan']), ['LP FAN'], componentSpan(['lpFan']));
      if (currentMode === 'twin') {
        makeTopLabel(componentCenter(['hpCompressor']), ['HP', 'COMPRESSOR'], componentSpan(['hpCompressor']));
        makeTopLabel(721, ['COMBUSTOR'], { left: 640, right: 802 });
        makeTopLabel(componentCenter(['hpTurbine']), ['HP', 'TURBINE'], componentSpan(['hpTurbine']));
        makeTopLabel(componentCenter(['lpTurbine']), ['LP', 'TURBINE'], componentSpan(['lpTurbine']));
        return;
      }
      makeTopLabel(componentCenter(['ipCompressor']), ['IP', 'COMPRESSOR'], componentSpan(['ipCompressor']));
      makeTopLabel(componentCenter(['hpCompressor']), ['HP', 'COMPRESSOR'], componentSpan(['hpCompressor']));
      makeTopLabel(721, ['COMBUSTOR'], { left: 640, right: 802 });
      makeTopLabel(componentCenter(['hpTurbine']), ['HP', 'TURBINE'], componentSpan(['hpTurbine']));
      makeTopLabel(componentCenter(['ipTurbine']), ['IP', 'TURBINE'], componentSpan(['ipTurbine']));
      makeTopLabel(componentCenter(['lpTurbine']), ['LP', 'TURBINE'], componentSpan(['lpTurbine']));
    }

    function renderRotorViews() {
      rotorsRoot.innerHTML = '';
      getVisibleSpools().forEach(function (spool) {
        var div = document.createElement('div');
        div.className = 'tf-rotor-cell';
        div.innerHTML =
          '<b style="color:' + spool.color + '">N' + nNumberFor(spool) + ' · ' + spool.id + ' spool</b>' +
          '<small>' + spool.parts + '</small>' +
          '<svg viewBox="0 0 220 220" aria-label="Rotating ' + spool.id + ' rotor">' +
          '<circle cx="110" cy="110" r="101" fill="#09182a" stroke="#536c84" stroke-width="2"></circle>' +
          '<circle cx="110" cy="110" r="86" fill="none" stroke="' + spool.color + '" stroke-width="2" opacity=".3"></circle>' +
          '<g class="tf-spin"></g>' +
          '<circle cx="110" cy="110" r="19" fill="#b2beca" stroke="#f4f9ff" stroke-width="3"></circle>' +
          '<circle cx="110" cy="110" r="8" fill="#35465b"></circle>' +
          '</svg>' +
          '<small>Rotor (looking along engine axis)</small>';
        rotorsRoot.appendChild(div);
        var spin = div.querySelector('.tf-spin');
        spool.rotorEl = spin;
        for (var i = 0; i < 20; i++) {
          elt('path', {
            d: 'M105 92 C88 74 85 46 104 26 C121 45 130 71 115 92 Z',
            fill: spool.color, stroke: '#203145', 'stroke-width': '1.2',
            transform: 'rotate(' + (i * 18) + ' 110 110)',
          }, spin);
        }
      });
    }

    function renderControls() {
      controlsRoot.innerHTML = '';
      getVisibleSpools().forEach(function (spool) {
        var div = document.createElement('div');
        div.className = 'tf-control';
        div.innerHTML =
          '<header><strong style="color:' + spool.color + '">N' + nNumberFor(spool) + ' · ' + spool.name + '</strong><span><b class="tf-val">' + spool.speed + '%</b></span></header>' +
          '<input type="range" min="0" max="100" value="' + spool.speed + '" aria-label="' + spool.id + ' speed">' +
          '<small>' + spool.parts + '</small>';
        controlsRoot.appendChild(div);
        var valEl = div.querySelector('.tf-val');
        div.querySelector('input').addEventListener('input', function (e) {
          spool.speed = +e.target.value;
          valEl.textContent = spool.speed + '%';
        });
      });
    }

    function renderNaming() {
      namingRoot.innerHTML = '';
      getVisibleSpools().forEach(function (spool) {
        var n = nNumberFor(spool);
        var div = document.createElement('div');
        div.className = 'tf-naming-card';
        div.style.setProperty('--card-clr', spool.color);
        div.innerHTML =
          '<b>N' + n + ' — ' + spool.name + '</b>' +
          '<span>' + spool.note + '. Read out on the flight deck as "N' + n + '" — the ' + (n === 1 ? 'first (slowest, most outboard)' : n === 2 ? 'second' : 'third (fastest, innermost)') + ' spool speed.</span>';
        namingRoot.appendChild(div);
      });
      if (currentMode === 'single') {
        namingRoot.firstChild.querySelector('span').textContent =
          'The single shaft connecting the compressor and turbine. With only one spool, there’s nothing to distinguish it from — it’s simply read as N1 (sometimes just "N").';
      }
    }

    function renderShaftPanel() {
      var info = SHAFT_INFO[currentMode];
      wrap.querySelector('.tf-cutaway-title').textContent = info.title;
      var img = wrap.querySelector('.tf-cutaway-img');
      img.src = info.image;
      img.alt = info.alt;
      wrap.querySelector('.tf-cutaway-intro').textContent = info.intro;
      wrap.querySelector('.tf-cutaway-list').innerHTML = info.items.map(function (html) { return '<li>' + html + '</li>'; }).join('');
      wrap.querySelector('.tf-cutaway-closing').textContent = info.closing;
    }

    function applyMode() {
      var conf = MODES[currentMode];
      wrap.querySelector('.tf-title').textContent = conf.title;
      wrap.querySelector('.tf-subtitle').textContent = conf.subtitle;
      wrap.querySelector('.tf-mode-desc').textContent = conf.description;
      wrap.querySelector('.tf-mode-note').textContent = conf.note;
      wrap.querySelectorAll('.tf-mode-btn').forEach(function (btn) { btn.classList.toggle('tf-active', btn.dataset.mode === currentMode); });

      SPOOLS.forEach(function (spool) {
        var visible = conf.visible.indexOf(spool.id) !== -1;
        var shaftEl = wrap.querySelector('.tf-shaft' + spool.id);
        if (shaftEl) shaftEl.style.display = visible ? '' : 'none';
        spool.stageEls.forEach(function (s) {
          var stageVisible = visible && (!s.st.modes || s.st.modes.indexOf(currentMode) !== -1);
          s.group.style.display = stageVisible ? '' : 'none';
        });
      });

      renderTopLabels();
      applyPartMarkerVisibility();
      renderRotorViews();
      renderControls();
      renderNaming();
      renderShaftPanel();
      isolateIndex = 0;
      wrap.querySelector('.tf-isolate').textContent = 'Show one rotating spool at a time: Off';
      updateStatus();
    }

    function updateStatus() {
      var visibleSpools = getVisibleSpools();
      var statusEl = wrap.querySelector('.tf-status');
      if (paused) {
        statusEl.textContent = 'Rotation paused';
      } else if (isolateIndex) {
        statusEl.textContent = 'Only ' + visibleSpools[isolateIndex - 1].id + ' spool rotates';
      } else {
        statusEl.textContent = 'Visible spools rotating: ' + visibleSpools.map(function (s) { return s.id; }).join(', ');
      }
    }

    wrap.querySelectorAll('.tf-mode-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentMode = btn.dataset.mode;
        applyMode();
      });
    });
    wrap.querySelector('.tf-pause').addEventListener('click', function () {
      paused = !paused;
      wrap.querySelector('.tf-pause').textContent = paused ? '▶ Resume' : '⏸ Pause';
      updateStatus();
    });
    wrap.querySelector('.tf-reset').addEventListener('click', function () {
      SPOOLS.forEach(function (spool) { spool.speed = spool.defaultSpeed; });
      paused = false;
      wrap.querySelector('.tf-pause').textContent = '⏸ Pause';
      renderControls();
      updateStatus();
    });
    wrap.querySelector('.tf-isolate').addEventListener('click', function () {
      var visibleSpools = getVisibleSpools();
      isolateIndex = (isolateIndex + 1) % (visibleSpools.length + 1);
      wrap.querySelector('.tf-isolate').textContent = 'Show one rotating spool at a time: ' + (isolateIndex ? visibleSpools[isolateIndex - 1].id : 'Off');
      updateStatus();
    });

    var prev = performance.now();
    function tick(t) {
      var dt = Math.min((t - prev) / 1000, 0.08); prev = t;
      var visibleSpools = getVisibleSpools();
      SPOOLS.forEach(function (spool) {
        if (spool.angle == null) spool.angle = 0;
        var visible = visibleSpools.indexOf(spool) !== -1;
        var allowed = !paused && visible && (!isolateIndex || visibleSpools[isolateIndex - 1] === spool);
        if (allowed) spool.angle += (spool.speed / 100) * 270 * dt;

        if (spool.rotorEl) spool.rotorEl.setAttribute('transform', 'rotate(' + spool.angle + ' 110 110)');
        spool.stageEls.forEach(function (s) {
          var ph = (spool.angle / 360 + s.index * 0.14) % 1;
          s.mark.setAttribute('y', 240 + (s.st.yOff || 0) - s.st.size / 2 + (s.st.size - 11) * ph);
          s.mark.setAttribute('opacity', visible ? (0.08 + 0.2 * Math.abs(Math.sin((spool.angle * Math.PI / 180) + s.index))) : 0);
        });
      });
      rafId = requestAnimationFrame(tick);
    }

    // --- high bypass vs low bypass comparison (static schematic) ---
    function bypassSvg(opts) {
      var w = 420, h = 180, cy = h / 2;
      var fanR = opts.fanR, coreR = opts.coreR;
      var nacelleTop = cy - fanR, nacelleBottom = cy + fanR;
      var coreTop = cy - coreR, coreBottom = cy + coreR;
      var fanX = 40, coreEndX = w - 30;
      var s = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="170">';
      s += '<path d="M' + fanX + ' ' + nacelleTop + ' L' + (coreEndX - 20) + ' ' + nacelleTop + ' L' + (coreEndX) + ' ' + cy + ' L' + (coreEndX - 20) + ' ' + nacelleBottom + ' L' + fanX + ' ' + nacelleBottom + ' Z" fill="#17304a" stroke="#3d5b78" stroke-width="2"></path>';
      s += '<rect x="' + (fanX + 24) + '" y="' + coreTop + '" width="' + (coreEndX - 50 - fanX) + '" height="' + (coreBottom - coreTop) + '" rx="6" fill="#55251d" stroke="#e88948" stroke-width="2"></rect>';
      s += '<rect x="' + (fanX + 6) + '" y="' + (cy - fanR - 2) + '" width="16" height="' + (fanR * 2 + 4) + '" rx="4" fill="#f6c83c" stroke="#fbe089" stroke-width="1.5"></rect>';
      var bypassGap = (coreTop - nacelleTop) > 6;
      if (bypassGap) {
        s += '<path d="M' + (fanX + 26) + ' ' + (nacelleTop + 6) + ' H' + (coreEndX - 60) + '" stroke="#6abce9" stroke-width="4" fill="none" marker-end="url(#tf-bp-arrow)" opacity=".85"></path>';
        s += '<path d="M' + (fanX + 26) + ' ' + (nacelleBottom - 6) + ' H' + (coreEndX - 60) + '" stroke="#6abce9" stroke-width="4" fill="none" marker-end="url(#tf-bp-arrow)" opacity=".85"></path>';
      }
      s += '<path d="M' + (fanX + 30) + ' ' + cy + ' H' + (coreEndX - 56) + '" stroke="#fa873b" stroke-width="4" fill="none" marker-end="url(#tf-bp-arrow-core)"></path>';
      s += '<text x="' + (fanX + 24) + '" y="' + (h - 8) + '" fill="#97afc9" font-size="11">FAN</text>';
      s += '<text x="' + ((fanX + coreEndX) / 2 - 20) + '" y="' + (h - 8) + '" fill="#97afc9" font-size="11">CORE</text>';
      s += '</svg>';
      return s;
    }
    bypassRoot.innerHTML =
      '<svg width="0" height="0" style="position:absolute"><defs>' +
      '<marker id="tf-bp-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#6abce9"></path></marker>' +
      '<marker id="tf-bp-arrow-core" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#fa873b"></path></marker>' +
      '</defs></svg>' +
      '<div class="tf-bypass-card">' +
      '<h3>Low Bypass</h3>' +
      bypassSvg({ fanR: 28, coreR: 24 }) +
      '<div class="tf-bypass-stats"><div>Typical BPR<b>0.3 – 2</b></div><div>Fan size<b>Small</b></div><div>Core share<b>Most of the airflow</b></div></div>' +
      '<p>Most of the intake air goes through the engine core. Common on fighter jets and older/supersonic-capable engines, often paired with an afterburner. Produces strong thrust at high speed, but is noisier and less fuel-efficient at subsonic cruise.</p>' +
      '</div>' +
      '<div class="tf-bypass-card">' +
      '<h3>High Bypass</h3>' +
      bypassSvg({ fanR: 60, coreR: 24 }) +
      '<div class="tf-bypass-stats"><div>Typical BPR<b>4 – 12+</b></div><div>Fan size<b>Large</b></div><div>Core share<b>Small fraction</b></div></div>' +
      '<p>A large fan pushes most of the air around the core through the bypass duct instead of through it. Standard on commercial airliners (CFM56, Trent, GE90, LEAP): quieter and far more fuel-efficient at subsonic cruise, at the cost of a bulkier nacelle and less benefit at very high speed.</p>' +
      '</div>';

    applyMode();
    rafId = requestAnimationFrame(tick);

    window.TM.toolModules['turbofan-engine'].unmount = function () {
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }

  window.TM.registerTool('turbofan-engine', { mount: mount });
})();
