(function () {
  // Content sourced from the supplied reference block diagram (EEC /
  // ignition / starter-air block diagram) and the "Start Sequence for a
  // Twin Spool Engine (Part 1)" slide — both from the user-supplied deck.
  var COMPONENTS = {
    eivmu: ['Electrical Supply', '115 VAC electrical power supplied to the Engine Electronic Controller, powering it up to run the start sequence.'],
    eec: ['Engine Electronic Controller (EEC)', 'The engine’s electronic controller — manages the ignition system and feeds live engine parameters to the cockpit ECAM page throughout the start.'],
    ignitionunit: ['Ignition Unit', 'A dual-channel ignition exciter that turns EEC-commanded power into the high-voltage pulses sent on to the igniter plug.'],
    igniterplug: ['Igniter Plug', 'Sparks inside the combustion chamber to ignite the fuel-air mixture once fuel is introduced, starting combustion.'],
    ecampage: ['Engine ECAM Page', 'Displays live engine parameters — N1/N2, EGT, oil pressure and more — so the flight crew can monitor the start sequence as it progresses.'],
    airsupply: ['Starter Air Supply', 'Pneumatic and electrical power for the start, sourced from the APU, a ground air cart, or bleed air cross-fed from another already-running engine.'],
    scv: ['Starter Control Valve', 'Solenoid-operated pneumatic valve that opens to admit air to the starter motor; also carries a manual override square drive for maintenance ground-cranking without electrical power.'],
    startermotor: ['Starter Motor', 'An air-driven motor that converts the pneumatic supply into rotary drive, cranking the engine until it can sustain itself.'],
    engine: ['Engine (HP Shaft & Accessory Gearbox)', 'The core being cranked: the starter motor turns the HP shaft and accessory gearbox, drawing air through the inlet and turning the LP shaft, until the engine lights up and stabilizes at idle.'],
  };

  var STEPS = [
    {
      text: '<b>APU</b> supply pneumatic and electrical supply to run the Starter motor',
      comps: ['eivmu', 'eec', 'airsupply'], arrows: ['a1'],
      starter: false, ignition: false, fuel: false, n2: '0%',
    },
    {
      text: '<b>Start valve</b> opens allowing pneumatic air to power the Start Motor',
      comps: ['eivmu', 'eec', 'airsupply', 'scv', 'startermotor'], arrows: ['a1', 'a6', 'a7'],
      starter: true, ignition: false, fuel: false, n2: '0% → rising',
    },
    {
      text: '<b>Start motor</b> crank the engine by turning the HP shaft &amp; accessories gear box',
      comps: ['eivmu', 'eec', 'airsupply', 'scv', 'startermotor', 'engine'], arrows: ['a1', 'a6', 'a7', 'a8'],
      starter: true, ignition: false, fuel: false, n2: 'Cranking',
    },
    {
      text: 'Air drawn through the inlet causing <b>LP shaft</b> to turn',
      comps: ['eivmu', 'eec', 'airsupply', 'scv', 'startermotor', 'engine'], arrows: ['a1', 'a6', 'a7', 'a8'],
      starter: true, ignition: false, fuel: false, n2: 'Cranking (LP turning)',
    },
    {
      text: '<b>Oil pressure</b> will start showing',
      comps: ['eivmu', 'eec', 'airsupply', 'scv', 'startermotor', 'engine', 'ecampage'], arrows: ['a1', 'a4', 'a6', 'a7', 'a8'],
      starter: true, ignition: false, fuel: false, n2: 'Cranking (oil pressure rising)',
    },
    {
      text: 'Around 15% N2 <b>ignition</b> will start',
      comps: ['eivmu', 'eec', 'ignitionunit', 'igniterplug', 'airsupply', 'scv', 'startermotor', 'engine', 'ecampage'],
      arrows: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8'],
      starter: true, ignition: true, fuel: false, n2: '~15% N2',
    },
    {
      text: '20% to 25% N2 RPM, <b>fuel</b> will be sprayed into the combustion chamber',
      comps: ['eivmu', 'eec', 'ignitionunit', 'igniterplug', 'airsupply', 'scv', 'startermotor', 'engine', 'ecampage'],
      arrows: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8'],
      starter: true, ignition: true, fuel: true, n2: '20–25% N2',
    },
    {
      text: '<b>RPM</b> and <b>EGT</b> will tend to rise',
      comps: ['eivmu', 'eec', 'ignitionunit', 'igniterplug', 'airsupply', 'scv', 'startermotor', 'engine', 'ecampage'],
      arrows: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8'],
      starter: true, ignition: true, fuel: true, n2: 'Rising (RPM &amp; EGT)',
    },
    {
      text: 'When RPM reaches 40 to 50%, <b>starter cut-out</b>. <b>Ignition stops</b>.',
      comps: ['eec', 'engine', 'ecampage'], arrows: ['a1', 'a4'],
      starter: false, ignition: false, fuel: true, n2: '40–50% N2 (cut-out)',
    },
    {
      text: 'Engine RPM will continue to rise towards 60%, and the engine will <b>stabilize at idle</b>',
      comps: ['eec', 'engine', 'ecampage'], arrows: ['a1', 'a4'],
      starter: false, ignition: false, fuel: true, n2: '~60% N2 (idle)',
    },
  ];

  function box(id, x, y, w, h, label, opts) {
    opts = opts || {};
    var cx = x + w / 2, cy = y + h / 2;
    var lines = label.split('\n');
    var lh = opts.small ? 15 : 17;
    var startY = cy - ((lines.length - 1) * lh) / 2 + (opts.small ? 4 : 5);
    var text = lines.map(function (ln, i) {
      return '<text class="ss-box-label' + (opts.small ? ' small' : '') + '" x="' + cx + '" y="' + (startY + i * lh) + '">' + ln + '</text>';
    }).join('');
    var sub = opts.sub ? '<text class="ss-box-sub" x="' + cx + '" y="' + (startY + lines.length * lh + 2) + '">' + opts.sub + '</text>' : '';
    return '<g class="ss-box" data-comp="' + id + '">' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="8"></rect>' +
      text + sub +
      '</g>';
  }

  function arrow(id, circuit, d) {
    return '<path class="ss-arrow ' + circuit + '" data-arrow="' + id + '" d="' + d + '" marker-end="url(#ss-arrow-' + circuit + ')"></path>';
  }

  function mount(container) {
    container.innerHTML =
      '<div class="ss-diagram">' +
      '<p class="kicker">Official (Open)</p>' +
      '<h1>Engine Starting System — Twin-Spool Start Sequence</h1>' +
      '<p class="ss-sub">Walk through a twin-spool engine start step by step. Each step lights up the systems and connections involved.</p>' +

      '<div class="ss-stepbar">' +
      '<button type="button" class="ss-nav ss-prev" aria-label="Previous step">← Prev</button>' +
      '<div class="ss-dots"></div>' +
      '<button type="button" class="ss-nav ss-next" aria-label="Next step">Next →</button>' +
      '<button type="button" class="ss-play">▶ Play</button>' +
      '</div>' +

      '<div class="ss-match-panel">' +
      '<h3 class="ss-game-title">🧠 Match the Definition — Timed Challenge</h3>' +
      '<p class="ss-game-intro">Click a part name on the left, then its matching description on the right (or the other way round) — a correct pair locks in green, a wrong one just flashes and resets. Each round picks a random mix of components.</p>' +
      '<div class="ss-game-hud">' +
      '<div class="ss-game-stat"><span class="ss-game-stat-label">Score</span><span class="ss-game-stat-value" id="ssMatchScore">0</span></div>' +
      '<div class="ss-game-stat"><span class="ss-game-stat-label">Matched</span><span class="ss-game-stat-value" id="ssMatchSolved">0/0</span></div>' +
      '<div class="ss-game-stat"><span class="ss-game-stat-label">Time</span><span class="ss-game-stat-value" id="ssMatchTime">--</span></div>' +
      '<div class="ss-game-stat"><span class="ss-game-stat-label">Best</span><span class="ss-game-stat-value" id="ssMatchBest">--</span></div>' +
      '<button type="button" class="ss-game-btn" id="ssMatchStartBtn">▶ Start challenge</button>' +
      '</div>' +
      '<p class="ss-game-result" id="ssMatchResult"></p>' +
      '<div class="ss-match-columns">' +
      '<div class="ss-match-col" id="ssMatchTerms"></div>' +
      '<div class="ss-match-col" id="ssMatchDefs"></div>' +
      '</div>' +
      '</div>' +

      '<svg class="ss-svg" viewBox="0 0 1180 620" xmlns="http://www.w3.org/2000/svg">' +
      '<defs>' +
      '<marker id="ss-arrow-elec" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path class="ss-arrowhead-elec" d="M0,0 L6,3 L0,6 Z"></path></marker>' +
      '<marker id="ss-arrow-pneu" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path class="ss-arrowhead-pneu" d="M0,0 L6,3 L0,6 Z"></path></marker>' +
      '<marker id="ss-arrow-mech" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path class="ss-arrowhead-mech" d="M0,0 L6,3 L0,6 Z"></path></marker>' +
      '<marker id="ss-arrow-spark" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path class="ss-arrowhead-spark" d="M0,0 L6,3 L0,6 Z"></path></marker>' +
      '</defs>' +

      arrow('a1', 'elec', 'M200,95 L260,95') +
      arrow('a2', 'elec', 'M450,95 L510,95') +
      arrow('a3', 'elec', 'M700,95 L760,95') +
      arrow('a4', 'elec', 'M355,140 L355,190') +
      arrow('a5', 'spark', 'M835,130 L835,210 L1000,210 L1000,230') +
      arrow('a6', 'pneu', 'M230,485 L320,485') +
      arrow('a7', 'pneu', 'M540,485 L630,485') +
      arrow('a8', 'mech', 'M800,485 L900,485 L900,400') +

      box('eivmu', 30, 60, 170, 70, 'ELECTRICAL\n115 VAC SUPPLY') +
      box('eec', 260, 50, 190, 90, 'EEC\n(Engine Electronic\nController)') +
      box('ignitionunit', 510, 50, 190, 90, 'IGNITION UNIT\n(Dual Channel)') +
      box('igniterplug', 760, 60, 150, 70, 'IGNITER PLUG') +
      box('ecampage', 260, 190, 190, 70, 'ENGINE ECAM PAGE', { small: true }) +
      box('airsupply', 30, 430, 200, 110, 'STARTER AIR SUPPLY', { sub: 'APU / Ground / Other Engine' }) +
      box('scv', 320, 430, 220, 110, 'STARTER CONTROL VALVE', { sub: 'Solenoid + Manual Override' }) +
      box('startermotor', 630, 450, 170, 70, 'STARTER MOTOR') +
      box('engine', 900, 230, 220, 170, 'ENGINE\nHP Shaft &\nAccessory Gearbox') +

      '</svg>' +

      '<div class="ss-explain"><span class="e-title">Hover a component</span><span class="e-desc">Hover any box in the diagram above to see what it does, here.</span></div>' +

      '<div class="ss-readout">' +
      '<div class="ss-step-text"><span class="ss-step-num"></span><span class="ss-step-desc"></span></div>' +
      '<div class="ss-badges">' +
      '<span class="ss-badge" data-badge="starter">Starter</span>' +
      '<span class="ss-badge" data-badge="ignition">Ignition</span>' +
      '<span class="ss-badge" data-badge="fuel">Fuel</span>' +
      '<span class="ss-badge ss-badge-n2">N2: <b class="ss-n2-val"></b></span>' +
      '</div>' +
      '</div>' +

      '<div class="ss-ref">' +
      '<h3 class="ss-ref-title">Component reference</h3>' +
      '<ul class="ss-list"></ul>' +
      '</div>' +

      '</div>';

    var root = container.querySelector('.ss-diagram');
    var dotsEl = root.querySelector('.ss-dots');
    var prevBtn = root.querySelector('.ss-prev');
    var nextBtn = root.querySelector('.ss-next');
    var playBtn = root.querySelector('.ss-play');
    var stepNumEl = root.querySelector('.ss-step-num');
    var stepDescEl = root.querySelector('.ss-step-desc');
    var n2ValEl = root.querySelector('.ss-n2-val');
    var listEl = root.querySelector('.ss-list');
    var explain = root.querySelector('.ss-explain');
    var eTitle = explain.querySelector('.e-title');
    var eDesc = explain.querySelector('.e-desc');

    // Cursor-following tooltip, added alongside the existing fixed
    // `.ss-explain` panel by follow-up request ("I want mouse over
    // explanation display near my mouse cursor on all parts"). Reuses
    // the clientX/clientY-direct positioning every other tool's
    // tooltip uses, since `.ss-tooltip` is `position: fixed`.
    var tooltip = document.createElement('div');
    tooltip.className = 'ss-tooltip';
    tooltip.innerHTML = '<span class="t-title"></span><span class="t-desc"></span>';
    root.appendChild(tooltip);
    var tTitle = tooltip.querySelector('.t-title');
    var tDesc = tooltip.querySelector('.t-desc');
    function showTip(evt, key) {
      var c = COMPONENTS[key];
      tTitle.textContent = c[0];
      tDesc.textContent = c[1];
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

    // Masked while the "Match the Definition" challenge below is running
    // (see matchMaskedIds further down) so the list can't be used to peek
    // at the answer; renderCompList() is re-invoked on round start/end to
    // toggle this.
    var matchMaskedIds = null;
    function renderCompList() {
      listEl.innerHTML = Object.keys(COMPONENTS).map(function (key) {
        var c = COMPONENTS[key];
        var masked = matchMaskedIds && matchMaskedIds[key];
        var nameHtml = masked ? '🔒 ?????' : TM.escapeHtml(c[0]);
        var descHtml = masked
          ? 'Hidden while the Match the Definition challenge is running — match it in the challenge above instead.'
          : TM.escapeHtml(c[1]);
        return '<li class="ss-list-item' + (masked ? ' is-masked' : '') + '" data-comp="' + key + '">' +
          '<span class="ss-list-name">' + nameHtml + '</span>' +
          '<span class="ss-list-desc">' + descHtml + '</span>' +
          '</li>';
      }).join('');
      root.querySelectorAll('.ss-list-item').forEach(function (li) {
        var key = li.getAttribute('data-comp');
        li.addEventListener('mouseenter', function (e) {
          if (li.classList.contains('is-masked')) return;
          setActive(key, true); showExplain(key); showTip(e, key);
        });
        li.addEventListener('mousemove', positionTip);
        li.addEventListener('mouseleave', function () {
          if (li.classList.contains('is-masked')) return;
          setActive(key, false); hideExplain(); hideTip();
        });
      });
    }
    renderCompList();

    dotsEl.innerHTML = STEPS.map(function (_, i) {
      return '<button type="button" class="ss-dot" data-step="' + i + '" aria-label="Go to step ' + (i + 1) + '"></button>';
    }).join('');

    function setActive(key, active) {
      root.querySelectorAll('[data-comp="' + key + '"]').forEach(function (el) {
        el.classList.toggle('is-hovered', active);
      });
    }
    function showExplain(key) {
      var c = COMPONENTS[key];
      eTitle.textContent = c[0];
      eDesc.textContent = c[1];
      explain.classList.add('has-value');
    }
    function hideExplain() {
      eTitle.textContent = 'Hover a component';
      eDesc.textContent = 'Hover any box in the diagram above to see what it does, here.';
      explain.classList.remove('has-value');
    }
    root.querySelectorAll('.ss-box').forEach(function (g) {
      var key = g.getAttribute('data-comp');
      g.addEventListener('mouseenter', function (e) {
        if (matchMaskedIds && matchMaskedIds[key]) return; // don't spoil the challenge
        setActive(key, true); showExplain(key); showTip(e, key);
      });
      g.addEventListener('mousemove', positionTip);
      g.addEventListener('mouseleave', function () {
        if (matchMaskedIds && matchMaskedIds[key]) return;
        setActive(key, false); hideExplain(); hideTip();
      });
    });

    var current = 0;
    var playing = false;
    var playTimer = null;

    function applyStep(index) {
      current = Math.max(0, Math.min(STEPS.length - 1, index));
      var step = STEPS[current];

      root.querySelectorAll('.ss-box').forEach(function (g) {
        g.classList.toggle('active', step.comps.indexOf(g.getAttribute('data-comp')) !== -1);
      });
      root.querySelectorAll('.ss-arrow').forEach(function (p) {
        p.classList.toggle('active', step.arrows.indexOf(p.getAttribute('data-arrow')) !== -1);
      });

      stepNumEl.textContent = 'Step ' + (current + 1) + ' of ' + STEPS.length + ' — ';
      stepDescEl.innerHTML = step.text;
      n2ValEl.textContent = step.n2;

      root.querySelector('[data-badge="starter"]').classList.toggle('on', step.starter);
      root.querySelector('[data-badge="ignition"]').classList.toggle('on', step.ignition);
      root.querySelector('[data-badge="fuel"]').classList.toggle('on', step.fuel);

      dotsEl.querySelectorAll('.ss-dot').forEach(function (dot, i) {
        dot.classList.toggle('active', i === current);
      });
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current === STEPS.length - 1;
    }

    function stopPlay() {
      playing = false;
      playBtn.textContent = '▶ Play';
      if (playTimer != null) { clearInterval(playTimer); playTimer = null; }
    }
    function startPlay() {
      playing = true;
      playBtn.textContent = '⏸ Pause';
      playTimer = setInterval(function () {
        if (current >= STEPS.length - 1) { stopPlay(); return; }
        applyStep(current + 1);
      }, 3200);
    }

    prevBtn.addEventListener('click', function () { stopPlay(); applyStep(current - 1); });
    nextBtn.addEventListener('click', function () { stopPlay(); applyStep(current + 1); });
    dotsEl.addEventListener('click', function (e) {
      var dot = e.target.closest('.ss-dot');
      if (!dot) return;
      stopPlay();
      applyStep(Number(dot.getAttribute('data-step')));
    });
    playBtn.addEventListener('click', function () {
      if (playing) stopPlay(); else startPlay();
    });

    applyStep(0);

    // --- "Match the Definition" timed challenge --------------------------
    // Independent of the Prev/Next/Play step-through above: click a part
    // name then its matching description (or the reverse order —
    // whichever comes second triggers the check). Same mechanic and
    // scoring as the Oil System / Fuel System tools' own copy of this
    // game. This tool's component set is fixed (doesn't vary with the
    // step-through), so there's no per-config best-score key.
    var MATCH_SECONDS_PER_ITEM = 14;
    var MATCH_BEST_KEY = 'tm.startingSystem.matchBest';
    var matchTermsEl = root.querySelector('#ssMatchTerms');
    var matchDefsEl = root.querySelector('#ssMatchDefs');
    var matchScoreEl = root.querySelector('#ssMatchScore');
    var matchSolvedEl = root.querySelector('#ssMatchSolved');
    var matchTimeEl = root.querySelector('#ssMatchTime');
    var matchBestEl = root.querySelector('#ssMatchBest');
    var matchResultEl = root.querySelector('#ssMatchResult');
    var matchStartBtn = root.querySelector('#ssMatchStartBtn');

    var matchActive = false;
    var matchScore = 0, matchSolved = 0, matchTotal = 0;
    var matchDuration = 0, matchDeadline = 0, matchTimerId = null;
    var selTermEl = null, selDefEl = null, selTermId = null, selDefId = null;
    var matchKeys = Object.keys(COMPONENTS);

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

    function buildMatchTile(key, kind) {
      var tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'ss-match-tile';
      tile.textContent = kind === 'term' ? COMPONENTS[key][0] : COMPONENTS[key][1];
      tile.dataset.id = key;
      tile.addEventListener('click', function () {
        if (!matchActive || tile.classList.contains('is-solved')) return;
        if (kind === 'term') {
          if (selTermEl) selTermEl.classList.remove('is-selected');
          selTermEl = tile; selTermId = key;
        } else {
          if (selDefEl) selDefEl.classList.remove('is-selected');
          selDefEl = tile; selDefId = key;
        }
        tile.classList.add('is-selected');
        tryMatch();
      });
      return tile;
    }

    function startMatch() {
      if (matchActive) return;
      // A random subset each time (never fewer than 3, or the whole set
      // if there are 3 or fewer) so repeat rounds don't always quiz the
      // exact same parts.
      var count = matchKeys.length <= 3 ? matchKeys.length : 3 + Math.floor(Math.random() * (matchKeys.length - 2));
      var roundKeys = shuffled(matchKeys).slice(0, count);

      matchActive = true;
      matchTotal = roundKeys.length;
      matchScore = 0;
      matchSolved = 0;
      clearMatchSelection();
      matchResultEl.textContent = '';
      matchStartBtn.disabled = true;

      matchMaskedIds = {};
      roundKeys.forEach(function (k) { matchMaskedIds[k] = true; });
      renderCompList();

      matchTermsEl.innerHTML = '';
      matchDefsEl.innerHTML = '';
      shuffled(roundKeys).forEach(function (k) { matchTermsEl.appendChild(buildMatchTile(k, 'term')); });
      shuffled(roundKeys).forEach(function (k) { matchDefsEl.appendChild(buildMatchTile(k, 'def')); });

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
      matchTermsEl.querySelectorAll('.ss-match-tile:not(.is-solved)').forEach(function (el) { el.classList.add('is-revealed'); });
      matchDefsEl.querySelectorAll('.ss-match-tile:not(.is-solved)').forEach(function (el) { el.classList.add('is-revealed'); });
      matchMaskedIds = null;
      renderCompList();
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

    window.TM.toolModules['starting-system'].debugMatchState = function () {
      return { matchActive: matchActive, matchScore: matchScore, matchSolved: matchSolved, matchTotal: matchTotal };
    };
    window.TM.toolModules['starting-system'].debugForceMatchTimeout = function () {
      matchDeadline = performance.now() - 1;
    };

    window.TM.toolModules['starting-system'].unmount = function () {
      stopPlay();
      if (matchTimerId != null) { clearInterval(matchTimerId); matchTimerId = null; }
    };
  }

  window.TM.registerTool('starting-system', { mount: mount });
})();
