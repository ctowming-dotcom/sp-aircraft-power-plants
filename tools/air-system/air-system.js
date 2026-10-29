(function () {
  // Content sourced from the supplied deck: Chapter_11_Air_System_v1_2hr.pptx.
  // Both modes share one engine diagram (supplied by the user); marker
  // positions are percentages of that image's width/height so they scale
  // with it responsively regardless of displayed size.
  var INTERNAL_ITEMS = [
    { id: 'thrust-bearing', xPct: 48.7, yPct: 37.5, name: 'Thrust Bearing Load Relief', desc: 'Air pressure is used to offset part of the axial load on the main thrust bearing, reducing the load it must carry.' },
    { id: 'labyrinth-seal', xPct: 49.1, yPct: 50.5, name: 'Sealing of Main Bearing Compartments (Labyrinth Seal)', desc: 'Labyrinth seals use a pressurized air barrier to keep oil inside the bearing compartments and hot gas or debris out.' },
    { id: 'combustor-liner', xPct: 60.5, yPct: 19.1, name: 'Cooling of Combustion Chamber (Combustion Liner)', desc: 'Air passes through and around the combustor liner to keep its walls within temperature limits while the fuel-air mixture burns inside.' },
    { id: 'ngv-cooling', xPct: 69.9, yPct: 24.3, name: 'Cooling of Nozzle Guide Vanes', desc: 'NGVs direct combustion gas onto the turbine rotor and sit directly in the hottest gas path, so they are cooled with air bled from the compressor.' },
    { id: 'turbine-blade', xPct: 73.7, yPct: 65.8, name: 'Cooling of Turbine Blades', desc: 'Cooling air is fed through the turbine blades to keep metal temperatures within limits despite the extremely hot combustion gases flowing over them.' },
    { id: 'turbine-disc', xPct: 72.6, yPct: 46.2, name: 'Cooling of Turbine Discs', desc: 'Cooling air is directed onto the turbine disc faces to limit disc temperature and the thermal stresses that would otherwise shorten its fatigue life.' },
  ];

  var EXTERNAL_ITEMS = [
    { id: 'anti-icing', xPct: 10.5, yPct: 44.3, name: 'Engine Anti-Icing System (Hot Air)', desc: 'Hot air from the compressor is delivered to the inlet guide vanes and intake strut to prevent ice forming and disrupting airflow into the intake.' },
    { id: 'eec-cooling', xPct: 24, yPct: 11.3, name: 'EEC Cooling', desc: 'The Electronic Engine Control is mounted in the fan case; on some engines it is cooled by ram air.' },
    { id: 'customer-bleed', xPct: 41.4, yPct: 19.1, name: 'Customer Bleed', desc: 'Pressurized air taken from the compressor for airframe use — air-conditioning and cabin/reservoir pressurization. It is bled as early as possible in the compressor to minimize the effect on engine performance; during descent, with the engine at idle, HP bleed is needed to meet pressurization demand. A precooler regulates its temperature before it reaches the aircraft systems.' },
    { id: 'generator-cooling', xPct: 19.9, yPct: 78.6, name: 'Electrical Generator Cooling', desc: 'The integrated drive generators, driven by the external gearbox off the HP shaft, are cooled with fan air.' },
    { id: 'igniter-cooling', xPct: 58.1, yPct: 80.3, name: 'Igniter Lead & Igniter Box Cooling', desc: 'The exciter (igniter) box steps low voltage up to around 22 kV; fan air cools both the box and the high-tension leads carrying that voltage.' },
    { id: 'tcc-acc', xPct: 74.2, yPct: 12.9, name: 'Turbine Case Cooling / Active Clearance Control', desc: 'A dual-channel, EEC-controlled system plays fan air onto the HP and LP turbine cases to shrink them, tightening blade-tip clearance for better efficiency and longer service life. The EEC positions the actuator (using fuel muscle pressure) as a function of altitude and N2 speed.' },
    { id: 'nacelle-vent', xPct: 15.3, yPct: 79.1, name: 'Nacelle Ventilation and Cooling', desc: 'The space between the engine cowling and casing (the nacelle) is ventilated with fan air to prevent fluid vapor from accumulating and self-igniting.' },
  ];

  // Airflow route for each mode: a short sequence of waypoints (not tied
  // to INTERNAL_ITEMS/EXTERNAL_ITEMS — a separate, independent path) drawn
  // as a yellow flowing line with arrowheads, and shown as numbered yellow
  // boxes in flow order. Positions below are the teacher's own dragged
  // layout (baked in from the Copy-changes panel), not placeholders.
  var INTERNAL_FLOW = [
    { xPct: 12.5, yPct: 26.2 },
    { xPct: 45.2, yPct: 25.3 },
    { xPct: 53.7, yPct: 36.9 },
    { xPct: 68.2, yPct: 36.3 },
    { xPct: 80.6, yPct: 24.5 },
  ];
  var EXTERNAL_FLOW = [
    { xPct: 10.5, yPct: 14.4 },
    { xPct: 42.4, yPct: 15.8 },
    { xPct: 51.1, yPct: 13.4 },
    { xPct: 77.4, yPct: 12.7 },
    { xPct: 96.9, yPct: 26.2 },
  ];

  var EDIT_PASSWORD = 'APP2';

  // Persist edits to this browser's localStorage so they survive a page
  // reload instead of resetting back to the defaults above — editing no
  // longer has to be redone every visit. This only affects the editor's
  // own browser, though: it doesn't change what other visitors to the
  // deployed site see, since there's no backend here (per CLAUDE.md) —
  // getting an edit onto the live site for everyone still means sending
  // the "Copy changes" text so it can be committed to this file.
  var STORAGE_KEY_INTERNAL = 'tm.airSystem.internalItems';
  var STORAGE_KEY_EXTERNAL = 'tm.airSystem.externalItems';
  var STORAGE_KEY_INTERNAL_FLOW = 'tm.airSystem.internalFlow';
  var STORAGE_KEY_EXTERNAL_FLOW = 'tm.airSystem.externalFlow';

  function restoreItems(key, items) {
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
  function persistItems(key, items) {
    try { window.localStorage.setItem(key, JSON.stringify(items)); } catch (e) { /* storage full/blocked — edits still work this session */ }
  }
  restoreItems(STORAGE_KEY_INTERNAL, INTERNAL_ITEMS);
  restoreItems(STORAGE_KEY_EXTERNAL, EXTERNAL_ITEMS);
  restoreItems(STORAGE_KEY_INTERNAL_FLOW, INTERNAL_FLOW);
  restoreItems(STORAGE_KEY_EXTERNAL_FLOW, EXTERNAL_FLOW);

  function mount(container) {
    container.innerHTML =
      '<div class="air-sys">' +
      '<div class="air-sys-header">' +
      '<h1>Air System</h1>' +
      '<p>The engine air system covers every airflow that doesn’t directly produce thrust. Switch between its two halves and hover a marker — or a list item — for what it does. The numbered yellow boxes trace the airflow path for that half.</p>' +
      '</div>' +

      '<div class="air-sys-toggle">' +
      '<button type="button" class="air-sys-mode-btn active" data-mode="internal">Internal Air System</button>' +
      '<button type="button" class="air-sys-mode-btn" data-mode="external">External Air System</button>' +
      '<button type="button" class="air-sys-edit-btn" title="Edit wording and marker positions">✎ Edit</button>' +
      '</div>' +

      '<div class="air-sys-body">' +
      '<div class="air-sys-stage">' +
      '<div class="air-sys-image-wrap">' +
      '<img class="air-sys-image" src="tools/air-system/engine-diagram.png" alt="Generic turbojet cutaway diagram: intake, compression, combustion and exhaust sections, cold section and hot section labeled.">' +
      '<svg class="air-sys-flow-svg" viewBox="0 0 100 100" preserveAspectRatio="none">' +
      '<defs><marker id="air-sys-flow-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#f2b134"></path></marker></defs>' +
      '<g class="air-sys-flow-segs"></g>' +
      '</svg>' +
      '<div class="air-sys-flow-boxes"></div>' +
      '<div class="air-sys-image-markers"></div>' +
      '</div>' +
      '</div>' +
      '<ul class="air-sys-list"></ul>' +
      '</div>' +

      '<div class="air-sys-tooltip"><span class="t-title"></span><span class="t-desc"></span></div>' +

      // Password-gated edit mode: drag dots and retype names/descriptions
      // directly on the page; "Copy changes" exports both items arrays as
      // ready-to-paste source so the result can be saved back into the file.
      '<div class="air-sys-edit-panel" hidden>' +
      '<p>Drag dots, or click a name/description to retype it. When done:</p>' +
      '<button type="button" class="air-sys-edit-copy">Copy changes</button>' +
      '<textarea readonly></textarea>' +
      '</div>' +

      '</div>';

    var root = container.querySelector('.air-sys');
    var markerLayer = root.querySelector('.air-sys-image-markers');
    var imageWrap = root.querySelector('.air-sys-image-wrap');
    var flowSegsRoot = root.querySelector('.air-sys-flow-segs');
    var flowBoxLayer = root.querySelector('.air-sys-flow-boxes');
    var listEl = root.querySelector('.air-sys-list');
    var modeButtons = root.querySelectorAll('.air-sys-mode-btn');
    var editBtn = root.querySelector('.air-sys-edit-btn');
    var editPanel = root.querySelector('.air-sys-edit-panel');
    var editPanelText = editPanel.querySelector('textarea');
    var editCopyBtn = editPanel.querySelector('.air-sys-edit-copy');

    var tooltip = root.querySelector('.air-sys-tooltip');
    var tTitle = tooltip.querySelector('.t-title');
    var tDesc = tooltip.querySelector('.t-desc');

    var editUnlocked = false;
    var currentMode = 'internal';

    function showTip(evt, item) {
      tTitle.textContent = item.name;
      tDesc.textContent = item.desc;
      tooltip.style.display = 'block';
      positionTip(evt);
    }
    function positionTip(evt) {
      if (tooltip.style.display !== 'block') return;
      // .air-sys-tooltip is position: fixed (viewport-relative), so its left/top
      // must come straight from the pointer's own viewport coordinates,
      // not an offset against the panel's own bounding rect.
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
      var li = root.querySelector('[data-list="' + id + '"]');
      if (li) li.classList.toggle('is-hovered', active);
    }

    function formatItems(varName, items) {
      var lines = items.map(function (item) {
        return '    { id: ' + JSON.stringify(item.id) +
          ', xPct: ' + (Math.round(item.xPct * 10) / 10) +
          ', yPct: ' + (Math.round(item.yPct * 10) / 10) +
          ', name: ' + JSON.stringify(item.name) +
          ', desc: ' + JSON.stringify(item.desc) + ' },';
      });
      return '  var ' + varName + ' = [\n' + lines.join('\n') + '\n  ];';
    }

    function formatFlow(varName, points) {
      var lines = points.map(function (p) {
        return '    { xPct: ' + (Math.round(p.xPct * 10) / 10) + ', yPct: ' + (Math.round(p.yPct * 10) / 10) + ' },';
      });
      return '  var ' + varName + ' = [\n' + lines.join('\n') + '\n  ];';
    }

    function updateEditPanel() {
      if (!editUnlocked) return;
      editPanelText.value =
        formatItems('INTERNAL_ITEMS', INTERNAL_ITEMS) + '\n\n' +
        formatItems('EXTERNAL_ITEMS', EXTERNAL_ITEMS) + '\n\n' +
        formatFlow('INTERNAL_FLOW', INTERNAL_FLOW) + '\n\n' +
        formatFlow('EXTERNAL_FLOW', EXTERNAL_FLOW);
      persistItems(STORAGE_KEY_INTERNAL, INTERNAL_ITEMS);
      persistItems(STORAGE_KEY_EXTERNAL, EXTERNAL_ITEMS);
      persistItems(STORAGE_KEY_INTERNAL_FLOW, INTERNAL_FLOW);
      persistItems(STORAGE_KEY_EXTERNAL_FLOW, EXTERNAL_FLOW);
    }

    function makeDraggable(el, item, onMoveExtra) {
      el.addEventListener('pointerdown', function (evt) {
        if (!editUnlocked) return;
        evt.preventDefault();
        hideTip();
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

    // Rebuilds only the connecting line segments, never the numbered box
    // elements — safe to call on every pointermove while dragging a box.
    // (Rebuilding the box layer itself mid-drag would replace the <span>
    // the pointer is captured on, silently ending the drag after one
    // move, the same bug the Virtual Lab's waypoint handles had.)
    function renderFlowPath(mode) {
      var points = mode === 'internal' ? INTERNAL_FLOW : EXTERNAL_FLOW;
      flowSegsRoot.innerHTML = points.slice(0, -1).map(function (p, i) {
        var next = points[i + 1];
        return '<path class="air-sys-flow-seg" d="M' + p.xPct + ',' + p.yPct + ' L' + next.xPct + ',' + next.yPct + '" marker-end="url(#air-sys-flow-arrow)"></path>';
      }).join('');
    }

    function renderFlowBoxes(mode) {
      var points = mode === 'internal' ? INTERNAL_FLOW : EXTERNAL_FLOW;
      flowBoxLayer.innerHTML = points.map(function (p, i) {
        return '<span class="air-sys-flow-box" style="left:' + p.xPct + '%; top:' + p.yPct + '%;">' + (i + 1) + '</span>';
      }).join('');
      flowBoxLayer.querySelectorAll('.air-sys-flow-box').forEach(function (el, i) {
        makeDraggable(el, points[i], function () { renderFlowPath(currentMode); });
      });
    }

    function makeEditableText(el, item, field) {
      el.addEventListener('input', function () {
        item[field] = el.textContent;
        updateEditPanel();
      });
    }

    function render(mode) {
      currentMode = mode;
      root.className = 'air-sys air-sys-mode-' + mode + (editUnlocked ? ' air-sys-edit' : '');
      var items = mode === 'internal' ? INTERNAL_ITEMS : EXTERNAL_ITEMS;

      renderFlowPath(mode);
      renderFlowBoxes(mode);

      markerLayer.innerHTML = items.map(function (item) {
        return '<span class="air-sys-img-marker" data-marker="' + item.id + '" style="left:' + item.xPct + '%; top:' + item.yPct + '%;"></span>';
      }).join('');

      markerLayer.querySelectorAll('.air-sys-img-marker').forEach(function (el, i) {
        var item = items[i];
        el.addEventListener('mouseenter', function (e) { if (!editUnlocked) { showTip(e, item); } setActive(item.id, true); });
        el.addEventListener('mousemove', positionTip);
        el.addEventListener('mouseleave', function () { hideTip(); setActive(item.id, false); });
        makeDraggable(el, item);
      });

      listEl.innerHTML = items.map(function (item) {
        return '<li class="air-sys-list-item" data-list="' + item.id + '">' +
          '<span class="air-sys-list-name" data-field="name">' + TM.escapeHtml(item.name) + '</span>' +
          '<span class="air-sys-list-desc" data-field="desc">' + TM.escapeHtml(item.desc) + '</span>' +
          '</li>';
      }).join('');

      listEl.querySelectorAll('.air-sys-list-item').forEach(function (li, i) {
        var item = items[i];
        li.addEventListener('mouseenter', function () { setActive(item.id, true); });
        li.addEventListener('mouseleave', function () { setActive(item.id, false); });
        makeEditableText(li.querySelector('[data-field="name"]'), item, 'name');
        makeEditableText(li.querySelector('[data-field="desc"]'), item, 'desc');
      });

      listEl.querySelectorAll('[data-field]').forEach(function (el) {
        el.contentEditable = editUnlocked ? 'true' : 'false';
      });

      updateEditPanel();
    }

    modeButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        modeButtons.forEach(function (b) { b.classList.toggle('active', b === btn); });
        render(btn.getAttribute('data-mode'));
      });
    });

    editBtn.addEventListener('click', function () {
      if (editUnlocked) {
        editUnlocked = false;
        editBtn.textContent = '✎ Edit';
        editBtn.classList.remove('active');
        editPanel.hidden = true;
        render(currentMode);
        return;
      }
      var pw = window.prompt('Enter the edit password:');
      if (pw === null) return;
      if (pw === EDIT_PASSWORD) {
        editUnlocked = true;
        editBtn.textContent = '✓ Editing (click to stop)';
        editBtn.classList.add('active');
        editPanel.hidden = false;
        render(currentMode);
      } else {
        window.alert('Incorrect password.');
      }
    });

    editCopyBtn.addEventListener('click', function () {
      editPanelText.focus();
      editPanelText.select();
      try {
        document.execCommand('copy');
      } catch (e) {
        // Clipboard access can fail silently in some browsers; the text
        // stays selected so it can still be copied manually with Ctrl/Cmd+C.
      }
    });

    render('internal');
  }

  window.TM.registerTool('air-system', { mount: mount });
})();
