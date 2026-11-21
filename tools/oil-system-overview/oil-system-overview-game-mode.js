(function () {
  window.TM = window.TM || {};

  // Oil System's "🎮 Game Mode" page — reached from a button on the main
  // Oil System Overview tool. Hosts this chapter's own crossword and
  // Match the Definition game via the shared engines (see CLAUDE.md).
  // Content here is a standalone copy of the oil system's own component
  // names/descriptions (from oil-system-overview.js's DESC table and
  // bearing columns) — duplicated rather than shared, since Game Mode is
  // a separate page with no live diagram to read the pool from.

  var PAIRS = [
    { term: 'Oil Tank', definition: 'Stores the reserve of oil for the system, with a sight glass or dipstick so the level can be checked manually.' },
    { term: 'Supply (Pressure) Pump', definition: 'Draws oil from the tank and pressurizes it for delivery to the bearings and gearbox.' },
    { term: 'Scavenge Pump', definition: 'Draws used oil back out of the bearing chambers and gearbox and returns it toward the tank.' },
    { term: 'Oil Pressure Relief Valve', definition: 'A spring-loaded valve that limits feed-line pressure to a set design value.' },
    { term: 'Main Oil Filter', definition: 'A fine pressure filter fitted at the pump outlet that catches particles before they reach the oil jets.' },
    { term: 'FOHE', definition: 'Fuel/Oil Heat Exchanger — routes hot oil across a matrix of tubes carrying fuel, cooling the oil and pre-warming the fuel.' },
    { term: 'Last-Chance Filter', definition: 'A fine thread-type strainer fitted immediately upstream of the oil jets, the final safeguard before a bearing or gear mesh.' },
    { term: 'Magnetic Chip Detector', definition: 'A permanent magnet in the scavenge flow that collects ferrous wear debris from the chamber it serves.' },
    { term: 'Centrifugal Breather', definition: 'Spins air drawn from the bearing chambers and gearbox to fling out entrained oil mist before venting it overboard.' },
    { term: 'Gear Box', definition: 'The accessory/reduction gearbox — its gears and splines run under high torque and need continuous lubrication and cooling.' },
    { term: 'Oil Temperature Probe', definition: 'Measures the temperature of oil returning to the tank, feeding the cockpit warning system.' },
  ];

  var WORDS = [
    { word: 'TANK', clue: 'Stores the reserve of oil for the system' },
    { word: 'SUPPLY', clue: 'The pump that pressurizes oil for delivery to bearings and gearbox' },
    { word: 'SCAVENGE', clue: 'The circuit that pumps used oil back out of a bearing chamber' },
    { word: 'RELIEF', clue: 'A spring-loaded valve that limits feed-line pressure to a set value' },
    { word: 'FILTER', clue: 'Catches particles before they can reach the oil jets' },
    { word: 'FOHE', clue: 'Fuel/Oil Heat Exchanger — cools oil and pre-warms fuel' },
    { word: 'CHIP', clue: 'A detector that catches ferrous wear debris with a magnet' },
    { word: 'BREATHER', clue: 'Spins bearing-chamber air to fling out entrained oil mist' },
    { word: 'GEARBOX', clue: 'Accessory/reduction unit needing continuous lubrication and cooling' },
    { word: 'BEARING', clue: 'Supports a rotating shaft — jetted with oil to lubricate and cool it' },
    { word: 'PROBE', clue: 'Measures oil temperature returning to the tank' },
  ];

  function mount(root) {
    return TM.mountGameModeHub(root, {
      title: 'Oil System — Game Mode',
      backHash: 'oil-system-overview',
      backLabel: '← Back to Oil System Overview',
      games: [
        {
          id: 'crossword',
          label: '🧩 Crossword',
          mount: function (container) {
            return TM.mountCrossword(container, {
              gameId: 'oilSystemCrossword',
              title: 'Oil System Crossword',
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
              gameId: 'oilSystemMatch',
              title: 'Oil System — Match the Definition',
              intro: 'Click a part name, then its matching description (or the other way round). Each round is a random 3-of-' + PAIRS.length + ' mix.',
              pairs: PAIRS
            });
          }
        }
      ]
    });
  }

  window.TM.registerTool('oil-system-overview-game-mode', { mount: mount });
})();
