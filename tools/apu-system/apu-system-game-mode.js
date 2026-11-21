(function () {
  window.TM = window.TM || {};

  // APU System's "🎮 Game Mode" page — reached from a button on the main
  // Virtual Lab on APU System tool. Hosts this chapter's own crossword and
  // Match the Definition game via the shared engines (see CLAUDE.md).
  // Content here is a standalone copy of apu-system.js's own COMPONENTS
  // name/desc data — duplicated rather than shared, since Game Mode is a
  // separate page with no live diagram to read the pool from.

  var PAIRS = [
    { term: 'Non-modulating Bleed (Load) Valve', definition: 'Allows the pneumatic bleed from the APU to be interconnected or isolated from the aircraft pneumatic system.' },
    { term: 'Surge Control Valve', definition: 'A modulating valve that spills excess compressor airflow into the exhaust to protect against compressor stall/surge.' },
    { term: 'Inlet Guide Vane (IGV)', definition: 'A ring of vanes at the load compressor inlet that controls how much air reaches the compressor.' },
    { term: 'IGV Actuator (IGVA)', definition: 'Regulates the IGV opening to vary pneumatic load supply, controlled by the ECB and operated by FCU servo fuel.' },
    { term: 'Flow Sensor', definition: 'Measures airflow into the load compressor, feeding the control system that positions the IGV.' },
    { term: 'Load Compressor', definition: 'Compresses air drawn through the inlet for the aircraft’s pneumatic systems, part of the Load Section.' },
    { term: 'Accessory / Reduction Gearbox', definition: 'Reduction gears that drive the components needed to operate the gas turbine engine and the electrical generator.' },
    { term: 'Generator (GEN)', definition: 'Driven mechanically off the accessory gearbox, supplying electrical power to the aircraft.' },
    { term: 'Electronic Control Box (ECB)', definition: 'Receives the aircraft’s demand signal and commands the IGV actuator and fuel metering accordingly.' },
    { term: 'Compressor', definition: 'Part of the gas-generator: raises incoming air to high pressure before it enters the combustor.' },
    { term: 'Combustor', definition: 'Burns metered fuel in the compressed air to produce the high-energy gas that drives the turbine.' },
    { term: 'Turbine (3 Wheels)', definition: 'Extracts energy from hot gas to drive the compressor, load compressor, accessory gearbox, and generator.' },
    { term: 'Fuel Metering Valve', definition: 'Meters fuel into the combustor in the quantity commanded by the ECB/FCU.' }
  ];

  var WORDS = [
    { word: 'BLEED', clue: 'Air interconnected or isolated from the aircraft pneumatic system by a load valve' },
    { word: 'SURGE', clue: 'What a modulating control valve protects the compressor from' },
    { word: 'VANE', clue: 'A ring of these at the load compressor inlet controls airflow' },
    { word: 'ACTUATOR', clue: 'Regulates the IGV opening to vary pneumatic load supply' },
    { word: 'SENSOR', clue: 'Measures airflow into the load compressor' },
    { word: 'COMPRESSOR', clue: 'Raises incoming air to high pressure before the combustor' },
    { word: 'GEARBOX', clue: 'Drives engine accessories and the electrical generator' },
    { word: 'GENERATOR', clue: 'Supplies electrical power, driven off the accessory gearbox' },
    { word: 'COMBUSTOR', clue: 'Burns metered fuel in compressed air to produce hot gas' },
    { word: 'TURBINE', clue: 'Extracts energy from hot gas to drive the whole APU' },
    { word: 'METERING', clue: 'The type of valve that controls fuel quantity into the combustor' }
  ];

  function mount(root) {
    return TM.mountGameModeHub(root, {
      title: 'APU System — Game Mode',
      backHash: 'apu-system',
      backLabel: '← Back to Virtual Lab on APU System',
      games: [
        {
          id: 'crossword',
          label: '🧩 Crossword',
          mount: function (container) {
            return TM.mountCrossword(container, {
              gameId: 'apuSystemCrossword',
              title: 'APU System Crossword',
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
              gameId: 'apuSystemMatch',
              title: 'APU System — Match the Definition',
              intro: 'Click a part name, then its matching description (or the other way round). Each round is a random 3-of-' + PAIRS.length + ' mix.',
              pairs: PAIRS
            });
          }
        }
      ]
    });
  }

  window.TM.registerTool('apu-system-game-mode', { mount: mount });
})();
