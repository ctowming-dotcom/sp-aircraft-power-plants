(function () {
  window.TM = window.TM || {};

  var TILE = 32;
  var COLS = 15;
  var ROWS = 13;
  var W = COLS * TILE;
  var H = ROWS * TILE;

  var PLAYER_SPAWN = { r: 1, c: 1 };
  var BASE_SPEED = 2.2;
  var BOMB_FUSE_MS = 2200;
  var EXPLOSION_MS = 450;
  var STAGE_TIME_START = 150; // seconds
  var LIVES_START = 3;
  var HIGH_SCORE_KEY = 'tm.bombermanArcade.highScore';
  var INVULN_MS = 2000;

  // Tiny self-contained Web Audio sound effects — no audio files, so the
  // site stays build-step-free. Lazily created on first sound, which is
  // always triggered from a user gesture (move/bomb key, click),
  // satisfying the browser autoplay-gesture requirement with no extra
  // plumbing. Explosions use a short burst of filtered noise rather than
  // an oscillator beep, since that's what actually reads as a "boom".
  var SOUND_KEY = 'tm.bombermanArcade.sound';
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
    gain.gain.linearRampToValueAtTime(vol == null ? 0.16 : vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.03);
  }
  function noiseBurst(dur, vol) {
    var ctx = ensureAudio();
    if (!ctx) return;
    var bufferSize = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(vol == null ? 0.3 : vol, ctx.currentTime);
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    src.start();
  }
  function playPlant() { beep(200, 0.06, 'square', 0.1); }
  function playExplosion() { noiseBurst(0.35, 0.3); beep(90, 0.3, 'sawtooth', 0.12); }
  function playPickup() { beep(660, 0.07, 'square', 0.16); beep(880, 0.09, 'square', 0.18, 0.07); }
  function playHurt() { beep(260, 0.14, 'sawtooth', 0.18); beep(160, 0.2, 'sawtooth', 0.16, 0.1); }
  function playClear() { beep(523, 0.1, 'square', 0.18); beep(659, 0.1, 'square', 0.18, 0.1); beep(784, 0.1, 'square', 0.18, 0.2); beep(1046, 0.22, 'square', 0.2, 0.3); }
  function playGameOver() { beep(392, 0.18, 'square', 0.18); beep(330, 0.18, 'square', 0.18, 0.16); beep(220, 0.32, 'square', 0.18, 0.32); }

  var DIRS = {
    up: { dr: -1, dc: 0 },
    down: { dr: 1, dc: 0 },
    left: { dr: 0, dc: -1 },
    right: { dr: 0, dc: 1 },
  };
  var OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };
  var DIR_NAMES = ['up', 'down', 'left', 'right'];

  // Hard pillars sit at every (even, even) interior coordinate, isolated
  // and never adjacent to one another — by construction this can never
  // wall off a pocket with hard blocks alone, so every floor/soft-block
  // tile is always reachable, bombing through soft blocks if needed.
  function isHardWall(r, c) {
    if (r <= 0 || r >= ROWS - 1 || c <= 0 || c >= COLS - 1) return true;
    return r % 2 === 0 && c % 2 === 0;
  }

  function tileCenter(r, c) { return { x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 }; }
  function keyOf(r, c) { return r + ',' + c; }

  function mount(root) {
    root.innerHTML =
      '<div class="bm-wrap">' +
      '<h1>💣 Super Bomberman</h1>' +
      '<p class="bm-intro">Blast the brick blocks to clear a path and take out every creature before the clock runs out. Grab the power-ups that pop out of blocks — more bombs, bigger blasts, faster feet. Arrow keys / WASD to move, Space to drop a bomb.</p>' +
      '<div class="bm-hud">' +
      '<div class="bm-stat"><span class="bm-stat-label">Score</span><span class="bm-stat-value" id="bmScore">0</span></div>' +
      '<div class="bm-stat"><span class="bm-stat-label">High score</span><span class="bm-stat-value" id="bmHigh">0</span></div>' +
      '<div class="bm-stat"><span class="bm-stat-label">Time</span><span class="bm-stat-value" id="bmTime">0</span></div>' +
      '<div class="bm-stat"><span class="bm-stat-label">Lives</span><span class="bm-stat-value" id="bmLives">●●●</span></div>' +
      '<button type="button" class="bm-mute-btn" id="bmMuteBtn" aria-label="Toggle sound">' + (soundOn ? '🔊' : '🔇') + '</button>' +
      '<button type="button" class="bm-mute-btn" id="bmGuideBtn" aria-label="Exam guide">📘</button>' +
      '</div>' +
      '<div class="bm-guide hidden" id="bmGuide">' +
      '<h2>📘 Exam Guide</h2>' +
      '<p>This section is empty for now — exam tips for this game will be added here by January 2027. Check back then!</p>' +
      '</div>' +
      '<div class="bm-stage">' +
      '<canvas id="bmCanvas" width="' + W + '" height="' + H + '"></canvas>' +
      '<div class="bm-overlay hidden" id="bmOverlay">' +
      '<div class="bm-overlay-card">' +
      '<h2 id="bmOverlayTitle"></h2>' +
      '<p id="bmOverlayMsg"></p>' +
      '<button type="button" class="bm-btn bm-btn-primary" id="bmOverlayBtn"></button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="bm-touch">' +
      '<div></div><button type="button" class="bm-touch-btn" id="bmUpBtn">▲</button><div></div>' +
      '<button type="button" class="bm-touch-btn" id="bmLeftBtn">◀</button>' +
      '<button type="button" class="bm-touch-btn bm-touch-bomb" id="bmBombBtn">💣</button>' +
      '<button type="button" class="bm-touch-btn" id="bmRightBtn">▶</button>' +
      '<div></div><button type="button" class="bm-touch-btn" id="bmDownBtn">▼</button><div></div>' +
      '</div>' +
      '</div>';

    var canvas = root.querySelector('#bmCanvas');
    var ctx = canvas.getContext('2d');
    var scoreEl = root.querySelector('#bmScore');
    var highEl = root.querySelector('#bmHigh');
    var timeEl = root.querySelector('#bmTime');
    var livesEl = root.querySelector('#bmLives');
    var overlay = root.querySelector('#bmOverlay');
    var overlayTitle = root.querySelector('#bmOverlayTitle');
    var overlayMsg = root.querySelector('#bmOverlayMsg');
    var overlayBtn = root.querySelector('#bmOverlayBtn');

    var highScore = 0;
    try { highScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0; } catch (err) { highScore = 0; }
    highEl.textContent = highScore;

    var soft, powerUnder, items, bombs, explosions, enemies, player, score, lives, timeLeft, stage, running, rafId, lastTime;

    function buildStage() {
      soft = [];
      powerUnder = {};
      items = {};
      bombs = [];
      explosions = [];
      for (var r = 0; r < ROWS; r++) {
        soft.push(new Array(COLS).fill(false));
      }
      var clearTiles = {};
      [[1, 1], [1, 2], [2, 1], [ROWS - 2, COLS - 2], [ROWS - 2, COLS - 3], [ROWS - 3, COLS - 2]].forEach(function (t) {
        clearTiles[keyOf(t[0], t[1])] = true;
      });
      var powerKinds = ['bomb', 'fire', 'speed'];
      var powerIdx = 0;
      for (var r2 = 1; r2 < ROWS - 1; r2++) {
        for (var c2 = 1; c2 < COLS - 1; c2++) {
          if (isHardWall(r2, c2)) continue;
          if (clearTiles[keyOf(r2, c2)]) continue;
          if (Math.random() < 0.65) {
            soft[r2][c2] = true;
            if (Math.random() < 0.3) {
              powerUnder[keyOf(r2, c2)] = powerKinds[powerIdx % powerKinds.length];
              powerIdx++;
            }
          }
        }
      }
    }

    function spawnEnemies(count) {
      enemies = [];
      var placed = 0, attempts = 0;
      while (placed < count && attempts < 500) {
        attempts++;
        var r = 1 + Math.floor(Math.random() * (ROWS - 2));
        var c = 1 + Math.floor(Math.random() * (COLS - 2));
        if (isHardWall(r, c) || soft[r][c]) continue;
        var distToSpawn = Math.abs(r - PLAYER_SPAWN.r) + Math.abs(c - PLAYER_SPAWN.c);
        if (distToSpawn < 5) continue;
        var p = tileCenter(r, c);
        enemies.push({ x: p.x, y: p.y, dir: DIR_NAMES[Math.floor(Math.random() * 4)], alive: true, color: ['#c87f53', '#d9a441', '#a85ba0', '#5bb0a8'][placed % 4] });
        placed++;
      }
    }

    function resetPlayer() {
      var p = tileCenter(PLAYER_SPAWN.r, PLAYER_SPAWN.c);
      player.x = p.x; player.y = p.y; player.dir = null; player.want = null;
      player.invulnerableUntil = performance.now() + INVULN_MS;
    }

    function newGame() {
      score = 0;
      lives = LIVES_START;
      stage = 1;
      player = { x: 0, y: 0, dir: null, want: null, maxBombs: 1, range: 1, speed: BASE_SPEED, invulnerableUntil: 0 };
      startStage();
      updateHud();
    }

    function startStage() {
      buildStage();
      spawnEnemies(Math.min(3 + stage, 9));
      resetPlayer();
      timeLeft = Math.max(70, STAGE_TIME_START - (stage - 1) * 8);
    }

    function updateHud() {
      scoreEl.textContent = score;
      timeEl.textContent = Math.ceil(timeLeft);
      livesEl.textContent = new Array(Math.max(lives, 0) + 1).join('●');
    }

    function showOverlay(title, msg, btnLabel, action) {
      overlayTitle.textContent = title;
      overlayMsg.textContent = msg;
      overlayBtn.textContent = btnLabel;
      overlayBtn.onclick = action;
      overlay.classList.remove('hidden');
    }

    function startRunning() {
      overlay.classList.add('hidden');
      running = true;
      lastTime = performance.now();
      if (rafId == null) rafId = requestAnimationFrame(loop);
    }

    function entityTile(e) { return { r: Math.round((e.y - TILE / 2) / TILE), c: Math.round((e.x - TILE / 2) / TILE) }; }
    function isCentered(e) {
      var t = entityTile(e);
      var center = tileCenter(t.r, t.c);
      return Math.abs(e.x - center.x) < 1.4 && Math.abs(e.y - center.y) < 1.4;
    }
    function isFloor(r, c) { return !isHardWall(r, c) && !(soft[r] && soft[r][c]); }

    function updatePlayer(dt, now) {
      if (isCentered(player)) {
        var t = entityTile(player);
        var center = tileCenter(t.r, t.c);
        player.x = center.x; player.y = center.y;
        if (player.want && isFloor(t.r + DIRS[player.want].dr, t.c + DIRS[player.want].dc)) player.dir = player.want;
        if (player.dir && !isFloor(t.r + DIRS[player.dir].dr, t.c + DIRS[player.dir].dc)) player.dir = null;
      }
      if (player.dir) {
        var d = DIRS[player.dir];
        player.x += d.dc * player.speed * dt;
        player.y += d.dr * player.speed * dt;
      }
      var pt = entityTile(player);
      var item = items[keyOf(pt.r, pt.c)];
      if (item) {
        delete items[keyOf(pt.r, pt.c)];
        if (item === 'bomb') player.maxBombs = Math.min(player.maxBombs + 1, 6);
        else if (item === 'fire') player.range = Math.min(player.range + 1, 6);
        else if (item === 'speed') player.speed = Math.min(player.speed + 0.35, 3.6);
        score += 20;
        playPickup();
      }
      if (now > player.invulnerableUntil) {
        for (var i = 0; i < enemies.length; i++) {
          var en = enemies[i];
          if (!en.alive) continue;
          var dx = en.x - player.x, dy = en.y - player.y;
          if (dx * dx + dy * dy < (TILE * 0.55) * (TILE * 0.55)) { hurtPlayer(now); break; }
        }
      }
    }

    function updateEnemy(en, dt) {
      if (!en.alive) return;
      if (isCentered(en)) {
        var t = entityTile(en);
        var center = tileCenter(t.r, t.c);
        en.x = center.x; en.y = center.y;
        var candidates = DIR_NAMES.filter(function (dir) {
          return isFloor(t.r + DIRS[dir].dr, t.c + DIRS[dir].dc);
        });
        var nonReverse = candidates.filter(function (dir) { return !en.dir || dir !== OPPOSITE[en.dir]; });
        var pool = nonReverse.length ? nonReverse : candidates;
        if (pool.length) {
          var keepGoing = en.dir && pool.indexOf(en.dir) !== -1;
          en.dir = (keepGoing && Math.random() < 0.7) ? en.dir : pool[Math.floor(Math.random() * pool.length)];
        } else {
          en.dir = null;
        }
      }
      if (en.dir) {
        var d = DIRS[en.dir];
        en.x += d.dc * (BASE_SPEED * 0.75) * dt;
        en.y += d.dr * (BASE_SPEED * 0.75) * dt;
      }
    }

    function plantBomb() {
      var t = entityTile(player);
      var k = keyOf(t.r, t.c);
      var already = bombs.some(function (b) { return b.r === t.r && b.c === t.c; });
      if (already) return;
      var activeCount = bombs.length;
      if (activeCount >= player.maxBombs) return;
      bombs.push({ r: t.r, c: t.c, placedAt: performance.now(), range: player.range, exploded: false });
      playPlant();
    }

    function destroySoftBlock(r, c) {
      if (!soft[r][c]) return;
      soft[r][c] = false;
      score += 10;
      var pk = powerUnder[keyOf(r, c)];
      if (pk) { items[keyOf(r, c)] = pk; delete powerUnder[keyOf(r, c)]; }
    }

    function explode(bomb, now) {
      if (bomb.exploded) return;
      bomb.exploded = true;
      var tiles = [{ r: bomb.r, c: bomb.c }];
      DIR_NAMES.forEach(function (dirName) {
        var d = DIRS[dirName];
        for (var step = 1; step <= bomb.range; step++) {
          var r = bomb.r + d.dr * step, c = bomb.c + d.dc * step;
          if (isHardWall(r, c)) break;
          tiles.push({ r: r, c: c });
          if (soft[r][c]) { destroySoftBlock(r, c); break; }
        }
      });
      explosions.push({ tiles: tiles, until: now + EXPLOSION_MS });
      playExplosion();

      var tileSet = {};
      tiles.forEach(function (t) { tileSet[keyOf(t.r, t.c)] = true; });

      bombs.forEach(function (other) {
        if (!other.exploded && tileSet[keyOf(other.r, other.c)]) explode(other, now);
      });

      enemies.forEach(function (en) {
        if (!en.alive) return;
        var et = entityTile(en);
        if (tileSet[keyOf(et.r, et.c)]) { en.alive = false; score += 100; }
      });

      var pt = entityTile(player);
      if (tileSet[keyOf(pt.r, pt.c)] && now > player.invulnerableUntil) hurtPlayer(now);

      updateHud();
    }

    function hurtPlayer(now) {
      lives -= 1;
      playHurt();
      updateHud();
      if (lives <= 0) {
        gameOver();
      } else {
        resetPlayer();
      }
    }

    function gameOver() {
      running = false;
      playGameOver();
      var beat = score > highScore;
      if (beat) { highScore = score; try { localStorage.setItem(HIGH_SCORE_KEY, String(highScore)); } catch (err) {} highEl.textContent = highScore; }
      showOverlay('Game over', 'Final score: ' + score + (beat ? ' — new high score!' : ' · High score: ' + highScore), 'Play again', function () {
        newGame();
        startRunning();
      });
    }

    function stageClear() {
      running = false;
      playClear();
      var bonus = Math.ceil(timeLeft) * 10;
      score += bonus;
      updateHud();
      var beat = score > highScore;
      if (beat) { highScore = score; try { localStorage.setItem(HIGH_SCORE_KEY, String(highScore)); } catch (err) {} highEl.textContent = highScore; }
      showOverlay('Stage clear! 🎉', 'Time bonus +' + bonus + ' · Score: ' + score + (beat ? ' — new high score!' : ''), 'Next stage', function () {
        stage += 1;
        startStage();
        updateHud();
        startRunning();
      });
    }

    function checkBombs(now) {
      bombs.forEach(function (b) { if (!b.exploded && now - b.placedAt >= BOMB_FUSE_MS) explode(b, now); });
      bombs = bombs.filter(function (b) { return !b.exploded; });
      explosions = explosions.filter(function (ex) { return ex.until > now; });
    }

    function checkTimer(dt, now) {
      timeLeft -= dt * (16.6667 / 1000);
      if (timeLeft <= 0) {
        timeLeft = 0;
        hurtPlayer(now);
        if (running) timeLeft = Math.max(70, STAGE_TIME_START - (stage - 1) * 8);
      }
      updateHud();
    }

    function drawBoard(now) {
      ctx.fillStyle = '#1d6e2f';
      ctx.fillRect(0, 0, W, H);
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          var x = c * TILE, y = r * TILE;
          if (isHardWall(r, c)) {
            ctx.fillStyle = '#9aa0a6';
            ctx.fillRect(x, y, TILE, TILE);
            ctx.strokeStyle = '#6b7076';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
          } else if (soft[r][c]) {
            ctx.fillStyle = '#b06a3a';
            ctx.fillRect(x, y, TILE, TILE);
            ctx.strokeStyle = '#7c4323';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
            ctx.beginPath();
            ctx.moveTo(x + TILE / 2, y + 2);
            ctx.lineTo(x + TILE / 2, y + TILE - 2);
            ctx.moveTo(x + 2, y + TILE / 2);
            ctx.lineTo(x + TILE - 2, y + TILE / 2);
            ctx.stroke();
          }
        }
      }
    }

    function drawItems() {
      Object.keys(items).forEach(function (k) {
        var parts = k.split(','), r = Number(parts[0]), c = Number(parts[1]);
        var center = tileCenter(r, c);
        var kind = items[k];
        if (kind === 'bomb') {
          ctx.fillStyle = '#111';
          ctx.beginPath(); ctx.arc(center.x, center.y, TILE * 0.3, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#ffd400'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(center.x + 6, center.y - 10); ctx.lineTo(center.x + 12, center.y - 16); ctx.stroke();
        } else if (kind === 'fire') {
          ctx.fillStyle = '#ff7b1a';
          ctx.beginPath();
          ctx.moveTo(center.x, center.y - TILE * 0.32);
          ctx.quadraticCurveTo(center.x + TILE * 0.22, center.y, center.x, center.y + TILE * 0.32);
          ctx.quadraticCurveTo(center.x - TILE * 0.22, center.y, center.x, center.y - TILE * 0.32);
          ctx.fill();
        } else if (kind === 'speed') {
          ctx.fillStyle = '#4dd2ff';
          ctx.beginPath();
          ctx.moveTo(center.x - 6, center.y - 10);
          ctx.lineTo(center.x + 4, center.y - 10);
          ctx.lineTo(center.x - 2, center.y);
          ctx.lineTo(center.x + 6, center.y);
          ctx.lineTo(center.x - 4, center.y + 12);
          ctx.lineTo(center.x, center.y + 1);
          ctx.lineTo(center.x - 8, center.y + 1);
          ctx.closePath();
          ctx.fill();
        }
      });
    }

    function drawBombs(now) {
      bombs.forEach(function (b) {
        var center = tileCenter(b.r, b.c);
        var frac = (now - b.placedAt) / BOMB_FUSE_MS;
        var flash = Math.floor(now / (120 - frac * 80)) % 2 === 0;
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(center.x, center.y, TILE * 0.36, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = flash ? '#ff4d4d' : '#ffdf7a';
        ctx.beginPath(); ctx.arc(center.x, center.y, TILE * 0.1, 0, Math.PI * 2); ctx.fill();
      });
    }

    function drawExplosions(now) {
      explosions.forEach(function (ex) {
        var frac = Math.max(0, (ex.until - now) / EXPLOSION_MS);
        ex.tiles.forEach(function (t) {
          var center = tileCenter(t.r, t.c);
          ctx.fillStyle = 'rgba(255,160,40,' + (0.55 + 0.35 * frac) + ')';
          ctx.beginPath(); ctx.arc(center.x, center.y, TILE * 0.46 * (0.7 + 0.3 * frac), 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,240,180,' + (0.7 * frac) + ')';
          ctx.beginPath(); ctx.arc(center.x, center.y, TILE * 0.24, 0, Math.PI * 2); ctx.fill();
        });
      });
    }

    function drawEnemies() {
      enemies.forEach(function (en) {
        if (!en.alive) return;
        ctx.fillStyle = en.color;
        ctx.beginPath(); ctx.arc(en.x, en.y, TILE * 0.38, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath(); ctx.arc(en.x - 6, en.y - 4, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(en.x + 6, en.y - 4, 3, 0, Math.PI * 2); ctx.fill();
      });
    }

    function drawPlayer(now) {
      var flicker = now < player.invulnerableUntil && Math.floor(now / 100) % 2 === 0;
      if (flicker) return;
      ctx.fillStyle = '#3a8bd8';
      ctx.beginPath(); ctx.arc(player.x, player.y, TILE * 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fbe3c8';
      ctx.beginPath(); ctx.arc(player.x, player.y - 4, TILE * 0.26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.arc(player.x - 5, player.y - 6, 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(player.x + 5, player.y - 6, 2.4, 0, Math.PI * 2); ctx.fill();
    }

    function render(now) {
      drawBoard(now);
      drawItems();
      drawBombs(now);
      drawExplosions(now);
      drawEnemies();
      drawPlayer(now);
    }

    function loop(now) {
      if (!running) { rafId = null; return; }
      var dt = Math.max(0.1, Math.min((now - lastTime) / 16.6667, 2.5));
      lastTime = now;
      updatePlayer(dt, now);
      enemies.forEach(function (en) { updateEnemy(en, dt); });
      checkBombs(now);
      checkTimer(dt, now);
      if (running && enemies.length && enemies.every(function (en) { return !en.alive; })) { stageClear(); }
      if (running) render(now);
      rafId = requestAnimationFrame(loop);
    }

    function onKeyDown(e) {
      var map = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
      if (map[e.key]) { if (player) player.want = map[e.key]; e.preventDefault(); return; }
      if (e.key === ' ' || e.key === 'x' || e.key === 'X') { if (player && running) plantBomb(); e.preventDefault(); }
    }
    window.addEventListener('keydown', onKeyDown);

    function bindTouch(el, action) {
      el.addEventListener('pointerdown', function (e) { e.preventDefault(); action(); });
    }
    root.querySelector('#bmMuteBtn').addEventListener('click', function (e) {
      soundOn = !soundOn;
      try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch (err) { /* ignore */ }
      e.target.textContent = soundOn ? '🔊' : '🔇';
      if (soundOn) ensureAudio();
    });
    root.querySelector('#bmGuideBtn').addEventListener('click', function () {
      root.querySelector('#bmGuide').classList.toggle('hidden');
    });

    bindTouch(root.querySelector('#bmUpBtn'), function () { if (player) player.want = 'up'; });
    bindTouch(root.querySelector('#bmDownBtn'), function () { if (player) player.want = 'down'; });
    bindTouch(root.querySelector('#bmLeftBtn'), function () { if (player) player.want = 'left'; });
    bindTouch(root.querySelector('#bmRightBtn'), function () { if (player) player.want = 'right'; });
    bindTouch(root.querySelector('#bmBombBtn'), function () { if (player && running) plantBomb(); });

    newGame();
    render(0);
    showOverlay('Ready?', 'Blast blocks, grab power-ups, clear every creature before time runs out.', 'Start', startRunning);

    window.TM.toolModules['bomberman-arcade'].debugState = function () {
      return { player: player, enemies: enemies, bombs: bombs, soft: soft, items: items, score: score, lives: lives, timeLeft: timeLeft };
    };

    window.TM.toolModules['bomberman-arcade'].unmount = function () {
      running = false;
      if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
      window.removeEventListener('keydown', onKeyDown);
    };
  }

  window.TM.registerTool('bomberman-arcade', { mount: mount });
})();
