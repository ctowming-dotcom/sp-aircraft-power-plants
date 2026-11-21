(function () {
  window.TM = window.TM || {};

  // Virtual Lab's "🎮 Game Mode" page — reached from a button on the main
  // Virtual Lab on Engine Practical tool. Hosts this chapter's own
  // crossword and Match the Definition game via the shared engines (see
  // CLAUDE.md). Content here is a standalone copy of virtual-physical-
  // lab.js's own PARTS/CPR_INFO data — duplicated rather than shared,
  // since Game Mode is a separate page with no live diagram to read from.

  var PAIRS = [
    { term: 'Air Intake (Inlet Section)', definition: 'To capture and smoothly deliver air to the compressor with minimum energy loss.' },
    { term: 'Compressor Section', definition: 'To increase the pressure of the incoming air before it enters the combustion chamber.' },
    { term: 'Combustion Chamber (Combustor)', definition: 'To burn the fuel–air mixture efficiently and release high-temperature, high-energy gas.' },
    { term: 'Turbine Section', definition: 'To extract energy from the high-temperature, high-pressure gases leaving the combustor to turn the Compressor and the accessories Gear Box.' },
    { term: 'Exhaust (Nozzle Section)', definition: 'To convert the remaining gas energy into high-speed jet thrust.' },
    { term: 'Compressor Pressure Ratio (CPR)', definition: 'CPR = P2 ÷ P1, the ratio of compressor outlet pressure to inlet pressure — a higher CPR improves combustion efficiency and thrust, and reduces fuel consumption.' },
  ];

  var WORDS = [
    { word: 'INLET', clue: 'Captures and smoothly delivers air to the compressor' },
    { word: 'COMPRESSOR', clue: 'Increases the pressure of incoming air before combustion' },
    { word: 'COMBUSTOR', clue: 'Burns the fuel-air mixture and releases high-energy gas' },
    { word: 'TURBINE', clue: 'Extracts energy from hot gas to turn the compressor and gearbox' },
    { word: 'EXHAUST', clue: 'Converts remaining gas energy into high-speed jet thrust' },
    { word: 'THROTTLE', clue: 'The control that commands engine RPM in this lab' },
    { word: 'RATIO', clue: 'CPR is short for Compressor Pressure ___' },
    { word: 'THRUST', clue: 'The forward force produced by the exhaust jet' },
    { word: 'NOZZLE', clue: 'Another name for the exhaust section' },
    { word: 'SURGE', clue: 'An unwanted compressor instability avoided by keeping CPR in range' },
  ];

  function mount(root) {
    return TM.mountGameModeHub(root, {
      title: 'Virtual Lab — Game Mode',
      backHash: 'virtual-physical-lab',
      backLabel: '← Back to Virtual Lab on Engine Practical',
      games: [
        {
          id: 'crossword',
          label: '🧩 Crossword',
          mount: function (container) {
            return TM.mountCrossword(container, {
              gameId: 'vlabCrossword',
              title: 'Virtual Lab Crossword',
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
              gameId: 'vlabMatch',
              title: 'Virtual Lab — Match the Definition',
              intro: 'Click a part name, then its matching description (or the other way round). Each round is a random 5-of-' + PAIRS.length + ' mix.',
              pairs: PAIRS
            });
          }
        }
      ]
    });
  }

  window.TM.registerTool('virtual-physical-lab-game-mode', { mount: mount });
})();
