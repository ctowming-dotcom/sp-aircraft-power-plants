(function () {
  window.TM = window.TM || {};

  // A retro top-down tank battle arcade game (Battle-City/1990 Tank style)
  // — an original level/character design in that classic genre, not a
  // reproduction of any specific game's art or level data. Built from
  // scratch with every convention established this session already baked
  // in (unlimited lives + persistent MCQ gate, password-locked settings,
  // named leaderboard) — see barrel-climb.js, which this file mirrors
  // structurally.

  var TILE = 40;
  var GRID = 14; // 14x14 tiles -> 560x560 canvas
  var W = TILE * GRID;
  var H = TILE * GRID;
  var TANK_SIZE = 32;
  var BULLET_SIZE = 6;
  var BASE_COL = 6, BASE_ROW = GRID - 1;

  var HIGH_SCORE_KEY = 'tm.tankBattle.highScore.v2';
  var GAME_ID = 'tankBattle';
  var RESPAWN_INVULN_MS = 1500;

  // Difficulty tunes enemy count/speed/fire rate — never lives, which are
  // unlimited on every tier (a hit just means one MCQ gate, not a limit).
  var DIFFICULTY_KEY = 'tm.tankBattle.difficulty';
  var DIFFICULTY_SETTINGS = {
    easy: { enemySpeed: 1.3, fireIntervalMin: 2200, fireIntervalMax: 3600, extraEnemies: 0 },
    normal: { enemySpeed: 1.7, fireIntervalMin: 1600, fireIntervalMax: 2800, extraEnemies: 1 },
    hard: { enemySpeed: 2.2, fireIntervalMin: 1100, fireIntervalMax: 2000, extraEnemies: 2 },
  };
  var difficulty = 'normal';
  try {
    var savedDiff = localStorage.getItem(DIFFICULTY_KEY);
    if (DIFFICULTY_SETTINGS[savedDiff]) difficulty = savedDiff;
  } catch (err) { /* ignore */ }
  function diffCfg() { return DIFFICULTY_SETTINGS[difficulty]; }

  // Three hand-authored interior layouts (brick/steel clusters); a steel
  // border is added programmatically around every stage so tanks always
  // stay contained, with the base tile and both spawn lanes always left
  // clear regardless of what the interior string specifies there.
  var LAYOUTS = [
    [
      '..............',
      '.BBB....BBB...',
      '.BBB....BBB...',
      '..............',
      '....SS..SS....',
      '....SS..SS....',
      '..BB......BB..',
      '..BB......BB..',
      '..............',
      '.BBB.SSSS.BBB.',
      '.BBB.SSSS.BBB.',
      '..............',
      '..............',
      '..............',
    ],
    [
      '..............',
      '.BB.BB..BB.BB.',
      '.BB.BB..BB.BB.',
      '..............',
      '..SS......SS..',
      '..SS......SS..',
      '....BBBBBB....',
      '....BBBBBB....',
      '..SS......SS..',
      '..SS......SS..',
      '..............',
      '.BB.BB..BB.BB.',
      '.BB.BB..BB.BB.',
      '..............',
    ],
    [
      '..............',
      '.BBBBBB.BBBBB.',
      '..............',
      '..SS.SS.SS.SS.',
      '..SS.SS.SS.SS.',
      '..............',
      '.BB.BBBBBB.BB.',
      '.BB.BBBBBB.BB.',
      '..............',
      '..SS.SS.SS.SS.',
      '..SS.SS.SS.SS.',
      '..............',
      '.BBBBB.BBBBBB.',
      '..............',
    ],
  ];
  var ENEMY_SPAWNS = [
    { col: 1, row: 1 }, { col: 7, row: 1 }, { col: 12, row: 1 }, { col: 4, row: 1 }
  ];
  var PLAYER_SPAWN = { col: 3, row: GRID - 2 };

  function buildGrid(stageIndex) {
    var rows = LAYOUTS[stageIndex % LAYOUTS.length];
    var grid = [];
    for (var r = 0; r < GRID; r++) {
      var line = [];
      for (var c = 0; c < GRID; c++) {
        var ch = (rows[r] && rows[r][c]) || '.';
        line.push(ch === 'B' || ch === 'S' ? ch : '.');
      }
      grid.push(line);
    }
    // Steel border, always present regardless of the interior pattern.
    for (var c2 = 0; c2 < GRID; c2++) { grid[0][c2] = 'S'; grid[GRID - 1][c2] = 'S'; }
    for (var r2 = 0; r2 < GRID; r2++) { grid[r2][0] = 'S'; grid[r2][GRID - 1] = 'S'; }
    // Keep spawn lanes and the base tile clear.
    ENEMY_SPAWNS.forEach(function (s) { grid[s.row][s.col] = '.'; });
    grid[PLAYER_SPAWN.row][PLAYER_SPAWN.col] = '.';
    grid[BASE_ROW][BASE_COL] = '.';
    grid[BASE_ROW - 1][BASE_COL] = '.';
    return grid;
  }

  // Tiny self-contained Web Audio sound effects — same pattern as this
  // portal's other arcade games: no audio files, lazily created on first
  // sound (always from a user gesture), with a persisted mute toggle.
  var SOUND_KEY = 'tm.tankBattle.sound';
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
  function playFire() { beep(880, 0.05, 'square', 0.1); }
  function playExplode() { beep(140, 0.18, 'sawtooth', 0.2); beep(90, 0.22, 'sawtooth', 0.16, 0.08); }
  function playHurt() { beep(260, 0.16, 'sawtooth', 0.2); beep(160, 0.22, 'sawtooth', 0.18, 0.1); }
  function playClear() { beep(523, 0.1, 'square', 0.18); beep(659, 0.1, 'square', 0.18, 0.1); beep(784, 0.1, 'square', 0.18, 0.2); beep(1046, 0.22, 'square', 0.2, 0.3); }
  function playMcqRight() { beep(523, 0.09, 'square', 0.18); beep(784, 0.14, 'square', 0.18, 0.09); }
  function playMcqWrong() { beep(180, 0.18, 'sawtooth', 0.18); }

  // A broad mixed-review bank — every other arcade game's MCQ pool is
  // narrowly themed to one system (see CLAUDE.md's "MCQ gate on life
  // loss" section), so this one deliberately spans several systems at
  // once as a cumulative review. Editable in-browser via the password-
  // gated "✎" edit panel (password APP, same casual click-guard as every
  // other tool's edit mode).
  var DEFAULT_MCQS = [
    { q: 'What does "bypass ratio" describe?', choices: ['The ratio of air bypassing the core to air passing through it', 'The ratio of fuel to air in the combustor', 'The gear ratio in the accessory gearbox', 'The oil pressure relief setting'], answer: 0 },
    { q: 'What is the main job of the compressor?', choices: ['Raise the pressure of incoming air before combustion', 'Cool the turbine blades', 'Store fuel', 'Detect fire'], answer: 0 },
    { q: 'What does FOHE stand for?', choices: ['Fuel/Oil Heat Exchanger', 'Fan Outlet Housing Element', 'Fire/Overheat Emergency', 'Flow Output Handling Equipment'], answer: 0 },
    { q: 'Why does a scavenge pump have more capacity than the supply pump?', choices: ['Returning oil has expanded with heat and entrained air', 'It needs to cool the fuel', 'It feeds the igniter plugs', 'It pressurizes the cabin'], answer: 0 },
    { q: 'What does a labyrinth seal do?', choices: ['Restricts air/oil leakage along a rotating shaft', 'Filters fuel', 'Detects a fire', 'Starts the engine'], answer: 0 },
    { q: 'What triggers a Fire (not Fault) warning?', choices: ['A genuine detected fire condition', 'A malfunctioning detection loop', 'Low oil pressure', 'High N1'], answer: 0 },
    { q: 'What does the APU typically supply on the ground?', choices: ['Electrical power and bleed air without the main engines running', 'Only hydraulic fluid', 'Only fuel', 'Only de-icing fluid'], answer: 0 },
    { q: 'What is customer bleed air used for?', choices: ['Cabin pressurization, anti-icing and pneumatic systems', 'Cooling the oil tank only', 'Starting the fire bottle', 'Running the fuel pump'], answer: 0 },
    { q: 'What does a Magnetic Chip Detector catch?', choices: ['Ferrous wear debris in the scavenge oil flow', 'Fuel vapor', 'Bleed air leaks', 'Ice crystals'], answer: 0 },
    { q: 'What does N1 usually represent on a twin-spool engine?', choices: ['The low-pressure (fan) spool speed, as a percentage', 'The high-pressure spool speed', 'Oil temperature', 'EGT'], answer: 0 },
  ];
  var MCQ_KEY = 'tm.tankBattle.mcqs';
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
      '<div class="tb-wrap">' +
      '<h1>🪖 Tank Battle</h1>' +
      '<p class="tb-intro">Clear every enemy tank without losing your own, and keep bullets away from your base. Arrow keys / WASD to move, Space to fire.</p>' +
      '<div class="tb-hud">' +
      '<div class="tb-stat"><span class="tb-stat-label">Score</span><span class="tb-stat-value" id="tbScore">0</span></div>' +
      '<div class="tb-stat"><span class="tb-stat-label">High score</span><span class="tb-stat-value" id="tbHigh">0</span></div>' +
      '<div class="tb-stat"><span class="tb-stat-label">Top score</span><span class="tb-stat-value" id="tbTop">--</span></div>' +
      '<div class="tb-stat"><span class="tb-stat-label">Misses</span><span class="tb-stat-value" id="tbMisses">0</span></div>' +
      '<div class="tb-stat"><span class="tb-stat-label">Stage</span><span class="tb-stat-value" id="tbStage">1</span></div>' +
      '<button type="button" class="tb-mute-btn" id="tbMuteBtn" aria-label="Toggle sound">' + (soundOn ? '🔊' : '🔇') + '</button>' +
      '<button type="button" class="tb-mute-btn" id="tbSettingsBtn" aria-label="Game settings">⚙️</button>' +
      '<button type="button" class="tb-mute-btn" id="tbEditBtn" aria-label="Edit questions">✎</button>' +
      '</div>' +
      '<div class="tb-guide hidden" id="tbSettings">' +
      '<h2>⚙️ Game Settings</h2>' +
      '<p>Easy gives slower/fewer enemies that fire less often; Hard gives the opposite. Lives are unlimited on every setting — a hit just means answering one question before you continue. Takes effect on your next game.</p>' +
      '<div class="tb-diff-row">' +
      '<button type="button" class="tb-tab tb-diff-btn" data-diff="easy">Easy</button>' +
      '<button type="button" class="tb-tab tb-diff-btn" data-diff="normal">Normal</button>' +
      '<button type="button" class="tb-tab tb-diff-btn" data-diff="hard">Hard</button>' +
      '</div>' +
      '<button type="button" class="tb-btn tb-btn-primary" id="tbResetTopBtn">Reset top score…</button>' +
      '</div>' +
      '<div class="tb-stage">' +
      '<canvas id="tbCanvas" width="' + W + '" height="' + H + '"></canvas>' +
      '<div class="tb-overlay hidden" id="tbOverlay">' +
      '<div class="tb-overlay-card">' +
      '<h2 id="tbOverlayTitle"></h2>' +
      '<p id="tbOverlayMsg"></p>' +
      '<button type="button" class="tb-btn tb-btn-primary" id="tbOverlayBtn"></button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="tb-touch">' +
      '<div></div><button type="button" class="tb-touch-btn" id="tbUpBtn">▲</button><div></div>' +
      '<button type="button" class="tb-touch-btn" id="tbLeftBtn">◀</button>' +
      '<button type="button" class="tb-touch-btn tb-touch-fire" id="tbFireBtn">🔥</button>' +
      '<button type="button" class="tb-touch-btn" id="tbRightBtn">▶</button>' +
      '<div></div><button type="button" class="tb-touch-btn" id="tbDownBtn">▼</button><div></div>' +
      '</div>' +
      '<div class="tb-mcq-overlay hidden" id="tbMcqOverlay">' +
      '<div class="tb-mcq-card">' +
      '<button type="button" class="tb-mcq-close hidden" id="tbMcqCloseBtn" aria-label="Close">✕</button>' +
      '<h2>📝 Quick Check</h2>' +
      '<p class="tb-mcq-note">Answer correctly to get back in — try as many times as you need.</p>' +
      '<p class="tb-mcq-question" id="tbMcqQuestion"></p>' +
      '<div class="tb-mcq-choices" id="tbMcqChoices"></div>' +
      '<p class="tb-mcq-feedback" id="tbMcqFeedback"></p>' +
      '</div>' +
      '</div>' +
      '<div class="tb-guide hidden" id="tbMcqEdit">' +
      '<h2>✎ Edit questions</h2>' +
      '<p>Change any question, its 4 choices, or which one is correct. Saved to this browser only — paste the box below into tank-battle.js to make it the default for everyone.</p>' +
      '<div id="tbMcqEditList"></div>' +
      '<div class="tb-diff-row">' +
      '<button type="button" class="tb-btn tb-btn-primary" id="tbMcqSaveBtn">Save changes</button>' +
      '</div>' +
      '<p class="tb-mcq-note">Copy-paste source:</p>' +
      '<textarea class="tb-mcq-copy" id="tbMcqCopy" readonly rows="8"></textarea>' +
      '</div>' +
      '</div>';

    var canvas = root.querySelector('#tbCanvas');
    var ctx = canvas.getContext('2d');
    var scoreEl = root.querySelector('#tbScore');
    var highEl = root.querySelector('#tbHigh');
    var topEl = root.querySelector('#tbTop');
    var missesEl = root.querySelector('#tbMisses');
    var stageEl = root.querySelector('#tbStage');
    var overlay = root.querySelector('#tbOverlay');
    var overlayTitle = root.querySelector('#tbOverlayTitle');
    var overlayMsg = root.querySelector('#tbOverlayMsg');
    var overlayBtn = root.querySelector('#tbOverlayBtn');
    var mcqOverlay = root.querySelector('#tbMcqOverlay');
    var mcqQuestionEl = root.querySelector('#tbMcqQuestion');
    var mcqChoicesEl = root.querySelector('#tbMcqChoices');
    var mcqFeedbackEl = root.querySelector('#tbMcqFeedback');
    var mcqCloseBtn = root.querySelector('#tbMcqCloseBtn');
    var mcqs = loadMcqs();
    var mcqEditUnlocked = false;
    var settingsUnlocked = false;
    var pendingMcqCorrect = null;

    var highScore = 0;
    try { highScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0; } catch (err) { highScore = 0; }
    highEl.textContent = highScore;

    function updateTopDisplay() { topEl.textContent = TM.Leaderboard.bestLabel(GAME_ID); }
    updateTopDisplay();

    var score, misses, stage, grid, player, enemies, bullets, baseAlive, running, rafId, lastTime;
    var keys = { left: false, right: false, up: false, down: false };
    var lastDir = 'up';
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

    function tileAt(px, py) {
      var c = Math.floor(px / TILE), r = Math.floor(py / TILE);
      if (r < 0 || r >= GRID || c < 0 || c >= GRID) return 'S';
      return grid[r][c];
    }
    function solidAt(px, py) {
      var t = tileAt(px, py);
      return t === 'B' || t === 'S';
    }

    function canOccupy(x, y, size) {
      var half = size / 2;
      return !solidAt(x - half + 1, y - half + 1) && !solidAt(x + half - 1, y - half + 1) &&
        !solidAt(x - half + 1, y + half - 1) && !solidAt(x + half - 1, y + half - 1);
    }

    function resetPlayer() {
      player.x = PLAYER_SPAWN.col * TILE + TILE / 2;
      player.y = PLAYER_SPAWN.row * TILE + TILE / 2;
      player.facing = 'up';
      player.invulnerableUntil = performance.now() + RESPAWN_INVULN_MS;
    }

    function spawnEnemies(count) {
      enemies = [];
      for (var i = 0; i < count; i++) {
        var spot = ENEMY_SPAWNS[i % ENEMY_SPAWNS.length];
        enemies.push({
          x: spot.col * TILE + TILE / 2,
          y: spot.row * TILE + TILE / 2,
          facing: 'down',
          nextTurnAt: performance.now() + 400 + Math.random() * 800,
          nextFireAt: performance.now() + diffCfg().fireIntervalMin + Math.random() * (diffCfg().fireIntervalMax - diffCfg().fireIntervalMin),
        });
      }
    }

    function startStage() {
      grid = buildGrid(stage - 1);
      bullets = [];
      baseAlive = true;
      player = {};
      resetPlayer();
      spawnEnemies(2 + Math.min(2, stage - 1) + diffCfg().extraEnemies);
    }

    function newGame() {
      score = 0;
      misses = 0;
      stage = 1;
      startStage();
      updateHud();
    }

    function startRunning() {
      overlay.classList.add('hidden');
      running = true;
      lastTime = performance.now();
      if (rafId == null) rafId = requestAnimationFrame(loop);
    }

    function dirVector(dir) {
      if (dir === 'up') return { dx: 0, dy: -1 };
      if (dir === 'down') return { dx: 0, dy: 1 };
      if (dir === 'left') return { dx: -1, dy: 0 };
      return { dx: 1, dy: 0 };
    }

    function moveTank(t, dir, speed, dt) {
      var v = dirVector(dir);
      var nx = t.x + v.dx * speed * dt;
      var ny = t.y + v.dy * speed * dt;
      if (canOccupy(nx, t.y, TANK_SIZE)) t.x = nx;
      if (canOccupy(t.x, ny, TANK_SIZE)) t.y = ny;
      t.facing = dir;
    }

    function fireBullet(owner, tank) {
      var v = dirVector(tank.facing);
      bullets.push({
        x: tank.x + v.dx * (TANK_SIZE / 2 + 2),
        y: tank.y + v.dy * (TANK_SIZE / 2 + 2),
        dx: v.dx, dy: v.dy, owner: owner
      });
    }

    function updatePlayer(dt) {
      var dir = null;
      if (keys[lastDir]) dir = lastDir;
      else if (keys.up) dir = 'up';
      else if (keys.down) dir = 'down';
      else if (keys.left) dir = 'left';
      else if (keys.right) dir = 'right';
      if (dir) moveTank(player, dir, 2.6, dt);

      if (fireRequested) {
        fireRequested = false;
        var hasPlayerBullet = bullets.some(function (b) { return b.owner === 'player'; });
        if (!hasPlayerBullet) { fireBullet('player', player); playFire(); }
      }
    }

    function pickNewDir(e) {
      var dirs = ['up', 'down', 'left', 'right'].filter(function (d) { return d !== e.facing; });
      return dirs[Math.floor(Math.random() * dirs.length)];
    }

    function updateEnemy(e, dt, now) {
      if (now >= e.nextTurnAt) {
        var tryDirs = [e.facing, pickNewDir(e), pickNewDir(e), pickNewDir(e)];
        for (var i = 0; i < tryDirs.length; i++) {
          var v = dirVector(tryDirs[i]);
          if (canOccupy(e.x + v.dx * TILE * 0.6, e.y + v.dy * TILE * 0.6, TANK_SIZE)) { e.facing = tryDirs[i]; break; }
        }
        e.nextTurnAt = now + 900 + Math.random() * 1400;
      }
      var before = { x: e.x, y: e.y };
      moveTank(e, e.facing, diffCfg().enemySpeed, dt);
      if (e.x === before.x && e.y === before.y) e.nextTurnAt = now; // stuck — pick a new direction next frame

      if (now >= e.nextFireAt) {
        fireBullet('enemy', e);
        e.nextFireAt = now + diffCfg().fireIntervalMin + Math.random() * (diffCfg().fireIntervalMax - diffCfg().fireIntervalMin);
      }
    }

    function tankHit(x, y, tank) {
      var half = TANK_SIZE / 2;
      return x > tank.x - half && x < tank.x + half && y > tank.y - half && y < tank.y + half;
    }

    function updateBullets(dt, now) {
      var speed = 7 * dt;
      bullets.forEach(function (b) {
        b.x += b.dx * speed;
        b.y += b.dy * speed;
      });
      bullets = bullets.filter(function (b) {
        if (b.x < 0 || b.x > W || b.y < 0 || b.y > H) return false;

        var col = Math.floor(b.x / TILE), row = Math.floor(b.y / TILE);
        if (row === BASE_ROW && col === BASE_COL && baseAlive) {
          baseAlive = false;
          loseLife(now);
          return false;
        }
        var tile = tileAt(b.x, b.y);
        if (tile === 'S') return false;
        if (tile === 'B') { grid[row][col] = '.'; return false; }

        if (b.owner === 'enemy' && now > player.invulnerableUntil && tankHit(b.x, b.y, player)) {
          loseLife(now);
          return false;
        }
        if (b.owner === 'player') {
          for (var i = 0; i < enemies.length; i++) {
            if (tankHit(b.x, b.y, enemies[i])) {
              enemies.splice(i, 1);
              score += 100;
              playExplode();
              updateHud();
              if (enemies.length === 0) stageClear();
              return false;
            }
          }
        }
        return true;
      });
    }

    function loseLife(now) {
      misses += 1;
      playHurt();
      updateHud();
      running = false;
      if (baseAlive === false) baseAlive = true; // a "base hit" just costs a life, not a permanent loss
      showMcqGate(function () {
        resetPlayer();
        running = true;
        lastTime = performance.now();
        if (rafId == null) rafId = requestAnimationFrame(loop);
      });
    }

    // --- MCQ gate -----------------------------------------------------
    // Shown whenever the player's tank or the base takes a hit. Picks a
    // random question from the (possibly teacher-edited) bank, shuffles
    // the displayed choice order, and lets the student retry the SAME
    // question as many times as needed. A correct answer disables the
    // choices and reveals a ✕ — play only resumes once that's clicked,
    // so the result screen never silently disappears on its own.
    function showMcqGate(onCorrect) {
      var q = mcqs[Math.floor(Math.random() * mcqs.length)];
      var order = q.choices.map(function (text, i) { return { text: text, correct: i === q.answer }; });
      for (var i = order.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
      }
      mcqQuestionEl.textContent = q.q;
      mcqFeedbackEl.textContent = '';
      mcqFeedbackEl.className = 'tb-mcq-feedback';
      mcqChoicesEl.innerHTML = '';
      mcqCloseBtn.classList.add('hidden');
      pendingMcqCorrect = onCorrect;
      order.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tb-mcq-choice';
        btn.textContent = opt.text;
        btn.dataset.correct = opt.correct ? '1' : '0';
        btn.addEventListener('click', function () {
          if (opt.correct) {
            mcqFeedbackEl.textContent = '✅ Correct! Press ✕ to continue.';
            mcqFeedbackEl.className = 'tb-mcq-feedback is-correct';
            playMcqRight();
            mcqChoicesEl.querySelectorAll('.tb-mcq-choice').forEach(function (b) { b.disabled = true; });
            mcqCloseBtn.classList.remove('hidden');
          } else {
            mcqFeedbackEl.textContent = '❌ Not quite — try again.';
            mcqFeedbackEl.className = 'tb-mcq-feedback is-wrong';
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
      var listEl = root.querySelector('#tbMcqEditList');
      listEl.innerHTML = '';
      mcqs.forEach(function (q, qi) {
        var block = document.createElement('div');
        block.className = 'tb-mcq-edit-block';
        var qLabel = document.createElement('label');
        qLabel.textContent = 'Question ' + (qi + 1);
        var qInput = document.createElement('input');
        qInput.type = 'text';
        qInput.className = 'tb-mcq-edit-q';
        qInput.value = q.q;
        qInput.addEventListener('input', function () { q.q = qInput.value; });
        block.appendChild(qLabel);
        block.appendChild(qInput);
        q.choices.forEach(function (choiceText, ci) {
          var row = document.createElement('div');
          row.className = 'tb-mcq-edit-choice-row';
          var radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = 'tbMcqCorrect' + qi;
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
      root.querySelector('#tbMcqCopy').value = formatMcqs(mcqs);
    }

    function stageClear() {
      running = false;
      score += 500;
      playClear();
      var beat = score > highScore;
      updateHud();
      TM.Leaderboard.submitScore(GAME_ID, score, { higherIsBetter: true });
      updateTopDisplay();
      if (stage >= LAYOUTS.length) {
        showOverlay('All stages cleared! 🎉', 'Final score ' + score + (beat ? ' — new high score!' : ''), 'Play again', function () {
          newGame(); startRunning();
        });
      } else {
        showOverlay('Stage clear! 🎉', 'Stage ' + stage + ' cleared — score ' + score + (beat ? ' — new high score!' : ''), 'Next stage', function () {
          stage += 1; startStage(); updateHud(); startRunning();
        });
      }
    }

    function drawGrid() {
      for (var r = 0; r < GRID; r++) {
        for (var c = 0; c < GRID; c++) {
          var t = grid[r][c];
          if (t === '.') continue;
          var x = c * TILE, y = r * TILE;
          if (t === 'B') {
            ctx.fillStyle = '#b0543a';
            ctx.fillRect(x, y, TILE, TILE);
            ctx.strokeStyle = '#6e2e1c';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, y + 1, TILE / 2 - 2, TILE / 2 - 2);
            ctx.strokeRect(x + TILE / 2 + 1, y + 1, TILE / 2 - 2, TILE / 2 - 2);
            ctx.strokeRect(x + 1, y + TILE / 2 + 1, TILE / 2 - 2, TILE / 2 - 2);
            ctx.strokeRect(x + TILE / 2 + 1, y + TILE / 2 + 1, TILE / 2 - 2, TILE / 2 - 2);
          } else if (t === 'S') {
            ctx.fillStyle = '#8a95a6';
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = '#ced6e0';
            ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
          }
        }
      }
    }

    function drawBase() {
      var x = BASE_COL * TILE, y = BASE_ROW * TILE;
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
      ctx.fillStyle = '#a66a00';
      ctx.beginPath();
      ctx.moveTo(x + TILE / 2, y + 6);
      ctx.lineTo(x + TILE - 8, y + TILE - 8);
      ctx.lineTo(x + 8, y + TILE - 8);
      ctx.closePath();
      ctx.fill();
    }

    function drawTank(t, color) {
      ctx.fillStyle = color;
      ctx.fillRect(t.x - TANK_SIZE / 2, t.y - TANK_SIZE / 2, TANK_SIZE, TANK_SIZE);
      ctx.fillStyle = '#20242c';
      var v = dirVector(t.facing);
      ctx.fillRect(t.x + v.dx * (TANK_SIZE / 2 - 4) - 3, t.y + v.dy * (TANK_SIZE / 2 - 4) - 3, 6, 6);
      ctx.fillRect(t.x - 3, t.y - 3, 6, 6);
    }

    function drawBullet(b) {
      ctx.fillStyle = b.owner === 'player' ? '#ffd166' : '#ff7b88';
      ctx.fillRect(b.x - BULLET_SIZE / 2, b.y - BULLET_SIZE / 2, BULLET_SIZE, BULLET_SIZE);
    }

    function render() {
      ctx.fillStyle = '#10131f';
      ctx.fillRect(0, 0, W, H);
      drawGrid();
      drawBase();
      var flicker = performance.now() < player.invulnerableUntil && Math.floor(performance.now() / 100) % 2 === 0;
      if (!flicker) drawTank(player, '#4ade80');
      enemies.forEach(function (e) { drawTank(e, '#ff7b88'); });
      bullets.forEach(drawBullet);
    }

    function loop(now) {
      if (!running) { rafId = null; return; }
      var dt = Math.max(0.1, Math.min((now - lastTime) / 16.6667, 2.5));
      lastTime = now;

      updatePlayer(dt);
      enemies.forEach(function (e) { updateEnemy(e, dt, now); });
      updateBullets(dt, now);

      if (running) render();
      rafId = requestAnimationFrame(loop);
    }

    function onKeyDown(e) {
      var map = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' };
      if (map[e.key]) { keys[map[e.key]] = true; lastDir = map[e.key]; e.preventDefault(); return; }
      if (e.key === ' ') { fireRequested = true; e.preventDefault(); }
    }
    function onKeyUp(e) {
      var map = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' };
      if (map[e.key]) keys[map[e.key]] = false;
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    function bindHold(el, key) {
      el.addEventListener('pointerdown', function (e) { e.preventDefault(); keys[key] = true; lastDir = key; });
      el.addEventListener('pointerup', function () { keys[key] = false; });
      el.addEventListener('pointerleave', function () { keys[key] = false; });
      el.addEventListener('pointercancel', function () { keys[key] = false; });
    }
    bindHold(root.querySelector('#tbLeftBtn'), 'left');
    bindHold(root.querySelector('#tbRightBtn'), 'right');
    bindHold(root.querySelector('#tbUpBtn'), 'up');
    bindHold(root.querySelector('#tbDownBtn'), 'down');
    root.querySelector('#tbFireBtn').addEventListener('pointerdown', function (e) { e.preventDefault(); fireRequested = true; });

    root.querySelector('#tbMuteBtn').addEventListener('click', function (e) {
      soundOn = !soundOn;
      try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch (err) { /* ignore */ }
      e.target.textContent = soundOn ? '🔊' : '🔇';
      if (soundOn) ensureAudio();
    });
    root.querySelector('#tbSettingsBtn').addEventListener('click', function () {
      var panel = root.querySelector('#tbSettings');
      if (panel.classList.contains('hidden')) {
        if (!settingsUnlocked && !TM.Leaderboard.checkPassword('Enter the settings password to unlock game settings:')) return;
        settingsUnlocked = true;
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });
    root.querySelector('#tbResetTopBtn').addEventListener('click', function () {
      if (TM.Leaderboard.resetBest(GAME_ID)) updateTopDisplay();
    });
    root.querySelectorAll('.tb-diff-btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-diff') === difficulty);
      btn.addEventListener('click', function () {
        difficulty = btn.getAttribute('data-diff');
        try { localStorage.setItem(DIFFICULTY_KEY, difficulty); } catch (err) { /* ignore */ }
        root.querySelectorAll('.tb-diff-btn').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      });
    });
    root.querySelector('#tbEditBtn').addEventListener('click', function () {
      var editCard = root.querySelector('#tbMcqEdit');
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
    root.querySelector('#tbMcqSaveBtn').addEventListener('click', function () {
      saveMcqs(mcqs);
      refreshMcqCopy();
    });

    newGame();
    render();
    showOverlay('Ready?', 'Destroy every enemy tank and protect your base. Arrow keys/WASD to move, Space to fire.', 'Start', function () {
      newGame(); startRunning(); // re-applies the difficulty picked while still on this screen
    });

    window.TM.toolModules['tank-battle'].debugState = function () {
      return { player: player, enemies: enemies, bullets: bullets, score: score, misses: misses, stage: stage, baseAlive: baseAlive, mcqGateOpen: !mcqOverlay.classList.contains('hidden') };
    };
    window.TM.toolModules['tank-battle'].debugForceHit = function () { loseLife(performance.now()); };
    window.TM.toolModules['tank-battle'].debugForceStageClear = function () { enemies = []; stageClear(); };
    window.TM.toolModules['tank-battle'].debugAnswerMcq = function (correct) {
      var btns = mcqChoicesEl.querySelectorAll('.tb-mcq-choice');
      for (var k = 0; k < btns.length; k++) {
        var isRight = btns[k].dataset.correct === '1';
        if (isRight === !!correct) { btns[k].click(); return true; }
      }
      return false;
    };

    window.TM.toolModules['tank-battle'].unmount = function () {
      running = false;
      if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }

  window.TM.registerTool('tank-battle', { mount: mount });
})();
