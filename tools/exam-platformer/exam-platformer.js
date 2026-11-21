(function () {
  window.TM = window.TM || {};

  // Canvas is drawn at this fixed internal resolution; CSS scales the
  // element responsively, so every coordinate below is in these units.
  var W = 800;
  var H = 400;
  var GRAVITY = 0.5;
  var JUMP_V = -10.2;
  var MOVE_SPEED = 4.2;
  var PLAYER_W = 28;
  var PLAYER_H = 36;
  var LIVES_START = 3;
  var GROUND_Y = 340; // top of ground-level solids; player stands with its
                      // feet at this y when on a ground segment

  // Every stage is a flat list of "solids" (things you can stand on — both
  // ground segments and floating platforms are the same shape to the
  // collision code) plus a separate list of hazard "spikes", and a goalX
  // the player must reach. Gaps are simply the x-ranges no solid covers —
  // walk/jump over one and falling past the bottom of the screen costs a
  // life, the same as touching a spike.
  var STAGES = [
    {
      id: 'stage1',
      name: 'Intake Run',
      levelWidth: 2400,
      goalX: 2360,
      solids: [
        { x: 0, y: GROUND_Y, w: 500, h: 60 },
        { x: 560, y: GROUND_Y, w: 340, h: 60 },
        { x: 950, y: GROUND_Y, w: 550, h: 60 },
        { x: 1560, y: GROUND_Y, w: 840, h: 60 },
        { x: 1150, y: GROUND_Y - 90, w: 120, h: 16 },
      ],
      spikes: [
        { x: 1200, y: GROUND_Y - 20, w: 24, h: 20 },
        { x: 2000, y: GROUND_Y - 20, w: 24, h: 20 },
      ],
    },
    {
      id: 'stage2',
      name: 'Compressor Climb',
      levelWidth: 2800,
      goalX: 2760,
      solids: [
        { x: 0, y: GROUND_Y, w: 400, h: 60 },
        { x: 700, y: GROUND_Y, w: 300, h: 60 },
        { x: 1300, y: GROUND_Y, w: 300, h: 60 },
        { x: 1900, y: GROUND_Y, w: 300, h: 60 },
        { x: 2500, y: GROUND_Y, w: 300, h: 60 },
        { x: 500, y: GROUND_Y - 80, w: 100, h: 16 },
        { x: 1100, y: GROUND_Y - 90, w: 100, h: 16 },
        { x: 1700, y: GROUND_Y - 80, w: 100, h: 16 },
        { x: 2300, y: GROUND_Y - 90, w: 100, h: 16 },
      ],
      spikes: [
        { x: 850, y: GROUND_Y - 20, w: 24, h: 20 },
        { x: 1450, y: GROUND_Y - 20, w: 24, h: 20 },
        { x: 2050, y: GROUND_Y - 20, w: 24, h: 20 },
      ],
    },
    {
      id: 'stage3',
      name: 'Combustor Gauntlet',
      levelWidth: 3200,
      goalX: 3160,
      solids: [
        { x: 0, y: GROUND_Y, w: 350, h: 60 },
        { x: 650, y: GROUND_Y, w: 250, h: 60 },
        { x: 1250, y: GROUND_Y, w: 250, h: 60 },
        { x: 1850, y: GROUND_Y, w: 250, h: 60 },
        { x: 2450, y: GROUND_Y, w: 250, h: 60 },
        { x: 3000, y: GROUND_Y, w: 200, h: 60 },
        { x: 450, y: GROUND_Y - 70, w: 90, h: 16 },
        { x: 950, y: GROUND_Y - 60, w: 80, h: 16 },
        { x: 1080, y: GROUND_Y - 110, w: 80, h: 16 },
        { x: 1550, y: GROUND_Y - 60, w: 80, h: 16 },
        { x: 1680, y: GROUND_Y - 110, w: 80, h: 16 },
        { x: 2150, y: GROUND_Y - 60, w: 80, h: 16 },
        { x: 2280, y: GROUND_Y - 110, w: 80, h: 16 },
        { x: 2750, y: GROUND_Y - 70, w: 90, h: 16 },
      ],
      spikes: [
        { x: 750, y: GROUND_Y - 20, w: 24, h: 20 },
        { x: 1460, y: GROUND_Y - 20, w: 24, h: 20 },
        { x: 2050, y: GROUND_Y - 20, w: 24, h: 20 },
        { x: 2660, y: GROUND_Y - 20, w: 24, h: 20 },
        { x: 3080, y: GROUND_Y - 20, w: 24, h: 20 },
      ],
    },
  ];

  var DEFAULT_CLUES = {
    stage1: 'Clue 1: Oil has three circuits — supply, scavenge and return. Know which real component (pump, filter, chip detector…) belongs to each one.',
    stage2: 'Clue 2: N-numbering counts outward-to-inward among whichever spools are present — a twin-spool engine\'s HP spool is N2, not N3.',
    stage3: 'Clue 3: Walk through the full twin-spool start sequence in order, and be ready to say what "starter cut-out" actually means.',
  };

  var CLUES_KEY = 'tm.examPlatformer.clues';
  var PROGRESS_KEY = 'tm.examPlatformer.completed';
  var EDIT_PASSWORD = 'APP';

  function loadClues() {
    try {
      var saved = JSON.parse(localStorage.getItem(CLUES_KEY) || '{}');
      var out = {};
      STAGES.forEach(function (s) { out[s.id] = saved[s.id] || DEFAULT_CLUES[s.id]; });
      return out;
    } catch (err) {
      var fallback = {};
      STAGES.forEach(function (s) { fallback[s.id] = DEFAULT_CLUES[s.id]; });
      return fallback;
    }
  }

  function saveClues(clues) {
    try { localStorage.setItem(CLUES_KEY, JSON.stringify(clues)); } catch (err) { /* ignore */ }
  }

  function loadProgress() {
    try {
      var saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch (err) {
      return [];
    }
  }

  function saveProgress(list) {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(list)); } catch (err) { /* ignore */ }
  }

  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  // Tiny self-contained Web Audio sound effects — no audio files, so the
  // site stays build-step-free. Lazily created on first sound, which is
  // always triggered from a user gesture (jump key, click), satisfying
  // the browser autoplay-gesture requirement with no extra plumbing.
  var SOUND_KEY = 'tm.examPlatformer.sound';
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
  function playJump() { beep(520, 0.1, 'square', 0.12); }
  function playDeath() { beep(300, 0.12, 'sawtooth', 0.18); beep(180, 0.22, 'sawtooth', 0.16, 0.1); }
  function playClear() { beep(523, 0.1, 'square', 0.18); beep(659, 0.1, 'square', 0.18, 0.1); beep(784, 0.1, 'square', 0.18, 0.2); beep(1046, 0.22, 'square', 0.2, 0.3); }

  function mount(root) {
    var clues = loadClues();
    var completed = loadProgress();
    var editUnlocked = false;

    root.innerHTML =
      '<div class="ep-wrap">' +
      '<h1>🏁 Exam Clue Challenge</h1>' +
      '<p class="ep-intro">Clear a stage to reveal one exam clue. Arrow keys / A-D to move, Space or Up to jump — touching a spike or falling in a gap costs a life; 3 lives per attempt.</p>' +
      '<div class="ep-toolbar"><button type="button" class="ep-btn ep-btn-ghost" id="epMuteBtn" aria-label="Toggle sound">' + (soundOn ? '🔊' : '🔇') + '</button>' +
      '<button type="button" class="ep-btn ep-btn-ghost" id="epGuideBtn">📘 Exam guide</button>' +
      '<button type="button" class="ep-btn ep-btn-ghost" id="epEditBtn">✎ Edit clues</button></div>' +
      '<div class="ep-guide hidden" id="epGuideStage">' +
      '<h2>📘 Exam Guide</h2>' +
      '<p>This section is empty for now — exam tips for this game will be added here by January 2027. Check back then!</p>' +
      '</div>' +
      '<div class="ep-stagepicker" id="epStagePicker"></div>' +
      '<div class="ep-gameview hidden" id="epGameView">' +
      '<div class="ep-hud">' +
      '<button type="button" class="ep-btn ep-btn-ghost" id="epBackBtn">← Stages</button>' +
      '<span class="ep-hud-name" id="epStageName"></span>' +
      '<button type="button" class="ep-btn ep-btn-ghost" id="epMuteBtn2" aria-label="Toggle sound">' + (soundOn ? '🔊' : '🔇') + '</button>' +
      '<span class="ep-hud-lives" id="epLives"></span>' +
      '</div>' +
      '<canvas id="epCanvas" width="' + W + '" height="' + H + '"></canvas>' +
      '<div class="ep-touch">' +
      '<button type="button" class="ep-touch-btn" id="epLeftBtn">◀</button>' +
      '<button type="button" class="ep-touch-btn" id="epJumpBtn">⤒ Jump</button>' +
      '<button type="button" class="ep-touch-btn" id="epRightBtn">▶</button>' +
      '</div>' +
      '<div class="ep-overlay hidden" id="epOverlay">' +
      '<div class="ep-overlay-card">' +
      '<h2 id="epOverlayTitle"></h2>' +
      '<p id="epOverlayBody"></p>' +
      '<div class="ep-row">' +
      '<button type="button" class="ep-btn ep-btn-primary" id="epOverlayPrimary"></button>' +
      '<button type="button" class="ep-btn ep-btn-ghost" id="epOverlayStages">Back to stages</button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="ep-edit-panel hidden" id="epEditPanel"></div>' +
      '</div>';

    var stagePicker = root.querySelector('#epStagePicker');
    var gameView = root.querySelector('#epGameView');
    var canvas = root.querySelector('#epCanvas');
    var ctx = canvas.getContext('2d');
    var stageNameEl = root.querySelector('#epStageName');
    var livesEl = root.querySelector('#epLives');
    var overlay = root.querySelector('#epOverlay');
    var overlayTitle = root.querySelector('#epOverlayTitle');
    var overlayBody = root.querySelector('#epOverlayBody');
    var overlayPrimary = root.querySelector('#epOverlayPrimary');
    var editPanel = root.querySelector('#epEditPanel');

    function renderStagePicker() {
      stagePicker.innerHTML = '';
      STAGES.forEach(function (stage) {
        var done = completed.indexOf(stage.id) !== -1;
        var card = document.createElement('div');
        card.className = 'ep-stage-card' + (done ? ' is-done' : '');
        card.innerHTML =
          '<h3>' + stage.name + '</h3>' +
          '<p class="ep-stage-status">' + (done ? '✅ Completed — clue unlocked' : 'Not completed yet') + '</p>' +
          (done ? '<p class="ep-stage-clue">' + window.TM.escapeHtml(clues[stage.id]) + '</p>' : '') +
          '<button type="button" class="ep-btn ep-btn-primary ep-play-btn" data-stage="' + stage.id + '">' +
          (done ? 'Replay' : 'Play') + '</button>';
        stagePicker.appendChild(card);
      });
      stagePicker.querySelectorAll('.ep-play-btn').forEach(function (btn) {
        btn.addEventListener('click', function () { openStage(btn.getAttribute('data-stage')); });
      });
    }

    function renderEditPanel() {
      if (!editUnlocked) { editPanel.classList.add('hidden'); editPanel.innerHTML = ''; return; }
      editPanel.classList.remove('hidden');
      var fieldsHtml = STAGES.map(function (s) {
        return '<div class="ep-edit-field"><label>' + s.name + ' clue</label>' +
          '<textarea data-clue="' + s.id + '">' + window.TM.escapeHtml(clues[s.id]) + '</textarea></div>';
      }).join('');
      editPanel.innerHTML =
        '<h3>Edit exam clues</h3>' +
        fieldsHtml +
        '<div class="ep-row"><button type="button" class="ep-btn ep-btn-primary" id="epSaveClues">Save</button>' +
        '<button type="button" class="ep-btn ep-btn-ghost" id="epResetProgress">Reset all progress</button></div>' +
        '<p class="ep-edit-note">Saved to this browser only. To make a change the new default for every visitor, copy it into DEFAULT_CLUES in exam-platformer.js.</p>';
      editPanel.querySelector('#epSaveClues').addEventListener('click', function () {
        editPanel.querySelectorAll('textarea[data-clue]').forEach(function (ta) {
          clues[ta.getAttribute('data-clue')] = ta.value.trim() || DEFAULT_CLUES[ta.getAttribute('data-clue')];
        });
        saveClues(clues);
        renderStagePicker();
      });
      editPanel.querySelector('#epResetProgress').addEventListener('click', function () {
        completed = [];
        saveProgress(completed);
        renderStagePicker();
      });
    }

    var muteBtn = root.querySelector('#epMuteBtn');
    var muteBtn2 = root.querySelector('#epMuteBtn2');
    function toggleSound() {
      soundOn = !soundOn;
      try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch (err) { /* ignore */ }
      var icon = soundOn ? '🔊' : '🔇';
      muteBtn.textContent = icon;
      muteBtn2.textContent = icon;
      if (soundOn) ensureAudio();
    }
    muteBtn.addEventListener('click', toggleSound);
    muteBtn2.addEventListener('click', toggleSound);

    root.querySelector('#epGuideBtn').addEventListener('click', function () {
      root.querySelector('#epGuideStage').classList.toggle('hidden');
    });

    root.querySelector('#epEditBtn').addEventListener('click', function () {
      if (editUnlocked) { editUnlocked = false; renderEditPanel(); return; }
      var pw = window.prompt('Edit password:');
      if (pw === EDIT_PASSWORD) { editUnlocked = true; renderEditPanel(); }
      else if (pw !== null) window.alert('Wrong password.');
    });

    // ---- game state (reset per openStage) ----
    var stage = null;
    var player = null;
    var lives = LIVES_START;
    var cameraX = 0;
    var running = false;
    var rafId = null;
    var lastTime = 0;
    var keys = { left: false, right: false };
    var jumpRequested = false;

    function openStage(stageId) {
      stage = STAGES.filter(function (s) { return s.id === stageId; })[0];
      lives = LIVES_START;
      resetPlayer();
      stageNameEl.textContent = stage.name;
      updateLivesHud();
      overlay.classList.add('hidden');
      gameView.classList.remove('hidden');
      stagePicker.classList.add('hidden');
      root.querySelector('.ep-toolbar').classList.add('hidden');
      running = true;
      lastTime = performance.now();
      if (rafId == null) rafId = requestAnimationFrame(loop);
    }

    function backToStages() {
      running = false;
      if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
      gameView.classList.add('hidden');
      stagePicker.classList.remove('hidden');
      root.querySelector('.ep-toolbar').classList.remove('hidden');
      renderStagePicker();
    }

    function resetPlayer() {
      player = { x: 30, y: GROUND_Y - PLAYER_H, vx: 0, vy: 0, onGround: false };
      cameraX = 0;
    }

    function updateLivesHud() {
      livesEl.textContent = new Array(Math.max(lives, 0) + 1).join('❤');
    }

    function died() {
      lives -= 1;
      playDeath();
      updateLivesHud();
      if (lives <= 0) {
        running = false;
        showOverlay('Stage failed', 'Out of lives. Give it another go.', 'Retry stage', function () {
          lives = LIVES_START;
          updateLivesHud();
          resetPlayer();
          running = true;
          lastTime = performance.now();
          overlay.classList.add('hidden');
        });
      } else {
        resetPlayer();
      }
    }

    function completeStage() {
      running = false;
      playClear();
      if (completed.indexOf(stage.id) === -1) { completed.push(stage.id); saveProgress(completed); }
      showOverlay('Stage complete! 🎉', clues[stage.id], 'Back to stages', backToStages);
    }

    function showOverlay(title, body, primaryLabel, primaryAction) {
      overlayTitle.textContent = title;
      overlayBody.textContent = body;
      overlayPrimary.textContent = primaryLabel;
      overlayPrimary.onclick = primaryAction;
      overlay.classList.remove('hidden');
    }

    function update(dt) {
      player.vx = 0;
      if (keys.left) player.vx = -MOVE_SPEED;
      if (keys.right) player.vx = MOVE_SPEED;
      player.x += player.vx * dt;
      player.x = Math.max(0, Math.min(player.x, stage.levelWidth - PLAYER_W));

      if (jumpRequested && player.onGround) {
        player.vy = JUMP_V;
        player.onGround = false;
        playJump();
      }
      jumpRequested = false;

      var prevBottom = player.y + PLAYER_H;
      player.vy += GRAVITY * dt;
      player.y += player.vy * dt;
      var newBottom = player.y + PLAYER_H;

      player.onGround = false;
      stage.solids.forEach(function (s) {
        var overlapX = player.x + PLAYER_W > s.x && player.x < s.x + s.w;
        if (!overlapX) return;
        if (player.vy >= 0 && prevBottom <= s.y + 0.5 && newBottom >= s.y) {
          player.y = s.y - PLAYER_H;
          player.vy = 0;
          player.onGround = true;
        }
      });

      for (var i = 0; i < stage.spikes.length; i++) {
        var sp = stage.spikes[i];
        if (rectsOverlap(player.x, player.y, PLAYER_W, PLAYER_H, sp.x, sp.y, sp.w, sp.h)) { died(); return; }
      }

      if (player.y > H + 150) { died(); return; }

      if (player.x + PLAYER_W >= stage.goalX) { completeStage(); return; }

      cameraX = Math.max(0, Math.min(player.x - W / 3, Math.max(0, stage.levelWidth - W)));
    }

    function draw() {
      ctx.fillStyle = '#8fd3ff';
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.translate(-cameraX, 0);

      stage.solids.forEach(function (s) {
        ctx.fillStyle = s.y >= GROUND_Y ? '#3f8f4f' : '#caa45a';
        ctx.fillRect(s.x, s.y, s.w, s.h);
      });

      ctx.fillStyle = '#e24b4b';
      stage.spikes.forEach(function (sp) {
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y + sp.h);
        ctx.lineTo(sp.x + sp.w / 2, sp.y);
        ctx.lineTo(sp.x + sp.w, sp.y + sp.h);
        ctx.closePath();
        ctx.fill();
      });

      ctx.fillStyle = '#7a5230';
      ctx.fillRect(stage.goalX + 10, GROUND_Y - 140, 6, 140);
      ctx.fillStyle = '#ffd34d';
      ctx.beginPath();
      ctx.moveTo(stage.goalX + 16, GROUND_Y - 140);
      ctx.lineTo(stage.goalX + 60, GROUND_Y - 120);
      ctx.lineTo(stage.goalX + 16, GROUND_Y - 100);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ff7b88';
      ctx.fillRect(player.x, player.y, PLAYER_W, PLAYER_H);
      ctx.fillStyle = '#0b1c2c';
      ctx.fillRect(player.x + 6, player.y + 8, 4, 4);
      ctx.fillRect(player.x + PLAYER_W - 10, player.y + 8, 4, 4);

      ctx.restore();
    }

    function loop(now) {
      if (!running) { rafId = null; return; }
      var dt = Math.max(0.1, Math.min((now - lastTime) / 16.6667, 2.5));
      lastTime = now;
      update(dt);
      draw();
      rafId = requestAnimationFrame(loop);
    }

    function onKeyDown(e) {
      if (!running) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { keys.left = true; e.preventDefault(); }
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { keys.right = true; e.preventDefault(); }
      else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') { jumpRequested = true; e.preventDefault(); }
    }
    function onKeyUp(e) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    function bindHold(el, onDown, onUp) {
      el.addEventListener('pointerdown', function (e) { e.preventDefault(); onDown(); });
      el.addEventListener('pointerup', onUp);
      el.addEventListener('pointerleave', onUp);
      el.addEventListener('pointercancel', onUp);
    }
    bindHold(root.querySelector('#epLeftBtn'), function () { keys.left = true; }, function () { keys.left = false; });
    bindHold(root.querySelector('#epRightBtn'), function () { keys.right = true; }, function () { keys.right = false; });
    root.querySelector('#epJumpBtn').addEventListener('click', function () { jumpRequested = true; });

    root.querySelector('#epBackBtn').addEventListener('click', backToStages);
    root.querySelector('#epOverlayStages').addEventListener('click', backToStages);

    renderStagePicker();

    // test/debug hooks only — read-only, no effect on gameplay
    window.TM.toolModules['exam-platformer'].debugPlayer = function () { return player; };
    window.TM.toolModules['exam-platformer'].debugStages = function () { return STAGES; };

    window.TM.toolModules['exam-platformer'].unmount = function () {
      running = false;
      if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }

  window.TM.registerTool('exam-platformer', { mount: mount });
})();
