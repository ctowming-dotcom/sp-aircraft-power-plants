(function () {
  window.TM = window.TM || {};

  // A falling-blocks puzzle arcade game (Tetris-style) — an original
  // implementation of that classic genre's rules (7-bag randomizer, basic
  // wall-kick rotation, line clears), not a reproduction of any specific
  // game's art or data, matching this codebase's convention for the other
  // genre-inspired arcade games (see tank-battle.js/bubble-shooter.js).
  // This game has no stages — a single continuous session, closest in
  // shape to engine-emergency.js: unlimited lives (a "life" here is
  // topping out, i.e. a piece has nowhere to spawn), an MCQ gate on every
  // life lost, and a manual End button that submits the plain running
  // score (there is no stage-clear moment to submit at automatically).

  var COLS = 10, ROWS = 20, CELL = 26;
  var W = COLS * CELL, H = ROWS * CELL;
  var FAST_DROP_MS = 45; // fall interval while soft-drop is held, regardless of difficulty

  var HIGH_SCORE_KEY = 'tm.blockDrop.highScore';
  var GAME_ID = 'blockDrop';

  // Difficulty tunes starting fall speed and how fast it ramps up with
  // level — never lives, which are unlimited on every tier (topping out
  // just means one MCQ gate, not a limit).
  var DIFFICULTY_KEY = 'tm.blockDrop.difficulty';
  var DIFFICULTY_SETTINGS = {
    easy: { startInterval: 950, speedupPerLevel: 55, minInterval: 220 },
    normal: { startInterval: 800, speedupPerLevel: 75, minInterval: 150 },
    hard: { startInterval: 650, speedupPerLevel: 95, minInterval: 100 },
  };
  var difficulty = 'normal';
  try {
    var savedDiff = localStorage.getItem(DIFFICULTY_KEY);
    if (DIFFICULTY_SETTINGS[savedDiff]) difficulty = savedDiff;
  } catch (err) { /* ignore */ }
  function diffCfg() { return DIFFICULTY_SETTINGS[difficulty]; }

  // Standard 7 tetrominoes, each as 4 rotation states on a 4x4 grid.
  var SHAPES = {
    I: [['....', '####', '....', '....'], ['..#.', '..#.', '..#.', '..#.'], ['....', '####', '....', '....'], ['.#..', '.#..', '.#..', '.#..']],
    J: [['#...', '###.', '....', '....'], ['.##.', '.#..', '.#..', '....'], ['....', '###.', '..#.', '....'], ['.#..', '.#..', '##..', '....']],
    L: [['..#.', '###.', '....', '....'], ['.#..', '.#..', '.##.', '....'], ['....', '###.', '#...', '....'], ['##..', '.#..', '.#..', '....']],
    O: [['.##.', '.##.', '....', '....'], ['.##.', '.##.', '....', '....'], ['.##.', '.##.', '....', '....'], ['.##.', '.##.', '....', '....']],
    S: [['.##.', '##..', '....', '....'], ['.#..', '.##.', '..#.', '....'], ['.##.', '##..', '....', '....'], ['.#..', '.##.', '..#.', '....']],
    T: [['.#..', '###.', '....', '....'], ['.#..', '.##.', '.#..', '....'], ['....', '###.', '.#..', '....'], ['.#..', '##..', '.#..', '....']],
    Z: [['##..', '.##.', '....', '....'], ['..#.', '.##.', '.#..', '....'], ['##..', '.##.', '....', '....'], ['..#.', '.##.', '.#..', '....']],
  };
  var PIECE_COLORS = { I: '#4fd1e3', J: '#4a7bd1', L: '#ffa94d', O: '#ffd43b', S: '#4ade80', T: '#b084eb', Z: '#ff6b6b' };
  var PIECE_TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

  function cellsOf(type, rot) {
    var grid = SHAPES[type][rot];
    var out = [];
    for (var y = 0; y < 4; y++) {
      for (var x = 0; x < 4; x++) {
        if (grid[y][x] === '#') out.push({ x: x, y: y });
      }
    }
    return out;
  }

  function shuffled(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  // Tiny self-contained Web Audio sound effects — same pattern as this
  // portal's other arcade games: no audio files, lazily created on first
  // sound (always from a user gesture), with a persisted mute toggle.
  var SOUND_KEY = 'tm.blockDrop.sound';
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
  function playLock() { beep(220, 0.05, 'square', 0.1); }
  function playLineClear(n) {
    var base = 440 + n * 80;
    beep(base, 0.08, 'square', 0.18);
    beep(base * 1.25, 0.1, 'square', 0.18, 0.08);
    if (n >= 4) beep(base * 1.6, 0.16, 'square', 0.2, 0.16);
  }
  function playHurt() { beep(260, 0.16, 'sawtooth', 0.2); beep(160, 0.22, 'sawtooth', 0.18, 0.1); }
  function playMcqRight() { beep(523, 0.09, 'square', 0.18); beep(784, 0.14, 'square', 0.18, 0.09); }
  function playMcqWrong() { beep(180, 0.18, 'sawtooth', 0.18); }

  // A broad mixed-review bank, same convention as Tank Battle's — every
  // other arcade game's bank already claims its own narrow angle (see
  // CLAUDE.md's "MCQ gate on life loss" section).
  var DEFAULT_MCQS = [
    { q: 'What does EGT stand for?', choices: ['Exhaust Gas Temperature', 'Engine Ground Test', 'External Gearbox Torque', 'Exit Gate Timer'], answer: 0 },
    { q: 'What is the main job of the combustor?', choices: ['Burn the fuel/air mixture to produce hot, expanding gas', 'Compress incoming air', 'Cool the turbine blades', 'Filter engine oil'], answer: 0 },
    { q: 'On a twin-spool engine, what does N2 usually represent?', choices: ['The high-pressure spool speed, as a percentage', 'The low-pressure spool speed', 'Oil pressure', 'Fuel flow rate'], answer: 0 },
    { q: 'What does the nozzle do at the back of the engine?', choices: ['Accelerates the exhaust gas to produce thrust', 'Starts the engine', 'Detects overheat', 'Filters fuel'], answer: 0 },
    { q: 'What is bypass ratio?', choices: ['The ratio of air bypassing the core to air passing through it', 'The ratio of fuel to oil', 'The gearbox reduction ratio', 'The oil scavenge-to-supply ratio'], answer: 0 },
    { q: 'What does an igniter plug do?', choices: ['Provides the spark to ignite the fuel/air mixture at start', 'Cools the exhaust', 'Filters bleed air', 'Measures N1'], answer: 0 },
    { q: 'What is the purpose of the accessory gearbox?', choices: ['Drives engine accessories like pumps and the generator', 'Stores fuel', 'Detects fire', 'Cools the cabin'], answer: 0 },
    { q: 'Why is a Fire warning different from a Fault warning?', choices: ['Fire means a genuine detected fire; Fault means the detection system itself is malfunctioning', 'They mean the same thing', 'Fault is more serious than Fire', 'Fire only applies to the APU'], answer: 0 },
    { q: 'What does the compressor do?', choices: ['Raises the pressure of incoming air before combustion', 'Burns fuel', 'Produces electrical power', 'Detects ice'], answer: 0 },
    { q: 'What is the APU typically used for on the ground?', choices: ['Supplying electrical power and bleed air without the main engines running', 'Steering the aircraft', 'Fueling the aircraft', 'De-icing the wings'], answer: 0 },
  ];
  var MCQ_KEY = 'tm.blockDrop.mcqs';
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

  function mount(root) {
    root.innerHTML =
      '<div class="bd-wrap">' +
      '<h1>🧱 Block Drop</h1>' +
      '<p class="bd-intro">Clear lines by stacking falling blocks — no stages here, just an endless session that gets faster as you go. Left/Right to move, Up to rotate, Down to soft-drop, Space to hard-drop. Topping out is unlimited — just a quick knowledge-check question before you carry on.</p>' +
      '<div class="bd-hud">' +
      '<div class="bd-stat"><span class="bd-stat-label">Score</span><span class="bd-stat-value" id="bdScore">0</span></div>' +
      '<div class="bd-stat"><span class="bd-stat-label">High score</span><span class="bd-stat-value" id="bdHigh">0</span></div>' +
      '<div class="bd-stat"><span class="bd-stat-label">Top score</span><span class="bd-stat-value" id="bdTop">--</span></div>' +
      '<div class="bd-stat"><span class="bd-stat-label">Level</span><span class="bd-stat-value" id="bdLevel">1</span></div>' +
      '<div class="bd-stat"><span class="bd-stat-label">Lines</span><span class="bd-stat-value" id="bdLines">0</span></div>' +
      '<div class="bd-stat"><span class="bd-stat-label">Misses</span><span class="bd-stat-value" id="bdMisses">0</span></div>' +
      '<button type="button" class="bd-btn hidden" id="bdEndBtn">⏹ End</button>' +
      '<button type="button" class="bd-mute-btn" id="bdMuteBtn" aria-label="Toggle sound">' + (soundOn ? '🔊' : '🔇') + '</button>' +
      '<button type="button" class="bd-mute-btn" id="bdSettingsBtn" aria-label="Game settings">⚙️</button>' +
      '<button type="button" class="bd-mute-btn" id="bdEditBtn" aria-label="Edit questions">✎</button>' +
      '</div>' +
      '<div class="bd-guide hidden" id="bdSettings">' +
      '<h2>⚙️ Game Settings</h2>' +
      '<p>Easy starts slower and ramps up gently; Hard starts fast and ramps up quickly. Lives are unlimited on every setting — topping out just means answering one question before you continue. Takes effect on your next game.</p>' +
      '<div class="bd-diff-row">' +
      '<button type="button" class="bd-tab bd-diff-btn" data-diff="easy">Easy</button>' +
      '<button type="button" class="bd-tab bd-diff-btn" data-diff="normal">Normal</button>' +
      '<button type="button" class="bd-tab bd-diff-btn" data-diff="hard">Hard</button>' +
      '</div>' +
      '<button type="button" class="bd-btn bd-btn-primary" id="bdResetTopBtn">Reset top score…</button>' +
      '</div>' +
      '<div class="bd-stage">' +
      '<canvas id="bdCanvas" width="' + W + '" height="' + H + '"></canvas>' +
      '<div class="bd-side">' +
      '<div class="bd-next-box"><span class="bd-next-label">Next</span><canvas id="bdNextCanvas" width="96" height="96"></canvas></div>' +
      '</div>' +
      '<div class="bd-overlay hidden" id="bdOverlay">' +
      '<div class="bd-overlay-card">' +
      '<h2 id="bdOverlayTitle"></h2>' +
      '<p id="bdOverlayMsg"></p>' +
      '<button type="button" class="bd-btn bd-btn-primary" id="bdOverlayBtn"></button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="bd-touch">' +
      '<button type="button" class="bd-touch-btn" id="bdLeftBtn">◀</button>' +
      '<button type="button" class="bd-touch-btn" id="bdRotateBtn">⟳ Rotate</button>' +
      '<button type="button" class="bd-touch-btn" id="bdRightBtn">▶</button>' +
      '<button type="button" class="bd-touch-btn" id="bdSoftBtn">▼ Soft</button>' +
      '<button type="button" class="bd-touch-btn" id="bdHardBtn">⤓ Drop</button>' +
      '</div>' +
      '<div class="bd-mcq-overlay hidden" id="bdMcqOverlay">' +
      '<div class="bd-mcq-card">' +
      '<button type="button" class="bd-mcq-close hidden" id="bdMcqCloseBtn" aria-label="Close">✕</button>' +
      '<h2>📝 Quick Check</h2>' +
      '<p class="bd-mcq-note">Answer correctly to get back in — try as many times as you need.</p>' +
      '<p class="bd-mcq-question" id="bdMcqQuestion"></p>' +
      '<div class="bd-mcq-choices" id="bdMcqChoices"></div>' +
      '<p class="bd-mcq-feedback" id="bdMcqFeedback"></p>' +
      '</div>' +
      '</div>' +
      '<div class="bd-guide hidden" id="bdMcqEdit">' +
      '<h2>✎ Edit questions</h2>' +
      '<p>Change any question, its 4 choices, or which one is correct. Saved to this browser only — paste the box below into block-drop.js to make it the default for everyone.</p>' +
      '<div id="bdMcqEditList"></div>' +
      '<div class="bd-diff-row">' +
      '<button type="button" class="bd-btn bd-btn-primary" id="bdMcqSaveBtn">Save changes</button>' +
      '</div>' +
      '<p class="bd-mcq-note">Copy-paste source:</p>' +
      '<textarea class="bd-mcq-copy" id="bdMcqCopy" readonly rows="8"></textarea>' +
      '</div>' +
      '</div>';

    var canvas = root.querySelector('#bdCanvas');
    var ctx = canvas.getContext('2d');
    var nextCanvas = root.querySelector('#bdNextCanvas');
    var nextCtx = nextCanvas.getContext('2d');
    var scoreEl = root.querySelector('#bdScore');
    var highEl = root.querySelector('#bdHigh');
    var topEl = root.querySelector('#bdTop');
    var levelEl = root.querySelector('#bdLevel');
    var linesEl = root.querySelector('#bdLines');
    var missesEl = root.querySelector('#bdMisses');
    var overlay = root.querySelector('#bdOverlay');
    var overlayTitle = root.querySelector('#bdOverlayTitle');
    var overlayMsg = root.querySelector('#bdOverlayMsg');
    var overlayBtn = root.querySelector('#bdOverlayBtn');
    var endBtn = root.querySelector('#bdEndBtn');
    var mcqOverlay = root.querySelector('#bdMcqOverlay');
    var mcqQuestionEl = root.querySelector('#bdMcqQuestion');
    var mcqChoicesEl = root.querySelector('#bdMcqChoices');
    var mcqFeedbackEl = root.querySelector('#bdMcqFeedback');
    var mcqCloseBtn = root.querySelector('#bdMcqCloseBtn');
    var mcqs = loadMcqs();
    var mcqEditUnlocked = false;
    var settingsUnlocked = false;
    var pendingMcqCorrect = null;

    var highScore = 0;
    try { highScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0; } catch (err) { highScore = 0; }
    highEl.textContent = highScore;

    function updateTopDisplay() { topEl.textContent = TM.Leaderboard.bestLabel(GAME_ID); }
    updateTopDisplay();

    var board, score, misses, level, linesCleared, dropInterval, fallTimer;
    var bag = [];
    var piece, nextType;
    var softDropActive = false;
    var running = false, rafId = null, lastTime = 0;

    function emptyBoard() {
      var b = [];
      for (var r = 0; r < ROWS; r++) b.push(new Array(COLS).fill(null));
      return b;
    }

    function drawFromBag() {
      if (bag.length === 0) bag = shuffled(PIECE_TYPES);
      return bag.pop();
    }

    function updateHud() {
      scoreEl.textContent = score;
      levelEl.textContent = level;
      linesEl.textContent = linesCleared;
      missesEl.textContent = misses;
      if (score > highScore) {
        highScore = score;
        try { localStorage.setItem(HIGH_SCORE_KEY, String(highScore)); } catch (err) { /* ignore */ }
        highEl.textContent = highScore;
      }
    }

    function showOverlay(title, msg, btnLabel, action) {
      endBtn.classList.add('hidden');
      overlayTitle.textContent = title;
      overlayMsg.textContent = msg;
      overlayBtn.textContent = btnLabel;
      overlayBtn.onclick = action;
      overlay.classList.remove('hidden');
    }

    function collide(px, py, type, rot) {
      var cells = cellsOf(type, rot);
      for (var i = 0; i < cells.length; i++) {
        var bx = px + cells[i].x, by = py + cells[i].y;
        if (bx < 0 || bx >= COLS || by >= ROWS) return true;
        if (by >= 0 && board[by][bx]) return true;
      }
      return false;
    }

    function spawnPiece() {
      piece = { type: nextType, rot: 0, x: Math.floor((COLS - 4) / 2), y: -1 };
      nextType = drawFromBag();
      renderNext();
      if (collide(piece.x, piece.y, piece.type, piece.rot)) {
        loseLife();
      }
    }

    function recomputeDropInterval() {
      dropInterval = Math.max(diffCfg().minInterval, diffCfg().startInterval - (level - 1) * diffCfg().speedupPerLevel);
    }

    function newGame() {
      board = emptyBoard();
      score = 0;
      misses = 0;
      level = 1;
      linesCleared = 0;
      recomputeDropInterval();
      fallTimer = 0;
      bag = [];
      nextType = drawFromBag();
      spawnPiece();
      updateHud();
    }

    function startRunning() {
      overlay.classList.add('hidden');
      running = true;
      endBtn.classList.remove('hidden');
      lastTime = performance.now();
      fallTimer = 0;
      if (rafId == null) rafId = requestAnimationFrame(loop);
    }

    function endGame() {
      if (!running) return;
      running = false;
      if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
      mcqOverlay.classList.add('hidden');
      mcqCloseBtn.classList.add('hidden');
      pendingMcqCorrect = null;
      var result = TM.Leaderboard.submitScore(GAME_ID, score, { higherIsBetter: true });
      updateTopDisplay();
      showOverlay('Game ended', 'Score: ' + score + (result.submitted ? ' — 🏆 new top score!' : ''), 'Start', function () {
        newGame();
        startRunning();
      });
    }

    function clearLines() {
      var full = [];
      for (var r = 0; r < ROWS; r++) {
        if (board[r].every(function (cell) { return cell; })) full.push(r);
      }
      if (full.length) {
        full.forEach(function (r) { board.splice(r, 1); });
        for (var i = 0; i < full.length; i++) board.unshift(new Array(COLS).fill(null));
        linesCleared += full.length;
        level = 1 + Math.floor(linesCleared / 10);
        recomputeDropInterval();
        var pts = [0, 100, 300, 500, 800][full.length] * level;
        score += pts;
        playLineClear(full.length);
        updateHud();
      }
    }

    function lockPiece() {
      var cells = cellsOf(piece.type, piece.rot);
      cells.forEach(function (c) {
        var bx = piece.x + c.x, by = piece.y + c.y;
        if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) board[by][bx] = PIECE_COLORS[piece.type];
      });
      playLock();
      clearLines();
      spawnPiece();
    }

    function tryMoveDown() {
      if (!collide(piece.x, piece.y + 1, piece.type, piece.rot)) {
        piece.y += 1;
      } else {
        lockPiece();
      }
    }

    function moveHorizontal(dir) {
      if (!piece) return;
      if (!collide(piece.x + dir, piece.y, piece.type, piece.rot)) piece.x += dir;
    }

    function rotatePiece() {
      if (!piece) return;
      var newRot = (piece.rot + 1) % 4;
      var kicks = [0, -1, 1, -2, 2];
      for (var i = 0; i < kicks.length; i++) {
        if (!collide(piece.x + kicks[i], piece.y, piece.type, newRot)) {
          piece.x += kicks[i];
          piece.rot = newRot;
          return;
        }
      }
    }

    function hardDrop() {
      if (!piece) return;
      var dist = 0;
      while (!collide(piece.x, piece.y + 1, piece.type, piece.rot)) { piece.y += 1; dist += 1; }
      score += dist * 2;
      updateHud();
      lockPiece();
    }

    function loseLife() {
      misses += 1;
      playHurt();
      updateHud();
      running = false;
      if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
      showMcqGate(function () {
        board = emptyBoard();
        bag = [];
        nextType = drawFromBag();
        spawnPiece();
        running = true;
        lastTime = performance.now();
        fallTimer = 0;
        if (rafId == null) rafId = requestAnimationFrame(loop);
      });
    }

    // --- MCQ gate -----------------------------------------------------
    // Shown whenever the stack tops out (no room to spawn the next
    // piece). Picks a random question from the (possibly teacher-edited)
    // bank, shuffles the displayed choice order, and lets the student
    // retry the SAME question as many times as needed. A correct answer
    // disables the choices and reveals a ✕ — play only resumes once
    // that's clicked, so the result never silently disappears on its own.
    function showMcqGate(onCorrect) {
      var q = mcqs[Math.floor(Math.random() * mcqs.length)];
      var order = q.choices.map(function (text, i) { return { text: text, correct: i === q.answer }; });
      for (var i = order.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
      }
      mcqQuestionEl.textContent = q.q;
      mcqFeedbackEl.textContent = '';
      mcqFeedbackEl.className = 'bd-mcq-feedback';
      mcqChoicesEl.innerHTML = '';
      mcqCloseBtn.classList.add('hidden');
      pendingMcqCorrect = onCorrect;
      order.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bd-mcq-choice';
        btn.textContent = opt.text;
        btn.dataset.correct = opt.correct ? '1' : '0';
        btn.addEventListener('click', function () {
          if (opt.correct) {
            mcqFeedbackEl.textContent = '✅ Correct! Press ✕ to continue.';
            mcqFeedbackEl.className = 'bd-mcq-feedback is-correct';
            playMcqRight();
            mcqChoicesEl.querySelectorAll('.bd-mcq-choice').forEach(function (b) { b.disabled = true; });
            mcqCloseBtn.classList.remove('hidden');
          } else {
            mcqFeedbackEl.textContent = '❌ Not quite — try again.';
            mcqFeedbackEl.className = 'bd-mcq-feedback is-wrong';
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
      var cb = pendingMcqCorrect;
      pendingMcqCorrect = null;
      if (cb) cb();
    });

    // --- MCQ editor -----------------------------------------------------
    function renderMcqEditList() {
      var listEl = root.querySelector('#bdMcqEditList');
      listEl.innerHTML = '';
      mcqs.forEach(function (q, qi) {
        var block = document.createElement('div');
        block.className = 'bd-mcq-edit-block';
        var qLabel = document.createElement('label');
        qLabel.textContent = 'Question ' + (qi + 1);
        var qInput = document.createElement('input');
        qInput.type = 'text';
        qInput.className = 'bd-mcq-edit-q';
        qInput.value = q.q;
        qInput.addEventListener('input', function () { q.q = qInput.value; });
        block.appendChild(qLabel);
        block.appendChild(qInput);
        q.choices.forEach(function (choiceText, ci) {
          var row = document.createElement('div');
          row.className = 'bd-mcq-edit-choice-row';
          var radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = 'bdMcqCorrect' + qi;
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
      root.querySelector('#bdMcqCopy').value = formatMcqs(mcqs);
    }

    function drawCell(targetCtx, x, y, color, cell) {
      targetCtx.fillStyle = color;
      targetCtx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
      targetCtx.fillStyle = 'rgba(255,255,255,0.25)';
      targetCtx.fillRect(x * cell + 1, y * cell + 1, cell - 2, 3);
    }

    function ghostY() {
      var gy = piece.y;
      while (!collide(piece.x, gy + 1, piece.type, piece.rot)) gy += 1;
      return gy;
    }

    function render() {
      ctx.fillStyle = '#0c0f18';
      ctx.fillRect(0, 0, W, H);
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          if (board[r][c]) drawCell(ctx, c, r, board[r][c], CELL);
        }
      }
      if (piece) {
        var gy = ghostY();
        var cells = cellsOf(piece.type, piece.rot);
        ctx.globalAlpha = 0.25;
        cells.forEach(function (cl) {
          var by = gy + cl.y;
          if (by >= 0) drawCell(ctx, piece.x + cl.x, by, PIECE_COLORS[piece.type], CELL);
        });
        ctx.globalAlpha = 1;
        cells.forEach(function (cl) {
          var by = piece.y + cl.y;
          if (by >= 0) drawCell(ctx, piece.x + cl.x, by, PIECE_COLORS[piece.type], CELL);
        });
      }
    }

    function renderNext() {
      nextCtx.fillStyle = '#0c0f18';
      nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
      var cells = cellsOf(nextType, 0);
      var cell = 20;
      var minX = Math.min.apply(null, cells.map(function (c) { return c.x; }));
      var maxX = Math.max.apply(null, cells.map(function (c) { return c.x; }));
      var minY = Math.min.apply(null, cells.map(function (c) { return c.y; }));
      var maxY = Math.max.apply(null, cells.map(function (c) { return c.y; }));
      var w = (maxX - minX + 1) * cell, h = (maxY - minY + 1) * cell;
      var offX = (nextCanvas.width - w) / 2 - minX * cell;
      var offY = (nextCanvas.height - h) / 2 - minY * cell;
      nextCtx.save();
      nextCtx.translate(offX, offY);
      cells.forEach(function (cl) { drawCell(nextCtx, cl.x, cl.y, PIECE_COLORS[nextType], cell); });
      nextCtx.restore();
    }

    function loop(now) {
      if (!running) { rafId = null; return; }
      var dt = now - lastTime;
      lastTime = now;
      fallTimer += dt;
      var interval = softDropActive ? FAST_DROP_MS : dropInterval;
      if (fallTimer >= interval) {
        fallTimer = 0;
        if (softDropActive) { score += 1; updateHud(); }
        tryMoveDown();
      }
      if (running) render();
      rafId = requestAnimationFrame(loop);
    }

    function onKeyDown(e) {
      if (!running) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { moveHorizontal(-1); e.preventDefault(); }
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { moveHorizontal(1); e.preventDefault(); }
      else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'x' || e.key === 'X') { rotatePiece(); e.preventDefault(); }
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { softDropActive = true; e.preventDefault(); }
      else if (e.key === ' ') { hardDrop(); e.preventDefault(); }
    }
    function onKeyUp(e) {
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') softDropActive = false;
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    var holdTimer = null;
    function bindRepeat(el, fn) {
      el.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        if (!running) return;
        fn();
        holdTimer = setInterval(fn, 130);
      });
      var stop = function () { if (holdTimer != null) { clearInterval(holdTimer); holdTimer = null; } };
      el.addEventListener('pointerup', stop);
      el.addEventListener('pointerleave', stop);
      el.addEventListener('pointercancel', stop);
    }
    bindRepeat(root.querySelector('#bdLeftBtn'), function () { moveHorizontal(-1); });
    bindRepeat(root.querySelector('#bdRightBtn'), function () { moveHorizontal(1); });
    root.querySelector('#bdRotateBtn').addEventListener('pointerdown', function (e) { e.preventDefault(); if (running) rotatePiece(); });
    root.querySelector('#bdSoftBtn').addEventListener('pointerdown', function (e) { e.preventDefault(); softDropActive = true; });
    root.querySelector('#bdSoftBtn').addEventListener('pointerup', function () { softDropActive = false; });
    root.querySelector('#bdSoftBtn').addEventListener('pointerleave', function () { softDropActive = false; });
    root.querySelector('#bdHardBtn').addEventListener('pointerdown', function (e) { e.preventDefault(); if (running) hardDrop(); });

    root.querySelector('#bdMuteBtn').addEventListener('click', function (e) {
      soundOn = !soundOn;
      try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch (err) { /* ignore */ }
      e.target.textContent = soundOn ? '🔊' : '🔇';
      if (soundOn) ensureAudio();
    });
    root.querySelector('#bdSettingsBtn').addEventListener('click', function () {
      var panel = root.querySelector('#bdSettings');
      if (panel.classList.contains('hidden')) {
        if (!settingsUnlocked && !TM.Leaderboard.checkPassword('Enter the settings password to unlock game settings:')) return;
        settingsUnlocked = true;
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });
    root.querySelector('#bdResetTopBtn').addEventListener('click', function () {
      if (TM.Leaderboard.resetBest(GAME_ID)) updateTopDisplay();
    });
    endBtn.addEventListener('click', endGame);
    root.querySelectorAll('.bd-diff-btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-diff') === difficulty);
      btn.addEventListener('click', function () {
        difficulty = btn.getAttribute('data-diff');
        try { localStorage.setItem(DIFFICULTY_KEY, difficulty); } catch (err) { /* ignore */ }
        root.querySelectorAll('.bd-diff-btn').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      });
    });
    root.querySelector('#bdEditBtn').addEventListener('click', function () {
      var editCard = root.querySelector('#bdMcqEdit');
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
    root.querySelector('#bdMcqSaveBtn').addEventListener('click', function () {
      saveMcqs(mcqs);
      refreshMcqCopy();
    });

    newGame();
    render();
    showOverlay('Ready?', 'Clear lines before the stack reaches the top. Unlimited lives — topping out just means a quick knowledge-check question before a fresh board.', 'Start', function () {
      newGame(); startRunning(); // re-applies the difficulty picked while still on this screen
    });

    window.TM.toolModules['block-drop'].debugState = function () {
      return { score: score, misses: misses, level: level, linesCleared: linesCleared, board: board, piece: piece, mcqGateOpen: !mcqOverlay.classList.contains('hidden') };
    };
    window.TM.toolModules['block-drop'].debugForceTopOut = function () { loseLife(); };
    window.TM.toolModules['block-drop'].debugForceEnd = function () { endGame(); };
    window.TM.toolModules['block-drop'].debugAnswerMcq = function (correct) {
      var btns = mcqChoicesEl.querySelectorAll('.bd-mcq-choice');
      for (var k = 0; k < btns.length; k++) {
        var isRight = btns[k].dataset.correct === '1';
        if (isRight === !!correct) { btns[k].click(); return true; }
      }
      return false;
    };

    window.TM.toolModules['block-drop'].unmount = function () {
      running = false;
      if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
      if (holdTimer != null) { clearInterval(holdTimer); holdTimer = null; }
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }

  window.TM.registerTool('block-drop', { mount: mount });
})();
