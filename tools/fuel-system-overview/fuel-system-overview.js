(function () {
  var titles = {
    lpsov: 'LP SOV (LP shutoff valve)',
    lppump: 'LP pump',
    fohe: 'FOHE (Fuel Oil Heat Exchanger)',
    lpfilter: 'LP filter',
    hppump: 'HP pump',
    meteringvalve: 'Metering valve (in HMU)',
    hpsov: 'HP SOV (in HMU)',
    vsv: 'VSV (Variable Stator Vane actuator)',
    drainvv: 'Drain V/V',
    draincollector: 'Drain collector',
    drainmast: 'Drain mast',
    fftransmitter: 'FF transmitter',
    fuelmanifold: 'Fuel manifold',
    fuelnozzles: 'Fuel nozzles',
  };

  var descriptions = {
    lpsov: 'Sits at the boundary between the aircraft and engine fuel systems, isolating the two. Normally controlled by the engine fire switch or master switch — closing it stops fuel reaching the engine in an emergency such as fire or major failure.',
    lppump: 'The pump’s boost stage, a centrifugal pump, that raises tank fuel to a regulated pressure and pushes it on to the FOHE, preventing cavitation further downstream.',
    fohe: 'Uses the cooler fuel to remove heat from the hot engine oil — the oil is cooled while the fuel is warmed in return. A fuel smell in the oil tank during servicing can indicate a leaking FOHE.',
    lpfilter: 'Sits in the low-pressure circuit, upstream of the fuel control unit, and filters impurities out of the fuel. A differential pressure switch flags a clogged filter, and a bypass valve lets fuel around it if it does clog.',
    hppump: 'The pump’s main stage — a gear-type positive-displacement pump — that raises fuel to high pressure for metering, and also supplies servo fuel (Pf) to the bypass valve and other fuel-pressure-operated actuators.',
    meteringvalve: 'Computes the correct fuel quantity from thrust lever position, inlet pressure and temperature, shaft speeds (N1/N2/N3) and EGT, then meters exactly that flow onward to the nozzles.',
    hpsov: 'Cuts off fuel from the HMU to the fuel nozzles and combustion chamber. Unlike the LP valve, it doesn’t isolate the aircraft supply — it’s the valve that actually starts or stops combustion.',
    vsv: 'Uses HMU-metered servo fuel pressure as hydraulic muscle to torque-motor the variable stator vanes, controlling compressor airflow across the engine’s operating range.',
    drainvv: 'Stays closed while the engine runs so metered fuel isn’t lost. Opens after shutdown to bleed fuel trapped in the manifold to the drain mast, preventing it from coking (baking into carbon deposits) in the hot lines.',
    draincollector: 'Gathers the fuel bled off by the drain valve before it’s routed overboard, keeping residual fuel from pooling in the engine bay.',
    drainmast: 'Vents the collected drain fuel safely overboard, away from hot engine surfaces.',
    fftransmitter: 'Sends an electrical signal to the cockpit fuel flow gauge. During start it confirms the HP shutoff valve has opened; in flight it helps the crew catch excessive fuel flow before EGT gets too high.',
    fuelmanifold: 'Distributes metered fuel around the engine case to each fuel nozzle, keeping flow balanced across all of them.',
    fuelnozzles: 'Injects and atomizes fuel into the combustion chamber. Simplex or duplex types keep fuel evenly distributed and centred, avoiding hot spots that could damage the combustion liner.',
  };

  function mount(container) {
    container.innerHTML =
      '<div class="fuel-diagram">' +
      '<p class="kicker">Official (Open)</p>' +
      '<h1>Generic Fuel System Block Diagram</h1>' +
      '<div class="subhead-row">' +
      '<h2 class="fd-process-title">Fuel system flow – Start process</h2>' +
      '<div class="toggle">' +
      '<button type="button" class="fd-btn-start active">Start process</button>' +
      '<button type="button" class="fd-btn-shutdown">Shutdown process</button>' +
      '</div>' +
      '</div>' +

      '<svg viewBox="0 0 1000 700" xmlns="http://www.w3.org/2000/svg">' +

      '<path id="p1" class="pipe" d="M145,248 L172,248"></path>' +
      '<path id="p2" class="pipe" d="M305,248 L322,248"></path>' +
      '<path id="p3" class="pipe" d="M442,248 L458,248"></path>' +
      '<path id="p4" class="pipe" d="M595,248 L612,248"></path>' +
      '<path id="p5" class="pipe" d="M724,275 L724,337"></path>' +
      '<path id="p6" class="pipe" d="M724,390 L724,412"></path>' +
      '<path id="p7" class="pipe thin" d="M836,363 L872,363"></path>' +
      '<path id="p8" class="pipe" d="M724,465 L724,502"></path>' +
      '<path id="p9" class="pipe" d="M724,555 L724,570"></path>' +
      '<path id="p10" class="pipe" d="M724,623 L724,638"></path>' +

      '<path id="d1" class="pipe drain" d="M612,438 L548,438"></path>' +
      '<path id="d2" class="pipe drain" d="M476,465 L476,502"></path>' +
      '<path id="d3" class="pipe drain" d="M476,555 L476,570"></path>' +

      '<g class="box" id="lpsov" data-comp="lpsov">' +
      '<circle cx="100" cy="248" r="45"></circle>' +
      '<text x="100" y="243" text-anchor="middle" class="title-t">LP SOV</text>' +
      '<text class="valve-state" x="100" y="260" text-anchor="middle">OPEN</text>' +
      '</g>' +

      '<g class="box" data-comp="lppump"><rect x="172" y="222" width="133" height="53" rx="6"></rect>' +
      '<text x="238" y="253" text-anchor="middle" class="title-t">LP pump</text></g>' +

      '<g class="box" data-comp="fohe"><rect x="322" y="222" width="120" height="53" rx="6"></rect>' +
      '<text x="382" y="253" text-anchor="middle" class="title-t">FOHE</text></g>' +

      '<g class="box" data-comp="lpfilter"><rect x="458" y="222" width="137" height="53" rx="6"></rect>' +
      '<text x="526" y="253" text-anchor="middle" class="title-t">LP filter</text></g>' +

      '<g class="box" data-comp="hppump"><rect x="612" y="222" width="224" height="53" rx="6"></rect>' +
      '<text x="724" y="253" text-anchor="middle" class="title-t">HP pump</text></g>' +

      '<rect class="dashed-container" x="598" y="305" width="258" height="178" rx="6"></rect>' +
      '<text class="hmu-label" x="608" y="322">HMU</text>' +

      '<g class="box" data-comp="meteringvalve"><rect x="612" y="337" width="224" height="53" rx="6"></rect>' +
      '<text x="724" y="359" text-anchor="middle" class="title-t">Metering valve</text>' +
      '<text x="724" y="375" text-anchor="middle" class="plain-t">meters fuel flow</text></g>' +

      '<g class="box" id="hpsov" data-comp="hpsov"><rect x="612" y="412" width="224" height="53" rx="6"></rect>' +
      '<text x="724" y="434" text-anchor="middle" class="title-t">HP SOV</text>' +
      '<text class="valve-state" x="724" y="452" text-anchor="middle">OPEN</text></g>' +

      '<g class="box" data-comp="vsv"><rect x="872" y="337" width="100" height="53" rx="6"></rect>' +
      '<text x="922" y="368" text-anchor="middle" class="title-t">VSV</text></g>' +

      '<g class="box" id="drainvv" data-comp="drainvv"><rect x="405" y="412" width="143" height="53" rx="6"></rect>' +
      '<text x="476" y="434" text-anchor="middle" class="title-t">Drain V/V</text>' +
      '<text class="valve-state" x="476" y="452" text-anchor="middle">CLOSED</text></g>' +

      '<g class="box" data-comp="draincollector"><rect x="405" y="502" width="143" height="53" rx="6"></rect>' +
      '<text x="476" y="533" text-anchor="middle" class="title-t">Drain collector</text></g>' +

      '<g class="box" data-comp="drainmast"><rect x="405" y="570" width="143" height="53" rx="6"></rect>' +
      '<text x="476" y="601" text-anchor="middle" class="title-t">Drain mast</text></g>' +

      '<g class="box" data-comp="fftransmitter"><rect x="612" y="502" width="224" height="53" rx="6"></rect>' +
      '<text x="724" y="533" text-anchor="middle" class="title-t">FF transmitter</text></g>' +

      '<g class="box" data-comp="fuelmanifold"><rect x="612" y="570" width="224" height="53" rx="6"></rect>' +
      '<text x="724" y="601" text-anchor="middle" class="title-t">Fuel manifold</text></g>' +

      '<g class="box" data-comp="fuelnozzles"><rect x="612" y="638" width="224" height="53" rx="6"></rect>' +
      '<text x="724" y="669" text-anchor="middle" class="title-t">Fuel nozzles</text></g>' +

      '</svg>' +

      '<div class="fd-explain"><span class="e-title">Hover a component</span><span class="e-desc">Hover any box in the diagram above to see what it does, here.</span></div>' +

      '<p class="caption fd-caption"></p>' +
      '<div class="fd-ref">' +
      '<h3 class="fd-ref-title">Component reference</h3>' +
      '<ul class="fd-list"></ul>' +
      '</div>' +
      '<div class="fd-game-panel">' +
      '<h3 class="fd-game-title">🎮 Label the Fuel System — Timed Challenge</h3>' +
      '<p class="fd-game-intro">Drag each label below onto the matching box in the diagram above before time runs out — faster correct placements score more points. The reference list and hover tooltips are hidden for these parts while a challenge is running.</p>' +
      '<div class="fd-game-hud">' +
      '<div class="fd-game-stat"><span class="fd-game-stat-label">Score</span><span class="fd-game-stat-value" id="fdGameScore">0</span></div>' +
      '<div class="fd-game-stat"><span class="fd-game-stat-label">Placed</span><span class="fd-game-stat-value" id="fdGamePlaced">0/0</span></div>' +
      '<div class="fd-game-stat"><span class="fd-game-stat-label">Time</span><span class="fd-game-stat-value" id="fdGameTime">--</span></div>' +
      '<div class="fd-game-stat"><span class="fd-game-stat-label">Best</span><span class="fd-game-stat-value" id="fdGameBest">--</span></div>' +
      '<button type="button" class="fd-game-btn" id="fdGameStartBtn">▶ Start challenge</button>' +
      '</div>' +
      '<p class="fd-game-result" id="fdGameResult"></p>' +
      '<div class="fd-game-bank" id="fdGameBank"></div>' +
      '</div>' +
      '</div>';

    var root = container.querySelector('.fuel-diagram');
    var btnStart = root.querySelector('.fd-btn-start');
    var btnShutdown = root.querySelector('.fd-btn-shutdown');
    var processTitle = root.querySelector('.fd-process-title');
    var captionText = root.querySelector('.fd-caption');
    var listEl = root.querySelector('.fd-list');
    var explain = root.querySelector('.fd-explain');
    var eTitle = explain.querySelector('.e-title');
    var eDesc = explain.querySelector('.e-desc');

    // Cursor-following tooltip, added alongside the existing fixed
    // `.fd-explain` panel by follow-up request ("I want mouse over
    // explanation display near my mouse cursor on all parts"). Reuses
    // the clientX/clientY-direct positioning every other tool's
    // tooltip uses, since `.fd-tooltip` is `position: fixed`.
    var tooltip = document.createElement('div');
    tooltip.className = 'fd-tooltip';
    tooltip.innerHTML = '<span class="t-title"></span><span class="t-desc"></span>';
    root.appendChild(tooltip);
    var tTitle = tooltip.querySelector('.t-title');
    var tDesc = tooltip.querySelector('.t-desc');
    function showTip(evt, key) {
      tTitle.textContent = titles[key];
      tDesc.textContent = descriptions[key];
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

    // While the "Label the Fuel System" challenge below is running, the
    // entries for its target components are masked out so the list can't
    // be used to peek at the answer — see the game section further down.
    var gameMaskedKeys = null; // null = no masking (game not running)
    function renderList() {
      listEl.innerHTML = Object.keys(titles).map(function (key) {
        var masked = gameMaskedKeys && gameMaskedKeys[key];
        var nameHtml = masked ? '🔒 ?????' : TM.escapeHtml(titles[key]);
        var descHtml = masked
          ? 'Hidden while the Label the Fuel System challenge is running — drag the correct tile onto the diagram instead.'
          : TM.escapeHtml(descriptions[key]);
        return '<li class="fd-list-item' + (masked ? ' is-masked' : '') + '" data-comp="' + key + '">' +
          '<span class="fd-list-name">' + nameHtml + '</span>' +
          '<span class="fd-list-desc">' + descHtml + '</span>' +
          '</li>';
      }).join('');
    }
    renderList();

    var lpsov = root.querySelector('#lpsov');
    var hpsov = root.querySelector('#hpsov');
    var drainvv = root.querySelector('#drainvv');
    var lpsovLabel = lpsov.querySelector('.valve-state');
    var hpsovLabel = hpsov.querySelector('.valve-state');
    var drainvvLabel = drainvv.querySelector('.valve-state');

    var mainPipeIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'];
    var drainPipeIds = ['d1', 'd2', 'd3'];

    function setActive(key, active) {
      root.querySelectorAll('[data-comp="' + key + '"]').forEach(function (el) {
        el.classList.toggle('is-hovered', active);
      });
    }
    function showExplain(key) {
      eTitle.textContent = titles[key];
      eDesc.textContent = descriptions[key];
      explain.classList.add('has-value');
    }
    function hideExplain() {
      eTitle.textContent = 'Hover a component';
      eDesc.textContent = 'Hover any box in the diagram above to see what it does, here.';
      explain.classList.remove('has-value');
    }

    root.querySelectorAll('.box').forEach(function (box) {
      var key = box.getAttribute('data-comp');
      box.addEventListener('mouseenter', function (e) {
        if (gameMaskedKeys && gameMaskedKeys[key]) return; // don't spoil the challenge
        setActive(key, true); showExplain(key); showTip(e, key);
      });
      box.addEventListener('mousemove', positionTip);
      box.addEventListener('mouseleave', function () {
        if (gameMaskedKeys && gameMaskedKeys[key]) return;
        setActive(key, false); hideExplain(); hideTip();
      });
    });

    // Delegated (rather than bound per-<li>) since renderList() rebuilds
    // the list's innerHTML whenever the challenge below starts/ends.
    listEl.addEventListener('mouseover', function (e) {
      var li = e.target.closest('.fd-list-item');
      if (!li || li.classList.contains('is-masked')) return;
      var key = li.getAttribute('data-comp');
      setActive(key, true); showExplain(key); showTip(e, key);
    });
    listEl.addEventListener('mousemove', positionTip);
    listEl.addEventListener('mouseout', function (e) {
      var li = e.target.closest('.fd-list-item');
      if (!li || li.classList.contains('is-masked')) return;
      var key = li.getAttribute('data-comp');
      setActive(key, false); hideExplain(); hideTip();
    });

    function setBoxColor(el, color) {
      var shape = el.querySelector('rect, circle');
      shape.setAttribute('stroke', color);
      shape.setAttribute('stroke-width', 2);
    }

    function setState(state) {
      var green = '#4ade80';
      var red = '#f87171';
      var gray = '#7e93a8';

      if (state === 'start') {
        btnStart.classList.add('active');
        btnShutdown.classList.remove('active');
        processTitle.textContent = 'Fuel system flow – Start process';

        setBoxColor(lpsov, green);
        lpsovLabel.textContent = 'OPEN';
        lpsovLabel.setAttribute('fill', green);
        setBoxColor(hpsov, green);
        hpsovLabel.textContent = 'OPEN';
        hpsovLabel.setAttribute('fill', green);
        setBoxColor(drainvv, red);
        drainvvLabel.textContent = 'CLOSED';
        drainvvLabel.setAttribute('fill', red);

        mainPipeIds.forEach(function (id) {
          var p = root.querySelector('#' + id);
          p.setAttribute('stroke', green);
          p.style.opacity = 1;
          p.classList.add('flowing');
        });
        drainPipeIds.forEach(function (id) {
          var p = root.querySelector('#' + id);
          p.setAttribute('stroke', gray);
          p.style.opacity = 0.3;
          p.classList.remove('flowing');
        });

        captionText.textContent = 'LP and HP shutoff valves open. Fuel flows from the tank through the LP pump, FOHE, LP filter and HP pump into the HMU, then through the metering valve, HP SOV, FF transmitter and manifold to the nozzles. The drain valve stays closed.';
      } else {
        btnStart.classList.remove('active');
        btnShutdown.classList.add('active');
        processTitle.textContent = 'Fuel system flow – Shutdown process';

        setBoxColor(lpsov, red);
        lpsovLabel.textContent = 'CLOSED';
        lpsovLabel.setAttribute('fill', red);
        setBoxColor(hpsov, red);
        hpsovLabel.textContent = 'CLOSED';
        hpsovLabel.setAttribute('fill', red);
        setBoxColor(drainvv, green);
        drainvvLabel.textContent = 'OPEN';
        drainvvLabel.setAttribute('fill', green);

        mainPipeIds.forEach(function (id) {
          var p = root.querySelector('#' + id);
          p.setAttribute('stroke', gray);
          p.style.opacity = 0.3;
          p.classList.remove('flowing');
        });
        drainPipeIds.forEach(function (id) {
          var p = root.querySelector('#' + id);
          p.setAttribute('stroke', red);
          p.style.opacity = 1;
          p.classList.add('flowing');
        });

        captionText.textContent = 'LP and HP shutoff valves close, cutting fuel supply to the nozzles. The drain valve opens so trapped fuel in the manifold bleeds off through the drain collector to the drain mast instead of coking in the lines.';
      }
    }

    btnStart.addEventListener('click', function () { setState('start'); });
    btnShutdown.addEventListener('click', function () { setState('shutdown'); });

    setState('start');

    // --- "Label the Fuel System" timed drag-and-drop challenge ---------
    // Every `.box` already carries a `data-comp` key, so it doubles as the
    // game's own target id — no extra tagging needed, unlike the Oil
    // System tool (where only a subset of boxes were targets). Reuses
    // that tool's same pointer-based drag pattern (pointerdown clones the
    // tile and follows the pointer; pointerup hit-tests via
    // document.elementFromPoint) rather than HTML5 drag-and-drop, since
    // that's unreliable on touch without a polyfill.
    var GAME_SECONDS_PER_ITEM = 12;
    var GAME_BEST_KEY = 'tm.fuelSystem.gameBest';
    var gameBankEl = root.querySelector('#fdGameBank');
    var gameScoreEl = root.querySelector('#fdGameScore');
    var gamePlacedEl = root.querySelector('#fdGamePlaced');
    var gameTimeEl = root.querySelector('#fdGameTime');
    var gameBestEl = root.querySelector('#fdGameBest');
    var gameResultEl = root.querySelector('#fdGameResult');
    var gameStartBtn = root.querySelector('#fdGameStartBtn');
    var gamePanelEl = root.querySelector('.fd-game-panel');

    var gameActive = false;
    var gameScore = 0, gamePlaced = 0, gameTotal = 0;
    var gameDuration = 0, gameDeadline = 0, gameTimerId = null;
    var dragState = null;
    var gameKeys = Object.keys(titles);

    function loadGameBest() {
      try { return Number(localStorage.getItem(GAME_BEST_KEY)) || 0; } catch (err) { return 0; }
    }
    function saveGameBest(val) {
      try { localStorage.setItem(GAME_BEST_KEY, String(val)); } catch (err) { /* ignore */ }
    }
    function updateGameBestDisplay() {
      var best = loadGameBest();
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

    function gameTargets() {
      return Array.prototype.slice.call(root.querySelectorAll('.box'));
    }

    function buildBankTile(key) {
      var tile = document.createElement('div');
      tile.className = 'fd-game-tile';
      tile.textContent = titles[key];
      tile.dataset.targetId = key;
      tile.addEventListener('pointerdown', onTilePointerDown);
      return tile;
    }

    function onTilePointerDown(e) {
      if (!gameActive || dragState) return;
      e.preventDefault();
      var tile = e.currentTarget;
      var rect = tile.getBoundingClientRect();
      var clone = tile.cloneNode(true);
      clone.className = 'fd-game-tile fd-game-tile-drag';
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
      var targetGroup = el && el.closest ? el.closest('.box') : null;
      dragState = null;
      if (gameActive && targetGroup && targetGroup.classList.contains('is-blanked') && targetGroup.getAttribute('data-comp') === tile.dataset.targetId) {
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
      gameActive = true;
      gameTotal = gameKeys.length;
      gameScore = 0;
      gamePlaced = 0;
      gameResultEl.textContent = '';
      gameStartBtn.disabled = true;
      // Pinned to the bottom of the viewport while running — the Start
      // button lives below the diagram and the full reference list, so
      // without this the student would have to keep scrolling all the
      // way back down to reach the word bank after scrolling up to the
      // diagram.
      gamePanelEl.classList.add('is-floating');

      gameMaskedKeys = {};
      gameKeys.forEach(function (k) { gameMaskedKeys[k] = true; });
      renderList();

      gameTargets().forEach(function (g) { g.classList.add('is-blanked'); });

      gameBankEl.innerHTML = '';
      shuffled(gameKeys).forEach(function (key) { gameBankEl.appendChild(buildBankTile(key)); });

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
      gameMaskedKeys = null;
      renderList();
      gameBankEl.innerHTML = '';
      gameStartBtn.disabled = false;
      gamePanelEl.classList.remove('is-floating');
      updateGameHud();

      var best = loadGameBest();
      var beat = gameScore > best;
      if (beat) { saveGameBest(gameScore); updateGameBestDisplay(); }

      if (reason === 'cleared') {
        playGameClear();
        gameResultEl.textContent = '🎉 All ' + gameTotal + ' labeled! Score: ' + gameScore + (beat ? ' — new best!' : '');
      } else {
        gameResultEl.textContent = '⏱ Time\'s up — placed ' + gamePlaced + '/' + gameTotal + '. Score: ' + gameScore + (beat ? ' — new best!' : '');
      }
    }

    gameStartBtn.addEventListener('click', startGame);
    updateGameBestDisplay();

    // test/debug hooks only — read-only except debugForceTimeout, which
    // only nudges the game's own deadline to let a test exercise the
    // timeout path without a real multi-minute wait; no other gameplay
    // effect.
    window.TM.toolModules['fuel-system-overview'].debugGameState = function () {
      return { gameActive: gameActive, gameScore: gameScore, gamePlaced: gamePlaced, gameTotal: gameTotal };
    };
    window.TM.toolModules['fuel-system-overview'].debugForceTimeout = function () {
      gameDeadline = performance.now() - 1;
    };

    window.TM.toolModules['fuel-system-overview'].unmount = function () {
      if (gameTimerId != null) { clearInterval(gameTimerId); gameTimerId = null; }
      document.removeEventListener('pointermove', onDragPointerMove);
      document.removeEventListener('pointerup', onDragPointerUp);
      if (dragState && dragState.clone) dragState.clone.remove();
      dragState = null;
    };
  }

  window.TM.registerTool('fuel-system-overview', { mount: mount });
})();
