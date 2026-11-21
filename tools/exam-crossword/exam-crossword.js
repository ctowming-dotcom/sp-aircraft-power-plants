(function () {
  window.TM = window.TM || {};

  // Word banks — one word, one clue each. All words are single tokens
  // (letters only, no spaces/hyphens) so each fits in one grid cell per
  // letter. To change the vocabulary, edit these two arrays directly.
  var WORD_BANKS = {
    term1: [
      { word: 'TURBOFAN', clue: 'Engine type that bypasses some incoming air around the core for extra thrust and efficiency' },
      { word: 'COMPRESSOR', clue: 'Stage that squeezes incoming air to a higher pressure before combustion' },
      { word: 'COMBUSTOR', clue: 'Chamber where fuel and compressed air burn continuously' },
      { word: 'TURBINE', clue: 'Extracts energy from hot gas to drive the compressor and fan' },
      { word: 'BYPASS', clue: 'Air that flows around the engine core instead of through it' },
      { word: 'SPOOL', clue: 'A shaft plus its compressor and turbine stages, spinning together as one unit' },
      { word: 'NACELLE', clue: 'The streamlined housing that covers an engine' },
      { word: 'THRUST', clue: 'The forward force produced by accelerating air rearward' },
      { word: 'INTAKE', clue: 'Where air first enters the engine' },
      { word: 'EXHAUST', clue: 'Where spent gases leave the engine after passing through the turbine' },
      { word: 'IGNITER', clue: 'Sparks that light the fuel-air mixture in the combustor' },
      { word: 'ROTOR', clue: 'The rotating set of blades on a compressor or turbine stage' },
      { word: 'STATOR', clue: 'Fixed vanes that redirect airflow between rotating stages' },
      { word: 'BLADE', clue: 'A single airfoil-shaped component on a rotor or fan disc' },
      { word: 'SHAFT', clue: 'The rotating rod connecting a turbine stage to its compressor' },
      { word: 'NOZZLE', clue: 'Shapes and accelerates exhaust gas as it leaves the engine' },
      { word: 'PYLON', clue: 'The structure that attaches an engine to the wing' },
      { word: 'COWLING', clue: 'Removable panels covering the engine for access and streamlining' },
      { word: 'DIFFUSER', clue: 'Slows and spreads airflow to raise its pressure before the combustor' },
      { word: 'CORE', clue: 'The gas-generator path — compressor, combustor and turbine together' },
    ],
    term2: [
      { word: 'SCAVENGE', clue: 'The oil circuit that pumps used oil back out of a bearing chamber' },
      { word: 'BLEED', clue: 'Compressed air tapped off the engine for cabin, anti-ice or pneumatic use' },
      { word: 'STARTER', clue: 'The motor or air turbine that spins the engine up for its first start' },
      { word: 'IGNITION', clue: 'The system that fires the igniter plugs during engine start' },
      { word: 'FILTER', clue: 'Traps debris in the oil before it recirculates' },
      { word: 'VALVE', clue: 'A component that opens or closes to control a flow of air or fluid' },
      { word: 'PRESSURE', clue: 'What a gauge on the oil or bleed air system actually measures' },
      { word: 'SENSOR', clue: 'Detects a condition like temperature or pressure and reports it' },
      { word: 'DETECTOR', clue: 'Part of a fire-protection loop that senses rising temperature' },
      { word: 'EXTINGUISHER', clue: 'The agent bottle discharged to put out an engine or APU fire' },
      { word: 'GENERATOR', clue: 'Driven by the accessory gearbox to supply electrical power' },
      { word: 'GEARBOX', clue: 'Transmits engine shaft power to driven accessories like pumps' },
      { word: 'MANIFOLD', clue: 'A branching duct or pipe that distributes air or fuel to several outlets' },
      { word: 'THROTTLE', clue: 'The lever that commands engine thrust' },
      { word: 'CUTOUT', clue: 'Automatically disengages the starter once the engine is self-sustaining' },
      { word: 'SEAL', clue: 'A labyrinth type of this keeps oil from migrating along a rotating shaft' },
      { word: 'LOOP', clue: 'Fire-detection sensing wire run in redundant pairs, A and B' },
      { word: 'AGENT', clue: 'The extinguishing chemical stored in a fire-protection bottle' },
      { word: 'ACCESSORY', clue: 'Pumps, generators and starters driven off the engine are collectively this' },
      { word: 'CHIP', clue: 'A small metal fragment an oil detector is designed to catch' },
    ],
  };

  var WORDS_PER_PUZZLE = 8;
  var MIN_WORDS_ACCEPTED = 5;
  var GRID_SIZE = 21;
  var BEST_KEY_PREFIX = 'tm.examCrossword.best.';

  // Tiny self-contained Web Audio sound effects — same pattern as this
  // portal's other arcade games: no audio files, lazily created on first
  // sound (always from a user gesture), with a persisted mute toggle.
  var SOUND_KEY = 'tm.examCrossword.sound';
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
  function playType() { beep(440, 0.03, 'square', 0.05); }
  function playWrong() { beep(200, 0.12, 'sawtooth', 0.14); }
  function playSolved() { beep(523, 0.1, 'square', 0.18); beep(659, 0.1, 'square', 0.18, 0.1); beep(784, 0.1, 'square', 0.18, 0.2); beep(1046, 0.22, 'square', 0.2, 0.3); }

  function makeEmptyGrid(size) {
    var g = [];
    for (var r = 0; r < size; r++) g.push(new Array(size).fill(null));
    return g;
  }

  function canPlace(grid, word, row, col, dir) {
    var size = grid.length;
    var dr = dir === 'D' ? 1 : 0, dc = dir === 'A' ? 1 : 0;
    var beforeR = row - dr, beforeC = col - dc;
    if (beforeR >= 0 && beforeR < size && beforeC >= 0 && beforeC < size && grid[beforeR][beforeC]) return false;
    var endR = row + dr * word.length, endC = col + dc * word.length;
    if (endR >= 0 && endR < size && endC >= 0 && endC < size && grid[endR][endC]) return false;
    for (var i = 0; i < word.length; i++) {
      var r = row + dr * i, c = col + dc * i;
      if (r < 0 || r >= size || c < 0 || c >= size) return false;
      var existing = grid[r][c];
      if (existing) {
        if (existing !== word[i]) return false;
      } else {
        if (dir === 'A') {
          if ((r - 1 >= 0 && grid[r - 1][c]) || (r + 1 < size && grid[r + 1][c])) return false;
        } else {
          if ((c - 1 >= 0 && grid[r][c - 1]) || (c + 1 < size && grid[r][c + 1])) return false;
        }
      }
    }
    return true;
  }

  function place(grid, word, row, col, dir) {
    var dr = dir === 'D' ? 1 : 0, dc = dir === 'A' ? 1 : 0;
    for (var i = 0; i < word.length; i++) grid[row + dr * i][col + dc * i] = word[i];
  }

  function shuffled(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function finalizePuzzle(grid, placed, size) {
    var minR = size, maxR = -1, minC = size, maxC = -1;
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        if (grid[r][c]) {
          if (r < minR) minR = r;
          if (r > maxR) maxR = r;
          if (c < minC) minC = c;
          if (c > maxC) maxC = c;
        }
      }
    }
    var rows = maxR - minR + 1, cols = maxC - minC + 1;
    var trimmed = [];
    for (var r2 = 0; r2 < rows; r2++) {
      var row = [];
      for (var c2 = 0; c2 < cols; c2++) row.push(grid[minR + r2][minC + c2]);
      trimmed.push(row);
    }
    placed.forEach(function (p) { p.row -= minR; p.col -= minC; });

    var numberGrid = [];
    for (var r3 = 0; r3 < rows; r3++) numberGrid.push(new Array(cols).fill(null));
    var num = 1;
    for (var r4 = 0; r4 < rows; r4++) {
      for (var c4 = 0; c4 < cols; c4++) {
        if (!trimmed[r4][c4]) continue;
        var startsAcross = (c4 === 0 || !trimmed[r4][c4 - 1]) && (c4 + 1 < cols && trimmed[r4][c4 + 1]);
        var startsDown = (r4 === 0 || !trimmed[r4 - 1][c4]) && (r4 + 1 < rows && trimmed[r4 + 1][c4]);
        if (startsAcross || startsDown) { numberGrid[r4][c4] = num; num++; }
      }
    }
    placed.forEach(function (p) { p.number = numberGrid[p.row][p.col]; });

    var across = placed.filter(function (p) { return p.dir === 'A'; }).sort(function (a, b) { return a.number - b.number; });
    var down = placed.filter(function (p) { return p.dir === 'D'; }).sort(function (a, b) { return a.number - b.number; });

    var cellMap = {};
    placed.forEach(function (p) {
      var dr = p.dir === 'D' ? 1 : 0, dc = p.dir === 'A' ? 1 : 0;
      for (var i = 0; i < p.word.length; i++) {
        var key = (p.row + dr * i) + ',' + (p.col + dc * i);
        cellMap[key] = cellMap[key] || {};
        cellMap[key][p.dir] = p;
      }
    });

    return { grid: trimmed, rows: rows, cols: cols, numberGrid: numberGrid, across: across, down: down, cellMap: cellMap };
  }

  function generatePuzzle(pool) {
    for (var attempt = 0; attempt < 30; attempt++) {
      var candidates = shuffled(pool).slice(0, Math.min(WORDS_PER_PUZZLE * 2, pool.length));
      candidates.sort(function (a, b) { return b.word.length - a.word.length; });
      var grid = makeEmptyGrid(GRID_SIZE);
      var placed = [];

      var first = candidates[0];
      var startRow = Math.floor(GRID_SIZE / 2), startCol = Math.floor((GRID_SIZE - first.word.length) / 2);
      place(grid, first.word, startRow, startCol, 'A');
      placed.push({ word: first.word, clue: first.clue, row: startRow, col: startCol, dir: 'A' });

      for (var ci = 1; ci < candidates.length && placed.length < WORDS_PER_PUZZLE; ci++) {
        var cand = candidates[ci];
        var options = [];
        for (var pi = 0; pi < placed.length; pi++) {
          var p = placed[pi];
          var crossDir = p.dir === 'A' ? 'D' : 'A';
          for (var i = 0; i < p.word.length; i++) {
            for (var j = 0; j < cand.word.length; j++) {
              if (p.word[i] !== cand.word[j]) continue;
              var pr = p.dir === 'A' ? p.row : p.row + i;
              var pc = p.dir === 'A' ? p.col + i : p.col;
              var row = crossDir === 'D' ? pr - j : pr;
              var col = crossDir === 'A' ? pc - j : pc;
              if (canPlace(grid, cand.word, row, col, crossDir)) options.push({ row: row, col: col, dir: crossDir });
            }
          }
        }
        if (options.length) {
          var choice = options[Math.floor(Math.random() * options.length)];
          place(grid, cand.word, choice.row, choice.col, choice.dir);
          placed.push({ word: cand.word, clue: cand.clue, row: choice.row, col: choice.col, dir: choice.dir });
        }
      }

      if (placed.length >= Math.min(MIN_WORDS_ACCEPTED, pool.length)) {
        return finalizePuzzle(grid, placed, GRID_SIZE);
      }
    }
    return null;
  }

  function formatTime(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function mount(root) {
    root.innerHTML =
      '<div class="xw-wrap">' +
      '<h1>🧩 Crossword Challenge</h1>' +
      '<p class="xw-intro">A fresh random crossword every time, built from this course\'s key words. Pick a term, click a clue (or a cell), and type the answer — the clue explains what word you\'re looking for.</p>' +
      '<div class="xw-tabs">' +
      '<button type="button" class="xw-tab is-active" id="xwTabTerm1" data-term="term1">Term 1</button>' +
      '<button type="button" class="xw-tab" id="xwTabTerm2" data-term="term2">Term 2</button>' +
      '<button type="button" class="xw-mute-btn" id="xwMuteBtn" aria-label="Toggle sound">' + (soundOn ? '🔊' : '🔇') + '</button>' +
      '<button type="button" class="xw-mute-btn" id="xwGuideBtn" aria-label="Exam guide">📘</button>' +
      '</div>' +
      '<div class="xw-guide hidden" id="xwGuide">' +
      '<h2>📘 Exam Guide</h2>' +
      '<p>This section is empty for now — exam tips for this game will be added here by January 2027. Check back then!</p>' +
      '</div>' +
      '<div class="xw-hud">' +
      '<div class="xw-stat"><span class="xw-stat-label">Time</span><span class="xw-stat-value" id="xwTime">0:00</span></div>' +
      '<div class="xw-stat"><span class="xw-stat-label">Best</span><span class="xw-stat-value" id="xwBest">--</span></div>' +
      '<div class="xw-stat"><span class="xw-stat-label">Words</span><span class="xw-stat-value" id="xwProgress">0/0</span></div>' +
      '</div>' +
      '<div class="xw-controls">' +
      '<button type="button" class="xw-btn xw-btn-primary" id="xwNewBtn">🔀 New puzzle</button>' +
      '<button type="button" class="xw-btn xw-btn-ghost" id="xwCheckBtn">✓ Check</button>' +
      '<button type="button" class="xw-btn xw-btn-ghost" id="xwRevealBtn">👁 Reveal</button>' +
      '</div>' +
      '<div class="xw-board">' +
      '<div class="xw-grid-scroll"><div class="xw-grid" id="xwGrid"></div></div>' +
      '<div class="xw-clues">' +
      '<div class="xw-clue-col"><h3>Across</h3><ol class="xw-clue-list" id="xwAcross"></ol></div>' +
      '<div class="xw-clue-col"><h3>Down</h3><ol class="xw-clue-list" id="xwDown"></ol></div>' +
      '</div>' +
      '</div>' +
      '<div class="xw-overlay hidden" id="xwOverlay">' +
      '<div class="xw-overlay-card">' +
      '<h2>Solved! 🎉</h2>' +
      '<p id="xwOverlayMsg"></p>' +
      '<button type="button" class="xw-btn xw-btn-primary" id="xwOverlayBtn">New puzzle</button>' +
      '</div>' +
      '</div>' +
      '</div>';

    var gridEl = root.querySelector('#xwGrid');
    var acrossEl = root.querySelector('#xwAcross');
    var downEl = root.querySelector('#xwDown');
    var timeEl = root.querySelector('#xwTime');
    var bestEl = root.querySelector('#xwBest');
    var progressEl = root.querySelector('#xwProgress');
    var overlay = root.querySelector('#xwOverlay');
    var overlayMsg = root.querySelector('#xwOverlayMsg');

    var currentTerm = 'term1';
    var puzzle = null;
    var inputs = {}; // "r,c" -> input element
    var currentWord = null;
    var elapsed = 0;
    var timerId = null;
    var solved = false;
    var revealed = false;

    function loadBest(term) {
      try { return Number(localStorage.getItem(BEST_KEY_PREFIX + term)) || 0; } catch (err) { return 0; }
    }
    function saveBest(term, val) {
      try { localStorage.setItem(BEST_KEY_PREFIX + term, String(val)); } catch (err) { /* ignore */ }
    }

    function updateBestDisplay() {
      var best = loadBest(currentTerm);
      bestEl.textContent = best > 0 ? best : '--';
    }

    function stopTimer() { if (timerId != null) { clearInterval(timerId); timerId = null; } }
    function startTimer() {
      stopTimer();
      elapsed = 0;
      timeEl.textContent = formatTime(0);
      timerId = setInterval(function () {
        elapsed += 1;
        timeEl.textContent = formatTime(elapsed);
      }, 1000);
    }

    function cellKey(r, c) { return r + ',' + c; }

    function clearSelection() {
      Object.keys(inputs).forEach(function (k) { inputs[k].parentElement.classList.remove('is-active'); });
    }

    function selectWord(word) {
      clearSelection();
      currentWord = word;
      var dr = word.dir === 'D' ? 1 : 0, dc = word.dir === 'A' ? 1 : 0;
      var firstEmpty = null;
      for (var i = 0; i < word.word.length; i++) {
        var r = word.row + dr * i, c = word.col + dc * i;
        var input = inputs[cellKey(r, c)];
        if (input) {
          input.parentElement.classList.add('is-active');
          if (firstEmpty == null && !input.value) firstEmpty = input;
        }
      }
      root.querySelectorAll('.xw-clue-list li').forEach(function (li) { li.classList.remove('is-selected'); });
      var li = root.querySelector('[data-clue-id="' + word.dir + word.number + '"]');
      if (li) li.classList.add('is-selected');
      var target = firstEmpty || inputs[cellKey(word.row, word.col)];
      if (target) target.focus();
    }

    function wordsAt(r, c) {
      var cell = puzzle.cellMap[cellKey(r, c)];
      return cell || {};
    }

    function onCellFocusOrClick(r, c) {
      var cell = wordsAt(r, c);
      var preferDir = (currentWord && cell[currentWord.dir] && cell[currentWord.dir].row === currentWord.row && cell[currentWord.dir].col === currentWord.col) ? currentWord.dir : null;
      var word = preferDir ? cell[preferDir] : (cell.A || cell.D);
      if (word) selectWord(word);
    }

    function moveFocus(r, c, dr, dc) {
      var nr = r + dr, nc = c + dc;
      var input = inputs[cellKey(nr, nc)];
      if (input) { input.focus(); onCellFocusOrClick(nr, nc); }
    }

    function advanceInWord(r, c) {
      if (!currentWord) return;
      var dr = currentWord.dir === 'D' ? 1 : 0, dc = currentWord.dir === 'A' ? 1 : 0;
      var next = inputs[cellKey(r + dr, c + dc)];
      if (next) next.focus();
    }

    function retreatInWord(r, c) {
      if (!currentWord) return;
      var dr = currentWord.dir === 'D' ? 1 : 0, dc = currentWord.dir === 'A' ? 1 : 0;
      var prev = inputs[cellKey(r - dr, c - dc)];
      if (prev) { prev.focus(); prev.value = ''; }
    }

    function updateProgress() {
      var total = puzzle.across.length + puzzle.down.length;
      var done = 0;
      puzzle.across.concat(puzzle.down).forEach(function (w) {
        var dr = w.dir === 'D' ? 1 : 0, dc = w.dir === 'A' ? 1 : 0;
        var complete = true;
        for (var i = 0; i < w.word.length; i++) {
          var input = inputs[cellKey(w.row + dr * i, w.col + dc * i)];
          if (!input || input.value.toUpperCase() !== w.word[i]) { complete = false; break; }
        }
        if (complete) done++;
      });
      progressEl.textContent = done + '/' + total;
    }

    function checkSolved() {
      var allCorrect = true;
      Object.keys(inputs).forEach(function (k) {
        var r = Number(k.split(',')[0]), c = Number(k.split(',')[1]);
        if (puzzle.grid[r][c] && inputs[k].value.toUpperCase() !== puzzle.grid[r][c]) allCorrect = false;
      });
      if (allCorrect && !solved) {
        solved = true;
        stopTimer();
        playSolved();
        var score = revealed ? 0 : Math.max(50, 1000 - elapsed * 5);
        if (!revealed) {
          var best = loadBest(currentTerm);
          if (score > best) { saveBest(currentTerm, score); updateBestDisplay(); }
        }
        overlayMsg.textContent = revealed
          ? 'Revealed in ' + formatTime(elapsed) + '. Try a fresh one without peeking for a real score!'
          : 'Solved in ' + formatTime(elapsed) + ' — score ' + score + '.';
        overlay.classList.remove('hidden');
      }
    }

    function onInput(e, r, c) {
      var input = e.target;
      input.value = input.value.toUpperCase().replace(/[^A-Z]/g, '').slice(-1);
      if (input.value) {
        playType();
        advanceInWord(r, c);
      }
      updateProgress();
      checkSolved();
    }

    function onKeyDown(e, r, c) {
      if (e.key === 'Backspace') {
        if (!e.target.value) { e.preventDefault(); retreatInWord(r, c); }
        return;
      }
      if (e.key === 'ArrowRight') { e.preventDefault(); moveFocus(r, c, 0, 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); moveFocus(r, c, 0, -1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); moveFocus(r, c, 1, 0); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moveFocus(r, c, -1, 0); }
    }

    function buildGrid() {
      gridEl.innerHTML = '';
      inputs = {};
      gridEl.style.gridTemplateColumns = 'repeat(' + puzzle.cols + ', 1fr)';
      for (var r = 0; r < puzzle.rows; r++) {
        for (var c = 0; c < puzzle.cols; c++) {
          var cellWrap = document.createElement('div');
          cellWrap.className = 'xw-cell';
          if (!puzzle.grid[r][c]) {
            cellWrap.classList.add('is-block');
          } else {
            var num = puzzle.numberGrid[r][c];
            if (num) {
              var numEl = document.createElement('span');
              numEl.className = 'xw-cell-num';
              numEl.textContent = num;
              cellWrap.appendChild(numEl);
            }
            var input = document.createElement('input');
            input.type = 'text';
            input.maxLength = 1;
            input.autocomplete = 'off';
            input.spellcheck = false;
            (function (rr, cc) {
              input.addEventListener('focus', function () { onCellFocusOrClick(rr, cc); });
              input.addEventListener('click', function () { onCellFocusOrClick(rr, cc); });
              input.addEventListener('input', function (e) { onInput(e, rr, cc); });
              input.addEventListener('keydown', function (e) { onKeyDown(e, rr, cc); });
            })(r, c);
            cellWrap.appendChild(input);
            inputs[cellKey(r, c)] = input;
          }
          gridEl.appendChild(cellWrap);
        }
      }
    }

    function buildClues() {
      acrossEl.innerHTML = '';
      downEl.innerHTML = '';
      puzzle.across.forEach(function (w) {
        var li = document.createElement('li');
        li.setAttribute('data-clue-id', 'A' + w.number);
        li.innerHTML = '<b>' + w.number + '.</b> ' + window.TM.escapeHtml(w.clue) + ' <span class="xw-clue-len">(' + w.word.length + ')</span>';
        li.addEventListener('click', function () { selectWord(w); });
        acrossEl.appendChild(li);
      });
      puzzle.down.forEach(function (w) {
        var li = document.createElement('li');
        li.setAttribute('data-clue-id', 'D' + w.number);
        li.innerHTML = '<b>' + w.number + '.</b> ' + window.TM.escapeHtml(w.clue) + ' <span class="xw-clue-len">(' + w.word.length + ')</span>';
        li.addEventListener('click', function () { selectWord(w); });
        downEl.appendChild(li);
      });
    }

    function newPuzzle() {
      overlay.classList.add('hidden');
      solved = false;
      revealed = false;
      currentWord = null;
      puzzle = generatePuzzle(WORD_BANKS[currentTerm]);
      if (!puzzle) return; // should not happen given the curated word banks
      buildGrid();
      buildClues();
      updateProgress();
      updateBestDisplay();
      startTimer();
      selectWord(puzzle.across[0] || puzzle.down[0]);
    }

    function switchTerm(term) {
      if (term === currentTerm) return;
      currentTerm = term;
      root.querySelector('#xwTabTerm1').classList.toggle('is-active', term === 'term1');
      root.querySelector('#xwTabTerm2').classList.toggle('is-active', term === 'term2');
      newPuzzle();
    }

    root.querySelector('#xwTabTerm1').addEventListener('click', function () { switchTerm('term1'); });
    root.querySelector('#xwTabTerm2').addEventListener('click', function () { switchTerm('term2'); });
    root.querySelector('#xwNewBtn').addEventListener('click', newPuzzle);
    root.querySelector('#xwOverlayBtn').addEventListener('click', newPuzzle);

    root.querySelector('#xwCheckBtn').addEventListener('click', function () {
      var anyWrong = false;
      Object.keys(inputs).forEach(function (k) {
        var r = Number(k.split(',')[0]), c = Number(k.split(',')[1]);
        var input = inputs[k];
        if (!input.value) return;
        var ok = input.value.toUpperCase() === puzzle.grid[r][c];
        input.parentElement.classList.toggle('is-correct', ok);
        input.parentElement.classList.toggle('is-wrong', !ok);
        if (!ok) anyWrong = true;
      });
      if (anyWrong) playWrong();
      setTimeout(function () {
        Object.keys(inputs).forEach(function (k) { inputs[k].parentElement.classList.remove('is-wrong'); });
      }, 900);
    });

    root.querySelector('#xwRevealBtn').addEventListener('click', function () {
      revealed = true;
      Object.keys(inputs).forEach(function (k) {
        var r = Number(k.split(',')[0]), c = Number(k.split(',')[1]);
        inputs[k].value = puzzle.grid[r][c];
      });
      updateProgress();
      checkSolved();
    });

    root.querySelector('#xwMuteBtn').addEventListener('click', function (e) {
      soundOn = !soundOn;
      try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch (err) { /* ignore */ }
      e.target.textContent = soundOn ? '🔊' : '🔇';
      if (soundOn) ensureAudio();
    });
    root.querySelector('#xwGuideBtn').addEventListener('click', function () {
      root.querySelector('#xwGuide').classList.toggle('hidden');
    });

    newPuzzle();

    window.TM.toolModules['exam-crossword'].debugState = function () { return { puzzle: puzzle, inputs: inputs, currentTerm: currentTerm }; };

    window.TM.toolModules['exam-crossword'].unmount = function () {
      stopTimer();
    };
  }

  window.TM.registerTool('exam-crossword', { mount: mount });
})();
