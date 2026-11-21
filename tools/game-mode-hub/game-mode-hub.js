(function () {
  window.TM = window.TM || {};

  // Shared "Game Mode" hub — the page a study chapter's own "🎮 Game
  // Mode" button opens. Tabs between that chapter's own mini-games
  // (crossword, Match the Definition, and for Oil/Fuel System the
  // drag-and-drop labeling game), each mounted by the matching shared
  // engine. Shared chrome, like the crossword/match-game engines
  // themselves — see CLAUDE.md for the full rollout.
  //
  // config:
  //   title     - heading text, e.g. 'Oil System — Game Mode'
  //   backHash  - hash of the study tool this hub belongs to
  //   backLabel - link text back to that study tool
  //   games     - [{ id, label, mount(container) -> { unmount? } }, ...]

  function mountGameModeHub(root, config) {
    var tabsHtml = config.games.map(function (g, i) {
      return '<button type="button" class="gm-tab' + (i === 0 ? ' is-active' : '') + '" data-game="' + g.id + '">' + TM.escapeHtml(g.label) + '</button>';
    }).join('');

    root.innerHTML =
      '<div class="gm-wrap">' +
      '<a class="gm-back" href="#' + config.backHash + '">' + TM.escapeHtml(config.backLabel) + '</a>' +
      '<h1>🎮 ' + TM.escapeHtml(config.title) + '</h1>' +
      '<div class="gm-tabs">' + tabsHtml + '</div>' +
      '<div class="gm-game-container" id="gmGameContainer"></div>' +
      '</div>';

    var container = root.querySelector('#gmGameContainer');
    var active = null;

    function showGame(id) {
      var game = config.games.filter(function (g) { return g.id === id; })[0];
      if (!game) return;
      if (active && active.instance && active.instance.unmount) active.instance.unmount();
      root.querySelectorAll('.gm-tab').forEach(function (btn) {
        btn.classList.toggle('is-active', btn.getAttribute('data-game') === id);
      });
      container.innerHTML = '';
      active = { id: id, instance: game.mount(container) };
    }

    root.querySelectorAll('.gm-tab').forEach(function (btn) {
      btn.addEventListener('click', function () { showGame(btn.getAttribute('data-game')); });
    });

    showGame(config.games[0].id);

    return {
      unmount: function () { if (active && active.instance && active.instance.unmount) active.instance.unmount(); }
    };
  }

  window.TM.mountGameModeHub = mountGameModeHub;
})();
