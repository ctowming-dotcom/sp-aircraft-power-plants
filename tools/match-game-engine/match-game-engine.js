(function () {
  window.TM = window.TM || {};

  // Shared "Match the Definition" engine — click a term, then its matching
  // definition (or the other way round). Used by every study chapter's
  // Game Mode page (see CLAUDE.md): each chapter's Game Mode wrapper
  // supplies its own term/definition pairs and calls
  // TM.mountMatchGame(root, config). This is "shared chrome", like the
  // crossword engine, not a tool of its own.
  //
  // Each round uses at most 5 pairs (or fewer if the chapter's own pool is
  // smaller), chosen at random every time, by request (raised from an
  // initial cap of 3).
  //
  // config:
  //   gameId   - unique id for leaderboard storage, e.g. 'oilSystemMatch'
  //   title    - heading text
  //   intro    - one line of instructions
  //   pairs    - [{ term: '...', definition: '...' }, ...]
  //   backHash / backLabel - link back to the chapter's Game Mode hub

  var ROUND_SIZE = 5;
  var SECONDS_PER_ITEM = 14;

  function shuffled(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function mountMatchGame(root, config) {
    var gameId = config.gameId;
    var pool = config.pairs.map(function (p, i) { return { id: 'p' + i, name: p.term, desc: p.definition }; });

    var audioCtx = null;
    function ensureAudio() {
      if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (err) { return null; } }
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
    function playRight() { beep(660, 0.08, 'square', 0.15); }
    function playWrong() { beep(180, 0.16, 'sawtooth', 0.16); }
    function playClear() { beep(523, 0.09, 'square', 0.18); beep(784, 0.11, 'square', 0.18, 0.09); beep(1046, 0.16, 'square', 0.18, 0.18); }

    root.innerHTML =
      '<div class="mg-wrap">' +
      (config.backHash ? '<a class="mg-back" href="#' + config.backHash + '">' + TM.escapeHtml(config.backLabel) + '</a>' : '') +
      '<h1>🧠 ' + TM.escapeHtml(config.title) + '</h1>' +
      '<p class="mg-intro">' + TM.escapeHtml(config.intro) + '</p>' +
      '<div class="mg-hud">' +
      '<div class="mg-stat"><span class="mg-stat-label">Score</span><span class="mg-stat-value" id="mgScore">0</span></div>' +
      '<div class="mg-stat"><span class="mg-stat-label">Matched</span><span class="mg-stat-value" id="mgSolved">0/0</span></div>' +
      '<div class="mg-stat"><span class="mg-stat-label">Time</span><span class="mg-stat-value" id="mgTime">--</span></div>' +
      '<div class="mg-stat mg-stat-best"><span class="mg-stat-label">Top score</span><span class="mg-stat-value" id="mgBest">--</span></div>' +
      '</div>' +
      '<button type="button" class="mg-btn mg-btn-primary" id="mgStartBtn">▶ Start challenge</button>' +
      '<p class="mg-result" id="mgResult"></p>' +
      '<div class="mg-columns">' +
      '<div class="mg-col" id="mgTerms"></div>' +
      '<div class="mg-col" id="mgDefs"></div>' +
      '</div>' +
      '</div>';

    var termsEl = root.querySelector('#mgTerms');
    var defsEl = root.querySelector('#mgDefs');
    var scoreEl = root.querySelector('#mgScore');
    var solvedEl = root.querySelector('#mgSolved');
    var timeEl = root.querySelector('#mgTime');
    var bestEl = root.querySelector('#mgBest');
    var resultEl = root.querySelector('#mgResult');
    var startBtn = root.querySelector('#mgStartBtn');

    var active = false;
    var score = 0, solved = 0, total = 0;
    var duration = 0, deadline = 0, timerId = null;
    var selTermEl = null, selDefEl = null, selTermId = null, selDefId = null;

    function updateBestDisplay() { bestEl.textContent = TM.Leaderboard.bestLabel(gameId); }

    function updateHud() {
      scoreEl.textContent = score;
      solvedEl.textContent = solved + '/' + total;
      var remaining = Math.max(0, deadline - performance.now());
      timeEl.textContent = active ? Math.ceil(remaining / 1000) + 's' : '--';
    }

    function clearSelection() {
      if (selTermEl) selTermEl.classList.remove('is-selected');
      if (selDefEl) selDefEl.classList.remove('is-selected');
      selTermEl = null; selDefEl = null; selTermId = null; selDefId = null;
    }

    function tryMatch() {
      if (selTermId == null || selDefId == null) return;
      if (selTermId === selDefId) {
        selTermEl.classList.remove('is-selected'); selTermEl.classList.add('is-solved');
        selDefEl.classList.remove('is-selected'); selDefEl.classList.add('is-solved');
        solved += 1;
        var remainingFrac = Math.max(0, (deadline - performance.now()) / duration);
        score += Math.round(100 * (0.4 + 0.6 * remainingFrac));
        playRight();
        selTermEl = null; selDefEl = null; selTermId = null; selDefId = null;
        updateHud();
        if (solved >= total) endRound('cleared');
      } else {
        var badTerm = selTermEl, badDef = selDefEl;
        badTerm.classList.add('is-wrong-flash');
        badDef.classList.add('is-wrong-flash');
        playWrong();
        setTimeout(function () {
          badTerm.classList.remove('is-wrong-flash', 'is-selected');
          badDef.classList.remove('is-wrong-flash', 'is-selected');
        }, 400);
        selTermEl = null; selDefEl = null; selTermId = null; selDefId = null;
      }
    }

    function buildTile(item, kind) {
      var tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'mg-tile';
      tile.textContent = kind === 'term' ? item.name : item.desc;
      tile.dataset.id = item.id;
      tile.addEventListener('click', function () {
        if (!active || tile.classList.contains('is-solved')) return;
        if (kind === 'term') {
          if (selTermEl) selTermEl.classList.remove('is-selected');
          selTermEl = tile; selTermId = item.id;
        } else {
          if (selDefEl) selDefEl.classList.remove('is-selected');
          selDefEl = tile; selDefId = item.id;
        }
        tile.classList.add('is-selected');
        tryMatch();
      });
      return tile;
    }

    function startRound() {
      if (active) return;
      var items = shuffled(pool).slice(0, Math.min(ROUND_SIZE, pool.length));

      active = true;
      total = items.length;
      score = 0;
      solved = 0;
      clearSelection();
      resultEl.textContent = '';
      startBtn.disabled = true;

      termsEl.innerHTML = '';
      defsEl.innerHTML = '';
      shuffled(items).forEach(function (it) { termsEl.appendChild(buildTile(it, 'term')); });
      shuffled(items).forEach(function (it) { defsEl.appendChild(buildTile(it, 'def')); });

      duration = SECONDS_PER_ITEM * 1000 * total;
      deadline = performance.now() + duration;
      updateHud();

      if (timerId != null) clearInterval(timerId);
      timerId = setInterval(function () {
        if (performance.now() >= deadline) { endRound('timeup'); return; }
        updateHud();
      }, 200);
    }

    function endRound(reason) {
      if (!active) return;
      active = false;
      if (timerId != null) { clearInterval(timerId); timerId = null; }
      clearSelection();
      termsEl.querySelectorAll('.mg-tile:not(.is-solved)').forEach(function (el) { el.classList.add('is-revealed'); });
      defsEl.querySelectorAll('.mg-tile:not(.is-solved)').forEach(function (el) { el.classList.add('is-revealed'); });
      startBtn.disabled = false;
      updateHud();

      if (reason === 'cleared') {
        playClear();
        TM.Leaderboard.submitScore(gameId, score, { higherIsBetter: true });
        updateBestDisplay();
        resultEl.textContent = '🎉 All ' + total + ' matched! Score ' + score + '.';
      } else {
        resultEl.textContent = '⏰ Time’s up — matched ' + solved + '/' + total + '.';
      }
    }

    startBtn.addEventListener('click', startRound);
    updateBestDisplay();
    updateHud();

    return {
      debugState: function () { return { active: active, score: score, solved: solved, total: total }; },
      debugForceTimeout: function () { if (active) { deadline = performance.now() - 1; } },
      unmount: function () { if (timerId != null) clearInterval(timerId); }
    };
  }

  window.TM.mountMatchGame = mountMatchGame;
})();
