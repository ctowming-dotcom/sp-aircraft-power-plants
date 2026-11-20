(function () {
  window.TM = window.TM || {};

  // Fixed panel of switches — same layout every round. Each scenario below
  // names which of these (in order) is the correct response; every other
  // button on screen is a distractor for that round. Simplified for this
  // game — not an actual aircraft procedure.
  var CONTROLS = [
    { id: 'eng1Fire', label: 'ENG 1 FIRE' },
    { id: 'eng1Agent1', label: 'ENG 1 AGENT 1' },
    { id: 'eng1Agent2', label: 'ENG 1 AGENT 2' },
    { id: 'eng2Fire', label: 'ENG 2 FIRE' },
    { id: 'eng2Agent1', label: 'ENG 2 AGENT 1' },
    { id: 'eng2Agent2', label: 'ENG 2 AGENT 2' },
    { id: 'apuFire', label: 'APU FIRE' },
    { id: 'apuAgent', label: 'APU AGENT' },
    { id: 'starterAbort', label: 'ABORT START' },
    { id: 'bleedValve', label: 'BLEED VALVE' },
    { id: 'hydIsolate', label: 'HYD ISOLATE' },
    { id: 'throttleIdle', label: 'THROTTLE IDLE' },
    { id: 'engMasterOff', label: 'ENG MASTER OFF' },
  ];

  var SCENARIOS = [
    {
      id: 'eng1Fire',
      symptom: '🔥 ENG 1 FIRE WARNING — flames reported from the No.1 engine nacelle!',
      sequence: ['eng1Fire', 'eng1Agent1'],
      timeLimit: 7000,
      points: 100,
    },
    {
      id: 'eng2Fire',
      symptom: '🔥 ENG 2 FIRE WARNING — flames reported from the No.2 engine nacelle!',
      sequence: ['eng2Fire', 'eng2Agent1'],
      timeLimit: 7000,
      points: 100,
    },
    {
      id: 'apuFire',
      symptom: '🔥 APU FIRE WARNING — fire detected in the APU compartment!',
      sequence: ['apuFire', 'apuAgent'],
      timeLimit: 6000,
      points: 90,
    },
    {
      id: 'hungStart',
      symptom: '🌡️ HUNG START — EGT climbing fast, N2 stuck below idle during start!',
      sequence: ['starterAbort'],
      timeLimit: 4500,
      points: 70,
    },
    {
      id: 'oilLow',
      symptom: '🛢️ OIL PRESSURE LOW — pressure dropping fast, below the safe limit!',
      sequence: ['engMasterOff'],
      timeLimit: 7500,
      points: 80,
    },
    {
      id: 'bleedLeak',
      symptom: '💨 BLEED DUCT LEAK — duct overheat detected, possible bleed air leak!',
      sequence: ['bleedValve'],
      timeLimit: 6500,
      points: 80,
    },
    {
      id: 'hydLow',
      symptom: '🧯 HYDRAULIC PRESSURE LOW — system pressure falling below limits!',
      sequence: ['hydIsolate'],
      timeLimit: 7500,
      points: 80,
    },
    {
      id: 'egtOver',
      symptom: '🌡️ EGT OVER LIMIT — exhaust gas temperature exceeding redline!',
      sequence: ['throttleIdle'],
      timeLimit: 6500,
      points: 70,
    },
  ];

  var HIGH_SCORE_KEY = 'tm.engineEmergency.highScore';
  var START_LIVES = 3;
  var MIN_TIME_FRACTION = 0.55; // never speeds scenarios up past 55% of their base time
  var MS_PER_ROUND_CLEARED = 150; // each cleared round shaves this much off every timer

  function mount(root) {
    root.innerHTML =
      '<div class="ee-wrap">' +
      '<h1>⚠ Engine Emergency</h1>' +
      '<p class="ee-intro">Random in-flight emergencies fire with a countdown. Click the right switches on the panel below — in the right order — before time runs out. Gets faster the longer you survive. Simplified for this game, not an actual aircraft procedure.</p>' +
      '<div class="ee-hud">' +
      '<div class="ee-stat"><span class="ee-stat-label">Score</span><span class="ee-stat-value" id="eeScore">0</span></div>' +
      '<div class="ee-stat"><span class="ee-stat-label">High score</span><span class="ee-stat-value" id="eeHigh">0</span></div>' +
      '<div class="ee-stat"><span class="ee-stat-label">Lives</span><span class="ee-stat-value" id="eeLives">❤❤❤</span></div>' +
      '</div>' +
      '<div class="ee-card ee-start" id="eeStart">' +
      '<h2>Ready for your shift?</h2>' +
      '<p>3 lives. One wrong switch or a timeout costs a life. Scenarios speed up as your score climbs.</p>' +
      '<button type="button" class="ee-btn ee-btn-primary" id="eeStartBtn">Start shift</button>' +
      '</div>' +
      '<div class="ee-card ee-game hidden" id="eeGame">' +
      '<div class="ee-banner" id="eeBanner"></div>' +
      '<div class="ee-timerbar-track"><div class="ee-timerbar-fill" id="eeTimerBar"></div></div>' +
      '<div class="ee-panel" id="eePanel"></div>' +
      '</div>' +
      '<div class="ee-card ee-over hidden" id="eeOver">' +
      '<h2>Shift over</h2>' +
      '<p id="eeOverMsg"></p>' +
      '<button type="button" class="ee-btn ee-btn-primary" id="eeRestartBtn">Play again</button>' +
      '</div>' +
      '</div>';

    var scoreEl = root.querySelector('#eeScore');
    var highEl = root.querySelector('#eeHigh');
    var livesEl = root.querySelector('#eeLives');
    var startCard = root.querySelector('#eeStart');
    var gameCard = root.querySelector('#eeGame');
    var overCard = root.querySelector('#eeOver');
    var overMsg = root.querySelector('#eeOverMsg');
    var bannerEl = root.querySelector('#eeBanner');
    var timerBar = root.querySelector('#eeTimerBar');
    var panelEl = root.querySelector('#eePanel');

    var highScore = 0;
    try { highScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0; } catch (err) { highScore = 0; }
    highEl.textContent = highScore;

    var score = 0;
    var lives = START_LIVES;
    var roundsCleared = 0;
    var lastScenarioId = null;
    var scenario = null;
    var stepIndex = 0;
    var deadline = 0;
    var tickTimer = null;
    var nextTimer = null;

    var buttonEls = {};
    CONTROLS.forEach(function (c) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ee-switch';
      btn.textContent = c.label;
      btn.addEventListener('click', function () { handleClick(c.id, btn); });
      panelEl.appendChild(btn);
      buttonEls[c.id] = btn;
    });

    function clearTimers() {
      if (tickTimer != null) { clearInterval(tickTimer); tickTimer = null; }
      if (nextTimer != null) { clearTimeout(nextTimer); nextTimer = null; }
    }

    function updateHud() {
      scoreEl.textContent = score;
      livesEl.textContent = new Array(Math.max(lives, 0) + 1).join('❤');
    }

    function pickScenario() {
      var pool = SCENARIOS.filter(function (s) { return s.id !== lastScenarioId; });
      var picked = pool[Math.floor(Math.random() * pool.length)];
      lastScenarioId = picked.id;
      return picked;
    }

    function effectiveTimeLimit(base) {
      var shaved = base - roundsCleared * MS_PER_ROUND_CLEARED;
      return Math.max(base * MIN_TIME_FRACTION, shaved);
    }

    function startRound() {
      scenario = pickScenario();
      stepIndex = 0;
      deadline = Date.now() + effectiveTimeLimit(scenario.timeLimit);
      bannerEl.textContent = scenario.symptom;
      bannerEl.className = 'ee-banner is-active';
      panelEl.classList.remove('is-fail', 'is-success');
      Object.keys(buttonEls).forEach(function (id) { buttonEls[id].classList.remove('is-correct-step'); });
      timerBar.style.background = '';
      tick();
      if (tickTimer != null) clearInterval(tickTimer);
      tickTimer = setInterval(tick, 100);
    }

    function tick() {
      var remaining = deadline - Date.now();
      var limit = effectiveTimeLimit(scenario.timeLimit);
      var frac = Math.max(0, remaining / limit);
      timerBar.style.width = (frac * 100) + '%';
      timerBar.style.background = frac > 0.5 ? 'var(--success)' : (frac > 0.2 ? '#fbbf24' : 'var(--error)');
      if (remaining <= 0) fail();
    }

    function handleClick(id, btn) {
      if (!scenario) return;
      var expected = scenario.sequence[stepIndex];
      if (id === expected) {
        btn.classList.add('is-correct-step');
        stepIndex += 1;
        if (stepIndex >= scenario.sequence.length) succeed();
      } else {
        fail();
      }
    }

    function succeed() {
      clearTimers();
      var remaining = Math.max(0, deadline - Date.now());
      var limit = effectiveTimeLimit(scenario.timeLimit);
      var timeFrac = limit > 0 ? remaining / limit : 0;
      var gained = Math.round(scenario.points * (0.5 + 0.5 * timeFrac));
      score += gained;
      roundsCleared += 1;
      bannerEl.textContent = '✅ Handled — +' + gained + ' points';
      panelEl.classList.add('is-success');
      updateHud();
      nextTimer = setTimeout(startRound, 900);
    }

    function fail() {
      clearTimers();
      lives -= 1;
      panelEl.classList.add('is-fail');
      bannerEl.textContent = '❌ ' + (scenario ? scenario.symptom.replace(/^\S+\s/, '') : '') + ' — not handled in time!';
      updateHud();
      if (lives <= 0) {
        gameOver();
      } else {
        nextTimer = setTimeout(startRound, 1100);
      }
    }

    function gameOver() {
      clearTimers();
      scenario = null;
      gameCard.classList.add('hidden');
      overCard.classList.remove('hidden');
      var beat = score > highScore;
      if (beat) {
        highScore = score;
        try { localStorage.setItem(HIGH_SCORE_KEY, String(highScore)); } catch (err) { /* ignore */ }
        highEl.textContent = highScore;
      }
      overMsg.textContent = 'Final score: ' + score + (beat ? ' — new high score!' : ' · High score: ' + highScore);
    }

    function startGame() {
      score = 0;
      lives = START_LIVES;
      roundsCleared = 0;
      lastScenarioId = null;
      updateHud();
      startCard.classList.add('hidden');
      overCard.classList.add('hidden');
      gameCard.classList.remove('hidden');
      startRound();
    }

    root.querySelector('#eeStartBtn').addEventListener('click', startGame);
    root.querySelector('#eeRestartBtn').addEventListener('click', startGame);

    updateHud();

    window.TM.toolModules['engine-emergency'].unmount = function () {
      clearTimers();
    };
  }

  window.TM.registerTool('engine-emergency', { mount: mount });
})();
