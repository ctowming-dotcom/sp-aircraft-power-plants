(function () {
  window.TM = window.TM || {};

  // A Puzzle-Bobble/Bust-a-Move-style bubble shooter (an original hex-grid
  // design in that classic genre, not a reproduction of any specific
  // game's art or level data). Built from scratch with every convention
  // established this session already baked in (unlimited lives +
  // persistent MCQ gate, password-locked settings, named leaderboard) —
  // see tank-battle.js, which this file mirrors structurally.

  var GAME_ID = 'bubbleShooter';
  var HIGH_SCORE_KEY = 'tm.bubbleShooter.highScore.v2';

  // --- Hex grid geometry -----------------------------------------------
  // "Odd-r" horizontal-offset layout: odd rows are shoved right by one
  // bubble radius and have one fewer usable column than even rows.
  var BUBBLE_R = 24;
  var COLS = 9;
  var ROWS = 14;
  var ROW_H = Math.round(BUBBLE_R * Math.sqrt(3));
  var FIELD_LEFT = 24;
  var FIELD_TOP = 16;
  var FIELD_WIDTH = COLS * BUBBLE_R * 2;
  var FIELD_RIGHT = FIELD_LEFT + FIELD_WIDTH;
  var W = FIELD_LEFT * 2 + FIELD_WIDTH;
  var H = 640;
  var SHOOTER_X = W / 2;
  var SHOOTER_Y = H - 40;
  var DANGER_ROW = 11; // rows 11-13 are the buffer before the shooter
  var BULLET_R = BUBBLE_R - 4;
  var BULLET_SPEED = 11;

  var COLORS = ['#ff6b6b', '#4dabf7', '#ffd43b', '#51cf66', '#cc5de8', '#ff922b'];

  function validCol(row, col) {
    if (col < 0) return false;
    return row % 2 === 0 ? col < COLS : col < COLS - 1;
  }
  function cellCenter(row, col) {
    var y = FIELD_TOP + BUBBLE_R + row * ROW_H;
    var x = row % 2 === 0
      ? FIELD_LEFT + BUBBLE_R + col * BUBBLE_R * 2
      : FIELD_LEFT + BUBBLE_R * 2 + col * BUBBLE_R * 2;
    return { x: x, y: y };
  }
  function neighbors(row, col) {
    var deltas = row % 2 === 0
      ? [{ dr: 0, dc: -1 }, { dr: 0, dc: 1 }, { dr: -1, dc: -1 }, { dr: -1, dc: 0 }, { dr: 1, dc: -1 }, { dr: 1, dc: 0 }]
      : [{ dr: 0, dc: -1 }, { dr: 0, dc: 1 }, { dr: -1, dc: 0 }, { dr: -1, dc: 1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }];
    var out = [];
    deltas.forEach(function (d) {
      var nr = row + d.dr, nc = col + d.dc;
      if (nr >= 0 && nr < ROWS && validCol(nr, nc)) out.push({ row: nr, col: nc });
    });
    return out;
  }
  function generateRowCells(rowIndex, colorCount) {
    var row = new Array(COLS).fill(null);
    var maxCol = rowIndex % 2 === 0 ? COLS : COLS - 1;
    for (var c = 0; c < maxCol; c++) row[c] = Math.floor(Math.random() * colorCount);
    return row;
  }
  function initGrid(startRows, colorCount) {
    var grid = [];
    for (var r = 0; r < ROWS; r++) grid.push(r < startRows ? generateRowCells(r, colorCount) : new Array(COLS).fill(null));
    return grid;
  }
  function randomColor(colorCount) { return Math.floor(Math.random() * colorCount); }

  // Difficulty tunes how many colors are in play and how often a new row
  // of bubbles is added — never lives, which are unlimited on every tier.
  var DIFFICULTY_KEY = 'tm.bubbleShooter.difficulty';
  var DIFFICULTY_SETTINGS = {
    easy: { colors: 4, shotsPerRow: 10, startRows: 4 },
    normal: { colors: 5, shotsPerRow: 7, startRows: 5 },
    hard: { colors: 5, shotsPerRow: 5, startRows: 6 },
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
  var SOUND_KEY = 'tm.bubbleShooter.sound';
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
  function playFire() { beep(700, 0.05, 'square', 0.1); }
  function playPop() { beep(600, 0.07, 'square', 0.16); beep(900, 0.08, 'square', 0.14, 0.05); }
  function playBounce() { beep(300, 0.04, 'triangle', 0.08); }
  function playHurt() { beep(260, 0.16, 'sawtooth', 0.2); beep(160, 0.22, 'sawtooth', 0.18, 0.1); }
  function playClear() { beep(523, 0.1, 'square', 0.18); beep(659, 0.1, 'square', 0.18, 0.1); beep(784, 0.1, 'square', 0.18, 0.2); beep(1046, 0.22, 'square', 0.2, 0.3); }
  function playMcqRight() { beep(523, 0.09, 'square', 0.18); beep(784, 0.14, 'square', 0.18, 0.09); }
  function playMcqWrong() { beep(180, 0.18, 'sawtooth', 0.18); }

  // A fresh engine-vocabulary angle — every other arcade game's MCQ pool
  // is themed to a different system (see CLAUDE.md's "MCQ gate on life
  // loss" section and the Tank Battle entry for what's already covered).
  // Editable in-browser via the password-gated "✎" edit panel (password
  // APP, same casual click-guard as every other tool's edit mode).
  var DEFAULT_MCQS = [
    { q: 'What is a nacelle?', choices: ['The streamlined housing that covers an engine', 'A type of oil filter', 'The engine starter motor', 'A cockpit warning light'], answer: 0 },
    { q: 'What does a stator do?', choices: ['Fixed vanes that redirect airflow between rotating stages', 'Spins to compress air', 'Stores fuel under pressure', 'Detects engine fire'], answer: 0 },
    { q: 'What is a rotor?', choices: ['The rotating set of blades on a compressor or turbine stage', 'A fixed structural support', 'The engine’s oil tank', 'A type of bleed valve'], answer: 0 },
    { q: 'What does a diffuser do in a gas turbine?', choices: ['Slows and spreads airflow to raise its pressure before the combustor', 'Cools the turbine blades', 'Starts the engine', 'Filters engine oil'], answer: 0 },
    { q: 'What is the purpose of an igniter plug?', choices: ['Sparks that light the fuel-air mixture in the combustor', 'Measures oil pressure', 'Cools the exhaust gas', 'Detects a chip in the oil'], answer: 0 },
    { q: 'What does a starter cutout do?', choices: ['Automatically disengages the starter once the engine is self-sustaining', 'Shuts off fuel flow permanently', 'Opens the bleed valve', 'Arms the fire bottle'], answer: 0 },
    { q: 'What is a pylon?', choices: ['The structure that attaches an engine to the wing', 'A fuel storage tank', 'A type of turbine blade', 'An oil pressure sensor'], answer: 0 },
    { q: 'What drives the accessory gearbox?', choices: ['Engine shaft power, to run pumps/generators/starters', 'Cabin air conditioning', 'Battery power only', 'Hydraulic fluid pressure'], answer: 0 },
    { q: 'What does a manifold do?', choices: ['A branching duct or pipe that distributes air or fuel to several outlets', 'Converts AC power to DC', 'Measures turbine speed', 'Cools the accessory gearbox'], answer: 0 },
    { q: 'What does EGT stand for?', choices: ['Exhaust Gas Temperature', 'Engine Ground Test', 'Electrical Generator Trip', 'Emergency Glide Thrust'], answer: 0 },
  ];
  var MCQ_KEY = 'tm.bubbleShooter.mcqs';
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
      '<div class="bs-wrap">' +
      '<h1>🫧 Bubble Shooter</h1>' +
      '<p class="bs-intro">Match 3 or more same-colored bubbles to pop them. Move the mouse (or drag) to aim, click/tap/Space to fire — don’t let the stack reach the danger line.</p>' +
      '<div class="bs-hud">' +
      '<div class="bs-stat"><span class="bs-stat-label">Score</span><span class="bs-stat-value" id="bsScore">0</span></div>' +
      '<div class="bs-stat"><span class="bs-stat-label">High score</span><span class="bs-stat-value" id="bsHigh">0</span></div>' +
      '<div class="bs-stat"><span class="bs-stat-label">Top score</span><span class="bs-stat-value" id="bsTop">--</span></div>' +
      '<div class="bs-stat"><span class="bs-stat-label">Misses</span><span class="bs-stat-value" id="bsMisses">0</span></div>' +
      '<div class="bs-stat"><span class="bs-stat-label">Stage</span><span class="bs-stat-value" id="bsStage">1</span></div>' +
      '<button type="button" class="bs-mute-btn" id="bsMuteBtn" aria-label="Toggle sound">' + (soundOn ? '🔊' : '🔇') + '</button>' +
      '<button type="button" class="bs-mute-btn" id="bsSettingsBtn" aria-label="Game settings">⚙️</button>' +
      '<button type="button" class="bs-mute-btn" id="bsEditBtn" aria-label="Edit questions">✎</button>' +
      '</div>' +
      '<div class="bs-guide hidden" id="bsSettings">' +
      '<h2>⚙️ Game Settings</h2>' +
      '<p>Easy uses fewer colors and adds new rows slowly; Hard uses more colors and adds rows quickly. Misses are unlimited on every setting — a stack reaching the danger line just means answering one question before a fresh attempt at the same stage. Takes effect on your next game.</p>' +
      '<div class="bs-diff-row">' +
      '<button type="button" class="bs-tab bs-diff-btn" data-diff="easy">Easy</button>' +
      '<button type="button" class="bs-tab bs-diff-btn" data-diff="normal">Normal</button>' +
      '<button type="button" class="bs-tab bs-diff-btn" data-diff="hard">Hard</button>' +
      '</div>' +
      '<button type="button" class="bs-btn bs-btn-primary" id="bsResetTopBtn">Reset top score…</button>' +
      '</div>' +
      '<div class="bs-stage">' +
      '<canvas id="bsCanvas" width="' + W + '" height="' + H + '"></canvas>' +
      '<div class="bs-overlay hidden" id="bsOverlay">' +
      '<div class="bs-overlay-card">' +
      '<h2 id="bsOverlayTitle"></h2>' +
      '<p id="bsOverlayMsg"></p>' +
      '<button type="button" class="bs-btn bs-btn-primary" id="bsOverlayBtn"></button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="bs-touch">' +
      '<button type="button" class="bs-touch-btn" id="bsLeftBtn">◀</button>' +
      '<button type="button" class="bs-touch-btn bs-touch-fire" id="bsFireBtn">🔥 Fire</button>' +
      '<button type="button" class="bs-touch-btn" id="bsRightBtn">▶</button>' +
      '</div>' +
      '<div class="bs-mcq-overlay hidden" id="bsMcqOverlay">' +
      '<div class="bs-mcq-card">' +
      '<button type="button" class="bs-mcq-close hidden" id="bsMcqCloseBtn" aria-label="Close">✕</button>' +
      '<h2>📝 Quick Check</h2>' +
      '<p class="bs-mcq-note">Answer correctly to get back in — try as many times as you need.</p>' +
      '<p class="bs-mcq-question" id="bsMcqQuestion"></p>' +
      '<div class="bs-mcq-choices" id="bsMcqChoices"></div>' +
      '<p class="bs-mcq-feedback" id="bsMcqFeedback"></p>' +
      '</div>' +
      '</div>' +
      '<div class="bs-guide hidden" id="bsMcqEdit">' +
      '<h2>✎ Edit questions</h2>' +
      '<p>Change any question, its 4 choices, or which one is correct. Saved to this browser only — paste the box below into bubble-shooter.js to make it the default for everyone.</p>' +
      '<div id="bsMcqEditList"></div>' +
      '<div class="bs-diff-row">' +
      '<button type="button" class="bs-btn bs-btn-primary" id="bsMcqSaveBtn">Save changes</button>' +
      '</div>' +
      '<p class="bs-mcq-note">Copy-paste source:</p>' +
      '<textarea class="bs-mcq-copy" id="bsMcqCopy" readonly rows="8"></textarea>' +
      '</div>' +
      '</div>';

    var canvas = root.querySelector('#bsCanvas');
    var ctx = canvas.getContext('2d');
    var scoreEl = root.querySelector('#bsScore');
    var highEl = root.querySelector('#bsHigh');
    var topEl = root.querySelector('#bsTop');
    var missesEl = root.querySelector('#bsMisses');
    var stageEl = root.querySelector('#bsStage');
    var overlay = root.querySelector('#bsOverlay');
    var overlayTitle = root.querySelector('#bsOverlayTitle');
    var overlayMsg = root.querySelector('#bsOverlayMsg');
    var overlayBtn = root.querySelector('#bsOverlayBtn');
    var mcqOverlay = root.querySelector('#bsMcqOverlay');
    var mcqQuestionEl = root.querySelector('#bsMcqQuestion');
    var mcqChoicesEl = root.querySelector('#bsMcqChoices');
    var mcqFeedbackEl = root.querySelector('#bsMcqFeedback');
    var mcqCloseBtn = root.querySelector('#bsMcqCloseBtn');
    var mcqs = loadMcqs();
    var mcqEditUnlocked = false;
    var settingsUnlocked = false;
    var pendingMcqCorrect = null;

    var highScore = 0;
    try { highScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0; } catch (err) { highScore = 0; }
    highEl.textContent = highScore;

    function updateTopDisplay() { topEl.textContent = TM.Leaderboard.bestLabel(GAME_ID); }
    updateTopDisplay();

    var score, misses, stage, grid, colorCountForStage, shotsFired, bullet, currentColor, nextColor, aimAngle, running, rafId, lastTime;
    var keys = { left: false, right: false };
    var fireRequested = false;

    function updateHud() {
      scoreEl.textContent = score;
      missesEl.textContent = misses;
      stageEl.textContent = stage;
      if (score > highScore) {
        highScore = score;
        try { localStorage.setItem(HIGH_SCORE_KEY, String(highScore)); } catch (err) { /* ignore */ }
        highEl.textContent = highScore;
      }
    }
    function showOverlay(title, msg, btnLabel, action) {
      overlayTitle.textContent = title;
      overlayMsg.textContent = msg;
      overlayBtn.textContent = btnLabel;
      overlayBtn.onclick = action;
      overlay.classList.remove('hidden');
    }

    function startStage() {
      var startRows = Math.min(diffCfg().startRows + (stage - 1), 8);
      colorCountForStage = Math.min(diffCfg().colors + Math.floor((stage - 1) / 2), COLORS.length);
      grid = initGrid(startRows, colorCountForStage);
      shotsFired = 0;
      bullet = null;
      currentColor = randomColor(colorCountForStage);
      nextColor = randomColor(colorCountForStage);
      aimAngle = -Math.PI / 2;
    }

    // Time-to-clear and revive count for the CURRENT stage, across any
    // number of retries (a loseLife() retry re-deals the board via
    // startStage() but must not reset these, so a revive genuinely costs
    // the stage's final score) — only a true new stage resets them.
    var stageStartTime = 0, missesThisStage = 0;
    function resetStageTimer() { stageStartTime = performance.now(); missesThisStage = 0; }

    function newGame() {
      score = 0;
      misses = 0;
      stage = 1;
      startStage();
      resetStageTimer();
      updateHud();
    }

    function startRunning() {
      overlay.classList.add('hidden');
      running = true;
      lastTime = performance.now();
      if (rafId == null) rafId = requestAnimationFrame(loop);
    }

    function clampAim(a) { return Math.max(-Math.PI + 0.08, Math.min(-0.08, a)); }

    function updateAim(dt) {
      var speed = 0.045;
      if (keys.left) aimAngle = clampAim(aimAngle - speed * dt);
      if (keys.right) aimAngle = clampAim(aimAngle + speed * dt);
    }

    function occupiedCells() {
      var list = [];
      for (var r = 0; r < ROWS; r++) {
        var maxCol = r % 2 === 0 ? COLS : COLS - 1;
        for (var c = 0; c < maxCol; c++) if (grid[r][c] != null) list.push({ row: r, col: c });
      }
      return list;
    }

    function findSnapCell(x, y) {
      var estRow = Math.round((y - FIELD_TOP - BUBBLE_R) / ROW_H);
      estRow = Math.max(0, Math.min(ROWS - 1, estRow));
      var best = null, bestDist = Infinity;
      for (var r = Math.max(0, estRow - 2); r <= Math.min(ROWS - 1, estRow + 2); r++) {
        var maxCol = r % 2 === 0 ? COLS : COLS - 1;
        for (var c = 0; c < maxCol; c++) {
          if (grid[r][c] != null) continue;
          var ctr = cellCenter(r, c);
          var dx = x - ctr.x, dy = y - ctr.y;
          var d = dx * dx + dy * dy;
          if (d < bestDist) { bestDist = d; best = { row: r, col: c }; }
        }
      }
      return best;
    }

    function floodFillGroup(row, col) {
      var color = grid[row][col];
      var visited = {};
      var stack = [{ row: row, col: col }];
      var result = [];
      while (stack.length) {
        var cur = stack.pop();
        var key = cur.row + ',' + cur.col;
        if (visited[key]) continue;
        visited[key] = true;
        if (grid[cur.row][cur.col] !== color) continue;
        result.push(cur);
        neighbors(cur.row, cur.col).forEach(function (n) { stack.push(n); });
      }
      return result;
    }

    function removeFloating() {
      var reachable = {};
      var queue = [];
      for (var c = 0; c < COLS; c++) if (grid[0] && grid[0][c] != null) { queue.push({ row: 0, col: c }); reachable['0,' + c] = true; }
      while (queue.length) {
        var cur = queue.shift();
        neighbors(cur.row, cur.col).forEach(function (n) {
          var key = n.row + ',' + n.col;
          if (!reachable[key] && grid[n.row][n.col] != null) { reachable[key] = true; queue.push(n); }
        });
      }
      var removed = 0;
      for (var r = 0; r < ROWS; r++) {
        var maxCol = r % 2 === 0 ? COLS : COLS - 1;
        for (var cc = 0; cc < maxCol; cc++) {
          if (grid[r][cc] != null && !reachable[r + ',' + cc]) { grid[r][cc] = null; removed++; }
        }
      }
      return removed;
    }

    function boardEmpty() {
      for (var r = 0; r < ROWS; r++) {
        var maxCol = r % 2 === 0 ? COLS : COLS - 1;
        for (var c = 0; c < maxCol; c++) if (grid[r][c] != null) return false;
      }
      return true;
    }

    function dangerPresent() {
      for (var r = DANGER_ROW; r < ROWS; r++) {
        var maxCol = r % 2 === 0 ? COLS : COLS - 1;
        for (var c = 0; c < maxCol; c++) if (grid[r][c] != null) return true;
      }
      return false;
    }

    function checkStageClearOrDanger() {
      if (boardEmpty()) { stageClear(); return; }
      if (dangerPresent()) loseLife();
    }

    function resolveSnap(row, col, color) {
      grid[row][col] = color;
      var group = floodFillGroup(row, col);
      if (group.length >= 3) {
        group.forEach(function (cell) { grid[cell.row][cell.col] = null; });
        score += 10 * group.length;
        var floating = removeFloating();
        if (floating > 0) score += 15 * floating;
        playPop();
        updateHud();
      }
      checkStageClearOrDanger();
    }

    // After this long into a stage, stop adding new rows altogether —
    // the ceiling an endlessly-growing stack creates is meant to add
    // pressure early on, not punish a student who's taking their time
    // to actually clear the board; a fixed cutoff gives them a clean
    // runway to finish instead.
    var ROW_ADD_CUTOFF_SECONDS = 180;
    function stageElapsedSeconds() { return (performance.now() - stageStartTime) / 1000; }
    function rowDropImminent() {
      return stageElapsedSeconds() < ROW_ADD_CUTOFF_SECONDS && shotsFired + 1 >= diffCfg().shotsPerRow;
    }

    function addRowIfDue() {
      shotsFired += 1;
      if (shotsFired >= diffCfg().shotsPerRow) {
        shotsFired = 0;
        if (stageElapsedSeconds() < ROW_ADD_CUTOFF_SECONDS) {
          for (var r = ROWS - 1; r >= 1; r--) grid[r] = grid[r - 1];
          grid[0] = generateRowCells(0, colorCountForStage);
          if (dangerPresent()) loseLife();
        }
      }
    }

    function fireBullet() {
      if (bullet || !running) return;
      bullet = {
        x: SHOOTER_X, y: SHOOTER_Y,
        vx: Math.cos(aimAngle) * BULLET_SPEED, vy: Math.sin(aimAngle) * BULLET_SPEED,
        color: currentColor
      };
      playFire();
      currentColor = nextColor;
      nextColor = randomColor(colorCountForStage);
    }

    function updateBullet(dt) {
      if (!bullet) return;
      var steps = 4;
      var occ = occupiedCells();
      for (var s = 0; s < steps; s++) {
        bullet.x += bullet.vx * dt / steps;
        bullet.y += bullet.vy * dt / steps;
        if (bullet.x - BULLET_R <= FIELD_LEFT) { bullet.x = FIELD_LEFT + BULLET_R; bullet.vx = Math.abs(bullet.vx); playBounce(); }
        else if (bullet.x + BULLET_R >= FIELD_RIGHT) { bullet.x = FIELD_RIGHT - BULLET_R; bullet.vx = -Math.abs(bullet.vx); playBounce(); }
        if (bullet.y - BULLET_R <= FIELD_TOP) {
          var cell = findSnapCell(bullet.x, bullet.y) || { row: 0, col: 0 };
          var color = bullet.color;
          bullet = null;
          resolveSnap(cell.row, cell.col, color);
          addRowIfDue();
          return;
        }
        for (var i = 0; i < occ.length; i++) {
          var ctr = cellCenter(occ[i].row, occ[i].col);
          var dx = bullet.x - ctr.x, dy = bullet.y - ctr.y;
          if (dx * dx + dy * dy < (BUBBLE_R * 2 - 6) * (BUBBLE_R * 2 - 6)) {
            var snapCell = findSnapCell(bullet.x, bullet.y);
            var bcolor = bullet.color;
            bullet = null;
            if (snapCell) resolveSnap(snapCell.row, snapCell.col, bcolor);
            addRowIfDue();
            return;
          }
        }
      }
    }

    function loseLife() {
      if (!mcqOverlay.classList.contains('hidden')) return; // already mid-gate
      misses += 1;
      missesThisStage += 1;
      playHurt();
      updateHud();
      running = false;
      showMcqGate(function () {
        startStage(); // a fresh attempt at the same stage, score/stage kept
        updateHud();
        running = true;
        lastTime = performance.now();
        if (rafId == null) rafId = requestAnimationFrame(loop);
      });
    }

    // A par time for clearing one board (typical normal-difficulty board,
    // ~5 rows of 9 bubbles) and a points-per-second decay for finishing
    // faster than that; MISS_PENALTY is proportionate to a typical clear's
    // raw score (a few hundred points once the flat +300 stage bonus is in).
    var PAR_SECONDS = 60;
    var POINTS_PER_SECOND = 3;
    var MISS_PENALTY = 60;

    function stageClear() {
      running = false;
      score += 300;
      playClear();
      var beat = score > highScore;
      updateHud();

      var elapsedSeconds = (performance.now() - stageStartTime) / 1000;
      var timeBonus = Math.max(0, Math.round((PAR_SECONDS - elapsedSeconds) * POINTS_PER_SECOND));
      var penalty = missesThisStage * MISS_PENALTY;
      var finalScore = Math.max(0, score + timeBonus - penalty);
      var result = TM.Leaderboard.submitScore(GAME_ID, finalScore, { higherIsBetter: true });
      updateTopDisplay();

      var breakdown = 'Score: ' + score +
        (timeBonus ? (' + ' + timeBonus + ' time bonus') : '') +
        (missesThisStage ? (' − ' + penalty + ' for ' + missesThisStage + ' revive' + (missesThisStage === 1 ? '' : 's')) : '') +
        ((timeBonus || missesThisStage) ? (' = ' + finalScore) : '') +
        (beat ? ' — new high score!' : '') + (result.submitted ? ' — new top score!' : '');
      var clearedStage = stage;

      // A quick knowledge check gates moving on from a cleared stage, same
      // as a life lost — scoring/leaderboard submission already happened
      // above, so answering slowly here never affects the score just
      // locked in. Unlike the danger-line gate, this one's onCorrect just
      // shows the win overlay — the stage is already won, nothing to reset.
      showMcqGate(function () {
        showOverlay('Stage clear! 🎉', 'Stage ' + clearedStage + ' cleared — ' + breakdown, 'Next stage', function () {
          stage += 1; startStage(); resetStageTimer(); updateHud(); startRunning();
        });
      });
    }

    // --- MCQ gate -----------------------------------------------------
    // Shown whenever the bubble stack reaches the danger line near the
    // shooter. Picks a random question, shuffles the displayed choice
    // order, and lets the student retry the SAME question as many times
    // as needed. A correct answer disables the choices and reveals a ✕ —
    // play only resumes once that's clicked, so the result never
    // silently disappears on its own.
    function showMcqGate(onCorrect) {
      var q = mcqs[Math.floor(Math.random() * mcqs.length)];
      var order = q.choices.map(function (text, i) { return { text: text, correct: i === q.answer }; });
      for (var i = order.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
      }
      mcqQuestionEl.textContent = q.q;
      mcqFeedbackEl.textContent = '';
      mcqFeedbackEl.className = 'bs-mcq-feedback';
      mcqChoicesEl.innerHTML = '';
      mcqCloseBtn.classList.add('hidden');
      pendingMcqCorrect = onCorrect;
      order.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bs-mcq-choice';
        btn.textContent = opt.text;
        btn.dataset.correct = opt.correct ? '1' : '0';
        btn.addEventListener('click', function () {
          if (opt.correct) {
            mcqFeedbackEl.textContent = '✅ Correct! Press ✕ to continue.';
            mcqFeedbackEl.className = 'bs-mcq-feedback is-correct';
            playMcqRight();
            mcqChoicesEl.querySelectorAll('.bs-mcq-choice').forEach(function (b) { b.disabled = true; });
            mcqCloseBtn.classList.remove('hidden');
          } else {
            mcqFeedbackEl.textContent = '❌ Not quite — try again.';
            mcqFeedbackEl.className = 'bs-mcq-feedback is-wrong';
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
      var listEl = root.querySelector('#bsMcqEditList');
      listEl.innerHTML = '';
      mcqs.forEach(function (q, qi) {
        var block = document.createElement('div');
        block.className = 'bs-mcq-edit-block';
        var qLabel = document.createElement('label');
        qLabel.textContent = 'Question ' + (qi + 1);
        var qInput = document.createElement('input');
        qInput.type = 'text';
        qInput.className = 'bs-mcq-edit-q';
        qInput.value = q.q;
        qInput.addEventListener('input', function () { q.q = qInput.value; });
        block.appendChild(qLabel);
        block.appendChild(qInput);
        q.choices.forEach(function (choiceText, ci) {
          var row = document.createElement('div');
          row.className = 'bs-mcq-edit-choice-row';
          var radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = 'bsMcqCorrect' + qi;
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
      root.querySelector('#bsMcqCopy').value = formatMcqs(mcqs);
    }

    function drawField() {
      ctx.fillStyle = '#10131f';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 2;
      ctx.strokeRect(FIELD_LEFT - 2, FIELD_TOP - 2, FIELD_WIDTH + 4, ROWS * ROW_H + BUBBLE_R);

      var dangerY = FIELD_TOP + BUBBLE_R + DANGER_ROW * ROW_H - BUBBLE_R;
      ctx.strokeStyle = '#ff7b88';
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(FIELD_LEFT - 2, dangerY);
      ctx.lineTo(FIELD_RIGHT + 2, dangerY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function drawBubble(x, y, r, colorIndex) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = COLORS[colorIndex];
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fill();
    }

    function drawShooter() {
      var tipX = SHOOTER_X + Math.cos(aimAngle) * 220;
      var tipY = SHOOTER_Y + Math.sin(aimAngle) * 220;
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(SHOOTER_X, SHOOTER_Y);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      ctx.setLineDash([]);

      drawBubble(SHOOTER_X, SHOOTER_Y, BUBBLE_R, currentColor);

      ctx.font = '11px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.textAlign = 'center';
      ctx.fillText('NEXT', W - 40, SHOOTER_Y - 36);
      drawBubble(W - 40, SHOOTER_Y - 14, BUBBLE_R * 0.6, nextColor);

      if (bullet) drawBubble(bullet.x, bullet.y, BULLET_R, bullet.color);
    }

    function render() {
      drawField();
      // Warn the player a shot before a new row actually drops — the
      // whole stack trembles a little so it reads as "about to shift
      // down", rather than a row just appearing with no notice.
      var shakeX = 0, shakeY = 0;
      if (rowDropImminent()) {
        var t = performance.now() / 45;
        shakeX = Math.sin(t) * 2.2;
        shakeY = Math.cos(t * 1.3) * 1.6;
      }
      for (var r = 0; r < ROWS; r++) {
        var maxCol = r % 2 === 0 ? COLS : COLS - 1;
        for (var c = 0; c < maxCol; c++) {
          if (grid[r][c] == null) continue;
          var ctr = cellCenter(r, c);
          drawBubble(ctr.x + shakeX, ctr.y + shakeY, BUBBLE_R - 1, grid[r][c]);
        }
      }
      drawShooter();
    }

    function loop(now) {
      if (!running) { rafId = null; return; }
      var dt = Math.max(0.1, Math.min((now - lastTime) / 16.6667, 2.5));
      lastTime = now;

      updateAim(dt);
      if (fireRequested) { fireRequested = false; fireBullet(); }
      updateBullet(dt);

      if (running) render();
      rafId = requestAnimationFrame(loop);
    }

    function onKeyDown(e) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { keys.left = true; e.preventDefault(); }
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { keys.right = true; e.preventDefault(); }
      else if (e.key === ' ') { fireRequested = true; e.preventDefault(); }
    }
    function onKeyUp(e) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    canvas.addEventListener('pointermove', function (e) {
      var rect = canvas.getBoundingClientRect();
      var scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
      var mx = (e.clientX - rect.left) * scaleX, my = (e.clientY - rect.top) * scaleY;
      var dx = mx - SHOOTER_X, dy = my - SHOOTER_Y;
      if (dy > -8) dy = -8;
      aimAngle = Math.atan2(dy, dx);
    });
    canvas.addEventListener('click', function () { fireRequested = true; });
    canvas.style.touchAction = 'none';

    function bindHold(el, key) {
      el.addEventListener('pointerdown', function (e) { e.preventDefault(); keys[key] = true; });
      el.addEventListener('pointerup', function () { keys[key] = false; });
      el.addEventListener('pointerleave', function () { keys[key] = false; });
      el.addEventListener('pointercancel', function () { keys[key] = false; });
    }
    bindHold(root.querySelector('#bsLeftBtn'), 'left');
    bindHold(root.querySelector('#bsRightBtn'), 'right');
    root.querySelector('#bsFireBtn').addEventListener('pointerdown', function (e) { e.preventDefault(); fireRequested = true; });

    root.querySelector('#bsMuteBtn').addEventListener('click', function (e) {
      soundOn = !soundOn;
      try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch (err) { /* ignore */ }
      e.target.textContent = soundOn ? '🔊' : '🔇';
      if (soundOn) ensureAudio();
    });
    root.querySelector('#bsSettingsBtn').addEventListener('click', function () {
      var panel = root.querySelector('#bsSettings');
      if (panel.classList.contains('hidden')) {
        if (!settingsUnlocked && !TM.Leaderboard.checkPassword('Enter the settings password to unlock game settings:')) return;
        settingsUnlocked = true;
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });
    root.querySelector('#bsResetTopBtn').addEventListener('click', function () {
      if (TM.Leaderboard.resetBest(GAME_ID)) updateTopDisplay();
    });
    root.querySelectorAll('.bs-diff-btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-diff') === difficulty);
      btn.addEventListener('click', function () {
        difficulty = btn.getAttribute('data-diff');
        try { localStorage.setItem(DIFFICULTY_KEY, difficulty); } catch (err) { /* ignore */ }
        root.querySelectorAll('.bs-diff-btn').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      });
    });
    root.querySelector('#bsEditBtn').addEventListener('click', function () {
      var editCard = root.querySelector('#bsMcqEdit');
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
    root.querySelector('#bsMcqSaveBtn').addEventListener('click', function () {
      saveMcqs(mcqs);
      refreshMcqCopy();
    });

    newGame();
    render();
    showOverlay('Ready?', 'Pop 3+ matching bubbles before the stack reaches the danger line. Move the mouse to aim, click/tap/Space to fire.', 'Start', function () {
      newGame(); startRunning();
    });

    window.TM.toolModules['bubble-shooter'].debugState = function () {
      return {
        score: score, misses: misses, stage: stage, grid: grid,
        mcqGateOpen: !mcqOverlay.classList.contains('hidden'),
        shotsFired: shotsFired, shotsPerRow: diffCfg().shotsPerRow,
        rowDropImminent: rowDropImminent()
      };
    };
    window.TM.toolModules['bubble-shooter'].debugSetShotsFired = function (n) { shotsFired = n; };
    window.TM.toolModules['bubble-shooter'].debugSetStageStartTime = function (t) { stageStartTime = t; };
    window.TM.toolModules['bubble-shooter'].debugForceDanger = function () {
      for (var c = 0; c < COLS; c++) grid[DANGER_ROW][c] = randomColor(colorCountForStage);
      loseLife();
    };
    window.TM.toolModules['bubble-shooter'].debugForceStageClear = function () {
      for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) grid[r][c] = null;
      checkStageClearOrDanger();
    };
    window.TM.toolModules['bubble-shooter'].debugAnswerMcq = function (correct) {
      var btns = mcqChoicesEl.querySelectorAll('.bs-mcq-choice');
      for (var k = 0; k < btns.length; k++) {
        var isRight = btns[k].dataset.correct === '1';
        if (isRight === !!correct) { btns[k].click(); return true; }
      }
      return false;
    };

    window.TM.toolModules['bubble-shooter'].unmount = function () {
      running = false;
      if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }

  window.TM.registerTool('bubble-shooter', { mount: mount });
})();
