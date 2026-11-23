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

  var HIGH_SCORE_KEY = 'tm.engineEmergency.highScore.v2';

  // Difficulty only tunes the time pressure now — lives are unlimited on
  // every tier (a miss is handled by the MCQ gate below instead).
  var DIFFICULTY_KEY = 'tm.engineEmergency.difficulty';
  var DIFFICULTY_SETTINGS = {
    easy: { minTimeFraction: 0.7, msPerRoundCleared: 100 },
    normal: { minTimeFraction: 0.55, msPerRoundCleared: 150 },
    hard: { minTimeFraction: 0.4, msPerRoundCleared: 220 },
  };
  var difficulty = 'normal';
  try {
    var savedDiff = localStorage.getItem(DIFFICULTY_KEY);
    if (DIFFICULTY_SETTINGS[savedDiff]) difficulty = savedDiff;
  } catch (err) { /* ignore */ }
  function diffCfg() { return DIFFICULTY_SETTINGS[difficulty]; }

  // Every miss (wrong switch or timeout) is gated behind one of these 10
  // aircraft-power-plant MCQs — unlimited retries on the same question
  // until the student gets it right, then play resumes. Editable in-browser
  // via the password-gated "✎ Edit questions" panel below (password APP,
  // same casual click-guard as every other tool's edit mode); edits persist
  // to localStorage for that browser and the Copy-changes panel gives
  // paste-ready source to make an edit the permanent default for everyone.
  var DEFAULT_MCQS = [
    { q: 'What does the fire extinguisher "Agent" bottle contain?', choices: ['A fire-suppressing chemical', 'Compressed air', 'Engine oil', 'Hydraulic fluid'], answer: 0 },
    { q: "What is the purpose of the oil system's scavenge pumps?", choices: ['Pull used oil back out of the bearing chambers', 'Pump fuel to the combustor', 'Cool the cabin', 'Start the engine'], answer: 0 },
    { q: 'What happens at "starter cut-out" during engine start?', choices: ['The starter automatically disengages once the engine is self-sustaining', 'The engine shuts down', 'The igniters turn on', 'The fuel valve opens'], answer: 0 },
    { q: 'Bleed air is tapped from where?', choices: ["The engine's compressor", 'The fuel tank', 'The exhaust nozzle', 'The oil reservoir'], answer: 0 },
    { q: 'What does a "hung start" mean?', choices: ['N2 stuck below idle with EGT climbing fast', 'Normal engine shutdown', 'Full thrust achieved', 'Successful start'], answer: 0 },
    { q: 'What triggers a fire warning light in the cockpit?', choices: ['A fire detection loop sensing high temperature', 'Low oil pressure', 'Low fuel', 'High altitude'], answer: 0 },
    { q: "What does the APU's accessory gearbox do?", choices: ['Transmits shaft power to driven accessories like pumps and generators', 'Burns fuel', 'Cools the cabin', 'Detects fire'], answer: 0 },
    { q: 'Why are there two fire-detection loops (A and B)?', choices: ['Redundancy — so one damaged loop still leaves a fault, not total loss of detection', 'To detect two different types of fire', 'One is for day use, one for night', 'To save weight'], answer: 0 },
    { q: 'What does "ENG MASTER OFF" do during an oil-pressure-low emergency?', choices: ['Shuts down the affected engine to prevent damage', 'Starts the engine', 'Increases oil pressure', 'Resets the fire loop'], answer: 0 },
    { q: "What's the purpose of a throttle lever?", choices: ['Commands engine thrust', 'Controls cabin temperature', 'Opens the fire bottle', 'Starts the igniters'], answer: 0 },
  ];
  var MCQ_KEY = 'tm.engineEmergency.mcqs';
  var MCQ_EDIT_PASSWORD = 'APP888';

  function loadMcqs() {
    try {
      var saved = JSON.parse(localStorage.getItem(MCQ_KEY) || 'null');
      if (Array.isArray(saved) && saved.length === DEFAULT_MCQS.length) return saved;
    } catch (err) { /* ignore */ }
    return DEFAULT_MCQS.map(function (q) { return { q: q.q, choices: q.choices.slice(), answer: q.answer }; });
  }
  function saveMcqs(list) {
    try { localStorage.setItem(MCQ_KEY, JSON.stringify(list)); } catch (err) { /* ignore */ }
  }
  function formatMcqs(list) {
    var lines = ['  var DEFAULT_MCQS = ['];
    list.forEach(function (q) {
      lines.push('    { q: ' + JSON.stringify(q.q) + ', choices: ' + JSON.stringify(q.choices) + ', answer: ' + q.answer + ' },');
    });
    lines.push('  ];');
    return lines.join('\n');
  }

  // Tiny self-contained Web Audio sound effects — no audio files, just
  // oscillator beeps, so the site stays build-step-free. The AudioContext
  // is only created lazily on the first sound (itself only ever triggered
  // from a click handler), which satisfies browsers' autoplay-gesture
  // requirement without any extra plumbing.
  var SOUND_KEY = 'tm.engineEmergency.sound';
  var soundOn = true;
  try { soundOn = localStorage.getItem(SOUND_KEY) !== 'off'; } catch (err) { soundOn = true; }
  var audioCtx = null;
  function ensureAudio() {
    if (!soundOn) return null;
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (err) { return null; }
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function beep(freq, dur, type, vol, delay) {
    var ctx = ensureAudio();
    if (!ctx) return;
    var t0 = ctx.currentTime + (delay || 0);
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol == null ? 0.18 : vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.03);
  }
  function playCorrectStep() { beep(660, 0.08, 'square', 0.15); }
  function playSuccess() { beep(523, 0.09, 'square', 0.18); beep(784, 0.11, 'square', 0.18, 0.09); beep(1046, 0.16, 'square', 0.18, 0.18); }
  function playFail() { beep(220, 0.22, 'sawtooth', 0.2); beep(160, 0.26, 'sawtooth', 0.18, 0.08); }
  function playMcqRight() { beep(523, 0.09, 'square', 0.18); beep(784, 0.14, 'square', 0.18, 0.09); }
  function playMcqWrong() { beep(180, 0.18, 'sawtooth', 0.18); }

  function mount(root) {
    root.innerHTML =
      '<div class="ee-wrap">' +
      '<h1>⚠ Engine Emergency</h1>' +
      '<p class="ee-intro">Random in-flight emergencies fire with a countdown. Click the right switches on the panel below — in the right order — before time runs out. Gets faster the longer you survive. Every miss means one quick knowledge check before you can carry on. Simplified for this game, not an actual aircraft procedure.</p>' +
      '<div class="ee-hud">' +
      '<div class="ee-stat"><span class="ee-stat-label">Score</span><span class="ee-stat-value" id="eeScore">0</span></div>' +
      '<div class="ee-stat"><span class="ee-stat-label">High score</span><span class="ee-stat-value" id="eeHigh">0</span></div>' +
      '<div class="ee-stat"><span class="ee-stat-label">Misses</span><span class="ee-stat-value" id="eeMisses">0</span></div>' +
      '<div class="ee-stat ee-stat-top"><span class="ee-stat-label">Top score</span><span class="ee-stat-value" id="eeTopScore">--</span></div>' +
      '<button type="button" class="ee-btn ee-btn-ghost" id="eeSaveScoreBtn">🏆 Save my score</button>' +
      '<button type="button" class="ee-btn ee-btn-ghost hidden" id="eeEndGameBtn">⏹ End game</button>' +
      '<button type="button" class="ee-mute-btn" id="eeMuteBtn" aria-label="Toggle sound">' + (soundOn ? '🔊' : '🔇') + '</button>' +
      '<button type="button" class="ee-mute-btn" id="eeSettingsBtn" aria-label="Game settings">⚙️</button>' +
      '<button type="button" class="ee-mute-btn" id="eeEditBtn" aria-label="Edit questions">✎</button>' +
      '</div>' +
      '<div class="ee-card ee-guide hidden" id="eeSettings">' +
      '<h2>⚙️ Game Settings</h2>' +
      '<p>Easy gives more time and a slower speed-up; Hard gives less time and a faster speed-up. Lives are unlimited on every setting — a miss just means answering one question before you continue. Takes effect on your next shift.</p>' +
      '<div class="ee-row">' +
      '<button type="button" class="ee-btn ee-btn-ghost ee-diff-btn" data-diff="easy">Easy</button>' +
      '<button type="button" class="ee-btn ee-btn-ghost ee-diff-btn" data-diff="normal">Normal</button>' +
      '<button type="button" class="ee-btn ee-btn-ghost ee-diff-btn" data-diff="hard">Hard</button>' +
      '</div>' +
      '<button type="button" class="ee-btn ee-btn-ghost" id="eeResetTopBtn">Reset top score…</button>' +
      '</div>' +
      '<div class="ee-card ee-start" id="eeStart">' +
      '<h2>Ready for your shift?</h2>' +
      '<p>Unlimited lives. One wrong switch or a timeout means a quick knowledge-check question before you carry on. Scenarios speed up as your score climbs.</p>' +
      '<button type="button" class="ee-btn ee-btn-primary" id="eeStartBtn">Start shift</button>' +
      '</div>' +
      '<div class="ee-card ee-game hidden" id="eeGame">' +
      '<div class="ee-banner" id="eeBanner"></div>' +
      '<div class="ee-timerbar-track"><div class="ee-timerbar-fill" id="eeTimerBar"></div></div>' +
      '<div class="ee-panel" id="eePanel"></div>' +
      '</div>' +
      '<div class="ee-mcq-overlay hidden" id="eeMcqOverlay">' +
      '<div class="ee-mcq-card">' +
      '<button type="button" class="ee-mcq-close hidden" id="eeMcqCloseBtn" aria-label="Close">✕</button>' +
      '<h2>📝 Quick Check</h2>' +
      '<p class="ee-mcq-note">Answer correctly to get back to the panel — try as many times as you need.</p>' +
      '<p class="ee-mcq-question" id="eeMcqQuestion"></p>' +
      '<div class="ee-mcq-choices" id="eeMcqChoices"></div>' +
      '<p class="ee-mcq-feedback" id="eeMcqFeedback"></p>' +
      '</div>' +
      '</div>' +
      '<div class="ee-card ee-guide hidden" id="eeMcqEdit">' +
      '<h2>✎ Edit questions</h2>' +
      '<p>Change any question, its 4 choices, or which one is correct. Saved to this browser only — paste the box below into engine-emergency.js to make it the default for everyone.</p>' +
      '<div id="eeMcqEditList"></div>' +
      '<div class="ee-row">' +
      '<button type="button" class="ee-btn ee-btn-primary" id="eeMcqSaveBtn">Save changes</button>' +
      '</div>' +
      '<p class="ee-mcq-note">Copy-paste source:</p>' +
      '<textarea class="ee-mcq-copy" id="eeMcqCopy" readonly rows="8"></textarea>' +
      '</div>' +
      '</div>';

    var scoreEl = root.querySelector('#eeScore');
    var highEl = root.querySelector('#eeHigh');
    var missesEl = root.querySelector('#eeMisses');
    var startCard = root.querySelector('#eeStart');
    var gameCard = root.querySelector('#eeGame');
    var endGameBtn = root.querySelector('#eeEndGameBtn');
    var bannerEl = root.querySelector('#eeBanner');
    var timerBar = root.querySelector('#eeTimerBar');
    var panelEl = root.querySelector('#eePanel');
    var mcqOverlay = root.querySelector('#eeMcqOverlay');
    var mcqQuestionEl = root.querySelector('#eeMcqQuestion');
    var mcqChoicesEl = root.querySelector('#eeMcqChoices');
    var mcqFeedbackEl = root.querySelector('#eeMcqFeedback');
    var mcqCloseBtn = root.querySelector('#eeMcqCloseBtn');
    var topScoreEl = root.querySelector('#eeTopScore');

    var highScore = 0;
    try { highScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0; } catch (err) { highScore = 0; }
    highEl.textContent = highScore;

    function updateTopScoreDisplay() { topScoreEl.textContent = TM.Leaderboard.bestLabel('engineEmergency'); }
    updateTopScoreDisplay();

    var mcqs = loadMcqs();

    var score = 0;
    var misses = 0;
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
      missesEl.textContent = misses;
      if (score > highScore) {
        highScore = score;
        try { localStorage.setItem(HIGH_SCORE_KEY, String(highScore)); } catch (err) { /* ignore */ }
        highEl.textContent = highScore;
      }
    }

    function pickScenario() {
      var pool = SCENARIOS.filter(function (s) { return s.id !== lastScenarioId; });
      var picked = pool[Math.floor(Math.random() * pool.length)];
      lastScenarioId = picked.id;
      return picked;
    }

    function effectiveTimeLimit(base) {
      var shaved = base - roundsCleared * diffCfg().msPerRoundCleared;
      return Math.max(base * diffCfg().minTimeFraction, shaved);
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
        else playCorrectStep();
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
      playSuccess();
      updateHud();
      nextTimer = setTimeout(startRound, 900);
    }

    function fail() {
      clearTimers();
      misses += 1;
      scenario = null;
      panelEl.classList.add('is-fail');
      bannerEl.textContent = '❌ Not handled in time — answer a quick question to continue.';
      playFail();
      updateHud();
      showMcqGate(function () {
        nextTimer = setTimeout(startRound, 400);
      });
    }

    // --- MCQ gate ---------------------------------------------------
    // Shown on every miss. Picks a random question from the (possibly
    // teacher-edited) bank, shuffles the displayed choice order so the
    // correct answer's on-screen position never gives it away, and lets
    // the student retry the SAME question as many times as needed —
    // there is no penalty and no limit, only a short pause gate.
    // On a correct answer the overlay no longer auto-hides after a timeout —
    // it stays up (choices disabled, a ✕ button revealed) until the student
    // explicitly dismisses it, so a correct answer is never missed by a
    // screen that vanished before they could read it.
    var pendingOnCorrect = null;

    function showMcqGate(onCorrect) {
      pendingOnCorrect = onCorrect;
      mcqCloseBtn.classList.add('hidden');
      var q = mcqs[Math.floor(Math.random() * mcqs.length)];
      var order = q.choices.map(function (text, i) { return { text: text, correct: i === q.answer }; });
      for (var i = order.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
      }
      mcqQuestionEl.textContent = q.q;
      mcqFeedbackEl.textContent = '';
      mcqFeedbackEl.className = 'ee-mcq-feedback';
      mcqChoicesEl.innerHTML = '';
      order.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ee-mcq-choice';
        btn.textContent = opt.text;
        btn.dataset.correct = opt.correct ? '1' : '0';
        btn.addEventListener('click', function () {
          if (opt.correct) {
            mcqFeedbackEl.textContent = '✅ Correct! Press ✕ to continue.';
            mcqFeedbackEl.className = 'ee-mcq-feedback is-correct';
            playMcqRight();
            mcqChoicesEl.querySelectorAll('.ee-mcq-choice').forEach(function (b) { b.disabled = true; });
            mcqCloseBtn.classList.remove('hidden');
          } else {
            mcqFeedbackEl.textContent = '❌ Not quite — try again.';
            mcqFeedbackEl.className = 'ee-mcq-feedback is-wrong';
            playMcqWrong();
          }
        });
        mcqChoicesEl.appendChild(btn);
      });
      mcqOverlay.classList.remove('hidden');
    }

    mcqCloseBtn.addEventListener('click', function () {
      mcqOverlay.classList.add('hidden');
      mcqCloseBtn.classList.add('hidden');
      var cb = pendingOnCorrect;
      pendingOnCorrect = null;
      if (cb) cb();
    });

    function startGame() {
      score = 0;
      misses = 0;
      roundsCleared = 0;
      lastScenarioId = null;
      updateHud();
      startCard.classList.add('hidden');
      gameCard.classList.remove('hidden');
      endGameBtn.classList.remove('hidden');
      startRound();
    }

    function endGame() {
      clearTimers();
      mcqOverlay.classList.add('hidden');
      mcqCloseBtn.classList.add('hidden');
      pendingOnCorrect = null;
      TM.Leaderboard.submitScore('engineEmergency', score, { higherIsBetter: true });
      updateTopScoreDisplay();
      gameCard.classList.add('hidden');
      endGameBtn.classList.add('hidden');
      startCard.classList.remove('hidden');
    }

    // --- MCQ editor ---------------------------------------------------
    var mcqEditUnlocked = false;
    function renderMcqEditList() {
      var listEl = root.querySelector('#eeMcqEditList');
      listEl.innerHTML = '';
      mcqs.forEach(function (q, qi) {
        var block = document.createElement('div');
        block.className = 'ee-mcq-edit-block';
        var qLabel = document.createElement('label');
        qLabel.textContent = 'Question ' + (qi + 1);
        var qInput = document.createElement('input');
        qInput.type = 'text';
        qInput.className = 'ee-mcq-edit-q';
        qInput.value = q.q;
        qInput.addEventListener('input', function () { q.q = qInput.value; });
        block.appendChild(qLabel);
        block.appendChild(qInput);
        q.choices.forEach(function (choiceText, ci) {
          var row = document.createElement('div');
          row.className = 'ee-mcq-edit-choice-row';
          var radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = 'eeMcqCorrect' + qi;
          radio.checked = q.answer === ci;
          radio.addEventListener('change', function () { if (radio.checked) q.answer = ci; });
          var cInput = document.createElement('input');
          cInput.type = 'text';
          cInput.value = choiceText;
          cInput.addEventListener('input', function () { q.choices[ci] = cInput.value; });
          row.appendChild(radio);
          row.appendChild(cInput);
          block.appendChild(row);
        });
        listEl.appendChild(block);
      });
    }
    function refreshMcqCopy() {
      root.querySelector('#eeMcqCopy').value = formatMcqs(mcqs);
    }

    root.querySelector('#eeStartBtn').addEventListener('click', startGame);
    root.querySelector('#eeMuteBtn').addEventListener('click', function (e) {
      soundOn = !soundOn;
      try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch (err) { /* ignore */ }
      e.target.textContent = soundOn ? '🔊' : '🔇';
      if (soundOn) ensureAudio();
    });
    var settingsUnlocked = false;
    root.querySelector('#eeSettingsBtn').addEventListener('click', function () {
      var panel = root.querySelector('#eeSettings');
      if (panel.classList.contains('hidden')) {
        if (!settingsUnlocked && !TM.Leaderboard.checkPassword('Enter the settings password to unlock game settings:')) return;
        settingsUnlocked = true;
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });
    root.querySelector('#eeSaveScoreBtn').addEventListener('click', function () {
      TM.Leaderboard.submitScore('engineEmergency', score, { higherIsBetter: true });
      updateTopScoreDisplay();
    });
    endGameBtn.addEventListener('click', endGame);
    root.querySelector('#eeResetTopBtn').addEventListener('click', function () {
      if (TM.Leaderboard.resetBest('engineEmergency')) updateTopScoreDisplay();
    });
    root.querySelector('#eeEditBtn').addEventListener('click', function () {
      var editCard = root.querySelector('#eeMcqEdit');
      if (editCard.classList.contains('hidden')) {
        if (!mcqEditUnlocked) {
          var entered = window.prompt('Enter the edit password:');
          if (entered !== MCQ_EDIT_PASSWORD) return;
          mcqEditUnlocked = true;
        }
        renderMcqEditList();
        refreshMcqCopy();
        editCard.classList.remove('hidden');
      } else {
        editCard.classList.add('hidden');
      }
    });
    root.querySelector('#eeMcqSaveBtn').addEventListener('click', function () {
      saveMcqs(mcqs);
      refreshMcqCopy();
    });
    root.querySelectorAll('.ee-diff-btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-diff') === difficulty);
      btn.addEventListener('click', function () {
        difficulty = btn.getAttribute('data-diff');
        try { localStorage.setItem(DIFFICULTY_KEY, difficulty); } catch (err) { /* ignore */ }
        root.querySelectorAll('.ee-diff-btn').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      });
    });

    updateHud();

    window.TM.toolModules['engine-emergency'].debugState = function () {
      return { score: score, misses: misses, mcqGateOpen: !mcqOverlay.classList.contains('hidden') };
    };
    window.TM.toolModules['engine-emergency'].debugForceFail = function () { fail(); };
    window.TM.toolModules['engine-emergency'].debugAnswerMcq = function (correct) {
      var btns = mcqChoicesEl.querySelectorAll('.ee-mcq-choice');
      for (var k = 0; k < btns.length; k++) {
        var isRight = btns[k].dataset.correct === '1';
        if (isRight === !!correct) { btns[k].click(); return true; }
      }
      return false;
    };

    window.TM.toolModules['engine-emergency'].unmount = function () {
      clearTimers();
    };
  }

  window.TM.registerTool('engine-emergency', { mount: mount });
})();
