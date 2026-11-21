(function () {
  var DESC = {
    oilTank: ['Oil Tank', 'Stores the reserve of oil for the system. Usually mounted on the engine, it must allow full draining and replenishing, and carries a sight glass or dipstick so the oil level can be checked manually.'],
    supplyPump: ['Supply (Pressure) Pump', 'Draws oil from the tank and pressurizes it for delivery to the bearings and gearbox. Usually a gear-type pump built into the same assembly as the scavenge pump, sized for the flow needed at maximum engine speed. Its drive shaft has no shear neck, so it keeps supplying oil even if damaged.'],
    scavengePump: ['Scavenge Pump', 'Draws used oil back out of the bearing chambers and gearbox and returns it toward the tank. Scavenge capacity is larger than supply capacity, since the returning oil has expanded with heat and entrained air.'],
    reliefValve: ['Oil Pressure Relief Valve', 'A spring-loaded valve that limits feed-line pressure to a set design value. When pressure exceeds that value, it opens and routes the excess oil back to the tank or to the pump inlet, keeping delivery pressure consistent across engine speeds.'],
    mainFilter: ['Main Oil Filter', 'A fine pressure filter fitted at the pump outlet. It catches particles before they can block the oil feed jets, and often carries a pop-up indicator that gives a visual warning if it starts to block.'],
    fohe: ['FOHE — Fuel/Oil Heat Exchanger', 'Routes hot oil across a matrix of tubes carrying fuel. Heat passes from the oil into the fuel, which cools the oil and pre-warms the fuel before it reaches the combustor.'],
    lastChance: ['Last-Chance Filter', 'A fine thread-type strainer fitted immediately upstream of the oil jets — the final safeguard against any particle reaching a bearing or gear mesh.'],
    mcd: ['Magnetic Chip Detector', 'A permanent magnet sitting in the scavenge flow that collects ferrous wear debris from the chamber it serves. Inspecting it can reveal an impending bearing or spline failure without pulling a filter.'],
    electricMcd: ['Electric Magnetic Chip Detector', 'Continuously monitors the combined scavenge flow for ferrous debris and can trigger a cockpit warning immediately, rather than waiting for a manual inspection between flights.'],
    oilTempProbe: ['Oil Temperature Probe', 'Measures the temperature of oil returning to the tank. A high oil temperature reading is treated as a cause for engine shutdown, so this sensor feeds the cockpit warning system.'],
    breather: ['Centrifugal Breather (Deoiler)', 'Spins the air drawn from the bearing chambers and gearbox to fling out the entrained oil mist. Recovered oil rejoins the system while the cleaned air is vented overboard.'],
    gearbox: ['Gear Box', 'Accessory / reduction gearbox. Its gears and splines run under high torque and need continuous lubrication and cooling.'],
  };
  function bearingDesc(name, note) {
    return [name, 'Supports ' + note + '. Oil is jetted onto the bearing to lubricate and cool it under high rotational speed and load, then drains to the scavenge system.'];
  }

  var SPOOLS = {
    single: { label: 'Single Spool', columns: [
      { id: 'gearbox', label: 'Gear\nBox', desc: DESC.gearbox },
      { id: 'compb', label: 'Comp\nBearing', desc: bearingDesc('Compressor Bearing', 'the single compressor shaft') },
      { id: 'turbb', label: 'Turb\nBearing', desc: bearingDesc('Turbine Bearing', 'the single turbine shaft, the hottest bearing location in the engine') },
    ] },
    twin: { label: 'Twin Spool', columns: [
      { id: 'gearbox', label: 'Gear\nBox', desc: DESC.gearbox },
      { id: 'lpc', label: 'LPC\nBearing', desc: bearingDesc('LPC Bearing', 'the Low Pressure Compressor shaft') },
      { id: 'hpc', label: 'HPC\nBearing', desc: bearingDesc('HPC Bearing', 'the High Pressure Compressor shaft') },
      { id: 'hpt', label: 'HPT\nBearing', desc: bearingDesc('HPT Bearing', 'the High Pressure Turbine shaft, running close to the hot section') },
      { id: 'lpt', label: 'LPT\nBearing', desc: bearingDesc('LPT Bearing', 'the Low Pressure Turbine shaft') },
    ] },
    triple: { label: 'Triple Spool', columns: [
      { id: 'gearbox', label: 'Gear\nBox', desc: DESC.gearbox },
      { id: 'lpc', label: 'LPC\nBearing', desc: bearingDesc('LPC Bearing', 'the Low Pressure Compressor shaft') },
      { id: 'ipc', label: 'IPC\nBearing', desc: bearingDesc('IPC Bearing', 'the Intermediate Pressure Compressor shaft') },
      { id: 'hpc', label: 'HPC\nBearing', desc: bearingDesc('HPC Bearing', 'the High Pressure Compressor shaft') },
      { id: 'hpt', label: 'HPT\nBearing', desc: bearingDesc('HPT Bearing', 'the High Pressure Turbine shaft, the hottest bearing location in the engine') },
      { id: 'ipt', label: 'IPT\nBearing', desc: bearingDesc('IPT Bearing', 'the Intermediate Pressure Turbine shaft') },
      { id: 'lpt', label: 'LPT\nBearing', desc: bearingDesc('LPT Bearing', 'the Low Pressure Turbine shaft') },
    ] },
  };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function multiline(label, cx, cyMid, cls) {
    var lines = label.split('\n');
    var lh = 14;
    var startY = cyMid - ((lines.length - 1) * lh) / 2 + 4;
    return lines.map(function (ln, i) {
      return '<text class="' + cls + '" x="' + cx + '" y="' + (startY + i * lh) + '">' + esc(ln) + '</text>';
    }).join('');
  }
  function box(id, x, y, w, h, label, desc, opts) {
    opts = opts || {};
    var cx = x + w / 2, cy = y + h / 2;
    var cls = 'comp-box' + (opts.filter ? ' filter' : '');
    var lblCls = 'comp-label' + (opts.small ? ' small' : '');
    var gcls = 'comp' + (opts.gameId ? ' game-target' : '');
    var gameAttr = opts.gameId ? ' data-game-id="' + esc(opts.gameId) + '"' : '';
    return '<g class="' + gcls + '" data-title="' + esc(desc[0]) + '" data-desc="' + esc(desc[1]) + '"' + gameAttr + '>' +
      '<rect class="' + cls + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (opts.rx != null ? opts.rx : 4) + '"></rect>' +
      multiline(label, cx, cy, lblCls) +
      '</g>';
  }
  function line(cls, extra, d) {
    return '<path class="flow-line ' + cls + ' flow-anim" d="' + d + '" stroke-width="' + (extra.w || 3) + '" marker-end="url(#oil-arrow-' + cls + ')"></path>';
  }

  function buildDiagram(spoolKey) {
    var spool = SPOOLS[spoolKey];
    var cols = spool.columns;
    var N = cols.length;

    var spineX = 245;
    var leftX = spineX, rightX = 1500;
    var gap = N > 1 ? (rightX - leftX) / (N - 1) : 0;
    var colX = cols.map(function (c, i) { return N > 1 ? leftX + i * gap : (leftX + rightX) / 2; });

    var out = '';

    var tankW = 180, tankX = spineX - tankW / 2, tankY = 28, tankH = 62;
    out += box('oilTank', tankX, tankY, tankW, tankH, 'OIL TANK', DESC.oilTank);

    var otpX = tankX + tankW + 20, otpY = 28, otpW = 140, otpH = 62;
    out += box('otp', otpX, otpY, otpW, otpH, 'OIL TEMP\nPROBE', DESC.oilTempProbe, { small: true });

    var emcdX = otpX + otpW + 20, emcdY = 28, emcdW = 150, emcdH = 62;
    out += box('emcd', emcdX, emcdY, emcdW, emcdH, 'ELECTRIC\nMCD', DESC.electricMcd, { small: true });

    var rowMidY = tankY + tankH / 2;
    out += line('scavenge', { w: 2.6 }, 'M ' + emcdX + ' ' + rowMidY + ' L ' + (otpX + otpW) + ' ' + rowMidY);
    out += line('scavenge', { w: 2.6 }, 'M ' + otpX + ' ' + rowMidY + ' L ' + (tankX + tankW + 4) + ' ' + rowMidY);

    var pumpY = 150, pumpH = 66;
    var supplyPumpX = spineX - 90, supplyPumpW = 180;
    var scavPumpX = supplyPumpX + supplyPumpW, scavPumpW = 190;
    out += box('pumpS', supplyPumpX, pumpY, supplyPumpW, pumpH, 'SUPPLY\nPUMP', DESC.supplyPump, { small: true });
    out += box('pumpV', scavPumpX, pumpY, scavPumpW, pumpH, 'SCAVENGE\nPUMP', DESC.scavengePump, { small: true });

    var relief_x = spineX - 75;
    out += box('relief', relief_x, 258, 150, 54, 'OIL PRESSURE\nRELIEF VALVE', DESC.reliefValve, { small: true });
    out += box('mfilter', relief_x, 344, 150, 46, 'MAIN OIL\nFILTER', DESC.mainFilter, { small: true, filter: true });
    out += box('fohe', relief_x, 422, 150, 46, 'FOHE', DESC.fohe);

    out += line('supply', { w: 3 }, 'M ' + spineX + ' ' + (tankY + tankH + 4) + ' L ' + spineX + ' ' + pumpY);
    out += line('supply', { w: 3 }, 'M ' + spineX + ' ' + (pumpY + pumpH) + ' L ' + spineX + ' 258');
    out += line('supply', { w: 3 }, 'M ' + spineX + ' 312 L ' + spineX + ' 344');
    out += line('supply', { w: 3 }, 'M ' + spineX + ' 390 L ' + spineX + ' 422');

    out += line('supply', { w: 2 }, 'M ' + relief_x + ' 285 L ' + (relief_x - 75) + ' 285 L ' + (relief_x - 75) + ' 183 L ' + (supplyPumpX - 4) + ' 183');

    var scavPumpCX = scavPumpX + scavPumpW / 2;
    var emcdCX = emcdX + emcdW / 2;
    var jogY = emcdY + emcdH + 20;
    out += line('scavenge', { w: 3 }, 'M ' + scavPumpCX + ' ' + (pumpY - 4) + ' L ' + scavPumpCX + ' ' + jogY + ' L ' + emcdCX + ' ' + jogY + ' L ' + emcdCX + ' ' + (emcdY + emcdH + 4));

    var branchY = 490;
    out += '<path class="flow-line supply flow-anim" d="M ' + spineX + ' 468 L ' + spineX + ' ' + branchY + ' L ' + colX[N - 1] + ' ' + branchY + '" stroke-width="3" fill="none" marker-end="url(#oil-arrow-supply)"></path>';

    var lcfY = 512, lcfH = 26, lcfW = 78;
    var brY = 552, brH = 92, brW = 112;
    var mcdY = 660, mcdH = 34, mcdW = 76;

    cols.forEach(function (col, i) {
      var cx = colX[i];
      out += line('supply', { w: 2.4 }, 'M ' + cx + ' ' + branchY + ' L ' + cx + ' ' + lcfY);
      out += box('lcf' + i, cx - lcfW / 2, lcfY, lcfW, lcfH, 'Last\nChance', DESC.lastChance, { small: true, filter: true, rx: 2 });
      out += line('supply', { w: 2.4 }, 'M ' + cx + ' ' + (lcfY + lcfH) + ' L ' + cx + ' ' + brY);
      out += box('br' + i, cx - brW / 2, brY, brW, brH, col.label, col.desc, { small: true, gameId: col.id });
      out += line('scavenge', { w: 2.4 }, 'M ' + cx + ' ' + (brY + brH) + ' L ' + cx + ' ' + mcdY);
      out += box('mcd' + i, cx - mcdW / 2, mcdY, mcdW, mcdH, 'MCD', DESC.mcd, { small: true });
    });

    var scavTrunkY = 726, retTrunkY = 742;
    cols.forEach(function (col, i) {
      var cx = colX[i];
      out += line('scavenge', { w: 2 }, 'M ' + cx + ' ' + (mcdY + mcdH) + ' L ' + cx + ' ' + scavTrunkY);
      out += line('return', { w: 2 }, 'M ' + cx + ' ' + (mcdY + mcdH + 6) + ' L ' + cx + ' ' + retTrunkY);
    });
    out += '<path class="flow-line scavenge flow-anim" d="M ' + colX[0] + ' ' + scavTrunkY + ' L ' + colX[N - 1] + ' ' + scavTrunkY + '" stroke-width="2.4" fill="none"></path>';
    out += '<path class="flow-line return flow-anim" d="M ' + colX[0] + ' ' + retTrunkY + ' L ' + colX[N - 1] + ' ' + retTrunkY + '" stroke-width="2.4" fill="none"></path>';

    var avgX = (colX[0] + colX[N - 1]) / 2;

    var scavRiserX = rightX + 100;
    out += line('scavenge', { w: 3 }, 'M ' + colX[N - 1] + ' ' + scavTrunkY + ' L ' + scavRiserX + ' ' + scavTrunkY + ' L ' + scavRiserX + ' 183 L ' + (scavPumpX + scavPumpW + 4) + ' 183');

    var breatherW = 170, breatherH = 58, breatherX = avgX - breatherW / 2, breatherY = 800;
    out += line('return', { w: 3 }, 'M ' + avgX + ' ' + retTrunkY + ' L ' + avgX + ' ' + breatherY);
    out += box('breather', breatherX, breatherY, breatherW, breatherH, 'CENTRIFUGAL\nBREATHER', DESC.breather, { small: true });

    var retRiserX = rightX + 170;
    out += line('return', { w: 3 }, 'M ' + (breatherX + breatherW) + ' ' + (breatherY + breatherH / 2) + ' L ' + retRiserX + ' ' + (breatherY + breatherH / 2) + ' L ' + retRiserX + ' 8 L ' + (spineX + 45) + ' 8 L ' + (spineX + 45) + ' ' + (tankY - 4));

    var airLineY = breatherY + breatherH / 2 - 16;
    var airLabelY = breatherY + breatherH / 2 + 6;
    out += '<path class="static-line" d="M ' + breatherX + ' ' + airLineY + ' L ' + (breatherX - 100) + ' ' + airLineY + '" marker-end="url(#oil-arrow-air)"></path>';
    out += '<text class="static-label" x="' + (breatherX - 190) + '" y="' + airLabelY + '">AIR (vent overboard)</text>';

    out += '<text class="group-title" x="' + (relief_x + 150 + 30) + '" y="445">BEARING / GEARBOX COMPARTMENTS — ' + spool.label.toUpperCase() + '</text>';

    return out;
  }

  function mount(container) {
    container.innerHTML =
      '<div class="oil-diagram">' +
      '<header>' +
      '<div>' +
      '<span class="tag">REF: THE JET ENGINE — ROLLS ROYCE</span>' +
      '<h1>Turbofan Engine Oil System — Full Flow Dry Sump</h1>' +
      '<p>Toggle spool configuration and oil circuits. Hover any component for its function.</p>' +
      '</div>' +
      '</header>' +

      '<div class="controls">' +
      '<div class="control-group">' +
      '<span class="glabel">SPOOL CONFIG</span>' +
      '<button type="button" class="spool-btn active" data-spool="single">Single Spool</button>' +
      '<button type="button" class="spool-btn" data-spool="twin">Twin Spool</button>' +
      '<button type="button" class="spool-btn" data-spool="triple">Triple Spool</button>' +
      '</div>' +
      '<div class="control-group">' +
      '<span class="glabel">OIL CIRCUITS</span>' +
      '<label class="line-toggle legend-supply" data-line="supply">' +
      '<input type="checkbox" checked><span class="swatch"></span>Supply</label>' +
      '<label class="line-toggle legend-scavenge" data-line="scavenge">' +
      '<input type="checkbox" checked><span class="swatch"></span>Scavenge</label>' +
      '<label class="line-toggle legend-return" data-line="return">' +
      '<input type="checkbox" checked><span class="swatch"></span>Return (Deoiler)</label>' +
      '</div>' +
      '</div>' +

      '<div class="oil-game-panel">' +
      '<h3 class="oil-game-title">🎮 Label the Bearings — Timed Challenge</h3>' +
      '<p class="oil-game-intro">Drag each label below onto the matching bearing/gearbox box in the diagram further down before time runs out — faster correct placements score more points. Each round picks a random mix of this configuration\'s parts, so it\'s different every time. The reference list and hover tooltips are hidden for these parts while a challenge is running.</p>' +
      '<div class="oil-game-hud">' +
      '<div class="oil-game-stat"><span class="oil-game-stat-label">Score</span><span class="oil-game-stat-value" id="oilGameScore">0</span></div>' +
      '<div class="oil-game-stat"><span class="oil-game-stat-label">Placed</span><span class="oil-game-stat-value" id="oilGamePlaced">0/0</span></div>' +
      '<div class="oil-game-stat"><span class="oil-game-stat-label">Time</span><span class="oil-game-stat-value" id="oilGameTime">--</span></div>' +
      '<div class="oil-game-stat"><span class="oil-game-stat-label">Best (this config)</span><span class="oil-game-stat-value" id="oilGameBest">--</span></div>' +
      '<button type="button" class="oil-game-btn" id="oilGameStartBtn">▶ Start challenge</button>' +
      '</div>' +
      '<p class="oil-game-result" id="oilGameResult"></p>' +
      '<div class="oil-game-bank" id="oilGameBank"></div>' +
      '</div>' +

      '<div class="stage-wrap">' +
      '<svg class="oil-svg" viewBox="0 0 1780 1000" xmlns="http://www.w3.org/2000/svg">' +
      '<defs>' +
      '<pattern id="oil-hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">' +
      '<rect width="6" height="6" fill="#173350"></rect>' +
      '<line x1="0" y1="0" x2="0" y2="6" stroke="#5aa9d6" stroke-width="1.4"></line>' +
      '</pattern>' +
      '<marker id="oil-arrow-supply" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">' +
      '<path d="M0,0 L6,3 L0,6 Z" fill="var(--supply)"></path></marker>' +
      '<marker id="oil-arrow-scavenge" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">' +
      '<path d="M0,0 L6,3 L0,6 Z" fill="var(--scavenge)"></path></marker>' +
      '<marker id="oil-arrow-return" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">' +
      '<path d="M0,0 L6,3 L0,6 Z" fill="var(--return)"></path></marker>' +
      '<marker id="oil-arrow-air" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">' +
      '<path d="M0,0 L6,3 L0,6 Z" fill="var(--air)"></path></marker>' +
      '</defs>' +
      '<g class="diagram-root"></g>' +
      '</svg>' +
      '</div>' +
      '<div class="explain"><span class="e-title">Hover a component</span><span class="e-desc">Hover any box in the diagram above to see what it does, here.</span></div>' +
      '<div class="comp-ref">' +
      '<h3 class="comp-ref-title">Component reference — current configuration</h3>' +
      '<ul class="comp-list"></ul>' +
      '</div>' +
      '<footer>Diagram generated from lubrication system training notes. Educational schematic, not to scale.</footer>' +
      '</div>';

    var wrap = container.querySelector('.oil-diagram');
    var diagramRoot = wrap.querySelector('.diagram-root');
    var svgEl = wrap.querySelector('.oil-svg');
    var explain = wrap.querySelector('.explain');
    var eTitle = explain.querySelector('.e-title');
    var eDesc = explain.querySelector('.e-desc');
    var compListEl = wrap.querySelector('.comp-list');

    // Cursor-following tooltip, added alongside the existing fixed
    // `.explain` panel by follow-up request ("I want mouse over
    // explanation display near my mouse cursor on all parts") — the
    // `.explain` panel stays (still useful as a persistent "what did I
    // last hover" readout), this is additive. Reuses the clientX/
    // clientY-direct positioning every other tool's tooltip uses,
    // since `.oil-tooltip` is `position: fixed`.
    var tooltip = document.createElement('div');
    tooltip.className = 'oil-tooltip';
    tooltip.innerHTML = '<span class="t-title"></span><span class="t-desc"></span>';
    wrap.appendChild(tooltip);
    var tTitle = tooltip.querySelector('.t-title');
    var tDesc = tooltip.querySelector('.t-desc');
    function showTip(evt, title, desc) {
      tTitle.textContent = title;
      tDesc.textContent = desc;
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

    var currentSpool = 'single';
    var lineState = { supply: true, scavenge: true, return: true };

    // --- "Label the Bearings" timed drag-and-drop challenge --------------
    // A supplementary game layered on top of this same diagram: the
    // bearing/gearbox column boxes (tagged `.game-target` / `data-game-id`
    // by box(), one per entry in the current spool's `columns`) get their
    // labels blanked out, and the student drags shuffled label tiles from
    // a word bank onto the matching box before time runs out. Reuses the
    // pointer-based drag pattern this codebase's edit modes already use
    // (pointerdown captures a floating clone that follows the pointer;
    // pointerup hit-tests via document.elementFromPoint) rather than HTML5
    // drag-and-drop, since that's unreliable on touch without a polyfill.
    var GAME_SECONDS_PER_ITEM = 12;
    var GAME_BEST_KEY_PREFIX = 'tm.oilSystem.gameBest.';
    var gameBankEl = wrap.querySelector('#oilGameBank');
    var gameScoreEl = wrap.querySelector('#oilGameScore');
    var gamePlacedEl = wrap.querySelector('#oilGamePlaced');
    var gameTimeEl = wrap.querySelector('#oilGameTime');
    var gameBestEl = wrap.querySelector('#oilGameBest');
    var gameResultEl = wrap.querySelector('#oilGameResult');
    var gameStartBtn = wrap.querySelector('#oilGameStartBtn');
    var gamePanelEl = wrap.querySelector('.oil-game-panel');

    var gameActive = false;
    var gameScore = 0, gamePlaced = 0, gameTotal = 0;
    var gameDuration = 0, gameDeadline = 0, gameTimerId = null;
    var gameMaskedTitles = null; // null = no masking (game not running)
    var dragState = null;

    function loadGameBest(spool) {
      try { return Number(localStorage.getItem(GAME_BEST_KEY_PREFIX + spool)) || 0; } catch (err) { return 0; }
    }
    function saveGameBest(spool, val) {
      try { localStorage.setItem(GAME_BEST_KEY_PREFIX + spool, String(val)); } catch (err) { /* ignore */ }
    }
    function updateGameBestDisplay() {
      var best = loadGameBest(currentSpool);
      gameBestEl.textContent = best > 0 ? best : '--';
    }
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
    var gameAudioCtx = null;
    function ensureGameAudio() {
      if (!gameAudioCtx) {
        try { gameAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (err) { return null; }
      }
      if (gameAudioCtx.state === 'suspended') gameAudioCtx.resume();
      return gameAudioCtx;
    }
    function gameBeep(freq, dur, type, vol, delay) {
      var ctx = ensureGameAudio();
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
    function playGameRight() { gameBeep(660, 0.08, 'square', 0.15); }
    function playGameWrong() { gameBeep(180, 0.16, 'sawtooth', 0.16); }
    function playGameClear() { gameBeep(523, 0.09, 'square', 0.18); gameBeep(784, 0.11, 'square', 0.18, 0.09); gameBeep(1046, 0.16, 'square', 0.18, 0.18); }

    // Only the boxes chosen for THIS round (see startGame) — not every
    // game-target box — so a box left out of a round stays fully visible
    // and unmasked, as if the challenge weren't running at all.
    var gameRoundIds = null;
    function gameTargets() {
      var all = Array.prototype.slice.call(wrap.querySelectorAll('.comp.game-target'));
      if (!gameRoundIds) return all;
      return all.filter(function (g) { return gameRoundIds[g.dataset.gameId]; });
    }

    function buildBankTile(col) {
      var tile = document.createElement('div');
      tile.className = 'oil-game-tile';
      tile.textContent = col.label.replace(/\n/g, ' ');
      tile.dataset.targetId = col.id;
      tile.addEventListener('pointerdown', onTilePointerDown);
      return tile;
    }

    function onTilePointerDown(e) {
      if (!gameActive || dragState) return;
      e.preventDefault();
      var tile = e.currentTarget;
      var rect = tile.getBoundingClientRect();
      var clone = tile.cloneNode(true);
      clone.className = 'oil-game-tile oil-game-tile-drag';
      clone.style.position = 'fixed';
      clone.style.left = rect.left + 'px';
      clone.style.top = rect.top + 'px';
      clone.style.width = rect.width + 'px';
      clone.style.height = rect.height + 'px';
      document.body.appendChild(clone);
      tile.classList.add('is-dragging-source');
      dragState = { tile: tile, clone: clone, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
      document.addEventListener('pointermove', onDragPointerMove);
      document.addEventListener('pointerup', onDragPointerUp);
    }
    function onDragPointerMove(e) {
      if (!dragState) return;
      dragState.clone.style.left = (e.clientX - dragState.offsetX) + 'px';
      dragState.clone.style.top = (e.clientY - dragState.offsetY) + 'px';
    }
    function onDragPointerUp(e) {
      if (!dragState) return;
      document.removeEventListener('pointermove', onDragPointerMove);
      document.removeEventListener('pointerup', onDragPointerUp);
      var tile = dragState.tile, clone = dragState.clone;
      clone.style.display = 'none'; // hide before hit-testing so it isn't picked up
      var el = document.elementFromPoint(e.clientX, e.clientY);
      clone.remove();
      tile.classList.remove('is-dragging-source');
      var targetGroup = el && el.closest ? el.closest('.comp.game-target') : null;
      dragState = null;
      if (gameActive && targetGroup && targetGroup.classList.contains('is-blanked') && targetGroup.dataset.gameId === tile.dataset.targetId) {
        handleCorrectPlacement(tile, targetGroup);
      } else if (gameActive) {
        tile.classList.add('is-wrong-flash');
        setTimeout(function () { tile.classList.remove('is-wrong-flash'); }, 400);
        playGameWrong();
      }
    }

    function handleCorrectPlacement(tile, targetGroup) {
      targetGroup.classList.remove('is-blanked');
      targetGroup.classList.add('is-solved-flash');
      setTimeout(function () { targetGroup.classList.remove('is-solved-flash'); }, 500);
      tile.remove();
      gamePlaced += 1;
      var remainingFrac = Math.max(0, (gameDeadline - performance.now()) / gameDuration);
      gameScore += Math.round(100 * (0.4 + 0.6 * remainingFrac));
      playGameRight();
      updateGameHud();
      if (gamePlaced >= gameTotal) endGame('cleared');
    }

    function updateGameHud() {
      gameScoreEl.textContent = gameScore;
      gamePlacedEl.textContent = gamePlaced + '/' + gameTotal;
      var remaining = Math.max(0, gameDeadline - performance.now());
      gameTimeEl.textContent = gameActive ? Math.ceil(remaining / 1000) + 's' : '--';
    }

    function startGame() {
      if (gameActive) return;
      var all = SPOOLS[currentSpool].columns;
      // A random subset each time (never fewer than 3, or the whole set
      // if there are 3 or fewer) so repeat rounds on the same spool
      // config don't always quiz the exact same parts.
      var count = all.length <= 3 ? all.length : 3 + Math.floor(Math.random() * (all.length - 2));
      var cols = shuffled(all).slice(0, count);

      gameActive = true;
      gameTotal = cols.length;
      gameScore = 0;
      gamePlaced = 0;
      gameResultEl.textContent = '';
      gameStartBtn.disabled = true;
      // Pinned to the bottom of the viewport while running — the Start
      // button lives below a long diagram + reference list, so without
      // this the student would have to keep scrolling all the way back
      // down to reach the word bank after scrolling up to the diagram.
      gamePanelEl.classList.add('is-floating');

      gameRoundIds = {};
      cols.forEach(function (c) { gameRoundIds[c.id] = true; });
      gameMaskedTitles = {};
      cols.forEach(function (c) { gameMaskedTitles[c.desc[0]] = true; });
      renderCompList();

      gameTargets().forEach(function (g) { g.classList.add('is-blanked'); });

      gameBankEl.innerHTML = '';
      shuffled(cols).forEach(function (col) { gameBankEl.appendChild(buildBankTile(col)); });

      gameDuration = GAME_SECONDS_PER_ITEM * 1000 * gameTotal;
      gameDeadline = performance.now() + gameDuration;
      updateGameHud();

      if (gameTimerId != null) clearInterval(gameTimerId);
      gameTimerId = setInterval(function () {
        if (performance.now() >= gameDeadline) { endGame('timeup'); return; }
        updateGameHud();
      }, 200);
    }

    function endGame(reason) {
      if (!gameActive) return;
      gameActive = false;
      if (gameTimerId != null) { clearInterval(gameTimerId); gameTimerId = null; }
      gameTargets().forEach(function (g) { g.classList.remove('is-blanked'); });
      gameRoundIds = null;
      gameMaskedTitles = null;
      renderCompList();
      gameBankEl.innerHTML = '';
      gameStartBtn.disabled = false;
      gamePanelEl.classList.remove('is-floating');
      updateGameHud();

      if (reason === 'reset') { gameResultEl.textContent = ''; return; }

      var best = loadGameBest(currentSpool);
      var beat = gameScore > best;
      if (beat) { saveGameBest(currentSpool, gameScore); updateGameBestDisplay(); }

      if (reason === 'cleared') {
        playGameClear();
        gameResultEl.textContent = '🎉 All ' + gameTotal + ' labeled! Score: ' + gameScore + (beat ? ' — new best!' : '');
      } else {
        gameResultEl.textContent = '⏱ Time\'s up — placed ' + gamePlaced + '/' + gameTotal + '. Score: ' + gameScore + (beat ? ' — new best!' : '');
      }
    }

    gameStartBtn.addEventListener('click', startGame);
    updateGameBestDisplay();

    // The diagram's own set of components changes with spool config (a
    // triple-spool build has bearing columns a single-spool one doesn't),
    // so the reference list below is rebuilt from whatever `.comp` groups
    // actually exist after each render — not a fixed list — deduping by
    // title since the same generic part (e.g. "Last Chance Filter", "MCD")
    // repeats once per bearing column with identical title/desc. While the
    // "Label the Bearings" challenge above is running, the entries for its
    // own target components are masked out so the list can't be used to
    // peek at the answer.
    function renderCompList() {
      var seen = {};
      var items = [];
      wrap.querySelectorAll('.comp').forEach(function (g) {
        var title = g.dataset.title;
        if (seen[title]) return;
        seen[title] = true;
        items.push({ title: title, desc: g.dataset.desc });
      });
      compListEl.innerHTML = items.map(function (item) {
        var masked = gameMaskedTitles && gameMaskedTitles[item.title];
        var nameHtml = masked ? '🔒 ?????' : TM.escapeHtml(item.title);
        var descHtml = masked
          ? 'Hidden while the Label the Bearings challenge is running — drag the correct tile onto the diagram instead.'
          : TM.escapeHtml(item.desc);
        return '<li class="comp-list-item' + (masked ? ' is-masked' : '') + '" data-title="' + TM.escapeHtml(item.title) + '">' +
          '<span class="comp-list-name">' + nameHtml + '</span>' +
          '<span class="comp-list-desc">' + descHtml + '</span>' +
          '</li>';
      }).join('');
    }

    function setActive(title, active) {
      wrap.querySelectorAll('.comp').forEach(function (el) {
        if (el.dataset.title === title) el.classList.toggle('is-hovered', active);
      });
      wrap.querySelectorAll('.comp-list-item').forEach(function (el) {
        if (el.dataset.title === title) el.classList.toggle('is-hovered', active);
      });
    }

    function render() {
      diagramRoot.innerHTML = buildDiagram(currentSpool);
      applyLineVisibility();
      renderCompList();
    }
    function applyLineVisibility() {
      Object.keys(lineState).forEach(function (k) {
        wrap.querySelectorAll('.flow-line.' + k).forEach(function (el) {
          el.classList.toggle('hidden', !lineState[k]);
        });
      });
    }

    wrap.querySelectorAll('.spool-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        wrap.querySelectorAll('.spool-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentSpool = btn.dataset.spool;
        if (gameActive) endGame('reset'); // target set changes with spool config
        render();
        updateGameBestDisplay();
      });
    });

    wrap.querySelectorAll('.line-toggle').forEach(function (label) {
      var input = label.querySelector('input');
      input.addEventListener('change', function () {
        var key = label.dataset.line;
        lineState[key] = input.checked;
        label.classList.toggle('dimmed', !input.checked);
        applyLineVisibility();
      });
    });

    svgEl.addEventListener('mouseover', function (e) {
      var g = e.target.closest('.comp');
      if (!g) return;
      if (gameMaskedTitles && gameMaskedTitles[g.dataset.title]) return; // don't spoil the challenge
      eTitle.textContent = g.dataset.title;
      eDesc.textContent = g.dataset.desc;
      explain.classList.add('has-value');
      setActive(g.dataset.title, true);
      showTip(e, g.dataset.title, g.dataset.desc);
    });
    svgEl.addEventListener('mousemove', positionTip);
    svgEl.addEventListener('mouseout', function (e) {
      var g = e.target.closest('.comp');
      if (!g) return;
      if (gameMaskedTitles && gameMaskedTitles[g.dataset.title]) return;
      eTitle.textContent = 'Hover a component';
      eDesc.textContent = 'Hover any box in the diagram above to see what it does, here.';
      explain.classList.remove('has-value');
      setActive(g.dataset.title, false);
      hideTip();
    });

    compListEl.addEventListener('mouseover', function (e) {
      var li = e.target.closest('.comp-list-item');
      if (!li) return;
      if (li.classList.contains('is-masked')) return;
      var title = li.dataset.title;
      var desc = li.querySelector('.comp-list-desc').textContent;
      eTitle.textContent = title;
      eDesc.textContent = desc;
      explain.classList.add('has-value');
      setActive(title, true);
      showTip(e, title, desc);
    });
    compListEl.addEventListener('mousemove', positionTip);
    compListEl.addEventListener('mouseout', function (e) {
      var li = e.target.closest('.comp-list-item');
      if (!li) return;
      if (li.classList.contains('is-masked')) return;
      eTitle.textContent = 'Hover a component';
      eDesc.textContent = 'Hover any box in the diagram above to see what it does, here.';
      explain.classList.remove('has-value');
      setActive(li.dataset.title, false);
      hideTip();
    });

    render();

    // test/debug hooks only — read-only except debugForceTimeout, which
    // only nudges the game's own deadline to let a test exercise the
    // timeout path without a real multi-minute wait; no other gameplay
    // effect.
    window.TM.toolModules['oil-system-overview'].debugGameState = function () {
      return { gameActive: gameActive, gameScore: gameScore, gamePlaced: gamePlaced, gameTotal: gameTotal };
    };
    window.TM.toolModules['oil-system-overview'].debugForceTimeout = function () {
      gameDeadline = performance.now() - 1;
    };

    window.TM.toolModules['oil-system-overview'].unmount = function () {
      if (gameTimerId != null) { clearInterval(gameTimerId); gameTimerId = null; }
      document.removeEventListener('pointermove', onDragPointerMove);
      document.removeEventListener('pointerup', onDragPointerUp);
      if (dragState && dragState.clone) dragState.clone.remove();
      dragState = null;
    };
  }

  window.TM.registerTool('oil-system-overview', { mount: mount });
})();
