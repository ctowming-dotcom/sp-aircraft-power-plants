(function () {
  // Content sourced from the supplied deck (Chapter_14_Auxiliary_Power_
  // Units_APU_v1.pptx). The diagram itself is the user's own supplied
  // reference image, used verbatim (not redrawn) — tools/apu-system/
  // apu-diagram.png, 1286x744 — with markers/regions/flow routes
  // overlaid at percentage positions, the same pattern Air System uses
  // for its engine-diagram.png.
  //
  // rPct is each marker's diameter as a % of the image's displayed
  // width (kept a true circle regardless of the image's own aspect
  // ratio via CSS aspect-ratio: 1/1, not a height percentage) — same
  // convention as the Virtual Lab's PARTS markers.
  var COMPONENTS = {
    bleedvalve: {
      name: 'Non-modulating Bleed (Load) Valve', key: true, xPct: 17, yPct: 18.1, rPct: 6.3,
      desc: 'Allows the pneumatic bleed from the APU to be interconnected or isolated from the aircraft pneumatic system (the air supply for ECS, Main Engine Start, and ATM). Usually a butterfly-type, spring-loaded, fail-safe-open valve, controlled by the ECB.',
    },
    surgevalve: {
      name: 'Surge Control Valve', key: true, xPct: 41.9, yPct: 17.1, rPct: 8.4,
      desc: 'A modulating valve on the compressor supply duct. If the load compressor delivers more airflow through the IGV than the aircraft pneumatic systems need, compressor stall/surge can result — this valve spills the excess air into the exhaust to protect both the load compressor and the engine from over-pressure. Controlled by the FCU, which supplies servo fuel to open or close it.',
    },
    igv: {
      name: 'Inlet Guide Vane (IGV)', key: true, xPct: 25.7, yPct: 37.6, rPct: 4,
      desc: 'A ring of vanes at the load compressor inlet (the small vertical oval next to the IGVA box). Positioning them controls how much air reaches the compressor, letting the APU satisfy varying aircraft pneumatic load demands without changing shaft RPM.',
    },
    igva: {
      name: 'IGV Actuator (IGVA)', key: false, xPct: 19.6, yPct: 54.5, rPct: 4.3,
      desc: 'Regulates the IGV opening to vary the pneumatic load supply entering the load compressor to suit demand. Controlled by the Electronic Control Box (ECB) and operated by servo fuel from the Fuel Control Unit (FCU) — this is how the IGV can vary the load without changing shaft RPM.',
    },
    flowsensor: {
      name: 'Flow Sensor', key: false, xPct: 26.7, yPct: 27.4, rPct: 2.8,
      desc: 'Measures airflow into the load compressor, feeding the control system that positions the IGV to match aircraft demand.',
    },
    loadcompressor: {
      name: 'Load Compressor', key: false, xPct: 22.5, yPct: 44, rPct: 5.2,
      desc: 'Compresses air drawn through the inlet for the aircraft’s pneumatic systems. Mounted on the same shaft as the gas generator, so it spins whenever the APU runs — part of the Load Section.',
    },
    accygearbox: {
      name: 'Accessory / Reduction Gearbox', key: false, xPct: 17.5, yPct: 38.5, rPct: 6.9,
      desc: 'Reduction gears drive the components needed to operate and control the gas turbine engine, and supply the mechanical power needed to drive the electrical generator.',
    },
    gen: {
      name: 'Generator (GEN)', key: false, xPct: 11.3, yPct: 34.4, rPct: 5.2,
      desc: 'Driven mechanically off the accessory gearbox, supplying electrical power to the aircraft — one of the two things (electrical and pneumatic) the APU exists to provide.',
    },
    ecb: {
      name: 'Electronic Control Box (ECB)', key: false, xPct: 21.4, yPct: 80.2, rPct: 8.2,
      desc: 'Receives the aircraft’s pneumatic/electrical demand signal and commands the IGV actuator and fuel metering accordingly, coordinating how much air and fuel the APU supplies.',
    },
    compressor: {
      name: 'Compressor', key: false, xPct: 42.4, yPct: 40.3, rPct: 1,
      desc: 'Part of the gas-generator (Power Section): raises incoming air to high pressure before it enters the combustor, same shaft as the turbine.',
    },
    combustor: {
      name: 'Combustor', key: false, xPct: 56.9, yPct: 68.5, rPct: 10,
      desc: 'Burns metered fuel in the compressed air to produce the high-energy gas that drives the turbine.',
    },
    turbine: {
      name: 'Turbine (3 Wheels)', key: false, xPct: 80.3, yPct: 40.9, rPct: 10,
      desc: 'Extracts energy from the combustor’s hot gas to drive the compressor, the load compressor, the accessory gearbox, and the generator — the Power Section’s whole reason for existing: providing torque to drive the Load Section.',
    },
    metering: {
      name: 'Fuel Metering Valve', key: false, xPct: 54.2, yPct: 83.1, rPct: 2.8,
      desc: 'Meters fuel into the combustor in the quantity commanded by the ECB/FCU for the current demand.',
    },
  };

  var SECTIONS = {
    power: {
      name: 'Power Section',
      desc: 'The gas turbine engine itself — compressor, combustor, and turbine — that burns fuel to produce torque. Its only job is to drive the Load Section (and, through it, the aircraft’s electrical and pneumatic systems).',
    },
    load: {
      name: 'Load Section',
      desc: 'The generator and load compressor, driven by the Power Section’s turbine through the accessory gearbox. This is what actually powers the aircraft — electrical power from the generator, pneumatic power (bleed air) from the load compressor.',
    },
  };

  // Where the Power/Load section tint divides, as a % of image width —
  // draggable in edit mode via a vertical handle.
  var REGION_SPLIT = 30.7;

  // Simplified airflow routes from a shared inlet, split into the Power
  // Section (compressor → combustor → turbine → exhaust) and Load
  // Section (load compressor → accessory gearbox) paths named in the
  // request. Percentage coordinates over the image, like Air System's
  // flow routes. Point 0 is the inlet itself (upstream of where the two
  // routes visually diverge); the rest are numbered 1..N after it, so
  // numbering is 0-based throughout. Edit-mode-only numbered yellow
  // handles; the flow line itself is always visible.
  var POWER_FLOW = [
    { xPct: 32.8, yPct: 74.2 },
    { xPct: 32.8, yPct: 45 },
    { xPct: 46.8, yPct: 45.7 },
    { xPct: 47, yPct: 72.6 },
    { xPct: 70.3, yPct: 73 },
    { xPct: 70.1, yPct: 40.5 },
    { xPct: 95.1, yPct: 41.3 },
  ];
  var LOAD_FLOW = [
    { xPct: 29, yPct: 74.2 },
    { xPct: 28.8, yPct: 43.9 },
    { xPct: 22.2, yPct: 43.6 },
    { xPct: 21.9, yPct: 18.5 },
    { xPct: 9.8, yPct: 18.1 },
  ];

  var EDIT_PASSWORD = 'APP2';
  var STORAGE_KEY_POWER_FLOW = 'tm.apuSystem.powerFlow';
  var STORAGE_KEY_LOAD_FLOW = 'tm.apuSystem.loadFlow';
  var STORAGE_KEY_REGION_SPLIT = 'tm.apuSystem.regionSplit';
  var STORAGE_KEY_COMPONENTS = 'tm.apuSystem.components';

  function restoreArray(key, items) {
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (!Array.isArray(saved) || saved.length !== items.length) return;
      for (var i = 0; i < saved.length; i++) {
        if (!saved[i] || typeof saved[i].xPct !== 'number' || typeof saved[i].yPct !== 'number') return;
      }
      items.splice.apply(items, [0, items.length].concat(saved));
    } catch (e) { /* corrupt/blocked storage — keep defaults */ }
  }
  function persistArray(key, items) {
    try { window.localStorage.setItem(key, JSON.stringify(items)); } catch (e) { /* storage full/blocked */ }
  }
  function restoreNumber(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      var n = Number(raw);
      return isFinite(n) ? n : fallback;
    } catch (e) { return fallback; }
  }
  function persistNumber(key, n) {
    try { window.localStorage.setItem(key, String(n)); } catch (e) { /* storage full/blocked */ }
  }
  function restoreComponentSizes() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY_COMPONENTS);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object') return;
      Object.keys(COMPONENTS).forEach(function (id) {
        var s = saved[id];
        if (!s) return;
        if (typeof s.rPct === 'number') COMPONENTS[id].rPct = s.rPct;
        if (typeof s.xPct === 'number') COMPONENTS[id].xPct = s.xPct;
        if (typeof s.yPct === 'number') COMPONENTS[id].yPct = s.yPct;
      });
    } catch (e) { /* corrupt/blocked storage — keep defaults */ }
  }
  function persistComponentSizes() {
    var out = {};
    Object.keys(COMPONENTS).forEach(function (id) {
      out[id] = { rPct: COMPONENTS[id].rPct, xPct: COMPONENTS[id].xPct, yPct: COMPONENTS[id].yPct };
    });
    try { window.localStorage.setItem(STORAGE_KEY_COMPONENTS, JSON.stringify(out)); } catch (e) { /* storage full/blocked */ }
  }
  restoreArray(STORAGE_KEY_POWER_FLOW, POWER_FLOW);
  restoreArray(STORAGE_KEY_LOAD_FLOW, LOAD_FLOW);
  REGION_SPLIT = restoreNumber(STORAGE_KEY_REGION_SPLIT, REGION_SPLIT);
  restoreComponentSizes();

  function mount(container) {
    container.innerHTML =
      '<div class="apu-sys">' +
      '<div class="apu-sys-toolbar">' +
      '<div>' +
      '<p class="kicker">Official (Open)</p>' +
      '<h1>Auxiliary Power Unit (APU)</h1>' +
      '<p class="apu-sys-sub">Hover any component for its function. In edit mode: drag the yellow boxes to reshape the airflow, drag the divider to resize the two sections, drag a marker to move it, and drag its corner handle to resize it.</p>' +
      '</div>' +
      '<button type="button" class="apu-sys-edit-btn" title="Edit diagram">✎ Edit</button>' +
      '</div>' +

      '<div class="apu-sys-legend">' +
      '<span class="apu-sys-legend-item power"><i></i>Power Section</span>' +
      '<span class="apu-sys-legend-item load"><i></i>Load Section</span>' +
      '<span class="apu-sys-legend-item key"><i></i>Key component (see reference below)</span>' +
      '</div>' +

      '<div class="apu-sys-image-wrap">' +
      '<img class="apu-sys-image" src="tools/apu-system/apu-diagram.png" alt="APU block diagram: bleed valve, surge control valve, generator, accessory gearbox, load compressor, flow sensor, IGV/IGVA, ECB, compressor, combustor, turbine, fuel metering.">' +

      '<div class="apu-sys-region power"></div>' +
      '<div class="apu-sys-region load"></div>' +
      '<div class="apu-sys-divider"><span class="apu-sys-divider-grip"></span></div>' +

      '<svg class="apu-sys-flow-svg" viewBox="0 0 100 100" preserveAspectRatio="none">' +
      '<defs>' +
      '<marker id="apu-sys-arrow-power" markerUnits="userSpaceOnUse" markerWidth="3.2" markerHeight="3.2" refX="2.4" refY="1.6" orient="auto"><path d="M0,0 L3.2,1.6 L0,3.2 Z" class="apu-sys-arrowhead power"></path></marker>' +
      '<marker id="apu-sys-arrow-load" markerUnits="userSpaceOnUse" markerWidth="3.2" markerHeight="3.2" refX="2.4" refY="1.6" orient="auto"><path d="M0,0 L3.2,1.6 L0,3.2 Z" class="apu-sys-arrowhead load"></path></marker>' +
      '</defs>' +
      '<g class="apu-sys-flow-segs power"></g>' +
      '<g class="apu-sys-flow-segs load"></g>' +
      '</svg>' +

      '<div class="apu-sys-flow-boxes"></div>' +
      '<div class="apu-sys-markers"></div>' +
      '</div>' +

      '<div class="apu-sys-tooltip"><span class="t-title"></span><span class="t-desc"></span></div>' +

      '<div class="apu-sys-sections">' +
      '<div class="apu-sys-section-card load"><h3>' + SECTIONS.load.name + '</h3><p>' + SECTIONS.load.desc + '</p></div>' +
      '<div class="apu-sys-section-card power"><h3>' + SECTIONS.power.name + '</h3><p>' + SECTIONS.power.desc + '</p></div>' +
      '</div>' +

      '<div class="apu-sys-ref">' +
      '<h3 class="apu-sys-ref-title">Key components (circled in the reference diagram)</h3>' +
      '<ul class="apu-sys-list key-list"></ul>' +
      '<h3 class="apu-sys-ref-title">Every other component</h3>' +
      '<ul class="apu-sys-list other-list"></ul>' +
      '</div>' +

      '<div class="apu-sys-edit-panel" hidden>' +
      '<p>Drag the numbered yellow boxes, the section divider, a marker, or a marker’s resize handle. When done:</p>' +
      '<button type="button" class="apu-sys-edit-copy">Copy changes</button>' +
      '<textarea readonly></textarea>' +
      '</div>' +

      '</div>';

    var root = container.querySelector('.apu-sys');
    var imageWrap = root.querySelector('.apu-sys-image-wrap');
    var markerLayer = root.querySelector('.apu-sys-markers');
    var flowBoxLayer = root.querySelector('.apu-sys-flow-boxes');
    var powerSegsRoot = root.querySelector('.apu-sys-flow-segs.power');
    var loadSegsRoot = root.querySelector('.apu-sys-flow-segs.load');
    var regionPower = root.querySelector('.apu-sys-region.power');
    var regionLoad = root.querySelector('.apu-sys-region.load');
    var divider = root.querySelector('.apu-sys-divider');
    var tooltip = root.querySelector('.apu-sys-tooltip');
    var tTitle = tooltip.querySelector('.t-title');
    var tDesc = tooltip.querySelector('.t-desc');
    var editBtn = root.querySelector('.apu-sys-edit-btn');
    var editPanel = root.querySelector('.apu-sys-edit-panel');
    var editPanelText = editPanel.querySelector('textarea');
    var editCopyBtn = editPanel.querySelector('.apu-sys-edit-copy');
    var keyListEl = root.querySelector('.key-list');
    var otherListEl = root.querySelector('.other-list');

    var editUnlocked = false;

    function listItemHtml(id, c) {
      return '<li class="apu-sys-list-item" data-comp="' + id + '">' +
        '<span class="apu-sys-list-name">' + TM.escapeHtml(c.name) + '</span>' +
        '<span class="apu-sys-list-desc">' + TM.escapeHtml(c.desc) + '</span>' +
        '</li>';
    }
    keyListEl.innerHTML = Object.keys(COMPONENTS).filter(function (id) { return COMPONENTS[id].key; })
      .map(function (id) { return listItemHtml(id, COMPONENTS[id]); }).join('');
    otherListEl.innerHTML = Object.keys(COMPONENTS).filter(function (id) { return !COMPONENTS[id].key; })
      .map(function (id) { return listItemHtml(id, COMPONENTS[id]); }).join('');

    function showTip(evt, c) {
      tTitle.textContent = c.name;
      tDesc.textContent = c.desc;
      tooltip.style.display = 'block';
      positionTip(evt);
    }
    function positionTip(evt) {
      if (tooltip.style.display !== 'block') return;
      // .apu-sys-tooltip is position: fixed (viewport-relative), so its
      // left/top must come straight from the pointer's own viewport
      // coordinates, not an offset against the panel's own bounding rect.
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
      root.querySelectorAll('[data-comp="' + id + '"]').forEach(function (el) {
        el.classList.toggle('is-hovered', active);
      });
    }

    function renderRegions() {
      regionLoad.style.width = REGION_SPLIT + '%';
      regionPower.style.left = REGION_SPLIT + '%';
      divider.style.left = REGION_SPLIT + '%';
    }
    renderRegions();

    function renderMarkers() {
      markerLayer.innerHTML = Object.keys(COMPONENTS).map(function (id) {
        var c = COMPONENTS[id];
        return '<span class="apu-sys-marker' + (c.key ? ' key' : '') + '" data-comp="' + id + '" style="left:' + c.xPct + '%; top:' + c.yPct + '%; width:' + c.rPct + '%;">' +
          '<span class="apu-sys-marker-resize"></span>' +
          '</span>';
      }).join('');
      markerLayer.querySelectorAll('.apu-sys-marker').forEach(function (el) {
        var id = el.getAttribute('data-comp');
        var c = COMPONENTS[id];
        var resizeHandle = el.querySelector('.apu-sys-marker-resize');
        el.addEventListener('mouseenter', function (e) { if (!editUnlocked) showTip(e, c); setActive(id, true); });
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
            c.xPct = x;
            c.yPct = y;
            el.style.left = x + '%';
            el.style.top = y + '%';
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
            var cx = rect.left + (c.xPct / 100) * rect.width;
            var cy = rect.top + (c.yPct / 100) * rect.height;
            var dx = moveEvt.clientX - cx, dy = moveEvt.clientY - cy;
            var distPx = Math.sqrt(dx * dx + dy * dy);
            var rPct = Math.max(1, Math.min(10, (distPx / rect.width) * 100));
            c.rPct = rPct;
            el.style.width = rPct + '%';
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
    renderMarkers();

    root.querySelectorAll('.apu-sys-list-item').forEach(function (li) {
      var id = li.getAttribute('data-comp');
      var c = COMPONENTS[id];
      li.addEventListener('mouseenter', function (e) { showTip(e, c); setActive(id, true); });
      li.addEventListener('mousemove', positionTip);
      li.addEventListener('mouseleave', function () { hideTip(); setActive(id, false); });
    });

    // --- divider drag (Power/Load section split) ---
    divider.addEventListener('pointerdown', function (evt) {
      if (!editUnlocked) return;
      evt.preventDefault();
      divider.setPointerCapture(evt.pointerId);
      divider.classList.add('dragging');
      function onMove(moveEvt) {
        var rect = imageWrap.getBoundingClientRect();
        var x = ((moveEvt.clientX - rect.left) / rect.width) * 100;
        REGION_SPLIT = Math.max(5, Math.min(95, x));
        renderRegions();
        updateEditPanel();
      }
      function onUp(upEvt) {
        divider.classList.remove('dragging');
        divider.releasePointerCapture(upEvt.pointerId);
        divider.removeEventListener('pointermove', onMove);
        divider.removeEventListener('pointerup', onUp);
      }
      divider.addEventListener('pointermove', onMove);
      divider.addEventListener('pointerup', onUp);
    });

    // --- airflow routes: per-segment paths (thicker, with an arrowhead
    // on every segment, not just the end) rather than one long path, so
    // direction reads clearly along the whole route. ---
    function renderFlowSegs(segRoot, points, circuit) {
      segRoot.innerHTML = points.slice(0, -1).map(function (p, i) {
        var next = points[i + 1];
        return '<path class="apu-sys-flow-seg ' + circuit + '" d="M' + p.xPct + ',' + p.yPct + ' L' + next.xPct + ',' + next.yPct + '" marker-end="url(#apu-sys-arrow-' + circuit + ')"></path>';
      }).join('');
    }
    function renderAllFlowSegs() {
      renderFlowSegs(powerSegsRoot, POWER_FLOW, 'power');
      renderFlowSegs(loadSegsRoot, LOAD_FLOW, 'load');
    }
    renderAllFlowSegs();

    function formatFlow(varName, points) {
      var lines = points.map(function (p) {
        return '    { xPct: ' + (Math.round(p.xPct * 10) / 10) + ', yPct: ' + (Math.round(p.yPct * 10) / 10) + ' },';
      });
      return '  var ' + varName + ' = [\n' + lines.join('\n') + '\n  ];';
    }
    function formatComponents() {
      var lines = Object.keys(COMPONENTS).map(function (id) {
        var c = COMPONENTS[id];
        return '    xPct: ' + (Math.round(c.xPct * 10) / 10) + ', yPct: ' + (Math.round(c.yPct * 10) / 10) + ', rPct: ' + (Math.round(c.rPct * 10) / 10) + '  // ' + id;
      });
      return '  // COMPONENTS positions/sizes:\n' + lines.join('\n');
    }
    function updateEditPanel() {
      if (!editUnlocked) return;
      editPanelText.value =
        formatFlow('POWER_FLOW', POWER_FLOW) + '\n\n' +
        formatFlow('LOAD_FLOW', LOAD_FLOW) + '\n\n' +
        '  var REGION_SPLIT = ' + (Math.round(REGION_SPLIT * 10) / 10) + ';\n\n' +
        formatComponents();
      persistArray(STORAGE_KEY_POWER_FLOW, POWER_FLOW);
      persistArray(STORAGE_KEY_LOAD_FLOW, LOAD_FLOW);
      persistNumber(STORAGE_KEY_REGION_SPLIT, REGION_SPLIT);
      persistComponentSizes();
    }

    function makeDraggable(el, item, onMoveExtra) {
      el.addEventListener('pointerdown', function (evt) {
        if (!editUnlocked) return;
        evt.preventDefault();
        el.setPointerCapture(evt.pointerId);
        el.classList.add('dragging');
        function onMove(moveEvt) {
          var rect = imageWrap.getBoundingClientRect();
          var x = ((moveEvt.clientX - rect.left) / rect.width) * 100;
          var y = ((moveEvt.clientY - rect.top) / rect.height) * 100;
          x = Math.max(0, Math.min(100, x));
          y = Math.max(0, Math.min(100, y));
          item.xPct = x;
          item.yPct = y;
          el.style.left = x + '%';
          el.style.top = y + '%';
          if (onMoveExtra) onMoveExtra();
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
    }

    // Numbering starts at 0 (point 0 is the inlet, upstream of where
    // the two routes diverge) — rebuilding only the segment lines (not
    // the box layer) on every move, for the same pointer-capture reason
    // Air System's/Virtual Lab's flow handles do this.
    function renderFlowBoxes() {
      var all = POWER_FLOW.map(function (p, i) { return { p: p, n: i, circuit: 'power' }; })
        .concat(LOAD_FLOW.map(function (p, i) { return { p: p, n: i, circuit: 'load' }; }));
      flowBoxLayer.innerHTML = all.map(function (item) {
        return '<span class="apu-sys-flow-box ' + item.circuit + '" style="left:' + item.p.xPct + '%; top:' + item.p.yPct + '%;">' + item.n + '</span>';
      }).join('');
      flowBoxLayer.querySelectorAll('.apu-sys-flow-box').forEach(function (el, idx) {
        var points = idx < POWER_FLOW.length ? POWER_FLOW : LOAD_FLOW;
        var i = idx < POWER_FLOW.length ? idx : idx - POWER_FLOW.length;
        makeDraggable(el, points[i], function () {
          renderFlowSegs(idx < POWER_FLOW.length ? powerSegsRoot : loadSegsRoot, points, idx < POWER_FLOW.length ? 'power' : 'load');
        });
      });
    }
    renderFlowBoxes();

    editBtn.addEventListener('click', function () {
      if (editUnlocked) {
        editUnlocked = false;
        editBtn.textContent = '✎ Edit';
        editBtn.classList.remove('active');
        editPanel.hidden = true;
        root.classList.remove('apu-sys-edit');
        return;
      }
      var pw = window.prompt('Enter the edit password:');
      if (pw === null) return;
      if (pw === EDIT_PASSWORD) {
        editUnlocked = true;
        editBtn.textContent = '✓ Editing (click to stop)';
        editBtn.classList.add('active');
        editPanel.hidden = false;
        root.classList.add('apu-sys-edit');
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
  }

  window.TM.registerTool('apu-system', { mount: mount });
})();
