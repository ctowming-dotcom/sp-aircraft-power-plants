(function () {
  // Real run data (ascending throttle sweep), extracted from the supplied
  // Engine_Run_Sample_Result.xlsx. Column mapping verified against the
  // supplied lab answer key's worked peak-RPM figures:
  //   P1/T1 = Comp Inlet Press/Temp, P2/T2 = Comp Exit Press/Temp,
  //   P3/T3 = Turb Inlet Press/Temp, P4 = Nozzle Exit Press, T4 = EGT.
  // Units as logged: pressure PSIG, temperature degC, fuel flow Gal/hr,
  // thrust lbf (clamped to 0 at idle — small negative tare noise in the
  // source log). RPM is the independent variable the throttle drives.
  var ANCHORS = [
    { rpm: 6815, fuelFlow: 0.02, thrust: 0, p1: 0.0033, p2: 0.239, p3: 0.471, p4: 0.097, t1: 27.5, t2: 27.0, t3: 29.9, t4: 29.5 },
    { rpm: 9523, fuelFlow: 1.05, thrust: 0, p1: 0.0054, p2: 0.325, p3: 0.566, p4: 0.106, t1: 27.4, t2: 26.5, t3: 29.4, t4: 29.2 },
    { rpm: 12188, fuelFlow: 4.37, thrust: 0, p1: 0.0097, p2: 0.624, p3: 0.871, p4: 0.131, t1: 27.4, t2: 25.8, t3: 148.8, t4: 38.4 },
    { rpm: 18424, fuelFlow: 2.43, thrust: 0, p1: 0.0275, p2: 1.287, p3: 1.549, p4: 0.197, t1: 27.5, t2: 24.1, t3: 467.1, t4: 74.9 },
    { rpm: 28044, fuelFlow: 2.23, thrust: 0, p1: 0.0667, p2: 2.920, p3: 3.240, p4: 0.367, t1: 27.8, t2: 22.6, t3: 649.0, t4: 158.4 },
    { rpm: 39797, fuelFlow: 2.24, thrust: 0, p1: 0.0689, p2: 5.230, p3: 5.534, p4: 0.408, t1: 27.4, t2: 65.6, t3: 606.5, t4: 376.3 },
    { rpm: 41683, fuelFlow: 2.24, thrust: 0.39, p1: 0.0777, p2: 5.772, p3: 6.093, p4: 0.440, t1: 27.4, t2: 76.7, t3: 606.5, t4: 407.0 },
    { rpm: 42675, fuelFlow: 2.37, thrust: 0.83, p1: 0.0807, p2: 6.125, p3: 6.465, p4: 0.457, t1: 27.3, t2: 79.6, t3: 602.7, t4: 413.6 },
    { rpm: 45256, fuelFlow: 2.61, thrust: 1.08, p1: 0.0915, p2: 7.008, p3: 7.387, p4: 0.509, t1: 27.3, t2: 82.5, t3: 606.6, t4: 419.9 },
    { rpm: 47855, fuelFlow: 2.74, thrust: 1.96, p1: 0.1060, p2: 8.028, p3: 8.449, p4: 0.574, t1: 27.3, t2: 85.7, t3: 608.9, t4: 425.5 },
    { rpm: 50943, fuelFlow: 2.91, thrust: 2.66, p1: 0.1213, p2: 9.225, p3: 9.655, p4: 0.651, t1: 27.3, t2: 89.3, t3: 604.2, t4: 429.5 },
    { rpm: 53579, fuelFlow: 3.10, thrust: 3.22, p1: 0.1391, p2: 10.429, p3: 10.846, p4: 0.715, t1: 27.3, t2: 97.0, t3: 582.3, t4: 431.9 },
    { rpm: 55571, fuelFlow: 3.22, thrust: 3.79, p1: 0.1546, p2: 11.265, p3: 11.709, p4: 0.766, t1: 27.4, t2: 104.0, t3: 573.9, t4: 431.2 },
    { rpm: 57199, fuelFlow: 3.39, thrust: 4.54, p1: 0.1657, p2: 12.116, p3: 12.589, p4: 0.822, t1: 27.6, t2: 110.9, t3: 573.1, t4: 429.6 },
    { rpm: 59308, fuelFlow: 3.58, thrust: 5.35, p1: 0.1759, p2: 13.281, p3: 13.799, p4: 0.892, t1: 27.8, t2: 117.5, t3: 574.4, t4: 429.2 },
    { rpm: 60929, fuelFlow: 3.70, thrust: 5.73, p1: 0.1897, p2: 14.167, p3: 14.750, p4: 0.956, t1: 27.9, t2: 123.9, t3: 576.9, t4: 429.2 },
    { rpm: 62149, fuelFlow: 3.84, thrust: 6.35, p1: 0.2023, p2: 14.990, p3: 15.597, p4: 1.015, t1: 27.8, t2: 127.2, t3: 581.8, t4: 429.4 },
    { rpm: 65923, fuelFlow: 4.10, thrust: 7.80, p1: 0.2347, p2: 17.392, p3: 18.059, p4: 1.189, t1: 27.7, t2: 134.9, t3: 590.1, t4: 430.5 },
    { rpm: 66610, fuelFlow: 4.25, thrust: 8.38, p1: 0.2421, p2: 17.991, p3: 18.712, p4: 1.248, t1: 27.6, t2: 138.9, t3: 591.7, t4: 430.2 },
    { rpm: 70827, fuelFlow: 4.64, thrust: 10.76, p1: 0.2825, p2: 21.233, p3: 22.138, p4: 1.498, t1: 27.6, t2: 143.7, t3: 607.6, t4: 431.5 },
    { rpm: 74376, fuelFlow: 4.85, thrust: 12.90, p1: 0.3268, p2: 24.174, p3: 25.152, p4: 1.714, t1: 27.6, t2: 150.3, t3: 628.0, t4: 433.8 },
    { rpm: 77178, fuelFlow: 4.93, thrust: 14.04, p1: 0.3612, p2: 26.467, p3: 27.445, p4: 1.813, t1: 27.8, t2: 166.3, t3: 654.3, t4: 438.9 },
  ];
  var MIN_RPM = ANCHORS[0].rpm;
  var MAX_RPM = ANCHORS[ANCHORS.length - 1].rpm;

  // Mode 1 = as logged (PSIG, degC, Gal/hr, lbf). Mode 2 = SI (Pa, K, L/hr, N & kgf).
  var PSI_TO_PA = 6894.757293168;
  var GAL_TO_L = 3.785411784;
  var LBF_TO_N = 4.4482216153;
  var N_TO_KGF = 1 / 9.80665;

  function fmtPressure(psig, mode) {
    return mode === 2 ? Math.round(psig * PSI_TO_PA).toLocaleString() + ' Pa' : psig.toFixed(3) + ' PSIG';
  }
  function fmtTemp(degC, mode) {
    return mode === 2 ? (degC + 273.15).toFixed(1) + ' K' : degC.toFixed(1) + ' °C';
  }
  function fmtFuel(galHr, mode) {
    return mode === 2 ? (galHr * GAL_TO_L).toFixed(2) + ' L/hr' : galHr.toFixed(2) + ' Gal/hr';
  }
  function fmtThrust(lbf, mode) {
    if (mode === 2) {
      var n = lbf * LBF_TO_N;
      return n.toFixed(1) + ' N · ' + (n * N_TO_KGF).toFixed(2) + ' kgf';
    }
    return lbf.toFixed(1) + ' lbf';
  }

  // Engine parts: position (percentage over the image) plus the name/desc
  // shown in the hover tooltip. Both position and wording are editable in
  // edit mode (see EDIT_PASSWORD below).
  var IMG_W = 1747, IMG_H = 900, CENTER_Y = 450;

  // rPct is the marker's diameter as a percentage of the image's
  // displayed width (kept circular regardless of the image's own aspect
  // ratio via `aspect-ratio: 1/1` in CSS, not a height percentage).
  var PARTS = [
    { comp: 'inlet', xPct: 9.7, yPct: 45.9, rPct: 9, name: 'Air Intake (Inlet Section)', desc: 'To capture and smoothly deliver air to the compressor with minimum energy loss.' },
    { comp: 'compressor', xPct: 36.1, yPct: 45.5, rPct: 9, name: 'Compressor Section', desc: 'To increase the pressure of the incoming air before it enters the combustion chamber.' },
    { comp: 'combustor', xPct: 84.1, yPct: 15, rPct: 9, name: 'Combustion Chamber (Combustor)', desc: 'To burn the fuel–air mixture efficiently and release high-temperature, high-energy gas.' },
    { comp: 'turbine', xPct: 56.9, yPct: 45.9, rPct: 9, name: 'Turbine Section', desc: 'To extract energy from the high-temperature, high-pressure gases leaving the combustor to turn Compressor and the accessories Gear Box.' },
    { comp: 'exhaust', xPct: 77.9, yPct: 45.9, rPct: 9, name: 'Exhaust (Nozzle Section)', desc: 'To convert the remaining gas energy into high-speed jet thrust.' },
  ];
  var CPR_INFO = { name: 'Compressor Pressure Ratio (CPR)', desc: 'CPR = P2 ÷ P1, the ratio of compressor outlet pressure to inlet pressure. A higher CPR improves combustion efficiency, increases thrust output, reduces fuel consumption, and is a useful indicator of compressor health — keeping it in range also helps avoid compressor surge or stall.' };

  // Airflow path traced over the static image to match the actual gas
  // route visible in it: straight in through the intake, up through the
  // centrifugal compressor to its diffuser exit, down through the short
  // elbow into the turbine inlet, then rearward through the annular
  // passage around the nozzle centerbody, converging back to the shaft
  // centerline at the centerbody's tip before the exhaust. Stored as a
  // handful of waypoints (not a fixed path string) so the route can be
  // reshaped in edit mode; a smooth curve is rebuilt through them each
  // time one moves. The lower route (`LOWER_WAYPOINTS`, below) starts
  // out mirroring the upper one about the centerline (y=450), matching
  // the engine's own top/bottom symmetry, but is independently
  // editable from then on — see `LOWER_WAYPOINTS`'s own comment.
  // A dead-center click on a PARTS marker that happens to sit under a
  // waypoint handle can be shadowed by that handle in edit mode (the
  // overlay SVG sits above the marker layer so handles stay reachable);
  // dragging from an off-center point on the marker always works.
  //
  // Re-derived by eye against the 1747x900 replacement image (a
  // different render of the same general centrifugal-compressor/
  // reverse-flow-combustor layout — straight through the intake, up
  // through the compressor to its diffuser exit around the top, a
  // short elbow down into the turbine inlet, then rearward past the
  // nozzle centerbody to its tip on the shaft centerline) — approximate
  // placements, same as every waypoint set in this codebase; refine by
  // eye via edit mode if they don't trace the new artwork tightly enough.
  var UPPER_WAYPOINTS = [
    { x: 96, y: 401 }, { x: 303, y: 318 }, { x: 662, y: 276 }, { x: 777, y: 60 },
    { x: 1387, y: 58 }, { x: 1422, y: 149 }, { x: 1085, y: 102 }, { x: 849, y: 116 },
    { x: 892, y: 227 }, { x: 1214, y: 256 }, { x: 1667, y: 409 },
  ];

  // The lower route started life as a pure mirror of the upper one
  // (`mirrorPoints()`, defined below) — convenient while both halves of
  // the image were symmetric, but it meant the bottom route had no
  // handles of its own and couldn't be reshaped independently. By
  // request ("I have no control to edit the bottom half of the
  // airflow... allow me to edit the airflow at the bottom with yellow
  // boxes in numbers"), it's now its own independent array, just
  // *seeded* from the mirror of the current UPPER_WAYPOINTS at load
  // time — dragging an upper waypoint no longer moves the lower route
  // at all, and vice versa.
  var LOWER_WAYPOINTS = [
    { x: 90, y: 407 }, { x: 295, y: 507 }, { x: 670, y: 538 }, { x: 779, y: 733 },
    { x: 1442, y: 689 }, { x: 1500, y: 584 }, { x: 1244, y: 634 }, { x: 861, y: 659 },
    { x: 892, y: 594 }, { x: 1232, y: 556 }, { x: 1663, y: 411 },
  ];

  // Two independent combustor glows (pixel coordinates over the
  // 1747x900 image), one per duct — draggable in edit mode.
  var GLOWS = [
    { x: 1383, y: 125 },
    { x: 1413, y: 659 },
  ];

  var EDIT_PASSWORD = 'APP2';

  // Persist edits to this browser's localStorage so they survive a page
  // reload instead of resetting back to the defaults above — editing no
  // longer has to be redone every visit. This only affects the editor's
  // own browser: it doesn't change what other visitors to the deployed
  // site see, since there's no backend here (per CLAUDE.md) — getting an
  // edit onto the live site for everyone still means sending the "Copy
  // changes" text so it can be committed to this file.
  // Versioned (v2) because the reference image was swapped for a
  // different picture with a different layout — any positions an
  // editor's browser had saved under the old key were relative to the
  // *old* image, and would otherwise silently resurrect over the new
  // hardcoded defaults above via restoreArray() below, even though
  // they're now wrong for the picture actually on screen. Bump this
  // suffix again the next time the reference image changes.
  var STORAGE_KEY_PARTS = 'tm.vlab.parts.v2';
  var STORAGE_KEY_WAYPOINTS = 'tm.vlab.waypoints.v2';
  var STORAGE_KEY_LOWER_WAYPOINTS = 'tm.vlab.lowerWaypoints.v2';
  var STORAGE_KEY_GLOWS = 'tm.vlab.glows.v2';

  function restoreArray(key, items, requiredFields) {
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (!Array.isArray(saved) || saved.length !== items.length) return;
      for (var i = 0; i < saved.length; i++) {
        if (!saved[i]) return;
        for (var j = 0; j < requiredFields.length; j++) {
          if (typeof saved[i][requiredFields[j]] !== 'number') return;
        }
      }
      items.splice.apply(items, [0, items.length].concat(saved));
    } catch (e) { /* corrupt/blocked storage — keep defaults */ }
  }
  function persistArray(key, items) {
    try { window.localStorage.setItem(key, JSON.stringify(items)); } catch (e) { /* storage full/blocked — edits still work this session */ }
  }
  restoreArray(STORAGE_KEY_PARTS, PARTS, ['xPct', 'yPct', 'rPct']);
  restoreArray(STORAGE_KEY_WAYPOINTS, UPPER_WAYPOINTS, ['x', 'y']);
  restoreArray(STORAGE_KEY_LOWER_WAYPOINTS, LOWER_WAYPOINTS, ['x', 'y']);
  restoreArray(STORAGE_KEY_GLOWS, GLOWS, ['x', 'y']);

  function mirrorPoints(points) {
    return points.map(function (p) { return { x: p.x, y: p.y !== CENTER_Y ? 2 * CENTER_Y - p.y : p.y }; });
  }

  // Smooth curve through an arbitrary list of waypoints (uniform
  // Catmull-Rom converted to cubic Bezier) so dragging any single
  // waypoint reshapes the route without the user needing to manage
  // separate curve-control handles.
  function pathFromPoints(points) {
    if (points.length < 2) return '';
    var d = 'M' + points[0].x + ',' + points[0].y;
    for (var i = 0; i < points.length - 1; i++) {
      var p0 = points[i === 0 ? 0 : i - 1];
      var p1 = points[i];
      var p2 = points[i + 1];
      var p3 = points[i + 2 < points.length ? i + 2 : i + 1];
      var c1x = p1.x + (p2.x - p0.x) / 6;
      var c1y = p1.y + (p2.y - p0.y) / 6;
      var c2x = p2.x - (p3.x - p1.x) / 6;
      var c2y = p2.y - (p3.y - p1.y) / 6;
      d += ' C' + c1x.toFixed(1) + ',' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ',' + c2y.toFixed(1) + ' ' + p2.x + ',' + p2.y;
    }
    return d;
  }

  function interp(rpm, key) {
    if (rpm <= ANCHORS[0].rpm) return ANCHORS[0][key];
    var last = ANCHORS[ANCHORS.length - 1];
    if (rpm >= last.rpm) return last[key];
    for (var i = 0; i < ANCHORS.length - 1; i++) {
      var a = ANCHORS[i], b = ANCHORS[i + 1];
      if (rpm >= a.rpm && rpm <= b.rpm) {
        var t = (rpm - a.rpm) / (b.rpm - a.rpm);
        return a[key] + (b[key] - a[key]) * t;
      }
    }
    return last[key];
  }

  function glowMarkup(idx) {
    return '<g class="vlab-combustor-intensity" data-glow="' + idx + '">' +
      '<g class="vlab-combustor-flicker">' +
      '<ellipse class="vlab-flame" cx="-24" cy="0" rx="105" ry="90"></ellipse>' +
      '<ellipse class="vlab-flame" cx="21" cy="-15" rx="78" ry="60"></ellipse>' +
      '<ellipse class="vlab-flame" cx="27" cy="21" rx="69" ry="54"></ellipse>' +
      '</g>' +
      '</g>';
  }

  function mount(container) {
    container.innerHTML =
      '<div class="vlab">' +
      '<div class="vlab-header">' +
      '<h1>Virtual Lab on Engine Practical</h1>' +
      '<p>Push the throttle to increase engine RPM, and watch pressure, temperature, fuel flow and thrust respond across the engine in real time.</p>' +
      '</div>' +

      '<div class="vlab-edit-bar">' +
      '<button type="button" class="vlab-edit-btn" title="Edit part positions/wording, flow route and combustor glows">✎ Edit</button>' +
      '</div>' +

      '<div class="vlab-stage">' +
      '<div class="vlab-image-wrap">' +
      '<img class="vlab-image" src="tools/virtual-physical-lab/engine-diagram.png" alt="Cutaway diagram of a single-spool turbojet: intake, centrifugal compressor, combustor, turbine and exhaust, with P1/T1-P4/T4 sensor points marked.">' +

      '<svg class="vlab-overlay" viewBox="0 0 ' + IMG_W + ' ' + IMG_H + '" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">' +
      '<defs>' +
      '<linearGradient id="vlab-jet-grad" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="#ff7a3d" stop-opacity="0.95"></stop>' +
      '<stop offset="100%" stop-color="#ff7a3d" stop-opacity="0"></stop>' +
      '</linearGradient>' +
      '<radialGradient id="vlab-flame-grad" cx="35%" cy="50%" r="65%">' +
      '<stop offset="0%" stop-color="#fff3b0"></stop>' +
      '<stop offset="45%" stop-color="#ff9a3d"></stop>' +
      '<stop offset="100%" stop-color="#d1392b"></stop>' +
      '</radialGradient>' +
      '</defs>' +

      glowMarkup(0) + glowMarkup(1) +

      '<path class="vlab-flow-path-upper" fill="none" stroke="none"></path>' +
      '<path class="vlab-flow-path-lower" fill="none" stroke="none"></path>' +
      '<g class="vlab-flow"></g>' +

      '<path class="vlab-jet" d="M1190,254 L1190,352 L1290,303 Z"></path>' +

      '<g class="vlab-glow-handles"></g>' +
      '<g class="vlab-waypoint-handles"></g>' +
      '</svg>' +

      '<div class="vlab-hot-markers"></div>' +
      '</div>' +
      '</div>' +

      '<div class="vlab-edit-parts">' +
      '<p class="vlab-edit-parts-hint">Hover a marker on the diagram, or a name below, for what each part does.</p>' +
      '<ul class="vlab-edit-parts-list"></ul>' +
      '</div>' +

      '<div class="vlab-controls">' +
      '<label for="vlab-throttle">Throttle</label>' +
      '<input type="range" id="vlab-throttle" min="0" max="100" value="0" step="1">' +
      '<span class="vlab-throttle-pct">0%</span>' +
      '<div class="vlab-mode-toggle">' +
      '<button type="button" class="vlab-mode-btn active" data-mode="1">Mode 1 · PSIG / °C / lbf / Gal-hr</button>' +
      '<button type="button" class="vlab-mode-btn" data-mode="2">Mode 2 · Pa / K / N+kgf / L-hr</button>' +
      '</div>' +
      '</div>' +

      '<div class="vlab-panel">' +
      '<div class="vlab-gauge"><span class="vlab-gauge-label">RPM</span><span class="vlab-gauge-value vlab-val-rpm">0</span></div>' +
      '<div class="vlab-gauge"><span class="vlab-gauge-label">Thrust</span><span class="vlab-gauge-value vlab-val-thrust">0.0 lbf</span></div>' +

      '<div class="vlab-tile vlab-tile-1" data-comp="inlet"><span class="vlab-tile-label">T1 / P1 · Inlet</span><span class="vlab-tile-val vlab-val-tp1"></span></div>' +
      '<div class="vlab-tile vlab-tile-2" data-comp="compressor"><span class="vlab-tile-label">T2 / P2 · Compressor</span><span class="vlab-tile-val vlab-val-tp2"></span></div>' +
      '<div class="vlab-tile vlab-tile-3" data-comp="combustor"><span class="vlab-tile-label">T3 / P3 · Combustor</span><span class="vlab-tile-val vlab-val-tp3"></span></div>' +
      '<div class="vlab-tile vlab-tile-4" data-comp="exhaust"><span class="vlab-tile-label">T4 / P4 · Exhaust (EGT)</span><span class="vlab-tile-val vlab-val-tp4"></span></div>' +

      '<div class="vlab-tile"><span class="vlab-tile-label">Fuel Flow</span><span class="vlab-tile-val vlab-val-fuel"></span></div>' +
      '<div class="vlab-tile vlab-tile-cpr" data-comp="cpr"><span class="vlab-tile-label">Compressor Pressure Ratio</span><span class="vlab-tile-val">P2/P1 = <b class="vlab-val-cpr">0.0</b></span></div>' +
      '</div>' +

      '<div class="vlab-tooltip"><span class="t-title"></span><span class="t-desc"></span></div>' +

      '<div class="vlab-edit-panel" hidden>' +
      '<p>When done, copy this and send it back.</p>' +
      '<button type="button" class="vlab-edit-copy">Copy changes</button>' +
      '<textarea readonly></textarea>' +
      '</div>' +
      '</div>';

    var root = container.querySelector('.vlab');
    var svg = root.querySelector('.vlab-overlay');
    var imageWrap = root.querySelector('.vlab-image-wrap');
    var markerLayer = root.querySelector('.vlab-hot-markers');
    var editBtn = root.querySelector('.vlab-edit-btn');
    var editPartsBox = root.querySelector('.vlab-edit-parts');
    var editPartsList = root.querySelector('.vlab-edit-parts-list');
    var editPanel = root.querySelector('.vlab-edit-panel');
    var editPanelText = editPanel.querySelector('textarea');
    var editCopyBtn = editPanel.querySelector('.vlab-edit-copy');
    var waypointHandleLayer = root.querySelector('.vlab-waypoint-handles');
    var glowHandleLayer = root.querySelector('.vlab-glow-handles');

    var throttleInput = root.querySelector('#vlab-throttle');
    var throttlePctEl = root.querySelector('.vlab-throttle-pct');

    var valRpm = root.querySelector('.vlab-val-rpm');
    var valThrust = root.querySelector('.vlab-val-thrust');
    var valTp1 = root.querySelector('.vlab-val-tp1');
    var valTp2 = root.querySelector('.vlab-val-tp2');
    var valTp3 = root.querySelector('.vlab-val-tp3');
    var valTp4 = root.querySelector('.vlab-val-tp4');
    var valFuel = root.querySelector('.vlab-val-fuel');
    var valCpr = root.querySelector('.vlab-val-cpr');

    var glowEls = root.querySelectorAll('.vlab-combustor-intensity');
    var jet = root.querySelector('.vlab-jet');
    var flowGroup = root.querySelector('.vlab-flow');
    var flowPathUpper = root.querySelector('.vlab-flow-path-upper');
    var flowPathLower = root.querySelector('.vlab-flow-path-lower');

    var editUnlocked = false;
    var pathLengthUpper, pathLengthLower;

    // Tooltip (same pattern as the Fuel/Oil/Air System diagram tools)
    var tooltip = root.querySelector('.vlab-tooltip');
    var tTitle = tooltip.querySelector('.t-title');
    var tDesc = tooltip.querySelector('.t-desc');
    function showTip(evt, info) {
      if (!info) return;
      tTitle.textContent = info.name;
      tDesc.textContent = info.desc;
      tooltip.style.display = 'block';
      positionTip(evt);
    }
    function positionTip(evt) {
      if (tooltip.style.display !== 'block') return;
      // .vlab-tooltip is position: fixed (viewport-relative), so its
      // left/top must come straight from the pointer's own viewport
      // coordinates, not an offset against the panel's own bounding rect.
      var x = evt.clientX + 16;
      var y = evt.clientY + 16;
      var maxX = window.innerWidth - 280;
      if (x > maxX) x = evt.clientX - 276;
      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';
    }
    function hideTip() {
      tooltip.style.display = 'none';
    }
    root.querySelector('[data-comp="cpr"]').addEventListener('mouseenter', function (e) { showTip(e, CPR_INFO); });
    root.querySelector('[data-comp="cpr"]').addEventListener('mousemove', positionTip);
    root.querySelector('[data-comp="cpr"]').addEventListener('mouseleave', hideTip);
    root.querySelectorAll('.vlab-tile[data-comp]').forEach(function (el) {
      var comp = el.getAttribute('data-comp');
      if (comp === 'cpr') return;
      var part = PARTS.filter(function (p) { return p.comp === comp; })[0];
      el.addEventListener('mouseenter', function (e) { showTip(e, part); });
      el.addEventListener('mousemove', positionTip);
      el.addEventListener('mouseleave', hideTip);
    });

    // --- Part markers (HTML overlay, percentage-positioned like Air System).
    // Each is a big red circle (position + size both editable): position
    // is dragged from anywhere in the circle, size from its resize handle
    // (the small white-on-red dot at its edge, edit-mode only).
    function renderMarkers() {
      markerLayer.innerHTML = PARTS.map(function (p) {
        return '<span class="vlab-marker" data-comp="' + p.comp + '" style="left:' + p.xPct + '%; top:' + p.yPct + '%; width:' + p.rPct + '%;">' +
          '<span class="vlab-marker-resize"></span>' +
          '</span>';
      }).join('');
      markerLayer.querySelectorAll('.vlab-marker').forEach(function (el, i) {
        var part = PARTS[i];
        var resizeHandle = el.querySelector('.vlab-marker-resize');
        el.addEventListener('mouseenter', function (e) { if (!editUnlocked) showTip(e, part); });
        el.addEventListener('mousemove', positionTip);
        el.addEventListener('mouseleave', hideTip);
        el.addEventListener('pointerdown', function (evt) {
          if (!editUnlocked || evt.target === resizeHandle) return;
          evt.preventDefault();
          hideTip();
          el.setPointerCapture(evt.pointerId);
          el.classList.add('dragging');
          function onMove(moveEvt) {
            var rect = imageWrap.getBoundingClientRect();
            var x = Math.max(0, Math.min(100, ((moveEvt.clientX - rect.left) / rect.width) * 100));
            var y = Math.max(0, Math.min(100, ((moveEvt.clientY - rect.top) / rect.height) * 100));
            part.xPct = x; part.yPct = y;
            el.style.left = x + '%'; el.style.top = y + '%';
            updateEditPanel();
          }
          function onUp(upEvt) {
            el.classList.remove('dragging');
            el.releasePointerCapture(upEvt.pointerId);
            el.removeEventListener('pointermove', onMove);
            el.removeEventListener('pointerup', onUp);
          }
          el.addEventListener('pointermove', onMove);
          el.addEventListener('pointerup', onUp);
        });
        resizeHandle.addEventListener('pointerdown', function (evt) {
          if (!editUnlocked) return;
          evt.preventDefault();
          evt.stopPropagation();
          hideTip();
          resizeHandle.setPointerCapture(evt.pointerId);
          resizeHandle.classList.add('dragging');
          function onMove(moveEvt) {
            var rect = imageWrap.getBoundingClientRect();
            var cx = rect.left + (part.xPct / 100) * rect.width;
            var cy = rect.top + (part.yPct / 100) * rect.height;
            var dx = moveEvt.clientX - cx, dy = moveEvt.clientY - cy;
            var distPct = (Math.sqrt(dx * dx + dy * dy) / rect.width) * 100;
            part.rPct = Math.max(2, Math.min(30, distPct * 2));
            el.style.width = part.rPct + '%';
            updateEditPanel();
          }
          function onUp(upEvt) {
            resizeHandle.classList.remove('dragging');
            resizeHandle.releasePointerCapture(upEvt.pointerId);
            resizeHandle.removeEventListener('pointermove', onMove);
            resizeHandle.removeEventListener('pointerup', onUp);
          }
          resizeHandle.addEventListener('pointermove', onMove);
          resizeHandle.addEventListener('pointerup', onUp);
        });
      });
    }

    function renderEditPartsList() {
      editPartsList.innerHTML = PARTS.map(function (p) {
        return '<li class="vlab-edit-parts-item" data-comp="' + p.comp + '">' +
          '<span class="vlab-edit-parts-name" data-field="name">' + TM.escapeHtml(p.name) + '</span>' +
          '<span class="vlab-edit-parts-desc" data-field="desc">' + TM.escapeHtml(p.desc) + '</span>' +
          '</li>';
      }).join('');
      editPartsList.querySelectorAll('.vlab-edit-parts-item').forEach(function (li, i) {
        var part = PARTS[i];
        li.addEventListener('mouseenter', function (e) { if (!editUnlocked) showTip(e, part); });
        li.addEventListener('mousemove', positionTip);
        li.addEventListener('mouseleave', hideTip);
        ['name', 'desc'].forEach(function (field) {
          var el = li.querySelector('[data-field="' + field + '"]');
          el.addEventListener('input', function () { part[field] = el.textContent; updateEditPanel(); });
        });
      });
    }

    // --- SVG coordinate conversion (for dragging flow waypoints / glows) ---
    function svgPoint(evt) {
      var pt = svg.createSVGPoint();
      pt.x = evt.clientX; pt.y = evt.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    }

    function rebuildFlowPaths() {
      flowPathUpper.setAttribute('d', pathFromPoints(UPPER_WAYPOINTS));
      flowPathLower.setAttribute('d', pathFromPoints(LOWER_WAYPOINTS));
      pathLengthUpper = flowPathUpper.getTotalLength();
      pathLengthLower = flowPathLower.getTotalLength();
    }

    // Builds and wires the numbered yellow-box handles for BOTH routes
    // in one shared SVG layer, tagged `data-set="upper"/"lower"` so a
    // drag updates the right array — same per-handle in-place-attribute-
    // update technique as before (never re-render the whole layer mid-
    // drag, or the pointer-captured element gets replaced and the drag
    // silently stops after one move).
    function renderWaypointHandles() {
      function setHtml(points, set) {
        return points.map(function (p, i) {
          return '<rect class="vlab-waypoint-handle ' + set + '" data-set="' + set + '" data-i="' + i + '" x="' + (p.x - 9) + '" y="' + (p.y - 9) + '" width="18" height="18" transform="rotate(45 ' + p.x + ' ' + p.y + ')"></rect>' +
            '<text class="vlab-waypoint-label" data-set="' + set + '" data-i="' + i + '" x="' + p.x + '" y="' + p.y + '">' + (i + 1) + '</text>';
        }).join('');
      }
      waypointHandleLayer.innerHTML = setHtml(UPPER_WAYPOINTS, 'upper') + setHtml(LOWER_WAYPOINTS, 'lower');
      waypointHandleLayer.querySelectorAll('.vlab-waypoint-handle').forEach(function (el) {
        var set = el.getAttribute('data-set');
        var i = Number(el.getAttribute('data-i'));
        var points = set === 'upper' ? UPPER_WAYPOINTS : LOWER_WAYPOINTS;
        var label = waypointHandleLayer.querySelector('.vlab-waypoint-label[data-set="' + set + '"][data-i="' + i + '"]');
        el.addEventListener('pointerdown', function (evt) {
          if (!editUnlocked) return;
          evt.preventDefault();
          el.setPointerCapture(evt.pointerId);
          el.classList.add('dragging');
          function onMove(moveEvt) {
            var p = svgPoint(moveEvt);
            var x = Math.round(p.x), y = Math.round(p.y);
            points[i] = { x: x, y: y };
            label.setAttribute('x', x);
            label.setAttribute('y', y);
            // Update this handle's own attributes in place — calling
            // renderWaypointHandles() here would replace the <rect> the
            // pointer is captured on mid-drag, silently ending the drag
            // after the very first move (the classic "it won't budge"
            // symptom), since a removed element can't keep its capture.
            el.setAttribute('x', x - 9);
            el.setAttribute('y', y - 9);
            el.setAttribute('transform', 'rotate(45 ' + x + ' ' + y + ')');
            rebuildFlowPaths();
            updateEditPanel();
          }
          function onUp(upEvt) {
            el.classList.remove('dragging');
            el.releasePointerCapture(upEvt.pointerId);
            el.removeEventListener('pointermove', onMove);
            el.removeEventListener('pointerup', onUp);
          }
          el.addEventListener('pointermove', onMove);
          el.addEventListener('pointerup', onUp);
        });
      });
    }

    function renderGlowHandles() {
      glowHandleLayer.innerHTML = GLOWS.map(function (g, i) {
        return '<circle class="vlab-glow-handle" data-i="' + i + '" cx="' + g.x + '" cy="' + g.y + '" r="14"></circle>';
      }).join('');
      glowHandleLayer.querySelectorAll('.vlab-glow-handle').forEach(function (el) {
        var i = Number(el.getAttribute('data-i'));
        el.addEventListener('pointerdown', function (evt) {
          if (!editUnlocked) return;
          evt.preventDefault();
          el.setPointerCapture(evt.pointerId);
          el.classList.add('dragging');
          function onMove(moveEvt) {
            var p = svgPoint(moveEvt);
            GLOWS[i] = { x: Math.round(p.x), y: Math.round(p.y) };
            el.setAttribute('cx', GLOWS[i].x);
            el.setAttribute('cy', GLOWS[i].y);
            updateEditPanel();
          }
          function onUp(upEvt) {
            el.classList.remove('dragging');
            el.releasePointerCapture(upEvt.pointerId);
            el.removeEventListener('pointermove', onMove);
            el.removeEventListener('pointerup', onUp);
          }
          el.addEventListener('pointermove', onMove);
          el.addEventListener('pointerup', onUp);
        });
      });
    }

    function setEditMode(on) {
      editUnlocked = on;
      root.classList.toggle('vlab-edit', on);
      editPanel.hidden = !on;
      editPartsBox.querySelector('.vlab-edit-parts-hint').textContent = on ?
        'Drag the circular part markers, the diamond flow waypoints (top and bottom routes drag independently), or the square glow handles on the diagram above. Click a name/description below to retype it.' :
        'Hover a marker on the diagram, or a name below, for what each part does.';
      editPartsList.querySelectorAll('[data-field]').forEach(function (el) {
        el.contentEditable = on ? 'true' : 'false';
      });
      editBtn.textContent = on ? '✓ Editing (click to stop)' : '✎ Edit';
      editBtn.classList.toggle('active', on);
      if (on) updateEditPanel();
    }

    editBtn.addEventListener('click', function () {
      if (editUnlocked) { setEditMode(false); return; }
      var pw = window.prompt('Enter the edit password:');
      if (pw === null) return;
      if (pw === EDIT_PASSWORD) setEditMode(true);
      else window.alert('Incorrect password.');
    });

    function updateEditPanel() {
      if (!editUnlocked) return;
      var partsCode = '  var PARTS = [\n' + PARTS.map(function (p) {
        return '    { comp: ' + JSON.stringify(p.comp) + ', xPct: ' + (Math.round(p.xPct * 10) / 10) +
          ', yPct: ' + (Math.round(p.yPct * 10) / 10) + ', rPct: ' + (Math.round(p.rPct * 10) / 10) +
          ', name: ' + JSON.stringify(p.name) + ', desc: ' + JSON.stringify(p.desc) + ' },';
      }).join('\n') + '\n  ];';
      var waypointsCode = '  var UPPER_WAYPOINTS = [\n    ' +
        UPPER_WAYPOINTS.map(function (p) { return '{ x: ' + p.x + ', y: ' + p.y + ' }'; }).join(', ') +
        '\n  ];';
      var lowerWaypointsCode = '  var LOWER_WAYPOINTS = [\n    ' +
        LOWER_WAYPOINTS.map(function (p) { return '{ x: ' + p.x + ', y: ' + p.y + ' }'; }).join(', ') +
        '\n  ];';
      var glowsCode = '  var GLOWS = [\n    ' +
        GLOWS.map(function (g) { return '{ x: ' + g.x + ', y: ' + g.y + ' }'; }).join(',\n    ') +
        '\n  ];';
      editPanelText.value = partsCode + '\n\n' + waypointsCode + '\n\n' + lowerWaypointsCode + '\n\n' + glowsCode;
      persistArray(STORAGE_KEY_PARTS, PARTS);
      persistArray(STORAGE_KEY_WAYPOINTS, UPPER_WAYPOINTS);
      persistArray(STORAGE_KEY_LOWER_WAYPOINTS, LOWER_WAYPOINTS);
      persistArray(STORAGE_KEY_GLOWS, GLOWS);
    }

    editCopyBtn.addEventListener('click', function () {
      editPanelText.focus();
      editPanelText.select();
      try { document.execCommand('copy'); } catch (e) { /* selection stays, can copy manually */ }
    });

    renderMarkers();
    renderEditPartsList();
    rebuildFlowPaths();
    renderWaypointHandles();
    renderGlowHandles();

    // Airflow arrows, overlaid on the static image and travelling along the
    // actual gas route traced over it — the picture can't show literal
    // blade rotation, so motion is carried by these arrows plus the
    // combustor glows / exhaust jet instead. (pathLengthUpper/Lower were
    // already set by rebuildFlowPaths() above.)
    var TANGENT_EPS = 1.5;

    function pointAndAngle(pathEl, totalLength, dist) {
      var d = Math.max(0, Math.min(totalLength, dist));
      var p = pathEl.getPointAtLength(d);
      var d2 = Math.min(totalLength, d + TANGENT_EPS);
      var p2 = pathEl.getPointAtLength(d2);
      var angle = Math.atan2(p2.y - p.y, p2.x - p.x) * (180 / Math.PI);
      return { x: p.x, y: p.y, angle: angle };
    }

    var PARTICLE_COUNT = 24;
    var particles = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      el.setAttribute('class', 'vlab-particle');
      el.setAttribute('d', 'M -10.5,-6.75 L 9,0 L -10.5,6.75 L -4.5,0 Z');
      flowGroup.appendChild(el);
      var onUpper = i % 2 === 0;
      particles.push({
        el: el,
        onUpper: onUpper,
        dist: (i / PARTICLE_COUNT) * (onUpper ? pathLengthUpper : pathLengthLower),
      });
    }

    var targetRpm = MIN_RPM;
    var currentRpm = MIN_RPM;
    var rafId = null;
    var lastTime = null;
    var unitMode = 1;

    function updateThrottle() {
      var pct = Number(throttleInput.value);
      throttlePctEl.textContent = pct + '%';
      targetRpm = MIN_RPM + (MAX_RPM - MIN_RPM) * (pct / 100);
    }
    throttleInput.addEventListener('input', updateThrottle);

    var modeButtons = root.querySelectorAll('.vlab-mode-btn');
    modeButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        unitMode = Number(btn.getAttribute('data-mode'));
        modeButtons.forEach(function (b) { b.classList.toggle('active', b === btn); });
      });
    });

    function frame(now) {
      // Freeze the whole simulation (RPM ramp, airflow arrows, combustor
      // glow) while editing — a moving diagram makes it harder to grab
      // and drop the small waypoint/glow handles precisely.
      if (editUnlocked) {
        lastTime = now;
        rafId = requestAnimationFrame(frame);
        return;
      }

      if (lastTime == null) lastTime = now;
      var dt = Math.min(64, now - lastTime) / 16.67; // normalized to ~60fps steps
      lastTime = now;

      currentRpm += (targetRpm - currentRpm) * Math.min(1, 0.08 * dt);
      if (Math.abs(targetRpm - currentRpm) < 1) currentRpm = targetRpm;

      var frac = (currentRpm - MIN_RPM) / (MAX_RPM - MIN_RPM);

      var fuelFlow = interp(currentRpm, 'fuelFlow');
      var thrust = interp(currentRpm, 'thrust');
      var p1 = interp(currentRpm, 'p1');
      var p2 = interp(currentRpm, 'p2');
      var p3 = interp(currentRpm, 'p3');
      var p4 = interp(currentRpm, 'p4');
      var t1 = interp(currentRpm, 't1');
      var t2 = interp(currentRpm, 't2');
      var t3 = interp(currentRpm, 't3');
      var t4 = interp(currentRpm, 't4');
      var cpr = p1 > 0.0001 ? p2 / p1 : 0;

      valRpm.textContent = Math.round(currentRpm).toLocaleString();
      valThrust.textContent = fmtThrust(thrust, unitMode);
      valTp1.innerHTML = '<b>' + fmtTemp(t1, unitMode) + '</b> &nbsp;·&nbsp; <b>' + fmtPressure(p1, unitMode) + '</b>';
      valTp2.innerHTML = '<b>' + fmtTemp(t2, unitMode) + '</b> &nbsp;·&nbsp; <b>' + fmtPressure(p2, unitMode) + '</b>';
      valTp3.innerHTML = '<b>' + fmtTemp(t3, unitMode) + '</b> &nbsp;·&nbsp; <b>' + fmtPressure(p3, unitMode) + '</b>';
      valTp4.innerHTML = '<b>' + fmtTemp(t4, unitMode) + '</b> &nbsp;·&nbsp; <b>' + fmtPressure(p4, unitMode) + '</b>';
      valFuel.innerHTML = '<b>' + fmtFuel(fuelFlow, unitMode) + '</b>';
      valCpr.textContent = cpr.toFixed(1);

      // Combustor glow intensity scales with fuel flow (both ducts)
      var fuelFrac = Math.min(1, fuelFlow / 5);
      glowEls.forEach(function (gel) {
        var idx = Number(gel.getAttribute('data-glow'));
        var g = GLOWS[idx];
        gel.style.opacity = String(0.25 + fuelFrac * 0.65);
        gel.setAttribute('transform', 'translate(' + g.x + ',' + g.y + ') scale(' + (0.7 + fuelFrac * 0.5) + ')');
      });

      // Exhaust jet scales with thrust
      var thrustFrac = Math.min(1, thrust / 15);
      jet.style.opacity = String(0.15 + thrustFrac * 0.85);
      jet.style.transform = 'scaleX(' + (0.3 + thrustFrac * 1.3) + ')';

      // Airflow arrow speed scales with RPM; color shifts cool → hot →
      // exhaust by fraction travelled along the path.
      var speed = (1.5 + frac * 11) * dt;
      particles.forEach(function (p) {
        var pathEl = p.onUpper ? flowPathUpper : flowPathLower;
        var totalLength = p.onUpper ? pathLengthUpper : pathLengthLower;
        p.dist += speed;
        if (p.dist > totalLength) p.dist -= totalLength;
        var pt = pointAndAngle(pathEl, totalLength, p.dist);
        var travelFrac = p.dist / totalLength;
        var color = travelFrac < 0.35 ? '#6fb7e8' : (travelFrac < 0.72 ? '#ff8a4d' : '#ffb98a');
        p.el.setAttribute('fill', color);
        p.el.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ',' + pt.y.toFixed(1) + ') rotate(' + pt.angle.toFixed(1) + ')');
      });

      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    window.TM.toolModules['virtual-physical-lab'].unmount = function () {
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }

  window.TM.registerTool('virtual-physical-lab', { mount: mount });
})();
