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
      '<a class="game-mode-btn" href="#starting-system-game-mode">🎮 Game Mode</a>' +

      '<div class="ss-stepbar">' +
      '<button type="button" class="ss-nav ss-prev" aria-label="Previous step">← Prev</button>' +
      '<div class="ss-dots"></div>' +
      '<button type="button" class="ss-nav ss-next" aria-label="Next step">Next →</button>' +
      '<button type="button" class="ss-play">▶ Play</button>' +
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

    function renderCompList() {
      listEl.innerHTML = Object.keys(COMPONENTS).map(function (key) {
        var c = COMPONENTS[key];
        return '<li class="ss-list-item" data-comp="' + key + '">' +
          '<span class="ss-list-name">' + TM.escapeHtml(c[0]) + '</span>' +
          '<span class="ss-list-desc">' + TM.escapeHtml(c[1]) + '</span>' +
          '</li>';
      }).join('');
      root.querySelectorAll('.ss-list-item').forEach(function (li) {
        var key = li.getAttribute('data-comp');
        li.addEventListener('mouseenter', function (e) {
          setActive(key, true); showExplain(key); showTip(e, key);
        });
        li.addEventListener('mousemove', positionTip);
        li.addEventListener('mouseleave', function () {
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
        setActive(key, true); showExplain(key); showTip(e, key);
      });
      g.addEventListener('mousemove', positionTip);
      g.addEventListener('mouseleave', function () {
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

    window.TM.toolModules['starting-system'].unmount = function () {
      stopPlay();
    };
  }

  window.TM.registerTool('starting-system', { mount: mount });
})();
