(function () {
  window.TM = window.TM || {};

  // Starting System's "🎮 Game Mode" page — reached from a button on the
  // main Engine Starting System tool. Hosts this chapter's own crossword
  // and Match the Definition game via the shared engines (see CLAUDE.md).
  // Content here is a standalone copy of starting-system.js's own
  // `COMPONENTS` table (stored there as `[name, desc]` array pairs) —
  // duplicated rather than shared, since Game Mode is a separate page
  // with no live diagram to read the pool from.

  var PAIRS = [
    { term: 'Electrical Supply', definition: '115 VAC electrical power supplied to the Engine Electronic Controller, powering it up to run the start sequence.' },
    { term: 'Engine Electronic Controller (EEC)', definition: 'The engine’s electronic controller — manages the ignition system and feeds live engine parameters to the cockpit ECAM page throughout the start.' },
    { term: 'Ignition Unit', definition: 'A dual-channel ignition exciter that turns EEC-commanded power into the high-voltage pulses sent on to the igniter plug.' },
    { term: 'Igniter Plug', definition: 'Sparks inside the combustion chamber to ignite the fuel-air mixture once fuel is introduced, starting combustion.' },
    { term: 'Engine ECAM Page', definition: 'Displays live engine parameters — N1/N2, EGT, oil pressure and more — so the flight crew can monitor the start sequence as it progresses.' },
    { term: 'Starter Air Supply', definition: 'Pneumatic and electrical power for the start, sourced from the APU, a ground air cart, or bleed air cross-fed from another already-running engine.' },
    { term: 'Starter Control Valve', definition: 'Solenoid-operated pneumatic valve that opens to admit air to the starter motor; also carries a manual override square drive for maintenance ground-cranking.' },
    { term: 'Starter Motor', definition: 'An air-driven motor that converts the pneumatic supply into rotary drive, cranking the engine until it can sustain itself.' },
    { term: 'Engine (HP Shaft & Accessory Gearbox)', definition: 'The core being cranked — the starter motor turns the HP shaft and accessory gearbox until the engine lights up and stabilizes at idle.' }
  ];

  var WORDS = [
    { word: 'ELECTRICAL', clue: '115 VAC power supplied to the Engine Electronic Controller' },
    { word: 'CONTROLLER', clue: 'Manages ignition and feeds live parameters to the ECAM page' },
    { word: 'IGNITION', clue: 'A dual-channel exciter turning commanded power into high-voltage pulses' },
    { word: 'IGNITER', clue: 'Sparks inside the combustion chamber to start combustion' },
    { word: 'ECAM', clue: 'Cockpit page displaying N1/N2, EGT and oil pressure during the start' },
    { word: 'PNEUMATIC', clue: 'The kind of air-driven supply that powers the starter motor' },
    { word: 'VALVE', clue: 'Opens to admit air to the starter motor' },
    { word: 'STARTER', clue: 'The air-driven motor that cranks the engine until it sustains itself' },
    { word: 'GEARBOX', clue: 'Turned by the starter motor along with the HP shaft' },
    { word: 'IDLE', clue: 'The stable RPM the engine settles at once the start completes' }
  ];

  function mount(root) {
    return TM.mountGameModeHub(root, {
      title: 'Starting System — Game Mode',
      backHash: 'starting-system',
      backLabel: '← Back to Starting System',
      games: [
        {
          id: 'crossword',
          label: '🧩 Crossword',
          mount: function (container) {
            return TM.mountCrossword(container, {
              gameId: 'startingSystemCrossword',
              title: 'Starting System Crossword',
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
              gameId: 'startingSystemMatch',
              title: 'Starting System — Match the Definition',
              intro: 'Click a part name, then its matching description (or the other way round). Each round is a random 3-of-' + PAIRS.length + ' mix.',
              pairs: PAIRS
            });
          }
        }
      ]
    });
  }

  window.TM.registerTool('starting-system-game-mode', { mount: mount });
})();
