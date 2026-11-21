(function () {
  window.TM = window.TM || {};

  // Fire Protection System's "🎮 Game Mode" page — reached from a button
  // on the main Fire System tool. Hosts this chapter's own crossword and
  // Match the Definition game via the shared engines (see CLAUDE.md).
  // Content is a standalone copy drawn from fire-system.js's own
  // PANEL_MARKERS/LOOP_MARKERS text — duplicated rather than shared,
  // since Game Mode is a separate page with no live diagram to mask.

  var PAIRS = [
    { term: 'ENG FIRE Pushbutton', definition: 'The guarded red pushbutton for an engine. Pushing it arms the fire extinguishing system and automatically cuts off fuel, hydraulic, bleed air, and electrical supplies to that engine.' },
    { term: 'Agent 1', definition: 'Fires the first extinguisher bottle into the engine nacelle, pressed after the ENG FIRE pushbutton once the fire warning has had time to clear on its own.' },
    { term: 'Agent 2', definition: 'Fires the second, backup extinguisher bottle into the nacelle, if the fire warning persists after Agent 1 has been discharged.' },
    { term: 'TEST Button', definition: 'Checks the fire detection and warning circuit without an actual fire present.' },
    { term: 'APU FIRE Pushbutton', definition: 'The guarded red pushbutton for the APU. Pushing it arms the APU fire extinguishing system and shuts down the APU’s fuel and electrical supplies.' },
    { term: 'Engine Master Switch', definition: 'ON starts/keeps an engine running; OFF shuts off its fuel supply. Used in the shutdown step before pushing the ENG FIRE pushbutton.' },
    { term: 'MODE Selector', definition: 'Selects the engine start mode — CRANK, NORM, or IGN START. Not part of the fire logic, but shares the same 115VU panel.' },
    { term: 'FIRE/FAULT Light', definition: 'Illuminates red (FIRE) or amber (FAULT) to repeat an engine’s fire/fault state on the pedestal panel.' },
    { term: 'Loop A / Loop B', definition: 'Two identical fire-sensing loops routed around the nacelle, electrically independent and run in parallel so damage to one doesn’t take out fire detection entirely.' },
    { term: 'Fire-Sensing Element', definition: 'A continuous heat-sensitive element running the length of each loop, whose electrical properties change when it detects an overheat/fire condition.' },
    { term: 'Fire Detection Unit (FDU)', definition: 'Continuously monitors both loops’ signals — agreement raises a Fire signal, a mismatch raises a Fault signal instead. One FDU per engine/APU.' }
  ];

  var WORDS = [
    { word: 'PUSHBUTTON', clue: 'Guarded red control that arms the extinguishing system and cuts engine supplies' },
    { word: 'AGENT', clue: 'The extinguishing bottle fired into the nacelle' },
    { word: 'SQUIB', clue: 'The discharge cartridge that fires an extinguisher bottle' },
    { word: 'TEST', clue: 'Checks the fire detection circuit without a real fire' },
    { word: 'MASTER', clue: 'The engine switch turned OFF before pushing FIRE' },
    { word: 'MODE', clue: 'Selector for CRANK, NORM or IGN START' },
    { word: 'FAULT', clue: 'Signal raised when the detection system itself is malfunctioning' },
    { word: 'LOOP', clue: 'One of two parallel fire-sensing wires around the nacelle' },
    { word: 'SENSING', clue: 'The heat-sensitive element running the length of a loop' },
    { word: 'DETECTION', clue: 'The unit (FDU) that monitors both loops and raises Fire or Fault' },
    { word: 'NACELLE', clue: 'The engine housing an extinguisher bottle discharges into' },
    { word: 'PEDESTAL', clue: 'Where the engine master switches and MODE selector sit' }
  ];

  function mount(root) {
    return TM.mountGameModeHub(root, {
      title: 'Fire Protection System — Game Mode',
      backHash: 'fire-system',
      backLabel: '← Back to Virtual Lab on Fire Protection System',
      games: [
        {
          id: 'crossword',
          label: '🧩 Crossword',
          mount: function (container) {
            return TM.mountCrossword(container, {
              gameId: 'fireSystemCrossword',
              title: 'Fire Protection System Crossword',
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
              gameId: 'fireSystemMatch',
              title: 'Fire Protection System — Match the Definition',
              intro: 'Click a part name, then its matching description (or the other way round). Each round is a random 3-of-' + PAIRS.length + ' mix.',
              pairs: PAIRS
            });
          }
        }
      ]
    });
  }

  window.TM.registerTool('fire-system-game-mode', { mount: mount });
})();
