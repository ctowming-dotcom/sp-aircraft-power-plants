(function () {
  window.TM = window.TM || {};

  window.TM.tools = [
    {
      id: 'virtual-physical-lab',
      name: 'Virtual Lab on Engine Practical',
      description: 'A hands-on virtual lab for running through engine start-up and operation procedures.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6"></path><path d="M10 3v5.5L5.5 17a2 2 0 0 0 1.8 2.9h9.4a2 2 0 0 0 1.8-2.9L14 8.5V3"></path><path d="M7.5 14.5h9"></path></svg>',
    },
    {
      id: 'turbofan-engine',
      name: 'Turbofan Engine',
      description: 'Interactive overview of a turbofan engine’s layout and operation.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.5"></circle><path d="M12 9.5c0-3 1-5.5 3.5-6.5"></path><path d="M14.3 10.3c2.4-1.7 5-2.2 7-1.2"></path><path d="M14.3 13.7c2.4 1.7 3.7 4 3.7 6.2"></path><path d="M9.7 13.7c-2.4 1.7-5 2.2-7 1.2"></path><path d="M9.7 10.3C7.3 8.6 6 6.3 6 4.1"></path></svg>',
    },
    {
      id: 'oil-system-overview',
      name: 'Oil System Overview',
      description: 'Interactive turbofan oil system diagram — switch spool configuration, toggle oil circuits, and hover a component for details.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c3 4 6 7.5 6 11a6 6 0 1 1-12 0c0-3.5 3-7 6-11z"></path></svg>',
    },
    {
      id: 'fuel-system-overview',
      name: 'Fuel System Overview',
      description: 'Interactive jet engine fuel system diagram — toggle start/shutdown flow and hover a component for details.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="2.5"></circle><rect x="10" y="8" width="8" height="8" rx="1.5"></rect><path d="M7.5 12h2.5M18 12h1.5"></path></svg>',
    },
    {
      id: 'air-system',
      name: 'Air System',
      description: "Interactive diagram of the engine's bleed air and pressurization system.",
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h11.5a2.5 2.5 0 1 0-2-4"></path><path d="M3 14h15.5a2.5 2.5 0 1 1-2 4"></path><path d="M3 11h8"></path></svg>',
    },
    {
      id: 'starting-system',
      name: 'Starting System',
      description: 'Interactive diagram of the engine starting sequence and components.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v7"></path><path d="M7 5.5a8 8 0 1 0 10 0"></path></svg>',
    },
    {
      id: 'apu-system',
      name: 'Virtual Lab on APU System',
      description: 'Interactive diagram of the Auxiliary Power Unit and its systems.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"></path></svg>',
    },
    {
      id: 'fire-system',
      name: 'Virtual Lab on Fire Protection System',
      description: 'Interactive diagram of the engine fire protection system — detection and suppression.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5a2.5 2.5 0 0 0 5 0c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7.5 7.5 0 1 1-15 0c0-1.15.43-2.29 1-3z"></path></svg>',
    },
    {
      id: 'engine-emergency',
      category: 'game',
      name: 'Engine Emergency',
      description: 'Arcade emergency-response game — random system failures fire with a countdown; hit the right panel switches before time runs out.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 21h20L12 2z"></path><path d="M12 9v5"></path><path d="M12 17h.01"></path></svg>',
    },
    {
      id: 'exam-platformer',
      category: 'game',
      name: 'Jump Challenge',
      description: 'A side-scrolling platformer — clear a stage by jumping gaps and dodging spikes to unlock an exam clue.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="6" r="2.5"></circle><path d="M12 8.5v5l-3.5 7"></path><path d="M12 13.5l3.5 6.5"></path><path d="M12 11l-4 2"></path><path d="M12 11l4-1.5"></path></svg>',
    },
    {
      id: 'pacman-arcade',
      category: 'game',
      name: 'Maze Muncher',
      description: 'A Pac-Man-style arcade game — clear the maze, dodge the ghosts, and turn the tables on them with a power pellet.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12 21.5 7a10 10 0 1 0 0 10z"></path><circle cx="15" cy="9" r="0.8" fill="currentColor" stroke="none"></circle></svg>',
    },
    {
      id: 'bomberman-arcade',
      category: 'game',
      name: 'Super Bomberman',
      description: 'A Bomberman-style arcade game — blast blocks, grab power-ups, and clear every creature before the clock runs out.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="13" r="7"></circle><path d="M16 8l2.5-2.5"></path><path d="M17 4.5h2.5V7"></path><path d="M11 13v0"></path></svg>',
    },
    {
      id: 'western-saloon',
      category: 'game',
      name: 'Shooting',
      description: 'A western-bar shooting gallery — gun down the outlaws popping up around the saloon, but spare the bartender and the regulars.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v4"></path><path d="M12 15h.01"></path><path d="M3 12h4"></path><path d="M17 12h4"></path></svg>',
    },
    {
      id: 'barrel-climb',
      category: 'game',
      name: 'Barrel Climb',
      description: 'A Donkey-Kong-style climbing arcade game — dodge rolling barrels and roaming flames up sloped girders to reach the rescue at the top.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="3"></circle><path d="M4 21l6-9 2 3 2-3 6 9"></path><path d="M9 14l-3 2"></path><path d="M15 14l3 2"></path></svg>',
    },
    {
      id: 'tank-battle',
      category: 'game',
      name: 'Tank Battle',
      description: 'A retro top-down tank battle — destroy every enemy tank, dodge return fire, and keep your base safe.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10" width="14" height="8" rx="1.5"></rect><path d="M12 10V5"></path><circle cx="12" cy="5" r="1.5"></circle><path d="M3 14h2"></path><path d="M19 14h2"></path><circle cx="8.5" cy="18" r="1.3"></circle><circle cx="15.5" cy="18" r="1.3"></circle></svg>',
    },

    // Hidden "Game Mode" pages — one per study chapter, each hosting that
    // chapter's own crossword + Match the Definition. Not catalog cards:
    // reached only via the "🎮 Game Mode" button on their own study tool.
    { id: 'virtual-physical-lab-game-mode', hidden: true, name: 'Virtual Lab — Game Mode' },
    { id: 'turbofan-engine-game-mode', hidden: true, name: 'Turbofan Engine — Game Mode' },
    { id: 'oil-system-overview-game-mode', hidden: true, name: 'Oil System — Game Mode' },
    { id: 'fuel-system-overview-game-mode', hidden: true, name: 'Fuel System — Game Mode' },
    { id: 'air-system-game-mode', hidden: true, name: 'Air System — Game Mode' },
    { id: 'starting-system-game-mode', hidden: true, name: 'Starting System — Game Mode' },
    { id: 'apu-system-game-mode', hidden: true, name: 'APU System — Game Mode' },
    { id: 'fire-system-game-mode', hidden: true, name: 'Fire System — Game Mode' },
  ];
})();
