(function () {
  window.TM = window.TM || {};

  // Shared crossword engine used by every study chapter's own "🎮 Game
  // Mode" crossword page. One engine, one auto-layout algorithm (adapted
  // from the old standalone Crossword Challenge game, now removed from the
  // games section per request — see CLAUDE.md), called once per chapter
  // with that chapter's own word bank. This is "shared chrome" in the same
  // sense as app.js/tools.js/styles.css, not a tool of its own — each
  // chapter's thin wrapper file supplies the words/clues and calls
  // TM.mountCrossword(root, config).
  //
  // config:
  //   gameId        - unique id for leaderboard + settings storage, e.g. 'oilSystemCrossword'
  //   title         - heading text, e.g. 'Oil System Crossword'
  //   intro         - one line of instructions under the title
  //   words         - [{ word: 'TANK', clue: '...' }, ...] (word = letters only, uppercase)
  //   backHash      - hash of the study tool to return to, e.g. 'oil-system-overview'
  //   backLabel     - link text, e.g. '← Back to Oil System Overview'

  var MIN_WORDS_ACCEPTED = 5;
  var GRID_SIZE = 21;

  var DIFFICULTY_SETTINGS = {
    easy: { wordsPerPuzzle: 6, revealPerWord: 4 },
    normal: { wordsPerPuzzle: 8, revealPerWord: 2 },
    hard: { wordsPerPuzzle: 10, revealPerWord: 2 },
  };

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

  function generatePuzzle(pool, wordsPerPuzzle) {
    for (var attempt = 0; attempt < 30; attempt++) {
      var candidates = shuffled(pool).slice(0, Math.min(wordsPerPuzzle * 2, pool.length));
      candidates.sort(function (a, b) { return b.word.length - a.word.length; });
      var grid = makeEmptyGrid(GRID_SIZE);
      var placed = [];

      var first = candidates[0];
      var startRow = Math.floor(GRID_SIZE / 2), startCol = Math.floor((GRID_SIZE - first.word.length) / 2);
      place(grid, first.word, startRow, startCol, 'A');
      placed.push({ word: first.word, clue: first.clue, row: startRow, col: startCol, dir: 'A' });

      for (var ci = 1; ci < candidates.length && placed.length < wordsPerPuzzle; ci++) {
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

  function mountCrossword(root, config) {
    var gameId = config.gameId;
    var pool = config.words.map(function (w) {
      return { word: String(w.word).toUpperCase().replace(/[^A-Z]/g, ''), clue: w.clue };
    }).filter(function (w) { return w.word.length >= 3; });

    var DIFF_KEY = 'tm.crossword.' + gameId + '.difficulty';
    var SOUND_KEY = 'tm.crossword.' + gameId + '.sound';

    var difficulty = 'normal';
    try {
      var savedDiff = localStorage.getItem(DIFF_KEY);
      if (DIFFICULTY_SETTINGS[savedDiff]) difficulty = savedDiff;
    } catch (err) { /* ignore */ }
    function diffCfg() { return DIFFICULTY_SETTINGS[difficulty]; }

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

    root.innerHTML =
      '<div class="xw-wrap">' +
      (config.backHash ? '<a class="xw-back" href="#' + config.backHash + '">' + TM.escapeHtml(config.backLabel) + '</a>' : '') +
      '<h1>🧩 ' + TM.escapeHtml(config.title) + '</h1>' +
      '<p class="xw-intro">' + TM.escapeHtml(config.intro) + '</p>' +
      '<div class="xw-tabs">' +
      '<button type="button" class="xw-mute-btn" id="xwMuteBtn" aria-label="Toggle sound">' + (soundOn ? '🔊' : '🔇') + '</button>' +
      '<button type="button" class="xw-mute-btn" id="xwSettingsBtn" aria-label="Game settings">⚙️</button>' +
      '</div>' +
      '<div class="xw-settings hidden" id="xwSettings">' +
      '<h2>⚙️ Game Settings</h2>' +
      '<p class="xw-settings-note">Easy reveals more letters per word and uses fewer words; Hard reveals the bare minimum (2) and uses more words. Takes effect on your next puzzle.</p>' +
      '<div class="xw-diff-row">' +
      '<button type="button" class="xw-diff-btn" data-diff="easy">Easy</button>' +
      '<button type="button" class="xw-diff-btn" data-diff="normal">Normal</button>' +
      '<button type="button" class="xw-diff-btn" data-diff="hard">Hard</button>' +
      '</div>' +
      '<button type="button" class="xw-btn xw-btn-ghost" id="xwResetBestBtn">Reset top score…</button>' +
      '</div>' +
      '<div class="xw-hud">' +
      '<div class="xw-stat"><span class="xw-stat-label">Time</span><span class="xw-stat-value" id="xwTime">0:00</span></div>' +
      '<div class="xw-stat"><span class="xw-stat-label">Top score</span><span class="xw-stat-value" id="xwBest">--</span></div>' +
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
    var settingsPanel = root.querySelector('#xwSettings');
    var settingsUnlocked = false;

    var puzzle = null;
    var inputs = {};
    var currentWord = null;
    var elapsed = 0;
    var timerId = null;
    var solved = false;
    var revealed = false;

    function updateBestDisplay() {
      bestEl.textContent = TM.Leaderboard.bestLabel(gameId);
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
          TM.Leaderboard.submitScore(gameId, score, { higherIsBetter: true });
          updateBestDisplay();
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

    function computeRevealedCells(puzzle, perWord) {
      var revealedMap = {};
      var allWords = puzzle.across.concat(puzzle.down);
      allWords.forEach(function (w) {
        var dr = w.dir === 'D' ? 1 : 0, dc = w.dir === 'A' ? 1 : 0;
        var cells = [];
        for (var i = 0; i < w.word.length; i++) cells.push({ r: w.row + dr * i, c: w.col + dc * i });
        var already = cells.filter(function (cell) { return revealedMap[cell.r + ',' + cell.c]; }).length;
        var need = Math.max(0, perWord - already);
        if (!need) return;
        var pool2 = shuffled(cells.filter(function (cell) { return !revealedMap[cell.r + ',' + cell.c]; }));
        pool2.slice(0, need).forEach(function (cell) { revealedMap[cell.r + ',' + cell.c] = true; });
      });
      return revealedMap;
    }

    function buildGrid() {
      gridEl.innerHTML = '';
      inputs = {};
      var revealedCells = computeRevealedCells(puzzle, diffCfg().revealPerWord);
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
            if (revealedCells[r + ',' + c]) {
              input.value = puzzle.grid[r][c];
              input.readOnly = true;
              cellWrap.classList.add('is-given');
            }
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
      puzzle = generatePuzzle(pool, diffCfg().wordsPerPuzzle);
      if (!puzzle) return;
      buildGrid();
      buildClues();
      updateProgress();
      updateBestDisplay();
      startTimer();
      selectWord(puzzle.across[0] || puzzle.down[0]);
    }

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
      solved = true;
      stopTimer();
      Object.keys(inputs).forEach(function (k) {
        var r = Number(k.split(',')[0]), c = Number(k.split(',')[1]);
        inputs[k].value = puzzle.grid[r][c];
      });
      updateProgress();
    });

    root.querySelector('#xwMuteBtn').addEventListener('click', function (e) {
      soundOn = !soundOn;
      try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch (err) { /* ignore */ }
      e.target.textContent = soundOn ? '🔊' : '🔇';
      if (soundOn) ensureAudio();
    });

    // Game settings are password-gated: the panel only opens once the
    // shared settings password is entered, same convention as every other
    // tool's "✎ Edit" button in this codebase.
    root.querySelector('#xwSettingsBtn').addEventListener('click', function () {
      if (settingsPanel.classList.contains('hidden')) {
        if (!settingsUnlocked && !TM.Leaderboard.checkPassword('Enter the settings password to unlock game settings:')) return;
        settingsUnlocked = true;
        settingsPanel.classList.remove('hidden');
      } else {
        settingsPanel.classList.add('hidden');
      }
    });
    root.querySelectorAll('.xw-diff-btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-diff') === difficulty);
      btn.addEventListener('click', function () {
        difficulty = btn.getAttribute('data-diff');
        try { localStorage.setItem(DIFF_KEY, difficulty); } catch (err) { /* ignore */ }
        root.querySelectorAll('.xw-diff-btn').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      });
    });
    root.querySelector('#xwResetBestBtn').addEventListener('click', function () {
      if (TM.Leaderboard.resetBest(gameId)) updateBestDisplay();
    });

    newPuzzle();

    return {
      debugState: function () { return { puzzle: puzzle, inputs: inputs, difficulty: difficulty }; },
      unmount: function () { stopTimer(); }
    };
  }

  window.TM.mountCrossword = mountCrossword;
})();
