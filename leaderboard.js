(function () {
  window.TM = window.TM || {};

  // Shared "forever" top-score leaderboard, used by every arcade game and
  // every study tool's own mini-games (Match the Definition, the oil/fuel
  // drag game, and the new per-chapter crossword). Per-browser localStorage
  // only — this site is static/no-backend (see CLAUDE.md), so a score set
  // here is permanent on whichever device set it, not shared across every
  // visitor's own browser, the same one-browser-only caveat every other
  // persisted-edit feature in this codebase already carries.
  //
  // One shared settings password ("APP") gates both resetting a leaderboard
  // and unlocking any game's settings/difficulty picker — the same password
  // already used by every arcade game's MCQ editor (MCQ_EDIT_PASSWORD).

  var SETTINGS_PASSWORD = 'APP';
  // Bumped to v2 when every "ends by clearing the stage" game's scoring
  // formula changed to include a time bonus and a per-revive penalty —
  // old scores were computed under a different formula and are no
  // longer comparable, so this orphans them for every visitor at once
  // rather than requiring a manual per-game reset.
  var KEY_PREFIX = 'tm.leaderboard.v2.';
  var LAST_NAME_KEY = 'tm.leaderboard.lastName';
  var MAX_NAME_LEN = 10;

  // A short, representative blocklist (not exhaustive) checked as a
  // case-insensitive substring match against the whole entered name.
  var PROFANITY = [
    'fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'nigger', 'nigga',
    'fag', 'faggot', 'slut', 'whore', 'cock', 'rape', 'retard', 'twat',
    'asshole', 'bastard', 'damn', 'piss', 'wank', 'cum', 'tits', 'sex',
    'porn', 'nazi', 'kkk', 'slave'
  ];

  function containsProfanity(name) {
    var lower = name.toLowerCase();
    for (var i = 0; i < PROFANITY.length; i++) {
      if (lower.indexOf(PROFANITY[i]) !== -1) return true;
    }
    return false;
  }

  function loadBest(gameId) {
    try {
      var raw = localStorage.getItem(KEY_PREFIX + gameId);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (obj && typeof obj.score === 'number' && typeof obj.name === 'string') return obj;
    } catch (err) { /* ignore */ }
    return null;
  }

  function saveBest(gameId, name, score) {
    try { localStorage.setItem(KEY_PREFIX + gameId, JSON.stringify({ name: name, score: score })); } catch (err) { /* ignore */ }
  }

  function clearBest(gameId) {
    try { localStorage.removeItem(KEY_PREFIX + gameId); } catch (err) { /* ignore */ }
  }

  function askForName(defaultName) {
    var name = window.prompt(
      'New top score! Enter your name (up to ' + MAX_NAME_LEN + ' characters) to claim the top spot:',
      defaultName || ''
    );
    if (name == null) return null; // cancelled
    name = name.trim().slice(0, MAX_NAME_LEN);
    if (!name) return null;
    if (containsProfanity(name)) {
      window.alert('That name isn’t allowed here — please choose another.');
      return askForName(defaultName);
    }
    return name;
  }

  // score: higher-is-better by default; pass { higherIsBetter: false } for a
  // timing leaderboard where a lower score (faster time) wins.
  function submitScore(gameId, score, opts) {
    opts = opts || {};
    var higherIsBetter = opts.higherIsBetter !== false;
    var current = loadBest(gameId);
    var beat = !current || (higherIsBetter ? score > current.score : score < current.score);
    if (!beat) return { submitted: false, best: current };
    var lastName = '';
    try { lastName = localStorage.getItem(LAST_NAME_KEY) || ''; } catch (err) { /* ignore */ }
    var name = askForName(lastName);
    if (name == null) return { submitted: false, best: current, cancelled: true };
    try { localStorage.setItem(LAST_NAME_KEY, name); } catch (err) { /* ignore */ }
    saveBest(gameId, name, score);
    return { submitted: true, best: { name: name, score: score } };
  }

  function checkPassword(message) {
    var pw = window.prompt(message || 'Enter the settings password:');
    if (pw !== SETTINGS_PASSWORD) {
      if (pw != null) window.alert('Incorrect password.');
      return false;
    }
    return true;
  }

  function resetBest(gameId) {
    if (!checkPassword('Enter the settings password to reset this leaderboard:')) return false;
    clearBest(gameId);
    return true;
  }

  function formatTime(totalSeconds) {
    var s = Math.max(0, Math.round(totalSeconds));
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  // Convenience formatter for a HUD "Best" stat tile — pass formatScore to
  // render e.g. a time instead of a bare number.
  function bestLabel(gameId, formatScore) {
    var best = loadBest(gameId);
    if (!best) return '--';
    var shown = formatScore ? formatScore(best.score) : best.score;
    return '🏆 ' + best.name + ' — ' + shown;
  }

  window.TM.Leaderboard = {
    getBest: loadBest,
    submitScore: submitScore,
    resetBest: resetBest,
    checkPassword: checkPassword,
    formatTime: formatTime,
    bestLabel: bestLabel,
    MAX_NAME_LEN: MAX_NAME_LEN
  };
})();
