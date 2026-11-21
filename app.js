(function () {
  window.TM = window.TM || {};
  window.TM.toolModules = {};

  window.TM.registerTool = function (id, module) {
    window.TM.toolModules[id] = module;
  };

  window.TM.escapeHtml = function (str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    var catalogView = document.getElementById('catalog-view');
    var toolView = document.getElementById('tool-view');
    var toolContainer = document.getElementById('tool-container');
    var catalogGrid = document.getElementById('catalog-grid');
    var gamesGrid = document.getElementById('games-grid');
    var backButton = document.getElementById('back-to-tools');

    var activeModule = null;

    function buildCard(tool) {
      var card = document.createElement('a');
      card.className = 'tool-card';
      card.href = '#' + tool.id;
      card.innerHTML =
        '<span class="tool-card-icon">' + tool.icon + '</span>' +
        '<h2>' + TM.escapeHtml(tool.name) + '</h2>' +
        '<p>' + TM.escapeHtml(tool.description) + '</p>' +
        '<span class="tool-card-cta">Open <span class="arrow">→</span></span>';
      return card;
    }

    function renderCatalog() {
      catalogGrid.innerHTML = '';
      gamesGrid.innerHTML = '';
      TM.tools.forEach(function (tool) {
        if (tool.hidden) return;
        var grid = tool.category === 'game' ? gamesGrid : catalogGrid;
        grid.appendChild(buildCard(tool));
      });
    }

    function showTool(id) {
      var tool = TM.tools.find(function (t) { return t.id === id; });
      var module = TM.toolModules[id];
      if (!tool || !module) {
        location.hash = '';
        return;
      }
      if (activeModule && activeModule.unmount) activeModule.unmount();
      catalogView.hidden = true;
      toolView.hidden = false;
      toolContainer.innerHTML = '';
      activeModule = module;
      module.mount(toolContainer);
    }

    function showCatalog() {
      if (activeModule && activeModule.unmount) activeModule.unmount();
      activeModule = null;
      toolContainer.innerHTML = '';
      toolView.hidden = true;
      catalogView.hidden = false;
    }

    function route() {
      var id = location.hash.replace(/^#/, '');
      if (!id) showCatalog();
      else showTool(id);
    }

    window.addEventListener('hashchange', route);
    backButton.addEventListener('click', function () { location.hash = ''; });

    renderCatalog();
    route();
  });
})();
