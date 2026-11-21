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

      '<div class="air-sys-match-panel">' +
      '<h3 class="air-sys-match-title">🧠 Match the Definition — Timed Challenge</h3>' +
      '<p class="air-sys-match-intro">Click a function name on the left, then its matching description on the right (or the other way round) — a correct pair locks in green, a wrong one just flashes and resets. Each round picks a random mix of the current mode\'s functions.</p>' +
      '<div class="air-sys-match-hud">' +
      '<div class="air-sys-match-stat"><span class="air-sys-match-stat-label">Score</span><span class="air-sys-match-stat-value" id="airMatchScore">0</span></div>' +
      '<div class="air-sys-match-stat"><span class="air-sys-match-stat-label">Matched</span><span class="air-sys-match-stat-value" id="airMatchSolved">0/0</span></div>' +
      '<div class="air-sys-match-stat"><span class="air-sys-match-stat-label">Time</span><span class="air-sys-match-stat-value" id="airMatchTime">--</span></div>' +
      '<div class="air-sys-match-stat"><span class="air-sys-match-stat-label">Best (this mode)</span><span class="air-sys-match-stat-value" id="airMatchBest">--</span></div>' +
      '<button type="button" class="air-sys-match-btn" id="airMatchStartBtn">▶ Start challenge</button>' +
      '</div>' +
      '<p class="air-sys-match-result" id="airMatchResult"></p>' +
      '<div class="air-sys-match-columns">' +
      '<div class="air-sys-match-col" id="airMatchTerms"></div>' +
      '<div class="air-sys-match-col" id="airMatchDefs"></div>' +
      '</div>' +
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
    var matchMaskedIds = null; // null = no masking (match round not running)

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
        el.addEventListener('mouseenter', function (e) {
          if (matchMaskedIds && matchMaskedIds[item.id]) return; // don't spoil the challenge
          if (!editUnlocked) { showTip(e, item); }
          setActive(item.id, true);
        });
        el.addEventListener('mousemove', positionTip);
        el.addEventListener('mouseleave', function () {
          if (matchMaskedIds && matchMaskedIds[item.id]) return;
          hideTip(); setActive(item.id, false);
        });
        makeDraggable(el, item);
      });

      // Masked while the "Match the Definition" challenge below is
      // running a round that includes this item — swapped for a locked
      // placeholder so the list can't be used to peek at the answer.
      listEl.innerHTML = items.map(function (item) {
        var masked = matchMaskedIds && matchMaskedIds[item.id];
        var nameHtml = masked ? '🔒 ?????' : TM.escapeHtml(item.name);
        var descHtml = masked
          ? 'Hidden while the Match the Definition challenge is running — click its matching tile instead.'
          : TM.escapeHtml(item.desc);
        return '<li class="air-sys-list-item' + (masked ? ' is-masked' : '') + '" data-list="' + item.id + '">' +
          '<span class="air-sys-list-name" data-field="name">' + nameHtml + '</span>' +
          '<span class="air-sys-list-desc" data-field="desc">' + descHtml + '</span>' +
          '</li>';
      }).join('');

      listEl.querySelectorAll('.air-sys-list-item').forEach(function (li, i) {
        var item = items[i];
        li.addEventListener('mouseenter', function () { if (!li.classList.contains('is-masked')) setActive(item.id, true); });
        li.addEventListener('mouseleave', function () { if (!li.classList.contains('is-masked')) setActive(item.id, false); });
        if (!li.classList.contains('is-masked')) {
          makeEditableText(li.querySelector('[data-field="name"]'), item, 'name');
          makeEditableText(li.querySelector('[data-field="desc"]'), item, 'desc');
        }
      });

      listEl.querySelectorAll('[data-field]').forEach(function (el) {
        el.contentEditable = editUnlocked ? 'true' : 'false';
      });

      updateEditPanel();
    }

    modeButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        modeButtons.forEach(function (b) { b.classList.toggle('active', b === btn); });
        if (matchActive) endMatch('reset'); // the match pool differs per mode
        render(btn.getAttribute('data-mode'));
        updateMatchBestDisplay();
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

    // --- "Match the Definition" timed challenge --------------------------
    // Click a function name then its matching description (or the reverse
    // order — whichever comes second triggers the check). The round's
    // pool is whichever items array matches the CURRENT mode, so switching
    // Internal/External mode mid-round aborts it (see modeButtons handler
    // above) rather than leaving a round quizzing the other mode's parts.
    var MATCH_SECONDS_PER_ITEM = 14;
    var MATCH_BEST_KEY_PREFIX = 'tm.airSystem.matchBest.';
    var matchTermsEl = root.querySelector('#airMatchTerms');
    var matchDefsEl = root.querySelector('#airMatchDefs');
    var matchScoreEl = root.querySelector('#airMatchScore');
    var matchSolvedEl = root.querySelector('#airMatchSolved');
    var matchTimeEl = root.querySelector('#airMatchTime');
    var matchBestEl = root.querySelector('#airMatchBest');
    var matchResultEl = root.querySelector('#airMatchResult');
    var matchStartBtn = root.querySelector('#airMatchStartBtn');

    var matchActive = false;
    var matchScore = 0, matchSolved = 0, matchTotal = 0;
    var matchDuration = 0, matchDeadline = 0, matchTimerId = null;
    var selTermEl = null, selDefEl = null, selTermId = null, selDefId = null;

    function shuffled(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
      }
      return a;
    }

    // Tiny self-contained Web Audio beeps — same no-audio-files pattern
    // every other game in this portal uses.
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

    function loadMatchBest(mode) {
      try { return Number(localStorage.getItem(MATCH_BEST_KEY_PREFIX + mode)) || 0; } catch (err) { return 0; }
    }
    function saveMatchBest(mode, val) {
      try { localStorage.setItem(MATCH_BEST_KEY_PREFIX + mode, String(val)); } catch (err) { /* ignore */ }
    }
    function updateMatchBestDisplay() {
      var best = loadMatchBest(currentMode);
      matchBestEl.textContent = best > 0 ? best : '--';
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
      tile.className = 'air-sys-match-tile';
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
      var all = currentMode === 'internal' ? INTERNAL_ITEMS : EXTERNAL_ITEMS;
      // A random subset each time (never fewer than 3, or the whole set
      // if there are 3 or fewer) so repeat rounds don't always quiz the
      // exact same parts.
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
      items.forEach(function (it) { matchMaskedIds[it.id] = true; });
      render(currentMode);

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
      matchTermsEl.querySelectorAll('.air-sys-match-tile:not(.is-solved)').forEach(function (el) { el.classList.add('is-revealed'); });
      matchDefsEl.querySelectorAll('.air-sys-match-tile:not(.is-solved)').forEach(function (el) { el.classList.add('is-revealed'); });
      matchMaskedIds = null;
      render(currentMode);
      matchStartBtn.disabled = false;
      updateMatchHud();

      if (reason === 'reset') { matchResultEl.textContent = ''; return; }

      var best = loadMatchBest(currentMode);
      var beat = matchScore > best;
      if (beat) { saveMatchBest(currentMode, matchScore); updateMatchBestDisplay(); }

      if (reason === 'cleared') {
        playMatchClear();
        matchResultEl.textContent = '🎉 All ' + matchTotal + ' matched! Score: ' + matchScore + (beat ? ' — new best!' : '');
      } else {
        matchResultEl.textContent = '⏱ Time\'s up — matched ' + matchSolved + '/' + matchTotal + '. Score: ' + matchScore + (beat ? ' — new best!' : '');
      }
    }

    matchStartBtn.addEventListener('click', startMatch);
    updateMatchBestDisplay();

    window.TM.toolModules['air-system'].debugMatchState = function () {
      return { matchActive: matchActive, matchScore: matchScore, matchSolved: matchSolved, matchTotal: matchTotal };
    };
    window.TM.toolModules['air-system'].debugForceMatchTimeout = function () {
      matchDeadline = performance.now() - 1;
    };
    window.TM.toolModules['air-system'].unmount = function () {
      if (matchTimerId != null) { clearInterval(matchTimerId); matchTimerId = null; }
    };

    render('internal');
  }

  window.TM.registerTool('air-system', { mount: mount });
})();
