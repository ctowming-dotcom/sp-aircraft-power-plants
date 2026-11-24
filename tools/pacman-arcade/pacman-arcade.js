(function () {
  window.TM = window.TM || {};

  var TILE = 20;
  var COLS = 19;
  var ROWS = 21;
  var W = COLS * TILE;
  var H = ROWS * TILE;

  // Validated offline with a BFS connectivity check — every floor tile
  // (including the ghost house, via its door) is reachable from the
  // player spawn, and the tunnel row (10) wraps left<->right. Denser
  // than the first version (more pillars, narrower corridors) by request
  // ("more complex maze"), re-validated the same way after the change.
  var MAZE = [
    '###################',
    '#o...............o#',
    '#.##..#.....#..##.#',
    '#.....#.....#.....#',
    '#.#..##.....##..#.#',
    '#.#.............#.#',
    '####.#.......#.####',
    '#....#.......#....#',
    '#......## ##......#',
    '#.#..#.#   #.#..#.#',
    '..#....#   #....#..',
    '#......#   #......#',
    '#......#####......#',
    '####.#.......#.####',
    '#....#.......#....#',
    '#.#..##.....##..#.#',
    '#.#.............#.#',
    '#.##..#.. ..#..##.#',
    '#.....#.....#.....#',
    '#o...............o#',
    '###################',
  ];

  var PLAYER_SPAWN = { r: 17, c: 9 };
  var DOOR_TILE = { r: 8, c: 9 };
  var HOUSE_EXIT = { r: 7, c: 9 }; // just above the door — ghosts head here to leave
  var HOUSE_TILES = (function () {
    var set = {};
    for (var r = 9; r <= 11; r++) for (var c = 8; c <= 10; c++) set[r + ',' + c] = true;
    set[DOOR_TILE.r + ',' + DOOR_TILE.c] = true;
    return set;
  })();

  // 5 ghosts, one released every N seconds (by request — "3 to 5 hunters
  // release on every 30 secs", then tightened to "every 8s per ghost") so
  // the pressure keeps ramping up the longer a maze runs, rather than all
  // of them being loose from the start. The actual interval is set per
  // difficulty below; releaseIndex just says "1st/2nd/3rd... to release".
  var GHOST_DEFS = [
    { color: '#ff4d4d', spawn: { r: 10, c: 8 }, scatter: { r: 1, c: 1 }, releaseIndex: 0 },
    { color: '#ffb8de', spawn: { r: 9, c: 9 }, scatter: { r: 1, c: 17 }, releaseIndex: 1 },
    { color: '#4dd2ff', spawn: { r: 10, c: 10 }, scatter: { r: 19, c: 1 }, releaseIndex: 2 },
    { color: '#ffb347', spawn: { r: 10, c: 9 }, scatter: { r: 19, c: 17 }, releaseIndex: 3 },
    { color: '#8bd45c', spawn: { r: 11, c: 9 }, scatter: { r: 1, c: 9 }, releaseIndex: 4 },
  ];

  var PLAYER_SPEED = 2.1;
  var SCATTER_MS = 7000;
  var CHASE_MS = 20000;
  var HIGH_SCORE_KEY = 'tm.pacmanArcade.highScore.v2';

  // Difficulty: slower/later ghosts and a longer power-pellet window on
  // Easy; faster/sooner ghosts and a shorter window on Hard. Lives are
  // unlimited on every tier — a catch means one MCQ gate, not a limit.
  var DIFFICULTY_KEY = 'tm.pacmanArcade.difficulty';
  var DIFFICULTY_SETTINGS = {
    easy: { ghostSpeed: 1.4, frightenedSpeed: 0.9, eyesSpeed: 3.2, frightenedMs: 9000, releaseIntervalMs: 12000 },
    normal: { ghostSpeed: 1.7, frightenedSpeed: 1.0, eyesSpeed: 3.4, frightenedMs: 7000, releaseIntervalMs: 8000 },
    hard: { ghostSpeed: 2.0, frightenedSpeed: 1.1, eyesSpeed: 3.6, frightenedMs: 5000, releaseIntervalMs: 5000 },
  };
  var difficulty = 'normal';
  try {
    var savedDiff = localStorage.getItem(DIFFICULTY_KEY);
    if (DIFFICULTY_SETTINGS[savedDiff]) difficulty = savedDiff;
  } catch (err) { /* ignore */ }
  function diffCfg() { return DIFFICULTY_SETTINGS[difficulty]; }

  // Tiny self-contained Web Audio sound effects — no audio files, so the
  // site stays build-step-free. Lazily created on first sound, which is
  // always triggered from a user gesture (move key, click), satisfying
  // the browser autoplay-gesture requirement with no extra plumbing.
  var SOUND_KEY = 'tm.pacmanArcade.sound';
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
    gain.gain.linearRampToValueAtTime(vol == null ? 0.14 : vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.03);
  }
  var dotToneToggle = false;
  function playDotEat() { dotToneToggle = !dotToneToggle; beep(dotToneToggle ? 300 : 220, 0.05, 'square', 0.08); }
  function playPelletEat() { beep(180, 0.12, 'sawtooth', 0.16); beep(140, 0.14, 'sawtooth', 0.14, 0.08); }
  function playGhostEat() { beep(440, 0.07, 'square', 0.16); beep(660, 0.07, 'square', 0.16, 0.07); beep(880, 0.1, 'square', 0.18, 0.14); }
  function playLoseLife() { beep(280, 0.14, 'sawtooth', 0.18); beep(200, 0.16, 'sawtooth', 0.16, 0.1); beep(120, 0.22, 'sawtooth', 0.16, 0.22); }
  function playClear() { beep(523, 0.1, 'square', 0.18); beep(659, 0.1, 'square', 0.18, 0.1); beep(784, 0.1, 'square', 0.18, 0.2); beep(1046, 0.22, 'square', 0.2, 0.3); }
  function playMcqRight() { beep(523, 0.09, 'square', 0.18); beep(784, 0.14, 'square', 0.18, 0.09); }
  function playMcqWrong() { beep(180, 0.18, 'sawtooth', 0.18); }

  // Every ghost catch is gated behind one of these 10 aircraft-power-plant
  // MCQs — unlimited retries on the same question until the student gets
  // it right, then the maze resumes. Editable in-browser via the
  // password-gated "✎" edit panel (password APP, same casual click-guard
  // as every other tool's edit mode).
  var DEFAULT_MCQS = [
    { q: 'What is a "spool" in a turbofan engine?', choices: ['A shaft plus its compressor and turbine stages spinning together', 'A type of fuel line', 'An oil filter', 'A cockpit gauge'], answer: 0 },
    { q: 'What does the intake do?', choices: ['Lets air first enter the engine', 'Burns fuel', 'Cools oil', 'Detects fire'], answer: 0 },
    { q: 'What produces thrust?', choices: ['Accelerating air rearward', 'The fire extinguisher', 'The starter motor', 'The oil pump'], answer: 0 },
    { q: 'What is a rotor?', choices: ['The rotating set of blades on a compressor/turbine stage', 'A fixed vane', 'A fuel tank', 'A warning light'], answer: 0 },
    { q: 'Where does exhaust gas exit?', choices: ['Through the nozzle', 'Through the intake', 'Through the oil filter', 'Through the fire loop'], answer: 0 },
    { q: 'What is removable cowling for?', choices: ['Access and streamlining over the engine', 'Starting the engine', 'Detecting fire', 'Storing fuel'], answer: 0 },
    { q: 'What\'s the "core" of a turbofan?', choices: ['Compressor, combustor and turbine together', 'Just the fan', 'The nacelle only', 'The fire bottle'], answer: 0 },
    { q: 'What does an igniter do?', choices: ['Sparks to light the fuel-air mixture', 'Cools the turbine', 'Filters oil', 'Measures thrust'], answer: 0 },
    { q: "What's a blade?", choices: ['A single airfoil-shaped component on a rotor/fan disc', 'A type of bolt', 'A fuel valve', 'A cockpit switch'], answer: 0 },
    { q: "What's the shaft's job?", choices: ['Connects a turbine stage to its compressor', 'Stores fuel', 'Detects pressure', 'Cools the cabin'], answer: 0 },
  ];
  var MCQ_KEY = 'tm.pacmanArcade.mcqs';
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

  var DIRS = {
    up: { dr: -1, dc: 0 },
    down: { dr: 1, dc: 0 },
    left: { dr: 0, dc: -1 },
    right: { dr: 0, dc: 1 },
  };
  var OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

  function tileChar(r, c) {
    if (r < 0 || r >= ROWS) return '#';
    var row = MAZE[r];
    var cc = ((c % COLS) + COLS) % COLS;
    return row.charAt(cc);
  }
  function isWall(r, c) { return tileChar(r, c) === '#'; }
  function isHouseTile(r, c) { return !!HOUSE_TILES[r + ',' + c]; }

  function mount(root) {
    root.innerHTML =
      '<div class="pac-wrap">' +
      '<h1>👻 Maze Muncher</h1>' +
      '<p class="pac-intro">Clear every dot while dodging the ghosts — one more ghost joins every so often, up to 5, so the longer a maze runs the hotter it gets. Grab a big pellet to turn the tables — chase them down for bonus points while they\'re blue. Arrow keys / WASD to move. Lives are unlimited — getting caught means one quick knowledge-check question before you carry on.</p>' +
      '<div class="pac-hud">' +
      '<div class="pac-stat"><span class="pac-stat-label">Score</span><span class="pac-stat-value" id="pacScore">0</span></div>' +
      '<div class="pac-stat"><span class="pac-stat-label">High score</span><span class="pac-stat-value" id="pacHigh">0</span></div>' +
      '<div class="pac-stat pac-stat-top"><span class="pac-stat-label">Top score</span><span class="pac-stat-value" id="pacTopScore">--</span></div>' +
      '<div class="pac-stat"><span class="pac-stat-label">Misses</span><span class="pac-stat-value" id="pacLives">0</span></div>' +
      '<button type="button" class="pac-btn hidden" id="pacEndBtn">⏹ End</button>' +
      '<button type="button" class="pac-mute-btn" id="pacMuteBtn" aria-label="Toggle sound">' + (soundOn ? '🔊' : '🔇') + '</button>' +
      '<button type="button" class="pac-mute-btn" id="pacSettingsBtn" aria-label="Game settings">⚙️</button>' +
      '<button type="button" class="pac-mute-btn" id="pacEditBtn" aria-label="Edit questions">✎</button>' +
      '</div>' +
      '<div class="pac-guide hidden" id="pacSettings">' +
      '<h2>⚙️ Game Settings</h2>' +
      '<p>Easy means slower ghosts, released further apart, with a longer power-pellet window; Hard means the opposite. Takes effect on your next maze.</p>' +
      '<div class="pac-diff-row">' +
      '<button type="button" class="pac-tab pac-diff-btn" data-diff="easy">Easy</button>' +
      '<button type="button" class="pac-tab pac-diff-btn" data-diff="normal">Normal</button>' +
      '<button type="button" class="pac-tab pac-diff-btn" data-diff="hard">Hard</button>' +
      '</div>' +
      '<button type="button" class="pac-btn pac-btn-ghost" id="pacResetTopBtn" style="margin-top:10px;">Reset top score…</button>' +
      '</div>' +
      '<div class="pac-stage">' +
      '<canvas id="pacCanvas" width="' + W + '" height="' + H + '"></canvas>' +
      '<div class="pac-overlay hidden" id="pacOverlay">' +
      '<div class="pac-overlay-card">' +
      '<h2 id="pacOverlayTitle"></h2>' +
      '<p id="pacOverlayMsg"></p>' +
      '<button type="button" class="pac-btn pac-btn-primary" id="pacOverlayBtn"></button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="pac-touch">' +
      '<div></div><button type="button" class="pac-touch-btn" id="pacUpBtn">▲</button><div></div>' +
      '<button type="button" class="pac-touch-btn" id="pacLeftBtn">◀</button>' +
      '<div class="pac-touch-fill"></div>' +
      '<button type="button" class="pac-touch-btn" id="pacRightBtn">▶</button>' +
      '<div></div><button type="button" class="pac-touch-btn" id="pacDownBtn">▼</button><div></div>' +
      '</div>' +
      '<div class="pac-mcq-overlay hidden" id="pacMcqOverlay">' +
      '<div class="pac-mcq-card">' +
      '<button type="button" class="pac-mcq-close hidden" id="pacMcqCloseBtn" aria-label="Close">✕</button>' +
      '<h2>📝 Quick Check</h2>' +
      '<p class="pac-mcq-note">Answer correctly to get back in — try as many times as you need.</p>' +
      '<p class="pac-mcq-question" id="pacMcqQuestion"></p>' +
      '<div class="pac-mcq-choices" id="pacMcqChoices"></div>' +
      '<p class="pac-mcq-feedback" id="pacMcqFeedback"></p>' +
      '</div>' +
      '</div>' +
      '<div class="pac-guide hidden" id="pacMcqEdit">' +
      '<h2>✎ Edit questions</h2>' +
      '<p>Change any question, its 4 choices, or which one is correct. Saved to this browser only — paste the box below into pacman-arcade.js to make it the default for everyone.</p>' +
      '<div id="pacMcqEditList"></div>' +
      '<div class="pac-diff-row">' +
      '<button type="button" class="pac-btn pac-btn-primary" id="pacMcqSaveBtn">Save changes</button>' +
      '</div>' +
      '<p class="pac-mcq-note">Copy-paste source:</p>' +
      '<textarea class="pac-mcq-copy" id="pacMcqCopy" readonly rows="8"></textarea>' +
      '</div>' +
      '</div>';

    var canvas = root.querySelector('#pacCanvas');
    var ctx = canvas.getContext('2d');
    var scoreEl = root.querySelector('#pacScore');
    var highEl = root.querySelector('#pacHigh');
    var livesEl = root.querySelector('#pacLives');
    var overlay = root.querySelector('#pacOverlay');
    var overlayTitle = root.querySelector('#pacOverlayTitle');
    var overlayMsg = root.querySelector('#pacOverlayMsg');
    var overlayBtn = root.querySelector('#pacOverlayBtn');
    var mcqOverlay = root.querySelector('#pacMcqOverlay');
    var mcqQuestionEl = root.querySelector('#pacMcqQuestion');
    var mcqChoicesEl = root.querySelector('#pacMcqChoices');
    var mcqFeedbackEl = root.querySelector('#pacMcqFeedback');
    var mcqs = loadMcqs();
    var mcqEditUnlocked = false;
    var mcqCloseBtn = root.querySelector('#pacMcqCloseBtn');
    var pendingMcqCorrect = null;
    var topScoreEl = root.querySelector('#pacTopScore');
    var endBtn = root.querySelector('#pacEndBtn');
    var settingsUnlocked = false;

    var highScore = 0;
    try { highScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0; } catch (err) { highScore = 0; }
    highEl.textContent = highScore;

    function updateTopScoreDisplay() { topScoreEl.textContent = TM.Leaderboard.bestLabel('pacmanArcade'); }
    updateTopScoreDisplay();

    var dots, pelletsLeft, score, misses, player, ghosts, mode, modeTimer, frightenedUntil, eatMultiplier, running, rafId, lastTime;

    function tileCenter(r, c) { return { x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 }; }

    function buildDots() {
      dots = {};
      var count = 0;
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          var ch = tileChar(r, c);
          if (ch === '.' || ch === 'o') { dots[r + ',' + c] = ch; count++; }
        }
      }
      pelletsLeft = count;
    }

    function resetPositions() {
      var p = tileCenter(PLAYER_SPAWN.r, PLAYER_SPAWN.c);
      player = { x: p.x, y: p.y, dir: null, want: null };
      ghosts = GHOST_DEFS.map(function (def, i) {
        var g = tileCenter(def.spawn.r, def.spawn.c);
        var releaseMs = def.releaseIndex * diffCfg().releaseIntervalMs;
        return {
          color: def.color,
          scatter: def.scatter,
          x: g.x, y: g.y,
          dir: 'up',
          state: releaseMs === 0 ? 'exiting' : 'house',
          releaseAt: performance.now() + releaseMs,
        };
      });
    }

    // Leaderboard scoring adds a time bonus (faster maze clear = more
    // points) and subtracts a flat penalty per life lost during the
    // attempt — tracked per maze, not cumulatively across mazes, and
    // reset every time a fresh maze starts. PAR_SECONDS/POINTS_PER_SECOND
    // are tuned to this maze's own size (19x21, ~150-200 dots): a clean
    // clear in well under a minute is realistic, so the bonus decays to
    // 0 by 45s; MISS_PENALTY (150) is pitched around one eaten-ghost's
    // worth of points, enough to matter without swamping a full clear.
    var PAR_SECONDS = 45;
    var POINTS_PER_SECOND = 5;
    var MISS_PENALTY = 150;
    var levelStartTime = 0;
    var missesThisLevel = 0;

    function startLevel() {
      buildDots();
      resetPositions();
      mode = 'scatter';
      modeTimer = performance.now() + SCATTER_MS;
      frightenedUntil = 0;
      eatMultiplier = 1;
      levelStartTime = performance.now();
      missesThisLevel = 0;
    }

    function startGame() {
      score = 0;
      misses = 0;
      startLevel();
      updateHud();
      overlay.classList.add('hidden');
      running = true;
      endBtn.classList.remove('hidden');
      lastTime = performance.now();
      if (rafId == null) rafId = requestAnimationFrame(loop);
    }

    function endGame() {
      if (!running) return;
      running = false;
      if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
      mcqOverlay.classList.add('hidden');
      mcqCloseBtn.classList.add('hidden');
      pendingMcqCorrect = null;
      var result = TM.Leaderboard.submitScore('pacmanArcade', score, { higherIsBetter: true });
      updateTopScoreDisplay();
      showOverlay('Maze ended', 'Score: ' + score + (result.submitted ? ' — 🏆 new top score!' : ''), 'Start', startGame);
    }

    function updateHud() {
      scoreEl.textContent = score;
      livesEl.textContent = misses;
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

    function playerTile() { return { r: Math.round((player.y - TILE / 2) / TILE), c: Math.round((player.x - TILE / 2) / TILE) }; }
    function entityTile(e) { return { r: Math.round((e.y - TILE / 2) / TILE), c: Math.round((e.x - TILE / 2) / TILE) }; }
    // Tolerance scales with how far this entity moves in a single frame
    // (speed * dt) rather than a fixed 1.2px — at the default ~60fps that's
    // about the same, but a slow frame (dt clamped up to 2.5x) or a fast
    // entity (eyes returning to the house move at up to eyesSpeed, nearly
    // double normal ghost speed) can step clean over a fixed, narrow
    // window in one frame and silently skip the "centered" instant a turn
    // is evaluated on — which is exactly what made steering feel like it
    // was ignoring key presses. A dynamic tolerance guarantees the window
    // is always at least as wide as the step that's about to cross it.
    function isCentered(e, speed, dt) {
      var t = entityTile(e);
      var center = tileCenter(t.r, t.c);
      var tol = Math.max(1.2, (speed || PLAYER_SPEED) * (dt || 1) * 0.6 + 0.6);
      return Math.abs(e.x - center.x) < tol && Math.abs(e.y - center.y) < tol;
    }

    function canPlayerEnter(r, c) { return !isWall(r, c) && !isHouseTile(r, c); }
    function canGhostEnter(r, c) { return !isWall(r, c); }

    function updatePlayer(dt) {
      var t = entityTile(player);
      if (isCentered(player, PLAYER_SPEED, dt)) {
        var center = tileCenter(t.r, t.c);
        player.x = center.x; player.y = center.y;
        if (player.want && canPlayerEnter(t.r + DIRS[player.want].dr, t.c + DIRS[player.want].dc)) {
          player.dir = player.want;
        }
        if (player.dir && !canPlayerEnter(t.r + DIRS[player.dir].dr, t.c + DIRS[player.dir].dc)) {
          player.dir = null;
        }
      }
      if (player.dir) {
        var d = DIRS[player.dir];
        player.x += d.dc * PLAYER_SPEED * dt;
        player.y += d.dr * PLAYER_SPEED * dt;
      }
      if (player.x < -TILE / 2) player.x = W + TILE / 2;
      else if (player.x > W + TILE / 2) player.x = -TILE / 2;

      var pt = entityTile(player);
      var key = pt.r + ',' + pt.c;
      if (dots[key]) {
        var wasPellet = dots[key] === 'o';
        delete dots[key];
        pelletsLeft--;
        score += wasPellet ? 50 : 10;
        if (wasPellet) {
          playPelletEat();
          frightenedUntil = performance.now() + diffCfg().frightenedMs;
          eatMultiplier = 1;
          ghosts.forEach(function (g) { if (g.state === 'chase' || g.state === 'scatter' || g.state === 'frightened') g.state = 'frightened'; });
        } else {
          playDotEat();
        }
        updateHud();
        if (pelletsLeft <= 0) levelClear();
      }
    }

    function ghostTargetFor(g, now) {
      if (g.state === 'eyes') return HOUSE_EXIT;
      if (g.state === 'exiting') return HOUSE_EXIT;
      if (g.state === 'frightened') return null; // random
      if (mode === 'scatter') return g.scatter;
      return playerTile();
    }

    function chooseGhostDirection(g, now) {
      var t = entityTile(g);
      var target = ghostTargetFor(g, now);
      var valid = ['up', 'down', 'left', 'right'].filter(function (dir) {
        var nr = t.r + DIRS[dir].dr, nc = t.c + DIRS[dir].dc;
        return canGhostEnter(nr, nc);
      });
      var nonReverse = valid.filter(function (dir) { return !g.dir || dir !== OPPOSITE[g.dir]; });
      var pool = nonReverse.length ? nonReverse : valid;
      if (!pool.length) return g.dir;

      if (!target) {
        return pool[Math.floor(Math.random() * pool.length)];
      }
      var targetPx = tileCenter(target.r, target.c);
      var best = null, bestDist = Infinity;
      pool.forEach(function (dir) {
        var nr = t.r + DIRS[dir].dr, nc = t.c + DIRS[dir].dc;
        var p = tileCenter(nr, nc);
        var dist = (p.x - targetPx.x) * (p.x - targetPx.x) + (p.y - targetPx.y) * (p.y - targetPx.y);
        if (dist < bestDist) { bestDist = dist; best = dir; }
      });
      return best;
    }

    function updateGhost(g, dt, now) {
      if (g.state === 'house') {
        if (now >= g.releaseAt) g.state = 'exiting';
        return;
      }
      var speed = diffCfg().ghostSpeed;
      if (g.state === 'frightened') speed = diffCfg().frightenedSpeed;
      else if (g.state === 'eyes' || g.state === 'exiting') speed = diffCfg().eyesSpeed;

      if (isCentered(g, speed, dt)) {
        var t = entityTile(g);
        var center = tileCenter(t.r, t.c);
        g.x = center.x; g.y = center.y;
        if (g.state === 'exiting' && t.r <= HOUSE_EXIT.r) {
          g.state = (mode === 'scatter') ? 'scatter' : 'chase';
        } else if (g.state === 'eyes' && t.r === HOUSE_EXIT.r && t.c === HOUSE_EXIT.c) {
          g.state = 'house';
          g.releaseAt = now + 2500;
        } else {
          g.dir = chooseGhostDirection(g, now);
        }
      }
      if (g.dir) {
        var d = DIRS[g.dir];
        g.x += d.dc * speed * dt;
        g.y += d.dr * speed * dt;
      }
      if (g.x < -TILE / 2) g.x = W + TILE / 2;
      else if (g.x > W + TILE / 2) g.x = -TILE / 2;
    }

    function checkFrightenedExpiry(now) {
      if (frightenedUntil && now >= frightenedUntil) {
        frightenedUntil = 0;
        ghosts.forEach(function (g) { if (g.state === 'frightened') g.state = (mode === 'scatter') ? 'scatter' : 'chase'; });
      }
    }

    function checkModeSwitch(now) {
      if (now >= modeTimer) {
        mode = (mode === 'scatter') ? 'chase' : 'scatter';
        modeTimer = now + (mode === 'scatter' ? SCATTER_MS : CHASE_MS);
        ghosts.forEach(function (g) {
          if (g.state === 'chase' || g.state === 'scatter') g.state = mode;
        });
      }
    }

    function checkCollisions() {
      for (var i = 0; i < ghosts.length; i++) {
        var g = ghosts[i];
        if (g.state === 'house' || g.state === 'exiting') continue;
        var dx = g.x - player.x, dy = g.y - player.y;
        if (dx * dx + dy * dy < (TILE * 0.6) * (TILE * 0.6)) {
          if (g.state === 'frightened') {
            score += 200 * eatMultiplier;
            eatMultiplier = Math.min(eatMultiplier + 1, 8);
            playGhostEat();
            updateHud();
            g.state = 'eyes';
          } else if (g.state !== 'eyes') {
            loseLife();
            return;
          }
        }
      }
    }

    function loseLife() {
      misses += 1;
      missesThisLevel += 1;
      playLoseLife();
      updateHud();
      running = false;
      showMcqGate(function () {
        resetPositions();
        running = true;
        lastTime = performance.now();
        if (rafId == null) rafId = requestAnimationFrame(loop);
      });
    }

    // --- MCQ gate -----------------------------------------------------
    // Shown on every ghost catch. Picks a random question from the
    // (possibly teacher-edited) bank, shuffles the displayed choice order
    // so the correct answer's on-screen position never gives it away,
    // and lets the student retry the SAME question as many times as
    // needed — no penalty, no limit, just a short pause gate.
    function showMcqGate(onCorrect) {
      var q = mcqs[Math.floor(Math.random() * mcqs.length)];
      var order = q.choices.map(function (text, i) { return { text: text, correct: i === q.answer }; });
      for (var i = order.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
      }
      mcqQuestionEl.textContent = q.q;
      mcqFeedbackEl.textContent = '';
      mcqFeedbackEl.className = 'pac-mcq-feedback';
      mcqChoicesEl.innerHTML = '';
      mcqCloseBtn.classList.add('hidden');
      pendingMcqCorrect = onCorrect;
      order.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pac-mcq-choice';
        btn.textContent = opt.text;
        btn.dataset.correct = opt.correct ? '1' : '0';
        btn.addEventListener('click', function () {
          if (opt.correct) {
            mcqFeedbackEl.textContent = '✅ Correct!';
            mcqFeedbackEl.className = 'pac-mcq-feedback is-correct';
            playMcqRight();
            mcqChoicesEl.querySelectorAll('.pac-mcq-choice').forEach(function (b) { b.disabled = true; });
            mcqCloseBtn.classList.remove('hidden');
          } else {
            mcqFeedbackEl.textContent = '❌ Not quite — try again.';
            mcqFeedbackEl.className = 'pac-mcq-feedback is-wrong';
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
      var listEl = root.querySelector('#pacMcqEditList');
      listEl.innerHTML = '';
      mcqs.forEach(function (q, qi) {
        var block = document.createElement('div');
        block.className = 'pac-mcq-edit-block';
        var qLabel = document.createElement('label');
        qLabel.textContent = 'Question ' + (qi + 1);
        var qInput = document.createElement('input');
        qInput.type = 'text';
        qInput.className = 'pac-mcq-edit-q';
        qInput.value = q.q;
        qInput.addEventListener('input', function () { q.q = qInput.value; });
        block.appendChild(qLabel);
        block.appendChild(qInput);
        q.choices.forEach(function (choiceText, ci) {
          var row = document.createElement('div');
          row.className = 'pac-mcq-edit-choice-row';
          var radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = 'pacMcqCorrect' + qi;
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
      root.querySelector('#pacMcqCopy').value = formatMcqs(mcqs);
    }

    function levelClear() {
      running = false;
      playClear();
      var beat = score > highScore;
      if (beat) { highScore = score; try { localStorage.setItem(HIGH_SCORE_KEY, String(highScore)); } catch (err) {} highEl.textContent = highScore; }

      var elapsedSeconds = (performance.now() - levelStartTime) / 1000;
      var timeBonus = Math.max(0, Math.round((PAR_SECONDS - elapsedSeconds) * POINTS_PER_SECOND));
      var penalty = missesThisLevel * MISS_PENALTY;
      var finalScore = Math.max(0, score + timeBonus - penalty);
      var result = TM.Leaderboard.submitScore('pacmanArcade', finalScore, { higherIsBetter: true });
      updateTopScoreDisplay();

      var parts = ['Score: ' + score];
      if (timeBonus) parts.push('+ ' + timeBonus + ' time bonus');
      if (penalty) parts.push('− ' + penalty + ' for ' + missesThisLevel + ' revive' + (missesThisLevel === 1 ? '' : 's'));
      var msg = parts.join(' ');
      if (timeBonus || penalty) msg += ' = ' + finalScore;
      msg += (beat ? ' — new high score!' : '') + (result.submitted ? ' 🏆 new top score!' : '');

      // A quick knowledge check gates moving on from a cleared maze, same
      // as a life lost — scoring/leaderboard submission already happened
      // above, so answering slowly here never affects the score just locked in.
      showMcqGate(function () {
        showOverlay('Maze clear! 🎉', msg, 'Next maze', function () {
          startLevel();
          updateHud();
          overlay.classList.add('hidden');
          running = true;
          endBtn.classList.remove('hidden');
          lastTime = performance.now();
        });
      });
    }

    function drawMaze() {
      ctx.fillStyle = '#060c18';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#1a3fae';
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          if (tileChar(r, c) === '#') {
            ctx.beginPath();
            var x = c * TILE, y = r * TILE, rad = 4;
            ctx.moveTo(x + rad, y);
            ctx.arcTo(x + TILE, y, x + TILE, y + TILE, rad);
            ctx.arcTo(x + TILE, y + TILE, x, y + TILE, rad);
            ctx.arcTo(x, y + TILE, x, y, rad);
            ctx.arcTo(x, y, x + TILE, y, rad);
            ctx.closePath();
            ctx.fill();
          }
        }
      }
    }

    function drawDots(now) {
      Object.keys(dots).forEach(function (key) {
        var parts = key.split(','), r = Number(parts[0]), c = Number(parts[1]);
        var center = tileCenter(r, c);
        var isPellet = dots[key] === 'o';
        ctx.fillStyle = '#ffe9a8';
        ctx.beginPath();
        if (isPellet) {
          var pulse = 0.75 + 0.25 * Math.sin(now / 180);
          ctx.arc(center.x, center.y, TILE * 0.28 * pulse, 0, Math.PI * 2);
        } else {
          ctx.arc(center.x, center.y, TILE * 0.11, 0, Math.PI * 2);
        }
        ctx.fill();
      });
    }

    function drawPlayer(now) {
      var angle = { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 }[player.dir || 'right'];
      var mouth = Math.abs(Math.sin(now / 90)) * 0.28 * Math.PI;
      ctx.fillStyle = '#ffd400';
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.arc(player.x, player.y, TILE * 0.42, angle + mouth, angle - mouth + Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    }

    function drawGhostBody(x, y, color) {
      var r = TILE * 0.42;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y - r * 0.1, r, Math.PI, 0, false);
      ctx.lineTo(x + r, y + r * 0.75);
      var bumps = 4;
      for (var i = 0; i < bumps; i++) {
        var bx = x + r - (2 * r * (i + 1)) / bumps;
        var midx = x + r - (2 * r * (i + 0.5)) / bumps;
        ctx.quadraticCurveTo(midx, y + r * 0.45, bx, y + r * 0.75);
      }
      ctx.lineTo(x - r, y - r * 0.1);
      ctx.closePath();
      ctx.fill();
    }

    function drawGhostEyes(x, y, dir, color) {
      var off = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir || 'down'];
      var ex = TILE * 0.14, ey = TILE * 0.03;
      [-1, 1].forEach(function (side) {
        var cx = x + side * ex;
        var cy = y - TILE * 0.06;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(cx, cy, TILE * 0.11, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = color || '#1a3fae';
        ctx.beginPath(); ctx.arc(cx + off[0] * 3, cy + off[1] * 3, TILE * 0.055, 0, Math.PI * 2); ctx.fill();
      });
    }

    function drawGhost(g, now) {
      if (g.state === 'house') return;
      if (g.state === 'eyes') { drawGhostEyes(g.x, g.y, g.dir, '#1a3fae'); return; }
      var color = g.color;
      if (g.state === 'frightened') {
        var flashing = frightenedUntil - now < 2000 && Math.floor(now / 160) % 2 === 0;
        color = flashing ? '#e7ecff' : '#2b4cff';
      }
      drawGhostBody(g.x, g.y, color);
      drawGhostEyes(g.x, g.y, g.dir, '#1a3fae');
    }

    function render(now) {
      drawMaze();
      drawDots(now);
      ghosts.forEach(function (g) { drawGhost(g, now); });
      drawPlayer(now);
    }

    function loop(now) {
      if (!running) { rafId = null; return; }
      var dt = Math.max(0.1, Math.min((now - lastTime) / 16.6667, 2.5));
      lastTime = now;
      updatePlayer(dt);
      checkModeSwitch(now);
      checkFrightenedExpiry(now);
      ghosts.forEach(function (g) { updateGhost(g, dt, now); });
      checkCollisions();
      if (running) render(now);
      rafId = requestAnimationFrame(loop);
    }

    function onKeyDown(e) {
      var map = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
      if (map[e.key]) { if (player) player.want = map[e.key]; e.preventDefault(); }
    }
    window.addEventListener('keydown', onKeyDown);

    function bindTouch(el, dir) {
      el.addEventListener('pointerdown', function (e) { e.preventDefault(); if (player) player.want = dir; });
    }
    root.querySelector('#pacMuteBtn').addEventListener('click', function (e) {
      soundOn = !soundOn;
      try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch (err) { /* ignore */ }
      e.target.textContent = soundOn ? '🔊' : '🔇';
      if (soundOn) ensureAudio();
    });
    root.querySelector('#pacSettingsBtn').addEventListener('click', function () {
      var panel = root.querySelector('#pacSettings');
      if (panel.classList.contains('hidden')) {
        if (!settingsUnlocked && !TM.Leaderboard.checkPassword('Enter the settings password to unlock game settings:')) return;
        settingsUnlocked = true;
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });
    root.querySelector('#pacResetTopBtn').addEventListener('click', function () {
      if (TM.Leaderboard.resetBest('pacmanArcade')) updateTopScoreDisplay();
    });
    endBtn.addEventListener('click', endGame);
    root.querySelectorAll('.pac-diff-btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-diff') === difficulty);
      btn.addEventListener('click', function () {
        difficulty = btn.getAttribute('data-diff');
        try { localStorage.setItem(DIFFICULTY_KEY, difficulty); } catch (err) { /* ignore */ }
        root.querySelectorAll('.pac-diff-btn').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      });
    });
    root.querySelector('#pacEditBtn').addEventListener('click', function () {
      var editCard = root.querySelector('#pacMcqEdit');
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
    root.querySelector('#pacMcqSaveBtn').addEventListener('click', function () {
      saveMcqs(mcqs);
      refreshMcqCopy();
    });

    bindTouch(root.querySelector('#pacUpBtn'), 'up');
    bindTouch(root.querySelector('#pacDownBtn'), 'down');
    bindTouch(root.querySelector('#pacLeftBtn'), 'left');
    bindTouch(root.querySelector('#pacRightBtn'), 'right');

    // initial idle screen (draws the maze behind a start prompt)
    buildDots();
    resetPositions();
    render(0);
    showOverlay('Ready?', 'Clear the maze, dodge the ghosts, chase them down when they turn blue.', 'Start', startGame);

    window.TM.toolModules['pacman-arcade'].debugState = function () {
      return { player: player, ghosts: ghosts, dots: dots, misses: misses, mcqGateOpen: !mcqOverlay.classList.contains('hidden') };
    };
    window.TM.toolModules['pacman-arcade'].debugForceLoseLife = function () { loseLife(); };
    window.TM.toolModules['pacman-arcade'].debugForceClear = function () { levelClear(); };
    window.TM.toolModules['pacman-arcade'].debugForceEnd = function () { endGame(); };
    window.TM.toolModules['pacman-arcade'].debugAnswerMcq = function (correct) {
      var btns = mcqChoicesEl.querySelectorAll('.pac-mcq-choice');
      for (var k = 0; k < btns.length; k++) {
        var isRight = btns[k].dataset.correct === '1';
        if (isRight === !!correct) { btns[k].click(); return true; }
      }
      return false;
    };

    window.TM.toolModules['pacman-arcade'].unmount = function () {
      running = false;
      if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
      window.removeEventListener('keydown', onKeyDown);
    };
  }

  window.TM.registerTool('pacman-arcade', { mount: mount });
})();
