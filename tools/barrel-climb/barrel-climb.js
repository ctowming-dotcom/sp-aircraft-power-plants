(function () {
  window.TM = window.TM || {};

  // A generic "climb past rolling barrels to reach the top" arcade game —
  // an original level/character design in the classic barrel-climber
  // genre, not a reproduction of any specific game's art or level data.
  var W = 760;
  var H = 560;
  var GRAVITY = 0.5;
  var JUMP_V = -9.6;
  var MOVE_SPEED = 2.6;
  var CLIMB_SPEED = 2.2;
  var BARREL_SPEED = 1.8;
  var BARREL_LADDER_CHANCE = 0.18; // per ladder pass, chance a barrel descends it instead of rolling on
  var HIGH_SCORE_KEY = 'tm.barrelClimb.highScore.v2';
  var RESPAWN_INVULN_MS = 1500;

  // Difficulty: slower/less frequent barrels and fewer flames on Easy;
  // the opposite on Hard. Lives are unlimited on every tier — a hit means
  // one MCQ gate, not a limit.
  var DIFFICULTY_KEY = 'tm.barrelClimb.difficulty';
  var DIFFICULTY_SETTINGS = {
    easy: { barrelIntervalBase: 3400, barrelIntervalMin: 1300, barrelIntervalStep: 180, fireballCap: 1 },
    normal: { barrelIntervalBase: 2600, barrelIntervalMin: 900, barrelIntervalStep: 220, fireballCap: 2 },
    hard: { barrelIntervalBase: 1900, barrelIntervalMin: 650, barrelIntervalStep: 260, fireballCap: 3 },
  };
  var difficulty = 'normal';
  try {
    var savedDiff = localStorage.getItem(DIFFICULTY_KEY);
    if (DIFFICULTY_SETTINGS[savedDiff]) difficulty = savedDiff;
  } catch (err) { /* ignore */ }
  function diffCfg() { return DIFFICULTY_SETTINGS[difficulty]; }

  // Each row is one sloped girder: a solid run from xStart to xEnd (the
  // rest of the row's width is an open gap), with its surface height
  // linearly interpolated between leftY (at x=xStart) and rightY
  // (at x=xEnd). The gap always sits at a row's own downhill end, so a
  // barrel rolling off it naturally lands on the row below and continues
  // in a believable zigzag.
  var TILT = 16;
  function row(baseY, xStart, xEnd, highSide) {
    var leftY = highSide === 'left' ? baseY - TILT : baseY + TILT;
    var rightY = highSide === 'left' ? baseY + TILT : baseY - TILT;
    return { xStart: xStart, xEnd: xEnd, leftY: leftY, rightY: rightY };
  }
  var ROWS = [
    { xStart: 0, xEnd: W, leftY: 520, rightY: 520 }, // ground floor — flat, catches everything
    row(420, 100, 760, 'right'), // gap at the left (low) end
    row(340, 0, 660, 'left'), // gap at the right (low) end
    row(260, 100, 760, 'right'),
    row(180, 0, 660, 'left'),
    row(100, 100, 760, 'right'), // top goal floor
  ];
  var TOP_ROW = ROWS.length - 1;

  function surfaceYAt(r, x) {
    if (x < r.xStart || x > r.xEnd) return null;
    var t = r.xEnd === r.xStart ? 0 : (x - r.xStart) / (r.xEnd - r.xStart);
    return r.leftY + (r.rightY - r.leftY) * t;
  }
  function downhillDir(r) { return r.rightY > r.leftY ? 1 : -1; }

  // One ladder between each consecutive pair of rows, at an x within both
  // rows' solid overlap — alternating left/right so the climb zigzags.
  var LADDER_XS = [200, 550, 200, 550, 200];
  var LADDERS = LADDER_XS.map(function (x, i) {
    return {
      x: x,
      fromRow: i,
      toRow: i + 1,
      topY: surfaceYAt(ROWS[i + 1], x),
      bottomY: surfaceYAt(ROWS[i], x),
    };
  });

  var DK_POS = { x: 690, y: surfaceYAt(ROWS[TOP_ROW], 690) };
  var GOAL_POS = { x: 600, y: surfaceYAt(ROWS[TOP_ROW], 600) };
  var PLAYER_SPAWN = { x: 40, row: 0 };

  // Tiny self-contained Web Audio sound effects — same pattern as this
  // portal's other arcade games: no audio files, lazily created on first
  // sound (always from a user gesture), with a persisted mute toggle.
  var SOUND_KEY = 'tm.barrelClimb.sound';
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
  function playJump() { beep(520, 0.09, 'square', 0.13); }
  function playHop() { beep(740, 0.06, 'square', 0.14); beep(980, 0.07, 'square', 0.14, 0.05); }
  function playHurt() { beep(260, 0.16, 'sawtooth', 0.2); beep(160, 0.22, 'sawtooth', 0.18, 0.1); }
  function playClear() { beep(523, 0.1, 'square', 0.18); beep(659, 0.1, 'square', 0.18, 0.1); beep(784, 0.1, 'square', 0.18, 0.2); beep(1046, 0.22, 'square', 0.2, 0.3); }
  function playMcqRight() { beep(523, 0.09, 'square', 0.18); beep(784, 0.14, 'square', 0.18, 0.09); }
  function playMcqWrong() { beep(180, 0.18, 'sawtooth', 0.18); }

  // Every hit (barrel or flame) is gated behind one of these 10 aircraft-
  // power-plant MCQs — unlimited retries on the same question until the
  // student gets it right, then play resumes. Editable in-browser via the
  // password-gated "✎" edit panel (password APP, same casual click-guard
  // as every other tool's edit mode).
  var DEFAULT_MCQS = [
    { q: "What's the correct order: during start, what happens right after the starter motor spins the engine?", choices: ['Fuel and ignition are introduced to begin combustion', 'The aircraft takes off', 'The fire bottle discharges', 'The APU shuts down'], answer: 0 },
    { q: 'What does the starter control valve do?', choices: ['Controls pneumatic air flow to the starter motor', 'Starts the fire loop', 'Filters fuel', 'Cools oil'], answer: 0 },
    { q: 'What is EGT?', choices: ['Exhaust Gas Temperature', 'Engine Gear Train', 'Electrical Ground Test', 'Engine Glide Time'], answer: 0 },
    { q: 'What does the EEC do during engine start?', choices: ['Electronically controls engine start/ignition sequencing', 'Extinguishes fires', 'Filters oil', 'Stores fuel'], answer: 0 },
    { q: 'Why must the starter disengage ("cut-out") once the engine is running?', choices: ['To avoid over-speeding/damaging the starter', 'To save fuel only', 'To start the APU', 'To detect fire'], answer: 0 },
    { q: 'What is N2 in a start sequence typically tracking?', choices: ['The rotational speed of the HP spool as a percentage', 'Fuel temperature', 'Cabin pressure', 'Oil quantity'], answer: 0 },
    { q: 'What does the igniter unit do during start?', choices: ['Supplies sparking energy to the igniter plugs', 'Pumps fuel', 'Detects fire', 'Starts the APU'], answer: 0 },
    { q: "What's the purpose of a pylon on an engine?", choices: ['Structurally attaches the engine to the wing', 'Cools the oil', 'Detects fire', 'Starts ignition'], answer: 0 },
    { q: 'What does "N1" typically refer to in a triple-spool engine?', choices: ['The low-pressure (fan) spool speed', 'The high-pressure spool speed', 'Oil pressure', 'Fuel flow'], answer: 0 },
    { q: "What's the benefit of a twin-spool vs single-spool design?", choices: ['Each spool can run at its own optimal speed for efficiency', "It's lighter with fewer parts", 'It needs no oil system', "It can't use bleed air"], answer: 0 },
  ];
  var MCQ_KEY = 'tm.barrelClimb.mcqs';
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
      '<div class="bc-wrap">' +
      '<h1>🛢️ Barrel Climb</h1>' +
      '<p class="bc-intro">Climb the girders to reach the top — dodge or jump the rolling barrels and the roaming flames. Arrow keys / WASD to move, Up/Down to climb a ladder, Space to jump.</p>' +
      '<div class="bc-hud">' +
      '<div class="bc-stat"><span class="bc-stat-label">Score</span><span class="bc-stat-value" id="bcScore">0</span></div>' +
      '<div class="bc-stat"><span class="bc-stat-label">High score</span><span class="bc-stat-value" id="bcHigh">0</span></div>' +
      '<div class="bc-stat"><span class="bc-stat-label">Top score</span><span class="bc-stat-value" id="bcTop">--</span></div>' +
      '<div class="bc-stat"><span class="bc-stat-label">Misses</span><span class="bc-stat-value" id="bcLives">0</span></div>' +
      '<button type="button" class="bc-mute-btn" id="bcMuteBtn" aria-label="Toggle sound">' + (soundOn ? '🔊' : '🔇') + '</button>' +
      '<button type="button" class="bc-mute-btn" id="bcSettingsBtn" aria-label="Game settings">⚙️</button>' +
      '<button type="button" class="bc-mute-btn" id="bcEditBtn" aria-label="Edit questions">✎</button>' +
      '</div>' +
      '<div class="bc-guide hidden" id="bcSettings">' +
      '<h2>⚙️ Game Settings</h2>' +
      '<p>Easy gives slower/less frequent barrels and fewer flames; Hard gives the opposite. Lives are unlimited on every setting — a hit just means answering one question before you continue. Takes effect on your next game.</p>' +
      '<div class="bc-diff-row">' +
      '<button type="button" class="bc-tab bc-diff-btn" data-diff="easy">Easy</button>' +
      '<button type="button" class="bc-tab bc-diff-btn" data-diff="normal">Normal</button>' +
      '<button type="button" class="bc-tab bc-diff-btn" data-diff="hard">Hard</button>' +
      '</div>' +
      '<button type="button" class="bc-btn bc-btn-primary" id="bcResetTopBtn">Reset top score…</button>' +
      '</div>' +
      '<div class="bc-stage">' +
      '<canvas id="bcCanvas" width="' + W + '" height="' + H + '"></canvas>' +
      '<div class="bc-overlay hidden" id="bcOverlay">' +
      '<div class="bc-overlay-card">' +
      '<h2 id="bcOverlayTitle"></h2>' +
      '<p id="bcOverlayMsg"></p>' +
      '<button type="button" class="bc-btn bc-btn-primary" id="bcOverlayBtn"></button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="bc-touch">' +
      '<div></div><button type="button" class="bc-touch-btn" id="bcUpBtn">▲</button><div></div>' +
      '<button type="button" class="bc-touch-btn" id="bcLeftBtn">◀</button>' +
      '<button type="button" class="bc-touch-btn bc-touch-jump" id="bcJumpBtn">⤒</button>' +
      '<button type="button" class="bc-touch-btn" id="bcRightBtn">▶</button>' +
      '<div></div><button type="button" class="bc-touch-btn" id="bcDownBtn">▼</button><div></div>' +
      '</div>' +
      '<div class="bc-mcq-overlay hidden" id="bcMcqOverlay">' +
      '<div class="bc-mcq-card">' +
      '<button type="button" class="bc-mcq-close hidden" id="bcMcqCloseBtn" aria-label="Close">✕</button>' +
      '<h2>📝 Quick Check</h2>' +
      '<p class="bc-mcq-note">Answer correctly to get back in — try as many times as you need.</p>' +
      '<p class="bc-mcq-question" id="bcMcqQuestion"></p>' +
      '<div class="bc-mcq-choices" id="bcMcqChoices"></div>' +
      '<p class="bc-mcq-feedback" id="bcMcqFeedback"></p>' +
      '</div>' +
      '</div>' +
      '<div class="bc-guide hidden" id="bcMcqEdit">' +
      '<h2>✎ Edit questions</h2>' +
      '<p>Change any question, its 4 choices, or which one is correct. Saved to this browser only — paste the box below into barrel-climb.js to make it the default for everyone.</p>' +
      '<div id="bcMcqEditList"></div>' +
      '<div class="bc-diff-row">' +
      '<button type="button" class="bc-btn bc-btn-primary" id="bcMcqSaveBtn">Save changes</button>' +
      '</div>' +
      '<p class="bc-mcq-note">Copy-paste source:</p>' +
      '<textarea class="bc-mcq-copy" id="bcMcqCopy" readonly rows="8"></textarea>' +
      '</div>' +
      '</div>';

    var canvas = root.querySelector('#bcCanvas');
    var ctx = canvas.getContext('2d');
    var scoreEl = root.querySelector('#bcScore');
    var highEl = root.querySelector('#bcHigh');
    var livesEl = root.querySelector('#bcLives');
    var overlay = root.querySelector('#bcOverlay');
    var overlayTitle = root.querySelector('#bcOverlayTitle');
    var overlayMsg = root.querySelector('#bcOverlayMsg');
    var overlayBtn = root.querySelector('#bcOverlayBtn');
    var mcqOverlay = root.querySelector('#bcMcqOverlay');
    var mcqQuestionEl = root.querySelector('#bcMcqQuestion');
    var mcqChoicesEl = root.querySelector('#bcMcqChoices');
    var mcqFeedbackEl = root.querySelector('#bcMcqFeedback');
    var mcqCloseBtn = root.querySelector('#bcMcqCloseBtn');
    var topEl = root.querySelector('#bcTop');
    var mcqs = loadMcqs();
    var mcqEditUnlocked = false;
    var settingsUnlocked = false;
    var pendingMcqCorrect = null;

    var GAME_ID = 'barrelClimb';
    // Scoring at stage clear = raw score + a fast-climb time bonus −
    // a per-revive penalty. PAR_SECONDS/POINTS_PER_SECOND judged from a
    // clean climb through this stage's 5 ladders taking roughly 20-30s;
    // MISS_PENALTY sits between a single barrel-hop bonus (50) and the
    // flat stage-clear bonus (500) so one revive stings but never wipes
    // out a whole climb's worth of score.
    var PAR_SECONDS = 25;
    var POINTS_PER_SECOND = 10;
    var MISS_PENALTY = 100;
    var stageStartTime = 0;
    var missesThisStage = 0;

    var highScore = 0;
    try { highScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0; } catch (err) { highScore = 0; }
    highEl.textContent = highScore;

    function updateTopDisplay() { topEl.textContent = TM.Leaderboard.bestLabel(GAME_ID); }
    updateTopDisplay();

    var score, misses, stage, player, barrels, fireballs, barrelSpawnAt, running, rafId, lastTime;
    var keys = { left: false, right: false, up: false, down: false };
    var jumpRequested = false;

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
      overlayTitle.textContent = title;
      overlayMsg.textContent = msg;
      overlayBtn.textContent = btnLabel;
      overlayBtn.onclick = action;
      overlay.classList.remove('hidden');
    }

    function barrelIntervalNow() { return Math.max(diffCfg().barrelIntervalMin, diffCfg().barrelIntervalBase - stage * diffCfg().barrelIntervalStep); }
    function fireballCountNow() { return Math.min(diffCfg().fireballCap, 1 + Math.floor((stage - 1) / 2)); }

    function resetPlayer() {
      var p = ROWS[PLAYER_SPAWN.row];
      player.x = PLAYER_SPAWN.x;
      player.y = surfaceYAt(p, PLAYER_SPAWN.x);
      player.vy = 0;
      player.row = PLAYER_SPAWN.row;
      player.onGround = true;
      player.climbing = null;
      player.facing = 1;
      player.invulnerableUntil = performance.now() + RESPAWN_INVULN_MS;
    }

    function spawnFireballs() {
      fireballs = [];
      var count = fireballCountNow();
      for (var i = 0; i < count; i++) {
        var r = 2 + (i % 2);
        var row = ROWS[r];
        var x = row.xStart + (row.xEnd - row.xStart) * (0.3 + 0.2 * i);
        fireballs.push({ x: x, y: surfaceYAt(row, x), vy: 0, row: r, dir: 1, onGround: true });
      }
    }

    function startStage() {
      barrels = [];
      spawnFireballs();
      barrelSpawnAt = performance.now() + 1200;
      resetPlayer();
      stageStartTime = performance.now();
      missesThisStage = 0;
    }

    function newGame() {
      score = 0;
      misses = 0;
      stage = 1;
      player = {};
      startStage();
      updateHud();
    }

    function startRunning() {
      overlay.classList.add('hidden');
      running = true;
      lastTime = performance.now();
      if (rafId == null) rafId = requestAnimationFrame(loop);
    }

    function spawnBarrel() {
      var row = ROWS[TOP_ROW];
      barrels.push({ x: DK_POS.x, y: DK_POS.y, vy: 0, row: TOP_ROW, dir: downhillDir(row), onGround: true, scoredAgainstPlayer: false, lastLadderSign: {} });
    }

    // Shared sloped-ground resolver used by the player, barrels and
    // fireballs alike: while "onGround", stay snapped to the current
    // row's (possibly sloped) surface as x changes; once x walks past
    // that row's solid span, fall until some row's surface is crossed
    // from above, then land on it. Same pattern as this portal's other
    // platformer, just generalized from a flat y to a sloped one.
    function applyGravity(e, dt) {
      if (e.onGround) {
        var cur = ROWS[e.row];
        var sy = surfaceYAt(cur, e.x);
        if (sy == null) { e.onGround = false; }
        else { e.y = sy; }
      }
      if (!e.onGround) {
        e.vy += GRAVITY * dt;
        var prevY = e.y;
        e.y += e.vy * dt;
        for (var i = ROWS.length - 1; i >= 0; i--) {
          var s = surfaceYAt(ROWS[i], e.x);
          if (s == null) continue;
          if (e.vy >= 0 && prevY <= s + 0.5 && e.y >= s) {
            e.y = s; e.vy = 0; e.onGround = true; e.row = i;
            break;
          }
        }
      }
    }

    function updatePlayer(dt, now) {
      if (player.climbing) {
        var l = player.climbing;
        if (keys.up) player.y -= CLIMB_SPEED * dt;
        if (keys.down) player.y += CLIMB_SPEED * dt;
        if (player.y <= l.topY) {
          player.y = l.topY; player.row = l.toRow; player.onGround = true; player.climbing = null; player.vy = 0;
        } else if (player.y >= l.bottomY) {
          player.y = l.bottomY; player.row = l.fromRow; player.onGround = true; player.climbing = null; player.vy = 0;
        } else if (keys.left || keys.right) {
          player.climbing = null; player.onGround = false;
        }
      } else {
        if (keys.left) { player.x -= MOVE_SPEED * dt; player.facing = -1; }
        if (keys.right) { player.x += MOVE_SPEED * dt; player.facing = 1; }
        player.x = Math.max(10, Math.min(W - 10, player.x));

        if (jumpRequested && player.onGround) { player.vy = JUMP_V; player.onGround = false; playJump(); }

        for (var i = 0; i < LADDERS.length; i++) {
          var ladder = LADDERS[i];
          if (Math.abs(player.x - ladder.x) > 9) continue;
          var nearTop = player.onGround && player.row === ladder.toRow && Math.abs(player.y - ladder.topY) < 6;
          var nearBottom = player.onGround && player.row === ladder.fromRow && Math.abs(player.y - ladder.bottomY) < 6;
          if ((keys.down && nearTop) || (keys.up && nearBottom)) {
            player.climbing = ladder; player.x = ladder.x; player.onGround = false; player.vy = 0;
            break;
          }
        }

        if (!player.climbing) applyGravity(player, dt);
      }
      jumpRequested = false;

      if (now > player.invulnerableUntil) {
        var hit = barrels.some(function (b) {
          var dx = b.x - player.x, dy = b.y - player.y;
          return dx * dx + dy * dy < 15 * 15;
        }) || fireballs.some(function (f) {
          var dx = f.x - player.x, dy = f.y - player.y;
          return dx * dx + dy * dy < 15 * 15;
        });
        if (hit) { loseLife(now); return; }
      }
      barrels.forEach(function (b) {
        var dx = Math.abs(b.x - player.x);
        if (!b.scoredAgainstPlayer && dx < 14 && !player.onGround && player.y < b.y - 6) {
          b.scoredAgainstPlayer = true;
          score += 50;
          playHop();
          updateHud();
        }
      });

      if (player.row === TOP_ROW && player.onGround && Math.abs(player.x - GOAL_POS.x) < 24) {
        stageClear();
      }
    }

    function updateBarrel(b, dt, now) {
      if (b.descending) {
        b.y += CLIMB_SPEED * dt * 1.3;
        if (b.y >= b.descending.bottomY) {
          b.row = b.descending.fromRow; b.y = b.descending.bottomY; b.onGround = true;
          b.dir = downhillDir(ROWS[b.row]); b.descending = null;
        }
        return;
      }
      if (b.onGround) {
        var prevX = b.x;
        b.x += b.dir * BARREL_SPEED * dt;
        LADDERS.forEach(function (ladder) {
          if (ladder.toRow !== b.row) return;
          if ((prevX - ladder.x) * (b.x - ladder.x) <= 0 && Math.random() < BARREL_LADDER_CHANCE) {
            b.descending = ladder; b.onGround = false; b.x = ladder.x; b.y = ladder.topY;
          }
        });
      }
      if (!b.descending) applyGravity(b, dt);
    }

    function updateFireball(f, dt) {
      var r = ROWS[f.row];
      f.x += f.dir * (BARREL_SPEED * 0.6) * dt;
      if (f.x <= r.xStart + 6 || f.x >= r.xEnd - 6) { f.dir *= -1; f.x = Math.max(r.xStart + 6, Math.min(r.xEnd - 6, f.x)); }
      f.y = surfaceYAt(r, f.x);
    }

    function loseLife(now) {
      misses += 1;
      missesThisStage += 1;
      playHurt();
      updateHud();
      running = false;
      showMcqGate(function () {
        resetPlayer();
        running = true;
        lastTime = performance.now();
        if (rafId == null) rafId = requestAnimationFrame(loop);
      });
    }

    // --- MCQ gate -----------------------------------------------------
    // Shown on every hit (barrel or flame). Picks a random question from
    // the (possibly teacher-edited) bank, shuffles the displayed choice
    // order so the correct answer's on-screen position never gives it
    // away, and lets the student retry the SAME question as many times
    // as needed — no penalty, no limit, just a short pause gate.
    function showMcqGate(onCorrect) {
      var q = mcqs[Math.floor(Math.random() * mcqs.length)];
      var order = q.choices.map(function (text, i) { return { text: text, correct: i === q.answer }; });
      for (var i = order.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
      }
      mcqQuestionEl.textContent = q.q;
      mcqFeedbackEl.textContent = '';
      mcqFeedbackEl.className = 'bc-mcq-feedback';
      mcqChoicesEl.innerHTML = '';
      mcqCloseBtn.classList.add('hidden');
      pendingMcqCorrect = onCorrect;
      order.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bc-mcq-choice';
        btn.textContent = opt.text;
        btn.dataset.correct = opt.correct ? '1' : '0';
        btn.addEventListener('click', function () {
          if (opt.correct) {
            mcqFeedbackEl.textContent = '✅ Correct! Press ✕ to continue.';
            mcqFeedbackEl.className = 'bc-mcq-feedback is-correct';
            playMcqRight();
            mcqChoicesEl.querySelectorAll('.bc-mcq-choice').forEach(function (b) { b.disabled = true; });
            mcqCloseBtn.classList.remove('hidden');
          } else {
            mcqFeedbackEl.textContent = '❌ Not quite — try again.';
            mcqFeedbackEl.className = 'bc-mcq-feedback is-wrong';
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
      var listEl = root.querySelector('#bcMcqEditList');
      listEl.innerHTML = '';
      mcqs.forEach(function (q, qi) {
        var block = document.createElement('div');
        block.className = 'bc-mcq-edit-block';
        var qLabel = document.createElement('label');
        qLabel.textContent = 'Question ' + (qi + 1);
        var qInput = document.createElement('input');
        qInput.type = 'text';
        qInput.className = 'bc-mcq-edit-q';
        qInput.value = q.q;
        qInput.addEventListener('input', function () { q.q = qInput.value; });
        block.appendChild(qLabel);
        block.appendChild(qInput);
        q.choices.forEach(function (choiceText, ci) {
          var row = document.createElement('div');
          row.className = 'bc-mcq-edit-choice-row';
          var radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = 'bcMcqCorrect' + qi;
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
      root.querySelector('#bcMcqCopy').value = formatMcqs(mcqs);
    }

    function stageClear() {
      running = false;
      score += 500;
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
        (penalty ? (' − ' + penalty + ' for ' + missesThisStage + ' revive' + (missesThisStage === 1 ? '' : 's')) : '') +
        ((timeBonus || penalty) ? (' = ' + finalScore) : '');
      var clearedStage = stage;
      // A quick knowledge check gates moving on from a cleared stage, same
      // as a life lost — scoring/leaderboard submission already happened
      // above, so answering slowly here never affects the score just locked in.
      showMcqGate(function () {
        showOverlay('Rescue complete! 🎉', 'Stage ' + clearedStage + ' cleared — ' + breakdown + (beat ? ' — new high score!' : '') + (result.submitted ? ' — new top score!' : ''), 'Next stage', function () {
          stage += 1; startStage(); updateHud(); startRunning();
        });
      });
    }

    function drawRow(r) {
      ctx.strokeStyle = '#d6447a';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(r.xStart, r.leftY);
      ctx.lineTo(r.xEnd, r.rightY);
      ctx.stroke();
      ctx.strokeStyle = '#7a1f42';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (var x = r.xStart; x < r.xEnd; x += 14) {
        var y = surfaceYAt(r, x) + 5;
        ctx.moveTo(x, y); ctx.lineTo(Math.min(x + 7, r.xEnd), y + 3);
      }
      ctx.stroke();
    }

    function drawLadder(l) {
      ctx.strokeStyle = '#4dd2ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(l.x - 7, l.topY); ctx.lineTo(l.x - 7, l.bottomY);
      ctx.moveTo(l.x + 7, l.topY); ctx.lineTo(l.x + 7, l.bottomY);
      for (var y = l.topY + 6; y < l.bottomY; y += 10) { ctx.moveTo(l.x - 7, y); ctx.lineTo(l.x + 7, y); }
      ctx.stroke();
    }

    function drawBarrel(b) {
      ctx.fillStyle = '#9a5a2a';
      ctx.beginPath(); ctx.arc(b.x, b.y - 9, 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#5c3214'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(b.x, b.y - 9, 10, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(b.x - 10, b.y - 9); ctx.lineTo(b.x + 10, b.y - 9); ctx.stroke();
    }

    function drawFireball(f) {
      var flick = 0.85 + 0.15 * Math.sin(performance.now() / 90 + f.x);
      ctx.fillStyle = '#ff7b1a';
      ctx.beginPath(); ctx.arc(f.x, f.y - 9 * flick, 9 * flick, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffe08a';
      ctx.beginPath(); ctx.arc(f.x, f.y - 9 * flick, 4, 0, Math.PI * 2); ctx.fill();
    }

    function drawDK() {
      ctx.fillStyle = '#6b3a1e';
      ctx.beginPath(); ctx.arc(DK_POS.x, DK_POS.y - 16, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c99a6a';
      ctx.beginPath(); ctx.arc(DK_POS.x, DK_POS.y - 18, 9, 0, Math.PI * 2); ctx.fill();
    }

    function drawGoal() {
      ctx.fillStyle = '#e85d8a';
      ctx.beginPath(); ctx.arc(GOAL_POS.x, GOAL_POS.y - 20, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(GOAL_POS.x - 7, GOAL_POS.y - 13, 14, 13);
    }

    function drawPlayer() {
      var flicker = performance.now() < player.invulnerableUntil && Math.floor(performance.now() / 100) % 2 === 0;
      if (flicker) return;
      ctx.fillStyle = '#ff7b88';
      ctx.fillRect(player.x - 6, player.y - 20, 12, 16);
      ctx.fillStyle = '#fbe3c8';
      ctx.beginPath(); ctx.arc(player.x, player.y - 24, 6, 0, Math.PI * 2); ctx.fill();
    }

    function render() {
      ctx.fillStyle = '#10131f';
      ctx.fillRect(0, 0, W, H);
      ROWS.forEach(drawRow);
      LADDERS.forEach(drawLadder);
      drawDK();
      drawGoal();
      barrels.forEach(drawBarrel);
      fireballs.forEach(drawFireball);
      drawPlayer();
    }

    function loop(now) {
      if (!running) { rafId = null; return; }
      var dt = Math.max(0.1, Math.min((now - lastTime) / 16.6667, 2.5));
      lastTime = now;

      if (now >= barrelSpawnAt) { spawnBarrel(); barrelSpawnAt = now + barrelIntervalNow() * (0.8 + Math.random() * 0.4); }
      barrels.forEach(function (b) { updateBarrel(b, dt, now); });
      barrels = barrels.filter(function (b) { return b.y < H + 60 && b.x > -40 && b.x < W + 40; });
      fireballs.forEach(function (f) { updateFireball(f, dt); });
      updatePlayer(dt, now);

      if (running) render();
      rafId = requestAnimationFrame(loop);
    }

    function onKeyDown(e) {
      var map = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' };
      if (map[e.key]) { keys[map[e.key]] = true; e.preventDefault(); return; }
      if (e.key === ' ') { jumpRequested = true; e.preventDefault(); }
    }
    function onKeyUp(e) {
      var map = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' };
      if (map[e.key]) keys[map[e.key]] = false;
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    function bindHold(el, key) {
      el.addEventListener('pointerdown', function (e) { e.preventDefault(); keys[key] = true; });
      el.addEventListener('pointerup', function () { keys[key] = false; });
      el.addEventListener('pointerleave', function () { keys[key] = false; });
      el.addEventListener('pointercancel', function () { keys[key] = false; });
    }
    bindHold(root.querySelector('#bcLeftBtn'), 'left');
    bindHold(root.querySelector('#bcRightBtn'), 'right');
    bindHold(root.querySelector('#bcUpBtn'), 'up');
    bindHold(root.querySelector('#bcDownBtn'), 'down');
    // pointerdown (not click) so a tap registers instantly and
    // independently of whichever other touch button is already held —
    // same fix as Jump Challenge's jump button, for the same reason.
    root.querySelector('#bcJumpBtn').addEventListener('pointerdown', function (e) { e.preventDefault(); jumpRequested = true; });

    root.querySelector('#bcMuteBtn').addEventListener('click', function (e) {
      soundOn = !soundOn;
      try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch (err) { /* ignore */ }
      e.target.textContent = soundOn ? '🔊' : '🔇';
      if (soundOn) ensureAudio();
    });
    root.querySelector('#bcSettingsBtn').addEventListener('click', function () {
      var panel = root.querySelector('#bcSettings');
      if (panel.classList.contains('hidden')) {
        if (!settingsUnlocked && !TM.Leaderboard.checkPassword('Enter the settings password to unlock game settings:')) return;
        settingsUnlocked = true;
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });
    root.querySelector('#bcResetTopBtn').addEventListener('click', function () {
      if (TM.Leaderboard.resetBest(GAME_ID)) updateTopDisplay();
    });
    root.querySelectorAll('.bc-diff-btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-diff') === difficulty);
      btn.addEventListener('click', function () {
        difficulty = btn.getAttribute('data-diff');
        try { localStorage.setItem(DIFFICULTY_KEY, difficulty); } catch (err) { /* ignore */ }
        root.querySelectorAll('.bc-diff-btn').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      });
    });
    root.querySelector('#bcEditBtn').addEventListener('click', function () {
      var editCard = root.querySelector('#bcMcqEdit');
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
    root.querySelector('#bcMcqSaveBtn').addEventListener('click', function () {
      saveMcqs(mcqs);
      refreshMcqCopy();
    });

    newGame();
    render();
    showOverlay('Ready?', 'Climb to the top, dodge the barrels and flames, and reach the rescue.', 'Start', function () {
      newGame(); startRunning(); // re-applies the difficulty picked while still on this screen
    });

    window.TM.toolModules['barrel-climb'].debugState = function () {
      return { player: player, barrels: barrels, fireballs: fireballs, rows: ROWS, ladders: LADDERS, score: score, misses: misses, goal: GOAL_POS, topRow: TOP_ROW, mcqGateOpen: !mcqOverlay.classList.contains('hidden') };
    };
    window.TM.toolModules['barrel-climb'].debugKeys = keys;
    window.TM.toolModules['barrel-climb'].debugJump = function () { jumpRequested = true; };
    window.TM.toolModules['barrel-climb'].debugForceLoseLife = function () { loseLife(performance.now()); };
    window.TM.toolModules['barrel-climb'].debugForceStageClear = function () { stageClear(); };
    window.TM.toolModules['barrel-climb'].debugAnswerMcq = function (correct) {
      var btns = mcqChoicesEl.querySelectorAll('.bc-mcq-choice');
      for (var k = 0; k < btns.length; k++) {
        var isRight = btns[k].dataset.correct === '1';
        if (isRight === !!correct) { btns[k].click(); return true; }
      }
      return false;
    };

    window.TM.toolModules['barrel-climb'].unmount = function () {
      running = false;
      if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }

  window.TM.registerTool('barrel-climb', { mount: mount });
})();
