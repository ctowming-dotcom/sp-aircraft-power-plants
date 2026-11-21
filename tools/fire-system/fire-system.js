(function () {
  // Content sourced from the supplied lab answer key
  // (Lab_5_Engine_Fire_Protection_ANS_v7.0.docx) and its two reference
  // images, used verbatim (not redrawn) — fire-panel-overview.jpg (the
  // 20VU fire panel + cockpit location + 115VU engine mode panel) and
  // fdu-dual-loop.jpg (the APU's Loop A / Loop B dual-loop detection
  // circuit) — with hover markers overlaid at percentage positions,
  // same image-plus-overlay pattern as Air System/APU System.
  //
  // rPct is each marker's diameter as a % of the image's displayed
  // width (CSS aspect-ratio: 1/1 keeps it a true circle regardless of
  // the image's own aspect ratio) — same convention as APU System/
  // Virtual Lab. Both xPct/yPct and rPct are editable in edit mode
  // (password-gated "✎ Edit", same password as the other tools) by
  // request ("allow me to edit the size and location of the circle in
  // edit mode for fire protection").
  var PANEL_MARKERS = {
    'eng1-fire-pb': {
      name: 'ENG 1 FIRE Pushbutton', xPct: 19.3, yPct: 18, rPct: 7,
      desc: 'The guarded red pushbutton for engine 1. Pushing it arms the fire extinguishing system and automatically cuts off fuel, hydraulic, bleed air, and electrical supplies to that engine.',
    },
    'agent1-eng1': {
      name: 'ENG 1 — AGENT 1 (Squib/Disch)', xPct: 8.7, yPct: 12.4, rPct: 4.7,
      desc: 'Fires the first extinguisher bottle into the engine 1 nacelle. Pressed after the ENG FIRE pushbutton, once the fire warning has had time to clear on its own.',
    },
    'agent2-eng1': {
      name: 'ENG 1 — AGENT 2 (Squib/Disch)', xPct: 30.7, yPct: 11.9, rPct: 2.2,
      desc: 'Fires the second, backup extinguisher bottle into the engine 1 nacelle, if the fire warning persists after Agent 1 has been discharged.',
    },
    'test-eng1': {
      name: 'ENG 1 — TEST', xPct: 8.7, yPct: 19.5, rPct: 2.2,
      desc: 'Checks the engine 1 fire detection and warning circuit without an actual fire present.',
    },
    'apu-fire-pb': {
      name: 'APU FIRE Pushbutton', xPct: 42.3, yPct: 13.9, rPct: 7.6,
      desc: 'The guarded red pushbutton for the APU. Pushing it arms the APU fire extinguishing system and shuts down the APU’s fuel and electrical supplies.',
    },
    'apu-agent': {
      name: 'APU — AGENT (Squib/Disch)', xPct: 36.6, yPct: 23.4, rPct: 4.8,
      desc: 'Fires the APU’s single extinguisher bottle. The APU only carries one bottle (unlike each main engine’s two), since it has no second engine nearby still needing thrust and is usually shut down entirely once a fire is confirmed.',
    },
    'apu-test': {
      name: 'APU — TEST', xPct: 46.8, yPct: 23.2, rPct: 3.3,
      desc: 'Checks the APU fire detection and warning circuit without an actual fire present.',
    },
    'agent1-eng2': {
      name: 'ENG 2 — AGENT 1 (Squib/Disch)', xPct: 53.1, yPct: 13.6, rPct: 2.2,
      desc: 'Fires the first extinguisher bottle into the engine 2 nacelle. Pressed after the ENG FIRE pushbutton, once the fire warning has had time to clear on its own.',
    },
    'eng2-fire-pb': {
      name: 'ENG 2 FIRE Pushbutton', xPct: 64.1, yPct: 18.2, rPct: 5.5,
      desc: 'The guarded red pushbutton for engine 2. Pushing it arms the fire extinguishing system and automatically cuts off fuel, hydraulic, bleed air, and electrical supplies to that engine.',
    },
    'agent2-eng2': {
      name: 'ENG 2 — AGENT 2 (Squib/Disch)', xPct: 74.8, yPct: 12, rPct: 4.3,
      desc: 'Fires the second, backup extinguisher bottle into the engine 2 nacelle, if the fire warning persists after Agent 1 has been discharged.',
    },
    'test-eng2': {
      name: 'ENG 2 — TEST', xPct: 75.1, yPct: 20.4, rPct: 3.4,
      desc: 'Checks the engine 2 fire detection and warning circuit without an actual fire present.',
    },
    'overhead-location': {
      name: 'Fire Panel Location — Overhead Panel', xPct: 51.3, yPct: 34.8, rPct: 2.2,
      desc: 'This whole fire panel (labelled 20VU) is physically mounted on the cockpit’s overhead panel, within easy reach of both pilots.',
    },
    'pedestal-location': {
      name: 'Engine Mode Panel Location — Pedestal', xPct: 50.2, yPct: 74.1, rPct: 4.4,
      desc: 'The engine master switches and MODE selector (labelled 115VU) sit on the center pedestal between the two pilots, next to the thrust levers.',
    },
    'eng1-master': {
      name: 'ENG 1 Master Switch', xPct: 78.7, yPct: 77.6, rPct: 6.9,
      desc: 'ON starts/keeps engine 1 running; OFF shuts off its fuel supply. Used in the shutdown step before pushing the ENG FIRE pushbutton.',
    },
    'eng2-master': {
      name: 'ENG 2 Master Switch', xPct: 90.8, yPct: 77.4, rPct: 7.5,
      desc: 'ON starts/keeps engine 2 running; OFF shuts off its fuel supply. Used in the shutdown step before pushing the ENG FIRE pushbutton.',
    },
    'mode-selector': {
      name: 'MODE Selector (CRANK / NORM / IGN START)', xPct: 84.6, yPct: 87.6, rPct: 5.2,
      desc: 'Selects the engine start mode — CRANK (dry-motor the engine with no fuel/ignition), NORM (normal automatic start), or IGN START (manual ignition override). Not part of the fire logic itself, but shares the same 115VU panel.',
    },
    'eng1-fire-fault': {
      name: 'ENG 1 FIRE/FAULT Light', xPct: 76.7, yPct: 88.6, rPct: 4.9,
      desc: 'Illuminates red (FIRE) or amber (FAULT) to repeat the engine 1 fire/fault state on the pedestal panel, next to the master switch the pilot is about to use.',
    },
    'eng2-fire-fault': {
      name: 'ENG 2 FIRE/FAULT Light', xPct: 92.3, yPct: 88.7, rPct: 6,
      desc: 'Illuminates red (FIRE) or amber (FAULT) to repeat the engine 2 fire/fault state on the pedestal panel, next to the master switch the pilot is about to use.',
    },
  };

  var LOOP_MARKERS = {
    'loop-a': {
      name: 'Loop A', xPct: 42, yPct: 62, rPct: 2.2,
      desc: 'One of two identical fire-sensing loops routed around the nacelle. Loop A and Loop B are electrically independent and run in parallel, not in series — so damage to one loop’s wiring doesn’t take out fire detection entirely.',
    },
    'loop-b': {
      name: 'Loop B', xPct: 42, yPct: 69, rPct: 2.2,
      desc: 'The second of the two identical, parallel fire-sensing loops. Having two independent loops means the FDU can cross-check them: agreement between both gives a confident fire signal, while a mismatch points to a fault in one loop rather than a real fire.',
    },
    'sensing-element': {
      name: 'Fire-Sensing Element', xPct: 41.5, yPct: 57.2, rPct: 2.2,
      desc: 'A continuous heat-sensitive element running the length of each loop. Its electrical properties change when it detects an overheat/fire condition, which is what the FDU actually measures.',
    },
    'fdu-box': {
      name: 'Fire Detection Unit (FDU)', xPct: 77.9, yPct: 71.4, rPct: 10,
      desc: 'Continuously monitors both loops’ signals. If both loops agree a fire condition is present, it raises a Fire signal; if a loop’s own reading looks abnormal (e.g. open/shorted wiring) rather than a genuine fire, it raises a Fault signal instead. One FDU per engine/APU, each wired to that engine’s own Loop A/Loop B.',
    },
  };

  var SIGNALS = {
    fire: {
      name: 'Fire Signal',
      desc: 'Raised when the FDU’s loops agree a genuine fire condition is present. Activates the fire warning lights and aural/master warning alarms in the cockpit, and is what the pilot’s extinguishing drill responds to.',
    },
    fault: {
      name: 'Fault Signal',
      desc: 'Raised when the detection system itself is malfunctioning — e.g. a damaged loop or wiring fault — rather than an actual fire. Alerts the maintenance crew that the detection system needs inspection or repair, rather than triggering the fire drill.',
    },
  };

  var COMPARISON = [
    { feature: 'Location of Bottle', engine: 'Engine nacelle / pylon area, close to the engine but shielded from its heat', apu: 'APU compartment' },
    { feature: 'Extinguishing Method', engine: 'Always manual — pilot discharges Agent 1, then Agent 2 if needed, both on the ground and in flight', apu: 'Automatic on the ground; manual in flight' },
    { feature: 'Warning Signal', engine: 'Engine fire warning light and alarm on the flight deck', apu: 'APU fire warning light, also repeated at the wheel-well area (for ground/rescue crew)' },
    { feature: 'Number of Bottles', engine: '2 bottles (Agent 1 + Agent 2)', apu: '1 bottle' },
  ];

  var STEPS = [
    {
      text: 'A <b>fire warning</b> appears — Master Warning, an ECAM "ENG FIRE" message, and the red FIRE light illuminate on the affected engine’s fire panel.',
      marker: 'eng1-fire-fault',
    },
    {
      text: '<b>Thrust lever</b> of the affected engine — retard to idle.',
      marker: 'eng1-master',
    },
    {
      text: '<b>Engine Master Switch</b> — OFF. This shuts down fuel and ignition to that engine.',
      marker: 'eng1-master',
    },
    {
      text: '<b>ENG FIRE pushbutton</b> — PUSH. This arms the fire extinguishing system and automatically cuts off fuel, hydraulic, bleed air, and electrical supplies to that engine.',
      marker: 'eng1-fire-pb',
    },
    {
      text: 'Wait briefly (around 10 seconds). If the fire warning persists, discharge <b>Agent 1</b> — push the first SQUIB/DISCH button to fire the first bottle into the nacelle.',
      marker: 'agent1-eng1',
    },
    {
      text: 'Wait again (around 30 seconds). If the fire warning still persists, discharge <b>Agent 2</b> — push the second SQUIB/DISCH button to fire the backup bottle.',
      marker: 'agent2-eng1',
    },
    {
      text: 'If the fire warning clears, continue monitoring and complete the rest of the ECAM procedure. If it does <b>not</b> clear, this becomes a more serious emergency — the crew follows further checklist items, which may include diverting to the nearest suitable airport.',
      marker: null,
    },
  ];

  // Interactive fire-panel buttons: positioned from the matching
  // PANEL_MARKERS entry's own xPct/yPct (looked up live, not duplicated
  // here) so they always sit exactly where the real control is on the
  // overhead panel — including after a PANEL_MARKERS circle is dragged
  // in edit mode, so "Try It" stays in sync with the reference panel
  // above it. Button *size* stays fixed per type (fire switches bigger
  // than test/agent buttons, encoding what kind of control it is) rather
  // than following the marker's own editable rPct.
  var BUTTONS = {
    'eng1-fire-pb': { type: 'fire', unit: 'eng1' },
    'eng2-fire-pb': { type: 'fire', unit: 'eng2' },
    'apu-fire-pb': { type: 'fire', unit: 'apu' },
    'test-eng1': { type: 'test', unit: 'eng1' },
    'test-eng2': { type: 'test', unit: 'eng2' },
    'apu-test': { type: 'test', unit: 'apu' },
    'agent1-eng1': { type: 'agent', unit: 'eng1', agent: 1 },
    'agent2-eng1': { type: 'agent', unit: 'eng1', agent: 2 },
    'agent1-eng2': { type: 'agent', unit: 'eng2', agent: 1 },
    'agent2-eng2': { type: 'agent', unit: 'eng2', agent: 2 },
    'apu-agent': { type: 'agent', unit: 'apu', agent: 1 },
  };
  var UNITS = ['eng1', 'eng2', 'apu'];
  var UNIT_LABEL = { eng1: 'ENG 1', eng2: 'ENG 2', apu: 'APU' };
  var UNIT_SUPPLIES = {
    eng1: 'fuel, hydraulic, bleed air, and electrical supplies to Engine 1',
    eng2: 'fuel, hydraulic, bleed air, and electrical supplies to Engine 2',
    apu: 'fuel and electrical supplies to the APU',
  };

  function buttonHtml() {
    return Object.keys(BUTTONS).map(function (id) {
      var b = BUTTONS[id];
      var info = PANEL_MARKERS[id];
      return '<button type="button" class="fs-btn fs-btn-' + b.type + '" data-btn="' + id +
        '" style="left:' + info.xPct + '%; top:' + info.yPct + '%;" aria-label="' +
        TM.escapeHtml(info.name) + '"></button>';
    }).join('');
  }

  var EDIT_PASSWORD = 'APP2';
  var STORAGE_KEY_PANEL_MARKERS = 'tm.fireSystem.panelMarkers';
  var STORAGE_KEY_LOOP_MARKERS = 'tm.fireSystem.loopMarkers';

  function restoreMarkerPositions(key, markers) {
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object') return;
      Object.keys(markers).forEach(function (id) {
        var s = saved[id];
        if (!s) return;
        if (typeof s.xPct === 'number') markers[id].xPct = s.xPct;
        if (typeof s.yPct === 'number') markers[id].yPct = s.yPct;
        if (typeof s.rPct === 'number') markers[id].rPct = s.rPct;
      });
    } catch (e) { /* corrupt/blocked storage — keep defaults */ }
  }
  function persistMarkerPositions(key, markers) {
    var out = {};
    Object.keys(markers).forEach(function (id) {
      out[id] = { xPct: markers[id].xPct, yPct: markers[id].yPct, rPct: markers[id].rPct };
    });
    try { window.localStorage.setItem(key, JSON.stringify(out)); } catch (e) { /* storage full/blocked */ }
  }
  restoreMarkerPositions(STORAGE_KEY_PANEL_MARKERS, PANEL_MARKERS);
  restoreMarkerPositions(STORAGE_KEY_LOOP_MARKERS, LOOP_MARKERS);

  function unitBadgesHtml() {
    return UNITS.map(function (u) {
      var agents = u === 'apu' ? [1] : [1, 2];
      var badges = '<span class="fs-unit-badge" data-badge="' + u + '-armed">' + UNIT_LABEL[u] + ' ARMED</span>' +
        agents.map(function (n) {
          return '<span class="fs-unit-badge" data-badge="' + u + '-agent' + n + '">' + UNIT_LABEL[u] + ' AGENT ' + n + '</span>';
        }).join('');
      return '<div class="fs-unit-badge-group">' + badges + '</div>';
    }).join('');
  }

  function markerHtml(layerClass, markers) {
    return Object.keys(markers).map(function (id) {
      var m = markers[id];
      return '<span class="fs-marker" data-marker="' + id + '" style="left:' + m.xPct + '%; top:' + m.yPct + '%; width:' + m.rPct + '%;">' +
        '<span class="fs-marker-resize"></span>' +
        '</span>';
    }).join('');
  }
  function listHtml(markers) {
    return Object.keys(markers).map(function (id) {
      var m = markers[id];
      return '<li class="fs-list-item" data-marker="' + id + '">' +
        '<span class="fs-list-name">' + TM.escapeHtml(m.name) + '</span>' +
        '<span class="fs-list-desc">' + TM.escapeHtml(m.desc) + '</span>' +
        '</li>';
    }).join('');
  }

  function mount(container) {
    container.innerHTML =
      '<div class="fs-diagram">' +
      '<div class="fs-toolbar">' +
      '<div>' +
      '<p class="kicker">Official (Open)</p>' +
      '<h1>Engine Fire Protection System</h1>' +
      '<p class="fs-sub">Hover any marker for its function. In edit mode: drag a marker to move it, or its corner handle to resize it. Based on the supplied fire panel and dual-loop detection reference.</p>' +
      '</div>' +
      '<button type="button" class="fs-edit-btn" title="Edit markers">✎ Edit</button>' +
      '</div>' +

      '<div class="fs-match-panel">' +
      '<h3 class="fs-match-title">🧠 Match the Definition — Timed Challenge</h3>' +
      '<p class="fs-match-intro">Click a part name on the left, then its matching description on the right (or the other way round) — a correct pair locks in green, a wrong one just flashes and resets. Each round picks a random mix of components from both reference images below.</p>' +
      '<div class="fs-match-hud">' +
      '<div class="fs-match-stat"><span class="fs-match-stat-label">Score</span><span class="fs-match-stat-value" id="fsMatchScore">0</span></div>' +
      '<div class="fs-match-stat"><span class="fs-match-stat-label">Matched</span><span class="fs-match-stat-value" id="fsMatchSolved">0/0</span></div>' +
      '<div class="fs-match-stat"><span class="fs-match-stat-label">Time</span><span class="fs-match-stat-value" id="fsMatchTime">--</span></div>' +
      '<div class="fs-match-stat"><span class="fs-match-stat-label">Best</span><span class="fs-match-stat-value" id="fsMatchBest">--</span></div>' +
      '<button type="button" class="fs-match-btn" id="fsMatchStartBtn">▶ Start challenge</button>' +
      '</div>' +
      '<p class="fs-match-result" id="fsMatchResult"></p>' +
      '<div class="fs-match-columns">' +
      '<div class="fs-match-col" id="fsMatchTerms"></div>' +
      '<div class="fs-match-col" id="fsMatchDefs"></div>' +
      '</div>' +
      '</div>' +

      '<div class="fs-panel">' +
      '<h2 class="fs-section-title">Fire Panel &amp; Cockpit Location</h2>' +
      '<div class="fs-image-wrap">' +
      '<img class="fs-image" src="tools/fire-system/fire-panel-overview.jpg" alt="Engine and APU fire panel (20VU), its overhead-panel location, and the engine master/mode panel (115VU) on the pedestal.">' +
      '<div class="fs-markers">' + markerHtml('panel', PANEL_MARKERS) + '</div>' +
      '</div>' +
      '<ul class="fs-list">' + listHtml(PANEL_MARKERS) + '</ul>' +
      '</div>' +

      '<div class="fs-panel">' +
      '<h2 class="fs-section-title">Main Engine vs. APU Fire Protection</h2>' +
      '<p class="fs-note">Each engine and the APU have their own independent fire protection system, but they differ in a few key ways:</p>' +
      '<table class="fs-table"><thead><tr><th>Feature</th><th>Main Engine</th><th>APU</th></tr></thead><tbody>' +
      COMPARISON.map(function (row) {
        return '<tr><td>' + row.feature + '</td><td>' + row.engine + '</td><td>' + row.apu + '</td></tr>';
      }).join('') +
      '</tbody></table>' +
      '</div>' +

      '<div class="fs-panel">' +
      '<h2 class="fs-section-title">Dual-Loop Fire Detection (FDU)</h2>' +
      '<p class="fs-note">Shown here for the APU, but each main engine has the exact same arrangement — its own FDU wired to its own Loop A / Loop B around that engine’s nacelle.</p>' +
      '<div class="fs-image-wrap">' +
      '<img class="fs-image" src="tools/fire-system/fdu-dual-loop.jpg" alt="Dual-loop fire detection circuit: Loop A and Loop B routed around the nacelle, feeding the Fire Detection Unit (FDU).">' +
      '<div class="fs-markers">' + markerHtml('loop', LOOP_MARKERS) + '</div>' +
      '</div>' +
      '<ul class="fs-list">' + listHtml(LOOP_MARKERS) + '</ul>' +
      '<p class="fs-note">Each engine/APU has one <b>individual</b> fire detection system, not a system shared across engines. That system’s 2 identical loops (A and B) are wired in <b>parallel</b>, not series — so a single damaged loop degrades to a fault condition rather than silently disabling fire detection altogether.</p>' +
      '</div>' +

      '<div class="fs-panel">' +
      '<h2 class="fs-section-title">Fire Signal vs. Fault Signal</h2>' +
      '<div class="fs-signal-cards">' +
      '<div class="fs-signal-card fire"><h3>' + SIGNALS.fire.name + '</h3><p>' + SIGNALS.fire.desc + '</p></div>' +
      '<div class="fs-signal-card fault"><h3>' + SIGNALS.fault.name + '</h3><p>' + SIGNALS.fault.desc + '</p></div>' +
      '</div>' +
      '</div>' +

      '<div class="fs-panel">' +
      '<h2 class="fs-section-title">Try It: Operate the Fire Panel</h2>' +
      '<p class="fs-note">Press a button to see what it does. The <b>FIRE</b> switches, <b>TEST</b> buttons, and <b>AGENT</b> (extinguisher) buttons below sit at the same positions as on the real overhead fire panel.</p>' +
      '<div class="fs-stepbar"><button type="button" class="fs-nav fs-reset-all">⟲ Reset All</button></div>' +
      '<div class="fs-image-wrap fs-sim-image-wrap">' +
      '<img class="fs-image" src="tools/fire-system/fire-panel-overview.jpg" alt="Interactive fire panel — press the FIRE, TEST, and AGENT buttons.">' +
      '<div class="fs-markers fs-sim-markers">' + buttonHtml() + '</div>' +
      '</div>' +
      '<div class="fs-status-panel">' +
      '<p class="fs-status-msg" aria-live="polite">Press a button on the panel above to begin.</p>' +
      '<div class="fs-unit-badges">' + unitBadgesHtml() + '</div>' +
      '</div>' +
      '</div>' +

      '<div class="fs-panel">' +
      '<h2 class="fs-section-title">Recommended Real-World Order (Main Engine Fire)</h2>' +
      '<ol class="fs-order-list">' +
      STEPS.map(function (s) { return '<li>' + s.text + '</li>'; }).join('') +
      '</ol>' +
      '</div>' +

      '<div class="fs-edit-panel" hidden>' +
      '<p>Drag a marker to move it, or its corner handle to resize it. When done:</p>' +
      '<button type="button" class="fs-edit-copy">Copy changes</button>' +
      '<textarea readonly></textarea>' +
      '</div>' +

      '</div>';

    var root = container.querySelector('.fs-diagram');
    var imageWraps = root.querySelectorAll('.fs-image-wrap');
    var panelImageWrap = imageWraps[0];
    var loopImageWrap = imageWraps[1];
    var editBtn = root.querySelector('.fs-edit-btn');
    var editPanel = root.querySelector('.fs-edit-panel');
    var editPanelText = editPanel.querySelector('textarea');
    var editCopyBtn = editPanel.querySelector('.fs-edit-copy');
    var editUnlocked = false;
    var tooltip = document.createElement('div');
    tooltip.className = 'fs-tooltip';
    tooltip.innerHTML = '<span class="t-title"></span><span class="t-desc"></span>';
    root.appendChild(tooltip);
    var tTitle = tooltip.querySelector('.t-title');
    var tDesc = tooltip.querySelector('.t-desc');

    function showTip(evt, m) {
      tTitle.textContent = m.name;
      tDesc.textContent = m.desc;
      tooltip.style.display = 'block';
      positionTip(evt);
    }
    function positionTip(evt) {
      if (tooltip.style.display !== 'block') return;
      // .fs-tooltip is position: fixed (viewport-relative), so its
      // left/top must come straight from the pointer's own viewport
      // coordinates — offsetting by the root panel's own rect (as an
      // earlier version did) left the tooltip positioned nowhere near
      // the cursor whenever the centered .fs-diagram wasn't flush with
      // the viewport's left edge.
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
    function setActive(id, active) {
      root.querySelectorAll('[data-marker="' + id + '"]').forEach(function (el) {
        el.classList.toggle('is-hovered', active);
      });
    }

    // Shared with the "Match the Definition" challenge further down —
    // true while `id` (from the given markers object, PANEL_MARKERS or
    // LOOP_MARKERS) is one of the current match round's components, so
    // hover tooltips can't be used to peek at the answer mid-round.
    function isMatchMasked(markersObj, id) {
      if (!matchMaskedIds) return false;
      var prefix = markersObj === PANEL_MARKERS ? 'panel' : 'loop';
      return !!matchMaskedIds[prefix + ':' + id];
    }

    // Buttons in the "Try It" panel read their position from
    // PANEL_MARKERS live, so a dragged marker keeps that panel in sync.
    function refreshButtonPositions() {
      Object.keys(BUTTONS).forEach(function (id) {
        var btn = root.querySelector('[data-btn="' + id + '"]');
        var info = PANEL_MARKERS[id];
        if (!btn || !info) return;
        btn.style.left = info.xPct + '%';
        btn.style.top = info.yPct + '%';
      });
    }

    function formatMarkers(varName, markers) {
      var lines = Object.keys(markers).map(function (id) {
        var m = markers[id];
        return '    "' + id + '": { xPct: ' + (Math.round(m.xPct * 10) / 10) + ', yPct: ' + (Math.round(m.yPct * 10) / 10) + ', rPct: ' + (Math.round(m.rPct * 10) / 10) + ' },';
      });
      return '  // ' + varName + ' positions/sizes:\n' + lines.join('\n');
    }
    function updateEditPanel() {
      if (!editUnlocked) return;
      editPanelText.value =
        formatMarkers('PANEL_MARKERS', PANEL_MARKERS) + '\n\n' +
        formatMarkers('LOOP_MARKERS', LOOP_MARKERS);
      persistMarkerPositions(STORAGE_KEY_PANEL_MARKERS, PANEL_MARKERS);
      persistMarkerPositions(STORAGE_KEY_LOOP_MARKERS, LOOP_MARKERS);
    }

    function wireMarkers(wrap, imageWrap, markers) {
      wrap.querySelectorAll('.fs-marker').forEach(function (el) {
        var id = el.getAttribute('data-marker');
        var m = markers[id];
        var resizeHandle = el.querySelector('.fs-marker-resize');

        el.addEventListener('mouseenter', function (e) { if (!editUnlocked && !isMatchMasked(markers, id)) showTip(e, m); setActive(id, true); });
        el.addEventListener('mousemove', positionTip);
        el.addEventListener('mouseleave', function () { hideTip(); setActive(id, false); });

        el.addEventListener('pointerdown', function (evt) {
          if (!editUnlocked || evt.target === resizeHandle) return;
          evt.preventDefault();
          el.setPointerCapture(evt.pointerId);
          el.classList.add('dragging');
          function onMove(moveEvt) {
            var rect = imageWrap.getBoundingClientRect();
            var x = Math.max(0, Math.min(100, ((moveEvt.clientX - rect.left) / rect.width) * 100));
            var y = Math.max(0, Math.min(100, ((moveEvt.clientY - rect.top) / rect.height) * 100));
            m.xPct = x;
            m.yPct = y;
            el.style.left = x + '%';
            el.style.top = y + '%';
            refreshButtonPositions();
            updateEditPanel();
          }
          function onUp(upEvt) {
            el.classList.remove('dragging');
            el.releasePointerCapture(upEvt.pointerId);
            el.removeEventListener('pointermove', onMove);
            el.removeEventListener('pointerup', onUp);
          }
          el.addEventListener('pointermove', onMove);
          el.addEventListener('pointerup', onUp);
        });

        resizeHandle.addEventListener('pointerdown', function (evt) {
          if (!editUnlocked) return;
          evt.preventDefault();
          evt.stopPropagation();
          resizeHandle.setPointerCapture(evt.pointerId);
          resizeHandle.classList.add('dragging');
          function onMove(moveEvt) {
            var rect = imageWrap.getBoundingClientRect();
            var cx = rect.left + (m.xPct / 100) * rect.width;
            var cy = rect.top + (m.yPct / 100) * rect.height;
            var dx = moveEvt.clientX - cx, dy = moveEvt.clientY - cy;
            var distPx = Math.sqrt(dx * dx + dy * dy);
            m.rPct = Math.max(1, Math.min(10, (distPx / rect.width) * 100));
            el.style.width = m.rPct + '%';
            updateEditPanel();
          }
          function onUp(upEvt) {
            resizeHandle.classList.remove('dragging');
            resizeHandle.releasePointerCapture(upEvt.pointerId);
            resizeHandle.removeEventListener('pointermove', onMove);
            resizeHandle.removeEventListener('pointerup', onUp);
          }
          resizeHandle.addEventListener('pointermove', onMove);
          resizeHandle.addEventListener('pointerup', onUp);
        });
      });
    }
    function wireList(markers) {
      root.querySelectorAll('.fs-list-item').forEach(function (li) {
        var id = li.getAttribute('data-marker');
        var m = markers[id];
        if (!m) return;
        li.addEventListener('mouseenter', function (e) { if (!isMatchMasked(markers, id)) showTip(e, m); setActive(id, true); });
        li.addEventListener('mousemove', positionTip);
        li.addEventListener('mouseleave', function () { hideTip(); setActive(id, false); });
      });
    }
    root.querySelectorAll('.fs-markers').forEach(function (wrap) {
      if (wrap.classList.contains('fs-sim-markers')) return;
      var isPanel = wrap.parentElement === panelImageWrap;
      wireMarkers(wrap, isPanel ? panelImageWrap : loopImageWrap, isPanel ? PANEL_MARKERS : LOOP_MARKERS);
    });
    wireList(PANEL_MARKERS);
    wireList(LOOP_MARKERS);

    editBtn.addEventListener('click', function () {
      if (editUnlocked) {
        editUnlocked = false;
        editBtn.textContent = '✎ Edit';
        editBtn.classList.remove('active');
        editPanel.hidden = true;
        root.classList.remove('fs-edit');
        return;
      }
      var pw = window.prompt('Enter the edit password:');
      if (pw === null) return;
      if (pw === EDIT_PASSWORD) {
        editUnlocked = true;
        editBtn.textContent = '✓ Editing (click to stop)';
        editBtn.classList.add('active');
        editPanel.hidden = false;
        root.classList.add('fs-edit');
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

    // --- interactive fire-panel buttons ---
    var state = {
      eng1: { pushed: false, agent1: false, agent2: false, testing: false },
      eng2: { pushed: false, agent1: false, agent2: false, testing: false },
      apu: { pushed: false, agent1: false, testing: false },
    };
    var statusMsg = root.querySelector('.fs-status-msg');

    function setStatus(html) { statusMsg.innerHTML = html; }

    function refreshBadges() {
      UNITS.forEach(function (u) {
        var armedBadge = root.querySelector('[data-badge="' + u + '-armed"]');
        if (armedBadge) armedBadge.classList.toggle('on', state[u].pushed);
        var agents = u === 'apu' ? [1] : [1, 2];
        agents.forEach(function (n) {
          var el = root.querySelector('[data-badge="' + u + '-agent' + n + '"]');
          if (el) el.classList.toggle('on', !!state[u]['agent' + n]);
        });
      });
    }

    function refreshButtons() {
      Object.keys(BUTTONS).forEach(function (id) {
        var b = BUTTONS[id];
        var btn = root.querySelector('[data-btn="' + id + '"]');
        if (!btn) return;
        if (b.type === 'fire') {
          btn.classList.toggle('is-pushed', state[b.unit].pushed);
        } else if (b.type === 'agent') {
          var discharged = !!state[b.unit]['agent' + b.agent];
          btn.classList.toggle('is-discharged', discharged);
          btn.classList.toggle('is-armed', state[b.unit].pushed && !discharged);
        } else if (b.type === 'test') {
          btn.classList.toggle('is-active', !!state[b.unit].testing);
        }
      });
      ['eng1', 'eng2'].forEach(function (u) {
        root.querySelectorAll('[data-marker="' + u + '-fire-fault"]').forEach(function (el) {
          el.classList.toggle('fs-step-active-marker', !!state[u].testing);
        });
      });
    }

    function handleFire(unit) {
      var s = state[unit];
      if (!s.pushed) {
        s.pushed = true;
        setStatus('<b>' + UNIT_LABEL[unit] + ' FIRE switch pushed.</b> This arms the extinguishing system and automatically cuts off ' + UNIT_SUPPLIES[unit] + '. The AGENT button(s) are now armed and ready to discharge.');
      } else {
        s.pushed = false;
        s.agent1 = false;
        if ('agent2' in s) s.agent2 = false;
        setStatus('<b>' + UNIT_LABEL[unit] + ' FIRE switch reset.</b> Supplies are restored to normal and the AGENT button(s) are disarmed again.');
      }
      refreshButtons();
      refreshBadges();
    }

    function handleAgent(unit, n) {
      var s = state[unit];
      var key = 'agent' + n;
      if (!s.pushed) {
        setStatus('Nothing happens yet — push the ' + UNIT_LABEL[unit] + ' FIRE switch first to arm the extinguishing system.');
        return;
      }
      if (s[key]) {
        setStatus(UNIT_LABEL[unit] + ' AGENT ' + n + ' has already been discharged. Use Reset All to try again.');
        return;
      }
      if (n === 2 && !s.agent1) {
        setStatus('<b>' + UNIT_LABEL[unit] + ' AGENT 2 discharged</b> (backup bottle fired into the ' + (unit === 'apu' ? 'APU compartment' : 'nacelle') + '). Note: normal procedure is to try Agent 1 first and wait to see if the fire clears before using the backup.');
      } else {
        setStatus('<b>' + UNIT_LABEL[unit] + ' AGENT ' + n + ' discharged.</b> The ' + (n === 1 ? 'first' : 'second, backup') + ' extinguisher bottle fires into the ' + (unit === 'apu' ? 'APU compartment' : 'nacelle') + '.');
      }
      s[key] = true;
      refreshButtons();
      refreshBadges();
    }

    function handleTest(unit) {
      var s = state[unit];
      s.testing = !s.testing;
      if (s.testing) {
        setStatus('<b>' + UNIT_LABEL[unit] + ' TEST active.</b> This simulates a fire condition to check the detection and warning circuit — the FIRE and FAULT lights illuminate without an actual fire.');
      } else {
        setStatus(UNIT_LABEL[unit] + ' TEST released — back to normal monitoring.');
      }
      refreshButtons();
    }

    root.querySelectorAll('.fs-btn').forEach(function (btn) {
      var id = btn.getAttribute('data-btn');
      var b = BUTTONS[id];
      btn.addEventListener('click', function () {
        if (b.type === 'fire') handleFire(b.unit);
        else if (b.type === 'agent') handleAgent(b.unit, b.agent);
        else if (b.type === 'test') handleTest(b.unit);
      });
      var info = PANEL_MARKERS[id];
      if (info) {
        btn.addEventListener('mouseenter', function (e) { if (!isMatchMasked(PANEL_MARKERS, id)) showTip(e, info); });
        btn.addEventListener('mousemove', positionTip);
        btn.addEventListener('mouseleave', hideTip);
      }
    });

    root.querySelector('.fs-reset-all').addEventListener('click', function () {
      UNITS.forEach(function (u) {
        state[u].pushed = false;
        state[u].agent1 = false;
        if ('agent2' in state[u]) state[u].agent2 = false;
        state[u].testing = false;
      });
      setStatus('All switches reset.');
      refreshButtons();
      refreshBadges();
    });

    refreshButtons();
    refreshBadges();

    // --- "Match the Definition" timed challenge ---------------------------
    // Click a part name then its matching description (or the reverse
    // order — whichever comes second triggers the check). Pool is every
    // marker from BOTH reference images (PANEL_MARKERS + LOOP_MARKERS,
    // 21 total), each tagged with a "panel:"/"loop:" id prefix so the two
    // objects' ids (already disjoint strings in this file, but kept
    // prefixed for clarity/safety) can't collide once merged. Same
    // pointer-free click-to-pair mechanic, random-subset-per-round, and
    // time-weighted scoring as Oil/Fuel System's own "Match the
    // Definition" game. Unlike those two tools there's no other game on
    // this page to coordinate with, so no mutual-exclusion flag is
    // needed. Masking here can't reuse a rebuildable render function
    // (both `.fs-list`s are baked once into mount()'s innerHTML via
    // `listHtml()`), so it mutates each round's own `<li>` name/desc text
    // in place instead, restoring the original text from PANEL_MARKERS/
    // LOOP_MARKERS when the round ends — the "Try It" button simulator
    // and its own state machine are untouched by any of this.
    var MATCH_SECONDS_PER_ITEM = 14;
    var MATCH_BEST_KEY = 'tm.fireSystem.matchBest';
    var matchTermsEl = root.querySelector('#fsMatchTerms');
    var matchDefsEl = root.querySelector('#fsMatchDefs');
    var matchScoreEl = root.querySelector('#fsMatchScore');
    var matchSolvedEl = root.querySelector('#fsMatchSolved');
    var matchTimeEl = root.querySelector('#fsMatchTime');
    var matchBestEl = root.querySelector('#fsMatchBest');
    var matchResultEl = root.querySelector('#fsMatchResult');
    var matchStartBtn = root.querySelector('#fsMatchStartBtn');

    var matchActive = false;
    var matchScore = 0, matchSolved = 0, matchTotal = 0;
    var matchDuration = 0, matchDeadline = 0, matchTimerId = null;
    var matchMaskedIds = null; // null = no masking (round not running)
    var selTermEl = null, selDefEl = null, selTermId = null, selDefId = null;

    function shuffled(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
      }
      return a;
    }

    var matchAudioCtx = null;
    function ensureMatchAudio() {
      if (!matchAudioCtx) {
        try { matchAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (err) { return null; }
      }
      if (matchAudioCtx.state === 'suspended') matchAudioCtx.resume();
      return matchAudioCtx;
    }
    function matchBeep(freq, dur, type, vol, delay) {
      var ctx = ensureMatchAudio();
      if (!ctx) return;
      var t0 = ctx.currentTime + (delay || 0);
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(vol == null ? 0.16 : vol, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.03);
    }
    function playMatchRight() { matchBeep(660, 0.08, 'square', 0.15); }
    function playMatchWrong() { matchBeep(180, 0.16, 'sawtooth', 0.16); }
    function playMatchClear() { matchBeep(523, 0.09, 'square', 0.18); matchBeep(784, 0.11, 'square', 0.18, 0.09); matchBeep(1046, 0.16, 'square', 0.18, 0.18); }

    function loadMatchBest() {
      try { return Number(localStorage.getItem(MATCH_BEST_KEY)) || 0; } catch (err) { return 0; }
    }
    function saveMatchBest(val) {
      try { localStorage.setItem(MATCH_BEST_KEY, String(val)); } catch (err) { /* ignore */ }
    }
    function updateMatchBestDisplay() {
      var best = loadMatchBest();
      matchBestEl.textContent = best > 0 ? best : '--';
    }

    function allComponentsPool() {
      var items = [];
      Object.keys(PANEL_MARKERS).forEach(function (k) {
        items.push({ id: 'panel:' + k, name: PANEL_MARKERS[k].name, desc: PANEL_MARKERS[k].desc });
      });
      Object.keys(LOOP_MARKERS).forEach(function (k) {
        items.push({ id: 'loop:' + k, name: LOOP_MARKERS[k].name, desc: LOOP_MARKERS[k].desc });
      });
      return items;
    }

    function poolItemRaw(poolId) {
      var sep = poolId.indexOf(':');
      var prefix = poolId.slice(0, sep), rawId = poolId.slice(sep + 1);
      var markers = prefix === 'panel' ? PANEL_MARKERS : LOOP_MARKERS;
      return markers[rawId];
    }

    function maskListItem(poolId, masked) {
      var m = poolItemRaw(poolId);
      if (!m) return;
      var rawId = poolId.slice(poolId.indexOf(':') + 1);
      var li = root.querySelector('.fs-list-item[data-marker="' + rawId + '"]');
      if (!li) return;
      var nameEl = li.querySelector('.fs-list-name');
      var descEl = li.querySelector('.fs-list-desc');
      if (masked) {
        nameEl.textContent = '🔒 ?????';
        descEl.textContent = 'Hidden while the Match the Definition challenge is running — match it in the panel above instead.';
        li.classList.add('is-masked');
      } else {
        nameEl.textContent = m.name;
        descEl.textContent = m.desc;
        li.classList.remove('is-masked');
      }
    }

    function updateMatchHud() {
      matchScoreEl.textContent = matchScore;
      matchSolvedEl.textContent = matchSolved + '/' + matchTotal;
      var remaining = Math.max(0, matchDeadline - performance.now());
      matchTimeEl.textContent = matchActive ? Math.ceil(remaining / 1000) + 's' : '--';
    }

    function clearMatchSelection() {
      if (selTermEl) selTermEl.classList.remove('is-selected');
      if (selDefEl) selDefEl.classList.remove('is-selected');
      selTermEl = null; selDefEl = null; selTermId = null; selDefId = null;
    }

    function tryMatch() {
      if (selTermId == null || selDefId == null) return;
      if (selTermId === selDefId) {
        selTermEl.classList.remove('is-selected'); selTermEl.classList.add('is-solved');
        selDefEl.classList.remove('is-selected'); selDefEl.classList.add('is-solved');
        matchSolved += 1;
        var remainingFrac = Math.max(0, (matchDeadline - performance.now()) / matchDuration);
        matchScore += Math.round(100 * (0.4 + 0.6 * remainingFrac));
        playMatchRight();
        selTermEl = null; selDefEl = null; selTermId = null; selDefId = null;
        updateMatchHud();
        if (matchSolved >= matchTotal) endMatch('cleared');
      } else {
        var badTerm = selTermEl, badDef = selDefEl;
        badTerm.classList.add('is-wrong-flash');
        badDef.classList.add('is-wrong-flash');
        playMatchWrong();
        setTimeout(function () {
          badTerm.classList.remove('is-wrong-flash', 'is-selected');
          badDef.classList.remove('is-wrong-flash', 'is-selected');
        }, 400);
        selTermEl = null; selDefEl = null; selTermId = null; selDefId = null;
      }
    }

    function buildMatchTile(item, kind) {
      var tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'fs-match-tile';
      tile.textContent = kind === 'term' ? item.name : item.desc;
      tile.dataset.id = item.id;
      tile.addEventListener('click', function () {
        if (!matchActive || tile.classList.contains('is-solved')) return;
        if (kind === 'term') {
          if (selTermEl) selTermEl.classList.remove('is-selected');
          selTermEl = tile; selTermId = item.id;
        } else {
          if (selDefEl) selDefEl.classList.remove('is-selected');
          selDefEl = tile; selDefId = item.id;
        }
        tile.classList.add('is-selected');
        tryMatch();
      });
      return tile;
    }

    function startMatch() {
      if (matchActive) return;
      var all = allComponentsPool();
      var count = all.length <= 3 ? all.length : 3 + Math.floor(Math.random() * (all.length - 2));
      var items = shuffled(all).slice(0, count);

      matchActive = true;
      matchTotal = items.length;
      matchScore = 0;
      matchSolved = 0;
      clearMatchSelection();
      matchResultEl.textContent = '';
      matchStartBtn.disabled = true;

      matchMaskedIds = {};
      items.forEach(function (it) { matchMaskedIds[it.id] = true; maskListItem(it.id, true); });

      matchTermsEl.innerHTML = '';
      matchDefsEl.innerHTML = '';
      shuffled(items).forEach(function (it) { matchTermsEl.appendChild(buildMatchTile(it, 'term')); });
      shuffled(items).forEach(function (it) { matchDefsEl.appendChild(buildMatchTile(it, 'def')); });

      matchDuration = MATCH_SECONDS_PER_ITEM * 1000 * matchTotal;
      matchDeadline = performance.now() + matchDuration;
      updateMatchHud();

      if (matchTimerId != null) clearInterval(matchTimerId);
      matchTimerId = setInterval(function () {
        if (performance.now() >= matchDeadline) { endMatch('timeup'); return; }
        updateMatchHud();
      }, 200);
    }

    function endMatch(reason) {
      if (!matchActive) return;
      matchActive = false;
      if (matchTimerId != null) { clearInterval(matchTimerId); matchTimerId = null; }
      clearMatchSelection();
      matchTermsEl.querySelectorAll('.fs-match-tile:not(.is-solved)').forEach(function (el) { el.classList.add('is-revealed'); });
      matchDefsEl.querySelectorAll('.fs-match-tile:not(.is-solved)').forEach(function (el) { el.classList.add('is-revealed'); });
      if (matchMaskedIds) Object.keys(matchMaskedIds).forEach(function (id) { maskListItem(id, false); });
      matchMaskedIds = null;
      matchStartBtn.disabled = false;
      updateMatchHud();

      var best = loadMatchBest();
      var beat = matchScore > best;
      if (beat) { saveMatchBest(matchScore); updateMatchBestDisplay(); }

      if (reason === 'cleared') {
        playMatchClear();
        matchResultEl.textContent = '🎉 All ' + matchTotal + ' matched! Score: ' + matchScore + (beat ? ' — new best!' : '');
      } else {
        matchResultEl.textContent = '⏱ Time\'s up — matched ' + matchSolved + '/' + matchTotal + '. Score: ' + matchScore + (beat ? ' — new best!' : '');
      }
    }

    matchStartBtn.addEventListener('click', startMatch);
    updateMatchBestDisplay();

    // test/debug hooks only — read-only except debugForceMatchTimeout,
    // which only nudges the round's own deadline to let a test exercise
    // the timeout path without a real multi-minute wait; no other
    // gameplay effect.
    window.TM.toolModules['fire-system'].debugMatchState = function () {
      return { matchActive: matchActive, matchScore: matchScore, matchSolved: matchSolved, matchTotal: matchTotal };
    };
    window.TM.toolModules['fire-system'].debugForceMatchTimeout = function () {
      matchDeadline = performance.now() - 1;
    };

    window.TM.toolModules['fire-system'].unmount = function () {
      if (matchTimerId != null) { clearInterval(matchTimerId); matchTimerId = null; }
    };
  }

  window.TM.registerTool('fire-system', { mount: mount });
})();
