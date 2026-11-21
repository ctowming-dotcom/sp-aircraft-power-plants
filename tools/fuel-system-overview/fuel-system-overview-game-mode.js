(function () {
  window.TM = window.TM || {};

  // Fuel System's "🎮 Game Mode" page — reached from a button on the main
  // Fuel System Overview tool. Hosts this chapter's own crossword and
  // Match the Definition game via the shared engines (see CLAUDE.md).
  // Content here is a standalone copy of fuel-system-overview.js's own
  // `titles`/`descriptions` objects (all 14 components) — duplicated
  // rather than shared, since Game Mode is a separate page with no live
  // diagram to read the pool from. Fuel's own "Label the Fuel System"
  // drag-and-drop game stays on the study page, unaffected.

  var PAIRS = [
    { term: 'LP SOV (LP shutoff valve)', definition: 'Sits at the boundary between aircraft and engine fuel systems — closing it stops fuel reaching the engine in an emergency.' },
    { term: 'LP pump', definition: 'The boost stage, a centrifugal pump, that raises tank fuel to a regulated pressure and pushes it to the FOHE.' },
    { term: 'FOHE (Fuel Oil Heat Exchanger)', definition: 'Uses cooler fuel to remove heat from hot engine oil — the oil is cooled while the fuel is warmed in return.' },
    { term: 'LP filter', definition: 'Filters impurities out of the fuel upstream of the fuel control unit, with a bypass valve if it clogs.' },
    { term: 'HP pump', definition: 'The main stage — a gear-type positive-displacement pump — that raises fuel to high pressure for metering.' },
    { term: 'Metering valve (in HMU)', definition: 'Computes the correct fuel quantity from thrust lever position, inlet conditions and shaft speeds, then meters it to the nozzles.' },
    { term: 'HP SOV (in HMU)', definition: 'Cuts off fuel from the HMU to the fuel nozzles and combustion chamber — the valve that actually starts or stops combustion.' },
    { term: 'VSV (Variable Stator Vane actuator)', definition: 'Uses metered servo fuel pressure to torque-motor the variable stator vanes, controlling compressor airflow.' },
    { term: 'Drain V/V', definition: 'Stays closed while the engine runs, then opens after shutdown to bleed trapped fuel to the drain mast.' },
    { term: 'Drain collector', definition: 'Gathers fuel bled off by the drain valve before it is routed overboard.' },
    { term: 'Drain mast', definition: 'Vents the collected drain fuel safely overboard, away from hot engine surfaces.' },
    { term: 'FF transmitter', definition: 'Sends an electrical signal to the cockpit fuel flow gauge.' },
    { term: 'Fuel manifold', definition: 'Distributes metered fuel around the engine case to each fuel nozzle.' },
    { term: 'Fuel nozzles', definition: 'Injects and atomizes fuel into the combustion chamber, avoiding hot spots on the combustion liner.' }
  ];

  var WORDS = [
    { word: 'SHUTOFF', clue: 'The LP valve that isolates the engine from the aircraft fuel supply' },
    { word: 'BOOST', clue: 'The LP pump stage that raises tank fuel pressure before the FOHE' },
    { word: 'HEATEXCHANGER', clue: 'Cools hot oil using cooler fuel (the FOHE, two words run together)' },
    { word: 'FILTER', clue: 'Removes impurities from fuel upstream of the control unit' },
    { word: 'METERING', clue: 'The valve that computes and doles out the correct fuel quantity' },
    { word: 'NOZZLES', clue: 'Injects and atomizes fuel into the combustion chamber' },
    { word: 'MANIFOLD', clue: 'Distributes metered fuel around the engine case to every nozzle' },
    { word: 'DRAIN', clue: 'The valve that bleeds trapped fuel to the mast after shutdown' },
    { word: 'TRANSMITTER', clue: 'Sends fuel flow data to the cockpit gauge' },
    { word: 'VANE', clue: 'Variable stator component whose actuator uses metered servo fuel' }
  ];

  function mount(root) {
    return TM.mountGameModeHub(root, {
      title: 'Fuel System — Game Mode',
      backHash: 'fuel-system-overview',
      backLabel: '← Back to Fuel System Overview',
      games: [
        {
          id: 'crossword',
          label: '🧩 Crossword',
          mount: function (container) {
            return TM.mountCrossword(container, {
              gameId: 'fuelSystemCrossword',
              title: 'Fuel System Crossword',
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
              gameId: 'fuelSystemMatch',
              title: 'Fuel System — Match the Definition',
              intro: 'Click a part name, then its matching description (or the other way round). Each round is a random 5-of-' + PAIRS.length + ' mix.',
              pairs: PAIRS
            });
          }
        }
      ]
    });
  }

  window.TM.registerTool('fuel-system-overview-game-mode', { mount: mount });
})();
