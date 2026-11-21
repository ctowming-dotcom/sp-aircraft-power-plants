(function () {
  window.TM = window.TM || {};

  // Air System's "🎮 Game Mode" page — reached from a button on the main
  // Air System tool. Hosts this chapter's own crossword and Match the
  // Definition game via the shared engines (see CLAUDE.md). Content here
  // is a standalone copy of the air system's own function names/
  // descriptions (from air-system.js's INTERNAL_ITEMS/EXTERNAL_ITEMS,
  // union of both modes) — duplicated rather than shared, since Game
  // Mode is a separate page with no live diagram to read the pool from.

  var PAIRS = [
    { term: 'Thrust Bearing Load Relief', definition: 'Air pressure is used to offset part of the axial load on the main thrust bearing, reducing the load it must carry.' },
    { term: 'Labyrinth Seal', definition: 'Uses a pressurized air barrier to keep oil inside the bearing compartments and hot gas or debris out.' },
    { term: 'Combustion Liner Cooling', definition: 'Air passes through and around the combustor liner to keep its walls within temperature limits while the fuel-air mixture burns inside.' },
    { term: 'NGV Cooling', definition: 'Nozzle Guide Vanes direct combustion gas onto the turbine rotor and sit in the hottest gas path, so they are cooled with air bled from the compressor.' },
    { term: 'Turbine Blade Cooling', definition: 'Cooling air is fed through the turbine blades to keep metal temperatures within limits despite the extremely hot combustion gases flowing over them.' },
    { term: 'Turbine Disc Cooling', definition: 'Cooling air is directed onto the turbine disc faces to limit disc temperature and the thermal stresses that would otherwise shorten its fatigue life.' },
    { term: 'Engine Anti-Icing', definition: 'Hot air from the compressor is delivered to the inlet guide vanes and intake strut to prevent ice forming and disrupting airflow into the intake.' },
    { term: 'EEC Cooling', definition: 'The Electronic Engine Control is mounted in the fan case; on some engines it is cooled by ram air.' },
    { term: 'Customer Bleed', definition: 'Pressurized air taken from the compressor for airframe use — air-conditioning and cabin/reservoir pressurization.' },
    { term: 'Electrical Generator Cooling', definition: 'The integrated drive generators, driven by the external gearbox off the HP shaft, are cooled with fan air.' },
    { term: 'Igniter Lead & Box Cooling', definition: 'The exciter (igniter) box steps low voltage up to around 22 kV; fan air cools both the box and the high-tension leads.' },
    { term: 'Turbine Case Cooling / ACC', definition: 'A dual-channel, EEC-controlled system plays fan air onto the HP and LP turbine cases to shrink them, tightening blade-tip clearance.' },
    { term: 'Nacelle Ventilation', definition: 'The space between the engine cowling and casing is ventilated with fan air to prevent fluid vapor from accumulating and self-igniting.' }
  ];

  var WORDS = [
    { word: 'BLEED', clue: 'Pressurized air taken from the compressor for airframe use' },
    { word: 'SEAL', clue: 'A labyrinth type uses a pressurized air barrier to keep oil in and debris out' },
    { word: 'LINER', clue: 'Air cools this combustion chamber wall while the fuel-air mixture burns inside' },
    { word: 'BLADE', clue: 'Cooling air is fed through these turbine components to keep metal temperatures down' },
    { word: 'DISC', clue: 'Cooling air is directed onto turbine disc faces to limit temperature and thermal stress' },
    { word: 'ICING', clue: 'Hot air prevents this from forming on the inlet guide vanes and intake strut' },
    { word: 'NACELLE', clue: 'The space between engine cowling and casing, ventilated with fan air' },
    { word: 'GENERATOR', clue: 'Driven off the HP shaft via the gearbox, cooled with fan air' },
    { word: 'IGNITER', clue: 'The exciter box steps voltage up to around 22 kV and is cooled by fan air' },
    { word: 'CLEARANCE', clue: 'Active control shrinks turbine cases to tighten blade-tip gaps' },
    { word: 'BEARING', clue: 'Air pressure offsets part of the axial load this component carries' },
    { word: 'VANE', clue: 'Nozzle guide type that directs hot gas onto the turbine rotor' }
  ];

  function mount(root) {
    return TM.mountGameModeHub(root, {
      title: 'Air System — Game Mode',
      backHash: 'air-system',
      backLabel: '← Back to Air System',
      games: [
        {
          id: 'crossword',
          label: '🧩 Crossword',
          mount: function (container) {
            return TM.mountCrossword(container, {
              gameId: 'airSystemCrossword',
              title: 'Air System Crossword',
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
              gameId: 'airSystemMatch',
              title: 'Air System — Match the Definition',
              intro: 'Click a function name, then its matching description (or the other way round). Each round is a random 5-of-' + PAIRS.length + ' mix.',
              pairs: PAIRS
            });
          }
        }
      ]
    });
  }

  window.TM.registerTool('air-system-game-mode', { mount: mount });
})();
