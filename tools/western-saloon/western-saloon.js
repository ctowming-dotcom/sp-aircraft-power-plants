(function () {
  window.TM = window.TM || {};

  var W = 720;
  var H = 440;

  // Fixed pop-up spots around the saloon — a back-shelf row (bottles/
  // outlaws peeking over the shelf) and a bar-counter row (closer, bigger
  // targets). Each slot just needs an anchor point; everything else about
  // a target (type, lifespan) is generated when it spawns there.
  var SLOTS = [
    { x: 90, y: 110, row: 'shelf' },
    { x: 210, y: 100, row: 'shelf' },
    { x: 330, y: 112, row: 'shelf' },
    { x: 450, y: 100, row: 'shelf' },
    { x: 570, y: 110, row: 'shelf' },
    { x: 650, y: 100, row: 'shelf' },
    { x: 150, y: 260, row: 'bar' },
    { x: 320, y: 270, row: 'bar' },
    { x: 480, y: 260, row: 'bar' },
    { x: 620, y: 270, row: 'bar' },
  ];

  var AMMO_MAX = 6;
  var RELOAD_MS = 900;
  var HIGH_SCORE_KEY = 'tm.westernSaloon.highScore.v2';
  var POP_IN_MS = 140;

  // Difficulty: slower/longer-lived targets and fewer bystanders mixed in
  // on Easy; the opposite on Hard. Lives are unlimited on every tier — a
  // bystander hit means one MCQ gate, not a limit.
  var DIFFICULTY_KEY = 'tm.westernSaloon.difficulty';
  var DIFFICULTY_SETTINGS = {
    easy: { baseSpawnMs: 1150, minSpawnMs: 550, baseLifespanMs: 1900, minLifespanMs: 950, maxCivilianChance: 0.32 },
    normal: { baseSpawnMs: 900, minSpawnMs: 420, baseLifespanMs: 1500, minLifespanMs: 700, maxCivilianChance: 0.48 },
    hard: { baseSpawnMs: 650, minSpawnMs: 300, baseLifespanMs: 1100, minLifespanMs: 500, maxCivilianChance: 0.6 },
  };
  var difficulty = 'normal';
  try {
    var savedDiff = localStorage.getItem(DIFFICULTY_KEY);
    if (DIFFICULTY_SETTINGS[savedDiff]) difficulty = savedDiff;
  } catch (err) { /* ignore */ }
  function diffCfg() { return DIFFICULTY_SETTINGS[difficulty]; }

  // Tiny self-contained Web Audio sound effects — same pattern as this
  // portal's other arcade games: no audio files, lazily created on first
  // sound (always from a user gesture), with a persisted mute toggle.
  var SOUND_KEY = 'tm.westernSaloon.sound';
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
    gain.gain.linearRampToValueAtTime(vol == null ? 0.16 : vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.03);
  }
  function noiseBurst(dur, vol, cutoff) {
    var ctx = ensureAudio();
    if (!ctx) return;
    var bufferSize = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff || 2200, ctx.currentTime);
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(vol == null ? 0.3 : vol, ctx.currentTime);
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    src.start();
  }
  function playShot() { noiseBurst(0.1, 0.28, 3200); }
  function playDryFire() { beep(140, 0.05, 'square', 0.1); }
  function playReload() { beep(220, 0.05, 'square', 0.1); beep(320, 0.05, 'square', 0.12, 0.12); }
  function playHitOutlaw() { beep(660, 0.07, 'square', 0.18); beep(880, 0.09, 'square', 0.18, 0.06); }
  function playHitCivilian() { beep(260, 0.16, 'sawtooth', 0.2); beep(160, 0.22, 'sawtooth', 0.18, 0.1); }
  function playMcqRight() { beep(523, 0.09, 'square', 0.18); beep(784, 0.14, 'square', 0.18, 0.09); }
  function playMcqWrong() { beep(180, 0.18, 'sawtooth', 0.18); }

  function rand(min, max) { return min + Math.random() * (max - min); }

  // Every bystander hit is gated behind one of these 10 aircraft-power-
  // plant MCQs — unlimited retries on the same question until the student
  // gets it right, then play resumes. Editable in-browser via the
  // password-gated "✎" edit panel (password APP, same casual click-guard
  // as every other tool's edit mode).
  var DEFAULT_MCQS = [
    { q: 'What is bleed air used for?', choices: ['Cabin pressurization, anti-ice and pneumatic systems', 'Only cockpit lighting', 'Fuel storage', 'Fire detection'], answer: 0 },
    { q: 'What does a labyrinth seal do?', choices: ['Keeps oil from migrating along a rotating shaft', 'Starts the engine', 'Detects fire', 'Stores fuel'], answer: 0 },
    { q: 'What is anti-icing bleed air used for?', choices: ['Preventing ice buildup on surfaces like the nacelle/wing', 'Cooling the cabin', 'Starting the APU', 'Detecting fire'], answer: 0 },
    { q: 'What does customer bleed typically supply?', choices: ['Cabin air conditioning and pressurization', 'Fuel to the combustor', 'Oil to the bearings', 'Power to the radio'], answer: 0 },
    { q: "What's a thrust bearing's job?", choices: ['Handles axial load from the rotating shaft', 'Detects fire', 'Stores fuel', 'Starts ignition'], answer: 0 },
    { q: 'What internal air system function cools the turbine blades?', choices: ['Turbine blade cooling air tapped from the compressor', 'Fuel spray', 'Oil circulation', 'Cabin air'], answer: 0 },
    { q: 'What is nacelle ventilation for?', choices: ['Cooling the engine compartment', 'Starting the engine', 'Detecting fire', 'Filtering fuel'], answer: 0 },
    { q: 'What does the generator cooling air system do?', choices: ['Cools the electrical generator using bleed air', 'Starts the APU', 'Detects fire', 'Filters oil'], answer: 0 },
    { q: "What's the purpose of turbine case cooling (ACC)?", choices: ['Controls turbine case clearance for efficiency', 'Starts the engine', 'Stores fuel', 'Detects fire'], answer: 0 },
    { q: 'What does igniter cooling air prevent?', choices: ['Overheating of the igniter plug', 'Fuel leaks', 'Oil contamination', 'Cabin depressurization'], answer: 0 },
  ];
  var MCQ_KEY = 'tm.westernSaloon.mcqs';
  var MCQ_EDIT_PASSWORD = 'APP';

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

  function mount(root) {
    root.innerHTML =
      '<div class="ws-wrap">' +
      '<h1>🤠 Shooting</h1>' +
      '<p class="ws-intro">Outlaws keep popping up around the bar — shoot them fast for points before the clock runs out. Don\'t hit the bartender or the regulars! Six shots per cylinder, press R (or the Reload button) to reload. Aim with the mouse/touch, click to fire.</p>' +
      '<div class="ws-hud">' +
      '<div class="ws-stat"><span class="ws-stat-label">Score</span><span class="ws-stat-value" id="wsScore">0</span></div>' +
      '<div class="ws-stat"><span class="ws-stat-label">Time</span><span class="ws-stat-value" id="wsTime">30</span></div>' +
      '<div class="ws-stat"><span class="ws-stat-label">High score</span><span class="ws-stat-value" id="wsHigh">0</span></div>' +
      '<div class="ws-stat"><span class="ws-stat-label">Top score</span><span class="ws-stat-value" id="wsTop">--</span></div>' +
      '<div class="ws-stat"><span class="ws-stat-label">Misses</span><span class="ws-stat-value" id="wsLives">0</span></div>' +
      '<button type="button" class="ws-mute-btn" id="wsMuteBtn" aria-label="Toggle sound">' + (soundOn ? '🔊' : '🔇') + '</button>' +
      '<button type="button" class="ws-mute-btn" id="wsGuideBtn" aria-label="Exam guide">📘</button>' +
      '<button type="button" class="ws-mute-btn" id="wsSettingsBtn" aria-label="Game settings">⚙️</button>' +
      '<button type="button" class="ws-mute-btn" id="wsEditBtn" aria-label="Edit questions">✎</button>' +
      '</div>' +
      '<div class="ws-guide hidden" id="wsGuide">' +
      '<h2>📘 Exam Guide</h2>' +
      '<p>This section is empty for now — exam tips for this game will be added here by January 2027. Check back then!</p>' +
      '</div>' +
      '<div class="ws-guide hidden" id="wsSettings">' +
      '<h2>⚙️ Game Settings</h2>' +
      '<p>Easy gives slower/longer-lived targets and fewer bystanders; Hard gives the opposite. Lives are unlimited on every setting — hitting a bystander just means answering one question before you continue. Takes effect on your next shift.</p>' +
      '<div class="ws-diff-row">' +
      '<button type="button" class="ws-tab ws-diff-btn" data-diff="easy">Easy</button>' +
      '<button type="button" class="ws-tab ws-diff-btn" data-diff="normal">Normal</button>' +
      '<button type="button" class="ws-tab ws-diff-btn" data-diff="hard">Hard</button>' +
      '</div>' +
      '<button type="button" class="ws-btn ws-btn-reload" id="wsResetTopBtn">Reset top score…</button>' +
      '</div>' +
      '<div class="ws-stage">' +
      '<canvas id="wsCanvas" width="' + W + '" height="' + H + '"></canvas>' +
      '<div class="ws-overlay hidden" id="wsOverlay">' +
      '<div class="ws-overlay-card">' +
      '<h2 id="wsOverlayTitle"></h2>' +
      '<p id="wsOverlayMsg"></p>' +
      '<button type="button" class="ws-btn ws-btn-primary" id="wsOverlayBtn"></button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="ws-controls">' +
      '<div class="ws-ammo" id="wsAmmo"></div>' +
      '<button type="button" class="ws-btn ws-btn-reload" id="wsReloadBtn">🔄 Reload</button>' +
      '</div>' +
      '<div class="ws-mcq-overlay hidden" id="wsMcqOverlay">' +
      '<div class="ws-mcq-card">' +
      '<button type="button" class="ws-mcq-close hidden" id="wsMcqCloseBtn" aria-label="Close">✕</button>' +
      '<h2>📝 Quick Check</h2>' +
      '<p class="ws-mcq-note">Answer correctly to get back in — try as many times as you need.</p>' +
      '<p class="ws-mcq-question" id="wsMcqQuestion"></p>' +
      '<div class="ws-mcq-choices" id="wsMcqChoices"></div>' +
      '<p class="ws-mcq-feedback" id="wsMcqFeedback"></p>' +
      '</div>' +
      '</div>' +
      '<div class="ws-guide hidden" id="wsMcqEdit">' +
      '<h2>✎ Edit questions</h2>' +
      '<p>Change any question, its 4 choices, or which one is correct. Saved to this browser only — paste the box below into western-saloon.js to make it the default for everyone.</p>' +
      '<div id="wsMcqEditList"></div>' +
      '<div class="ws-diff-row">' +
      '<button type="button" class="ws-btn ws-btn-primary" id="wsMcqSaveBtn">Save changes</button>' +
      '</div>' +
      '<p class="ws-mcq-note">Copy-paste source:</p>' +
      '<textarea class="ws-mcq-copy" id="wsMcqCopy" readonly rows="8"></textarea>' +
      '</div>' +
      '</div>';

    var canvas = root.querySelector('#wsCanvas');
    var ctx = canvas.getContext('2d');
    var scoreEl = root.querySelector('#wsScore');
    var timeEl = root.querySelector('#wsTime');
    var highEl = root.querySelector('#wsHigh');
    var topEl = root.querySelector('#wsTop');
    var livesEl = root.querySelector('#wsLives');
    var ammoEl = root.querySelector('#wsAmmo');
    var overlay = root.querySelector('#wsOverlay');
    var overlayTitle = root.querySelector('#wsOverlayTitle');
    var overlayMsg = root.querySelector('#wsOverlayMsg');
    var overlayBtn = root.querySelector('#wsOverlayBtn');
    var mcqOverlay = root.querySelector('#wsMcqOverlay');
    var mcqQuestionEl = root.querySelector('#wsMcqQuestion');
    var mcqChoicesEl = root.querySelector('#wsMcqChoices');
    var mcqFeedbackEl = root.querySelector('#wsMcqFeedback');
    var mcqCloseBtn = root.querySelector('#wsMcqCloseBtn');
    var mcqs = loadMcqs();
    var mcqEditUnlocked = false;
    var settingsUnlocked = false;
    var pendingMcqOnCorrect = null;
    var LEADERBOARD_ID = 'westernSaloon';
    var ROUND_SECONDS = 30;
    // Every life lost (civilian hit → MCQ gate) costs points off the final
    // submitted leaderboard score — the round's own fixed time budget
    // already makes this a timed game, so there's no separate "finished
    // faster" bonus to add on top, just the revive penalty.
    var MISS_PENALTY = 30;

    var highScore = 0;
    try { highScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0; } catch (err) { highScore = 0; }
    highEl.textContent = highScore;

    function updateTopDisplay() { topEl.textContent = TM.Leaderboard.bestLabel(LEADERBOARD_ID); }
    updateTopDisplay();

    var score, misses, ammo, reloading, reloadUntil, hitsCleared, targets, nextSpawnAt, running, rafId, lastTime;
    var timeLeft = ROUND_SECONDS, roundTimerId = null;
    var crosshair = { x: W / 2, y: H / 2 };
    var flashUntil = 0;
    var screenFlash = 0; // 0 = none, >0 = red tint strength, decays

    function updateHud() {
      scoreEl.textContent = score;
      livesEl.textContent = misses;
      if (score > highScore) {
        highScore = score;
        try { localStorage.setItem(HIGH_SCORE_KEY, String(highScore)); } catch (err) { /* ignore */ }
        highEl.textContent = highScore;
      }
      ammoEl.innerHTML = '';
      for (var i = 0; i < AMMO_MAX; i++) {
        var dot = document.createElement('span');
        dot.className = 'ws-bullet' + (i < ammo ? ' is-loaded' : '');
        ammoEl.appendChild(dot);
      }
    }

    function updateTimeDisplay() { timeEl.textContent = timeLeft; }

    function stopRoundTimer() { if (roundTimerId != null) { clearInterval(roundTimerId); roundTimerId = null; } }

    function startRoundTimer() {
      stopRoundTimer();
      timeLeft = ROUND_SECONDS;
      updateTimeDisplay();
      roundTimerId = setInterval(function () {
        if (!running) return; // paused while the MCQ gate (or any overlay) is open
        timeLeft -= 1;
        updateTimeDisplay();
        if (timeLeft <= 0) endRound();
      }, 1000);
    }

    function endRound() {
      if (!running) return; // already ended / not in a round
      running = false;
      if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
      stopRoundTimer();
      var finalScore = Math.max(0, score - misses * MISS_PENALTY);
      var result = TM.Leaderboard.submitScore(LEADERBOARD_ID, finalScore, { higherIsBetter: true });
      updateTopDisplay();
      showOverlay(
        "⏰ Time's up!",
        'Final score: ' + score + (misses ? (' − ' + (misses * MISS_PENALTY) + ' for ' + misses + ' revive' + (misses === 1 ? '' : 's')) : '') +
          (misses ? (' = ' + finalScore) : '') + (result.submitted ? ' — new top score!' : '') + '.',
        'Play Again',
        startGame
      );
    }

    function showOverlay(title, msg, btnLabel, action) {
      overlayTitle.textContent = title;
      overlayMsg.textContent = msg;
      overlayBtn.textContent = btnLabel;
      overlayBtn.onclick = action;
      overlay.classList.remove('hidden');
    }

    function spawnIntervalNow() { return Math.max(diffCfg().minSpawnMs, diffCfg().baseSpawnMs - hitsCleared * 18); }
    function lifespanNow() { return Math.max(diffCfg().minLifespanMs, diffCfg().baseLifespanMs - hitsCleared * 22); }
    function civilianChanceNow() { return Math.min(diffCfg().maxCivilianChance, 0.22 + hitsCleared * 0.01); }
    function maxConcurrentNow() { return Math.min(4, 2 + Math.floor(hitsCleared / 8)); }

    function freeSlots() {
      var occupied = {};
      targets.forEach(function (t) { occupied[t.slotIndex] = true; });
      var out = [];
      SLOTS.forEach(function (s, i) { if (!occupied[i]) out.push(i); });
      return out;
    }

    function trySpawn(now) {
      if (targets.length >= maxConcurrentNow()) return;
      var free = freeSlots();
      if (!free.length) return;
      var slotIndex = free[Math.floor(Math.random() * free.length)];
      var isCivilian = Math.random() < civilianChanceNow();
      targets.push({
        slotIndex: slotIndex,
        kind: isCivilian ? 'civilian' : 'outlaw',
        spawnedAt: now,
        lifespan: lifespanNow(),
        hit: false,
      });
    }

    function removeTarget(t) {
      var idx = targets.indexOf(t);
      if (idx !== -1) targets.splice(idx, 1);
    }

    function hitTest(x, y) {
      for (var i = targets.length - 1; i >= 0; i--) {
        var t = targets[i];
        var age = performance.now() - t.spawnedAt;
        if (age < POP_IN_MS) continue; // still popping in, not clickable yet
        var slot = SLOTS[t.slotIndex];
        var r = slot.row === 'bar' ? 34 : 26;
        var dx = x - slot.x, dy = y - (slot.y - 6);
        if (dx * dx + dy * dy <= r * r) return t;
      }
      return null;
    }

    function fire(x, y) {
      if (reloading) return;
      if (ammo <= 0) { playDryFire(); return; }
      ammo -= 1;
      playShot();
      flashUntil = performance.now() + 70;
      var target = hitTest(x, y);
      if (target) {
        target.hit = true;
        if (target.kind === 'outlaw') {
          var age = performance.now() - target.spawnedAt;
          var frac = Math.max(0, 1 - age / target.lifespan);
          var gained = Math.round(100 * (0.5 + 0.5 * frac));
          score += gained;
          hitsCleared += 1;
          playHitOutlaw();
        } else {
          misses += 1;
          playHitCivilian();
          screenFlash = 1;
          removeTarget(target);
          updateHud();
          running = false;
          showMcqGate(function () {
            running = true;
            lastTime = performance.now();
            if (rafId == null) rafId = requestAnimationFrame(loop);
          });
          return;
        }
        removeTarget(target);
      }
      updateHud();
    }

    // --- MCQ gate -----------------------------------------------------
    // Shown on every bystander hit. Picks a random question from the
    // (possibly teacher-edited) bank, shuffles the displayed choice order
    // so the correct answer's on-screen position never gives it away, and
    // lets the student retry the SAME question as many times as needed —
    // no penalty, no limit, just a short pause gate.
    function showMcqGate(onCorrect) {
      var q = mcqs[Math.floor(Math.random() * mcqs.length)];
      var order = q.choices.map(function (text, i) { return { text: text, correct: i === q.answer }; });
      for (var i = order.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
      }
      mcqQuestionEl.textContent = q.q;
      mcqFeedbackEl.textContent = '';
      mcqFeedbackEl.className = 'ws-mcq-feedback';
      mcqChoicesEl.innerHTML = '';
      mcqCloseBtn.classList.add('hidden');
      pendingMcqOnCorrect = null;
      order.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ws-mcq-choice';
        btn.textContent = opt.text;
        btn.dataset.correct = opt.correct ? '1' : '0';
        btn.addEventListener('click', function () {
          if (opt.correct) {
            mcqFeedbackEl.textContent = '✅ Correct!';
            mcqFeedbackEl.className = 'ws-mcq-feedback is-correct';
            playMcqRight();
            mcqChoicesEl.querySelectorAll('.ws-mcq-choice').forEach(function (b) { b.disabled = true; });
            pendingMcqOnCorrect = onCorrect;
            mcqCloseBtn.classList.remove('hidden');
          } else {
            mcqFeedbackEl.textContent = '❌ Not quite — try again.';
            mcqFeedbackEl.className = 'ws-mcq-feedback is-wrong';
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
      var cb = pendingMcqOnCorrect;
      pendingMcqOnCorrect = null;
      if (cb) cb();
    });

    // --- MCQ editor -----------------------------------------------------
    function renderMcqEditList() {
      var listEl = root.querySelector('#wsMcqEditList');
      listEl.innerHTML = '';
      mcqs.forEach(function (q, qi) {
        var block = document.createElement('div');
        block.className = 'ws-mcq-edit-block';
        var qLabel = document.createElement('label');
        qLabel.textContent = 'Question ' + (qi + 1);
        var qInput = document.createElement('input');
        qInput.type = 'text';
        qInput.className = 'ws-mcq-edit-q';
        qInput.value = q.q;
        qInput.addEventListener('input', function () { q.q = qInput.value; });
        block.appendChild(qLabel);
        block.appendChild(qInput);
        q.choices.forEach(function (choiceText, ci) {
          var row = document.createElement('div');
          row.className = 'ws-mcq-edit-choice-row';
          var radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = 'wsMcqCorrect' + qi;
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
      root.querySelector('#wsMcqCopy').value = formatMcqs(mcqs);
    }

    function startReload() {
      if (reloading || ammo === AMMO_MAX) return;
      reloading = true;
      reloadUntil = performance.now() + RELOAD_MS;
      playReload();
    }

    function startGame() {
      score = 0;
      misses = 0;
      ammo = AMMO_MAX;
      reloading = false;
      reloadUntil = 0;
      hitsCleared = 0;
      targets = [];
      nextSpawnAt = performance.now() + 500;
      updateHud();
      overlay.classList.add('hidden');
      running = true;
      lastTime = performance.now();
      if (rafId == null) rafId = requestAnimationFrame(loop);
      startRoundTimer();
    }

    function update(now) {
      if (reloading && now >= reloadUntil) { reloading = false; ammo = AMMO_MAX; updateHud(); }
      if (now >= nextSpawnAt) {
        trySpawn(now);
        nextSpawnAt = now + spawnIntervalNow() * rand(0.7, 1.3);
      }
      for (var i = targets.length - 1; i >= 0; i--) {
        var t = targets[i];
        if (!t.hit && now - t.spawnedAt >= t.lifespan) targets.splice(i, 1);
      }
      if (screenFlash > 0) screenFlash = Math.max(0, screenFlash - (now - lastTime) / 300);
    }

    function drawScene() {
      ctx.fillStyle = '#3a2416';
      ctx.fillRect(0, 0, W, H);
      // back wall
      ctx.fillStyle = '#5a3a24';
      ctx.fillRect(0, 0, W, 170);
      // shelf
      ctx.fillStyle = '#2e1c10';
      ctx.fillRect(0, 150, W, 14);
      // wanted poster
      ctx.fillStyle = '#e8dcb8';
      ctx.fillRect(300, 20, 90, 110);
      ctx.strokeStyle = '#2e1c10'; ctx.lineWidth = 3;
      ctx.strokeRect(300, 20, 90, 110);
      ctx.fillStyle = '#2e1c10';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('WANTED', 345, 40);
      ctx.beginPath(); ctx.arc(345, 70, 20, 0, Math.PI * 2); ctx.fillStyle = '#3a2416'; ctx.fill();
      ctx.fillStyle = '#2e1c10';
      ctx.fillText('$25,000', 345, 120);
      // bar counter
      ctx.fillStyle = '#4a2e1a';
      ctx.fillRect(0, 300, W, 30);
      ctx.fillStyle = '#6b4226';
      ctx.fillRect(0, 290, W, 12);
      // floor planks
      ctx.fillStyle = '#6b4a2e';
      ctx.fillRect(0, 330, W, H - 330);
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 2;
      for (var y = 345; y < H; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    }

    function drawTargetBase(slot) {
      ctx.fillStyle = slot.row === 'bar' ? '#2e1c10' : '#1f140b';
      ctx.beginPath();
      ctx.ellipse(slot.x, slot.y + 16, slot.row === 'bar' ? 38 : 30, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawOutlaw(cx, cy, scale) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.fillStyle = '#2a1c12';
      ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a1008';
      ctx.beginPath(); ctx.ellipse(0, -16, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(-8, -28, 16, 10);
      ctx.fillStyle = '#7a2222';
      ctx.fillRect(-16, 2, 32, 9);
      ctx.fillStyle = '#eee';
      ctx.beginPath(); ctx.arc(-7, -3, 2.6, 0, Math.PI * 2); ctx.arc(7, -3, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    function drawCivilian(cx, cy, scale) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.fillStyle = '#d9b48a';
      ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#efe6d6';
      ctx.beginPath(); ctx.ellipse(0, -18, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a1008';
      ctx.beginPath(); ctx.arc(-7, -3, 2.4, 0, Math.PI * 2); ctx.arc(7, -3, 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 4, 7, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      ctx.restore();
    }

    function drawTargets(now) {
      targets.forEach(function (t) {
        var slot = SLOTS[t.slotIndex];
        drawTargetBase(slot);
        var age = now - t.spawnedAt;
        var scale = Math.min(1, age / POP_IN_MS);
        var remaining = 1 - Math.max(0, (age - (t.lifespan - 220)) / 220);
        scale *= Math.max(0.15, Math.min(1, remaining));
        var cy = slot.y - 6;
        if (t.kind === 'outlaw') drawOutlaw(slot.x, cy, scale);
        else drawCivilian(slot.x, cy, scale);

        // small icon above the head to make friend/foe unmistakable at a glance
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, scale));
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(t.kind === 'outlaw' ? '🔫' : '🍺', slot.x, cy - 32);
        ctx.restore();
      });
    }

    function drawCrosshair() {
      ctx.strokeStyle = '#ffd400';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(crosshair.x, crosshair.y, 14, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(crosshair.x - 20, crosshair.y); ctx.lineTo(crosshair.x - 7, crosshair.y);
      ctx.moveTo(crosshair.x + 7, crosshair.y); ctx.lineTo(crosshair.x + 20, crosshair.y);
      ctx.moveTo(crosshair.x, crosshair.y - 20); ctx.lineTo(crosshair.x, crosshair.y - 7);
      ctx.moveTo(crosshair.x, crosshair.y + 7); ctx.lineTo(crosshair.x, crosshair.y + 20);
      ctx.stroke();
    }

    function render(now) {
      drawScene();
      drawTargets(now);
      drawCrosshair();
      if (now < flashUntil) {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(0, 0, W, H);
      }
      if (screenFlash > 0) {
        ctx.fillStyle = 'rgba(200,20,20,' + (screenFlash * 0.4) + ')';
        ctx.fillRect(0, 0, W, H);
      }
      if (reloading) {
        var frac = 1 - Math.max(0, (reloadUntil - now) / RELOAD_MS);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(W / 2 - 70, H - 40, 140, 16);
        ctx.fillStyle = '#ffd400';
        ctx.fillRect(W / 2 - 68, H - 38, 136 * frac, 12);
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Reloading…', W / 2, H - 46);
      }
    }

    function loop(now) {
      if (!running) { rafId = null; return; }
      update(now);
      render(now);
      lastTime = now;
      rafId = requestAnimationFrame(loop);
    }

    function canvasPoint(evt) {
      var rect = canvas.getBoundingClientRect();
      var cx = evt.clientX != null ? evt.clientX : (evt.touches && evt.touches[0].clientX);
      var cy = evt.clientY != null ? evt.clientY : (evt.touches && evt.touches[0].clientY);
      return { x: (cx - rect.left) * (W / rect.width), y: (cy - rect.top) * (H / rect.height) };
    }

    canvas.addEventListener('pointermove', function (e) {
      var p = canvasPoint(e);
      crosshair.x = p.x; crosshair.y = p.y;
    });
    canvas.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      var p = canvasPoint(e);
      crosshair.x = p.x; crosshair.y = p.y;
      if (running) fire(p.x, p.y);
    });

    function onKeyDown(e) {
      if ((e.key === 'r' || e.key === 'R') && running) { startReload(); e.preventDefault(); }
    }
    window.addEventListener('keydown', onKeyDown);

    root.querySelector('#wsReloadBtn').addEventListener('click', function () { if (running) startReload(); });
    root.querySelector('#wsMuteBtn').addEventListener('click', function (e) {
      soundOn = !soundOn;
      try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch (err) { /* ignore */ }
      e.target.textContent = soundOn ? '🔊' : '🔇';
      if (soundOn) ensureAudio();
    });
    root.querySelector('#wsGuideBtn').addEventListener('click', function () {
      root.querySelector('#wsGuide').classList.toggle('hidden');
    });
    root.querySelector('#wsSettingsBtn').addEventListener('click', function () {
      var panel = root.querySelector('#wsSettings');
      if (panel.classList.contains('hidden')) {
        if (!settingsUnlocked && !TM.Leaderboard.checkPassword('Enter the settings password to unlock game settings:')) return;
        settingsUnlocked = true;
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });
    root.querySelector('#wsResetTopBtn').addEventListener('click', function () {
      if (TM.Leaderboard.resetBest(LEADERBOARD_ID)) updateTopDisplay();
    });
    root.querySelectorAll('.ws-diff-btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-diff') === difficulty);
      btn.addEventListener('click', function () {
        difficulty = btn.getAttribute('data-diff');
        try { localStorage.setItem(DIFFICULTY_KEY, difficulty); } catch (err) { /* ignore */ }
        root.querySelectorAll('.ws-diff-btn').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      });
    });
    root.querySelector('#wsEditBtn').addEventListener('click', function () {
      var editCard = root.querySelector('#wsMcqEdit');
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
    root.querySelector('#wsMcqSaveBtn').addEventListener('click', function () {
      saveMcqs(mcqs);
      refreshMcqCopy();
    });

    score = 0; misses = 0; ammo = AMMO_MAX; reloading = false; hitsCleared = 0; targets = [];
    updateHud();
    render(performance.now());
    showOverlay('Ready?', 'Shoot the outlaws, spare the bartender and the regulars. Unlimited lives — 6 shots per cylinder.', 'Start', startGame);

    window.TM.toolModules['western-saloon'].debugState = function () {
      return { targets: targets, slots: SLOTS, score: score, misses: misses, ammo: ammo, reloading: reloading, mcqGateOpen: !mcqOverlay.classList.contains('hidden'), timeLeft: timeLeft, running: running };
    };
    window.TM.toolModules['western-saloon'].debugFire = function (x, y) { fire(x, y); };
    window.TM.toolModules['western-saloon'].debugForceCivilianHit = function () {
      misses += 1;
      updateHud();
      running = false;
      showMcqGate(function () {
        running = true;
        lastTime = performance.now();
        if (rafId == null) rafId = requestAnimationFrame(loop);
      });
    };
    window.TM.toolModules['western-saloon'].debugForceTimeUp = function () {
      timeLeft = 0;
      endRound();
    };
    window.TM.toolModules['western-saloon'].debugAnswerMcq = function (correct) {
      var btns = mcqChoicesEl.querySelectorAll('.ws-mcq-choice');
      for (var k = 0; k < btns.length; k++) {
        var isRight = btns[k].dataset.correct === '1';
        if (isRight === !!correct) { btns[k].click(); return true; }
      }
      return false;
    };

    window.TM.toolModules['western-saloon'].unmount = function () {
      running = false;
      if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
      stopRoundTimer();
      window.removeEventListener('keydown', onKeyDown);
    };
  }

  window.TM.registerTool('western-saloon', { mount: mount });
})();
