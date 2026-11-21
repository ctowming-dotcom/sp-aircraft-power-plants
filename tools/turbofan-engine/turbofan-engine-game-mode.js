(function () {
  window.TM = window.TM || {};

  // Turbofan Engine's "🎮 Game Mode" page — reached from a button on the
  // main Turbofan Engine tool. Hosts this chapter's own crossword and
  // Match the Definition game via the shared engines (see CLAUDE.md).
  // Content here is a standalone copy of the turbofan's own part-label
  // names/descriptions (from turbofan-engine.js's PART_LABELS, the union
  // across all engine modes since triple-spool shows every part) plus
  // the spool/bypass concepts the tool itself teaches — duplicated rather
  // than shared, since Game Mode is a separate page with no live
  // schematic to read the pool from.

  var PAIRS = [
    { term: 'Fan Blade', definition: 'The large forward blades that draw air into the engine; in a high-bypass turbofan most of that air is accelerated straight past the core, producing most of the thrust directly.' },
    { term: 'LP Compressor', definition: 'Raises the pressure of the air that continues into the engine core, driven by the LP turbine through the long LP shaft.' },
    { term: 'IP Compressor', definition: 'A middle compression stage between the LP and HP compressors, driven by its own IP turbine — only present in triple-spool engines.' },
    { term: 'HP Compressor', definition: 'The final, highest-pressure compression stage right before the combustor, driven by the HP turbine on the short HP shaft.' },
    { term: 'HP Turbine', definition: 'The first turbine stage the combustor’s hot gas reaches — extracts just enough energy to drive the HP compressor next to it.' },
    { term: 'IP Turbine', definition: 'Extracts energy to drive the IP compressor via the IP shaft — only present in triple-spool engines.' },
    { term: 'LP Turbine', definition: 'The last turbine stage(s) — extracts the remaining energy to drive the fan and LP compressor via the long outer LP shaft.' },
    { term: 'Spool', definition: 'A shaft plus the compressor and turbine stages it connects, all spinning together as one rotating assembly.' },
    { term: 'Bypass Ratio', definition: 'The mass of air that goes around the core through the fan duct, divided by the mass that goes through the core itself.' },
  ];

  var WORDS = [
    { word: 'FAN', clue: 'Large forward blades that draw air into the engine' },
    { word: 'COMPRESSOR', clue: 'Raises the pressure of air heading into the core' },
    { word: 'TURBINE', clue: 'Extracts energy from hot gas to drive a compressor stage' },
    { word: 'SPOOL', clue: 'A shaft plus its compressor and turbine stages, spinning as one unit' },
    { word: 'SHAFT', clue: 'The rotating rod connecting a turbine stage to its compressor' },
    { word: 'BYPASS', clue: 'Air that flows around the engine core instead of through it' },
    { word: 'NACELLE', clue: 'The streamlined housing that covers an engine' },
    { word: 'THRUST', clue: 'The forward force produced by accelerating air rearward' },
    { word: 'CORE', clue: 'The gas-generator path — compressor, combustor and turbine together' },
  ];

  function mount(root) {
    return TM.mountGameModeHub(root, {
      title: 'Turbofan Engine — Game Mode',
      backHash: 'turbofan-engine',
      backLabel: '← Back to Turbofan Engine',
      games: [
        {
          id: 'crossword',
          label: '🧩 Crossword',
          mount: function (container) {
            return TM.mountCrossword(container, {
              gameId: 'turbofanCrossword',
              title: 'Turbofan Engine Crossword',
              intro: 'A fresh random crossword every time, built from this chapter’s own key words.',
              words: WORDS
            });
          }
        },
        {
          id: 'match',
          label: '🧠 Match the Definition',
          mount: function (container) {
            return TM.mountMatchGame(container, {
              gameId: 'turbofanMatch',
              title: 'Turbofan Engine — Match the Definition',
              intro: 'Click a part name, then its matching description (or the other way round). Each round is a random 5-of-' + PAIRS.length + ' mix.',
              pairs: PAIRS
            });
          }
        }
      ]
    });
  }

  window.TM.registerTool('turbofan-engine-game-mode', { mount: mount });
})();
