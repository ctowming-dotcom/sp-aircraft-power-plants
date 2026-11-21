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
  var HIGH_SCORE_KEY = 'tm.pacmanArcade.highScore';

  // Difficulty: slower/later ghosts and a longer power-pellet window on
  // Easy; faster/sooner ghosts and a shorter window on Hard.
  var DIFFICULTY_KEY = 'tm.pacmanArcade.difficulty';
  var DIFFICULTY_SETTINGS = {
    easy: { lives: 4, ghostSpeed: 1.4, frightenedSpeed: 0.9, eyesSpeed: 3.2, frightenedMs: 9000, releaseIntervalMs: 12000 },
    normal: { lives: 3, ghostSpeed: 1.7, frightenedSpeed: 1.0, eyesSpeed: 3.4, frightenedMs: 7000, releaseIntervalMs: 8000 },
    hard: { lives: 2, ghostSpeed: 2.0, frightenedSpeed: 1.1, eyesSpeed: 3.6, frightenedMs: 5000, releaseIntervalMs: 5000 },
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
      '<p class="pac-intro">Clear every dot while dodging the ghosts — one more ghost joins every so often, up to 5, so the longer a maze runs the hotter it gets. Grab a big pellet to turn the tables — chase them down for bonus points while they\'re blue. Arrow keys / WASD to move.</p>' +
      '<div class="pac-hud">' +
      '<div class="pac-stat"><span class="pac-stat-label">Score</span><span class="pac-stat-value" id="pacScore">0</span></div>' +
      '<div class="pac-stat"><span class="pac-stat-label">High score</span><span class="pac-stat-value" id="pacHigh">0</span></div>' +
      '<div class="pac-stat"><span class="pac-stat-label">Lives</span><span class="pac-stat-value" id="pacLives">●●●</span></div>' +
      '<button type="button" class="pac-mute-btn" id="pacMuteBtn" aria-label="Toggle sound">' + (soundOn ? '🔊' : '🔇') + '</button>' +
      '<button type="button" class="pac-mute-btn" id="pacGuideBtn" aria-label="Exam guide">📘</button>' +
      '<button type="button" class="pac-mute-btn" id="pacSettingsBtn" aria-label="Game settings">⚙️</button>' +
      '</div>' +
      '<div class="pac-guide hidden" id="pacGuide">' +
      '<h2>📘 Exam Guide</h2>' +
      '<p>This section is empty for now — exam tips for this game will be added here by January 2027. Check back then!</p>' +
      '</div>' +
      '<div class="pac-guide hidden" id="pacSettings">' +
      '<h2>⚙️ Game Settings</h2>' +
      '<p>Easy means slower ghosts, released further apart, with a longer power-pellet window; Hard means the opposite. Takes effect on your next maze.</p>' +
      '<div class="pac-diff-row">' +
      '<button type="button" class="pac-tab pac-diff-btn" data-diff="easy">Easy</button>' +
      '<button type="button" class="pac-tab pac-diff-btn" data-diff="normal">Normal</button>' +
      '<button type="button" class="pac-tab pac-diff-btn" data-diff="hard">Hard</button>' +
      '</div>' +
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

    var highScore = 0;
    try { highScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0; } catch (err) { highScore = 0; }
    highEl.textContent = highScore;

    var dots, pelletsLeft, score, lives, player, ghosts, mode, modeTimer, frightenedUntil, eatMultiplier, running, rafId, lastTime;

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

    function startLevel() {
      buildDots();
      resetPositions();
      mode = 'scatter';
      modeTimer = performance.now() + SCATTER_MS;
      frightenedUntil = 0;
      eatMultiplier = 1;
    }

    function startGame() {
      score = 0;
      lives = diffCfg().lives;
      startLevel();
      updateHud();
      overlay.classList.add('hidden');
      running = true;
      lastTime = performance.now();
      if (rafId == null) rafId = requestAnimationFrame(loop);
    }

    function updateHud() {
      scoreEl.textContent = score;
      livesEl.textContent = new Array(Math.max(lives, 0) + 1).join('●');
    }

    function showOverlay(title, msg, btnLabel, action) {
      overlayTitle.textContent = title;
      overlayMsg.textContent = msg;
      overlayBtn.textContent = btnLabel;
      overlayBtn.onclick = action;
      overlay.classList.remove('hidden');
    }

    function playerTile() { return { r: Math.round((player.y - TILE / 2) / TILE), c: Math.round((player.x - TILE / 2) / TILE) }; }
    function entityTile(e) { return { r: Math.round((e.y - TILE / 2) / TILE), c: Math.round((e.x - TILE / 2) / TILE) }; }
    function isCentered(e) {
      var t = entityTile(e);
      var center = tileCenter(t.r, t.c);
      return Math.abs(e.x - center.x) < 1.2 && Math.abs(e.y - center.y) < 1.2;
    }

    function canPlayerEnter(r, c) { return !isWall(r, c) && !isHouseTile(r, c); }
    function canGhostEnter(r, c) { return !isWall(r, c); }

    function updatePlayer(dt) {
      var t = entityTile(player);
      if (isCentered(player)) {
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

      if (isCentered(g)) {
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
      lives -= 1;
      playLoseLife();
      updateHud();
      if (lives <= 0) {
        running = false;
        var beat = score > highScore;
        if (beat) { highScore = score; try { localStorage.setItem(HIGH_SCORE_KEY, String(highScore)); } catch (err) {} highEl.textContent = highScore; }
        showOverlay('Game over', 'Final score: ' + score + (beat ? ' — new high score!' : ' · High score: ' + highScore), 'Play again', startGame);
      } else {
        resetPositions();
      }
    }

    function levelClear() {
      running = false;
      playClear();
      var beat = score > highScore;
      if (beat) { highScore = score; try { localStorage.setItem(HIGH_SCORE_KEY, String(highScore)); } catch (err) {} highEl.textContent = highScore; }
      showOverlay('Maze clear! 🎉', 'Score: ' + score + (beat ? ' — new high score!' : ''), 'Next maze', function () {
        startLevel();
        updateHud();
        overlay.classList.add('hidden');
        running = true;
        lastTime = performance.now();
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
    root.querySelector('#pacGuideBtn').addEventListener('click', function () {
      root.querySelector('#pacGuide').classList.toggle('hidden');
    });
    root.querySelector('#pacSettingsBtn').addEventListener('click', function () {
      root.querySelector('#pacSettings').classList.toggle('hidden');
    });
    root.querySelectorAll('.pac-diff-btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-diff') === difficulty);
      btn.addEventListener('click', function () {
        difficulty = btn.getAttribute('data-diff');
        try { localStorage.setItem(DIFFICULTY_KEY, difficulty); } catch (err) { /* ignore */ }
        root.querySelectorAll('.pac-diff-btn').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      });
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

    window.TM.toolModules['pacman-arcade'].debugState = function () { return { player: player, ghosts: ghosts, dots: dots }; };

    window.TM.toolModules['pacman-arcade'].unmount = function () {
      running = false;
      if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
      window.removeEventListener('keydown', onKeyDown);
    };
  }

  window.TM.registerTool('pacman-arcade', { mount: mount });
})();
