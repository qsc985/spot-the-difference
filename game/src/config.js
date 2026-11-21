// Every tuning number, colour and difference in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below depends
// on the screen size. Two panels sit side by side, each 592x520, showing the same sunny
// harbour scene with 8 differences between them.

export const FIELD = { width: 1280, height: 720 };

export const PANEL = { width: 592, height: 520, leftX: 24, rightX: 664, topY: 80 };

export const HEADER = { height: 64 };

export const FOOTER = { topY: 616, height: 88 };

export const GAME = {
  totalDifferences: 8,
  timeLimitSeconds: 180,
  pointsPerFind: 100,
  pointsPerMiss: -10,
  hintCost: 25,
  maxHints: 3,
  /** Pixels of slack around a difference's circle when a click lands. */
  clickSlack: 10,
};

export const PALETTE = {
  backdrop: '#141a26',
  header: '#1c2436',
  panelFrame: '#2e3a52',
  panelFrameFound: '#3f7d4e',
  text: '#f2f5fa',
  muted: '#9aa5b8',
  accent: '#ffc53d',
  accentDark: '#e0a100',
  danger: '#e5534b',
  good: '#4cc38a',
  skyTop: '#ffd9a0',
  skyMid: '#ffb38a',
  skyBottom: '#ff8f7a',
  sea: '#2e7f9e',
  seaDeep: '#22617e',
  sand: '#f0d9a0',
  sandDark: '#ddc184',
  sun: '#fff3b0',
  sunCore: '#ffe066',
  cloud: '#fff6ea',
  rock: '#8d7d6b',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'harbour-spotter.best';

/**
 * The 8 differences, in panel-local coordinates (panel is PANEL.width x PANEL.height).
 * kind tells the scene painter what changes between the two panels:
 *  - 'sunglasses': the sun wears sunglasses on the left panel only
 *  - 'sail': the sailboat's sail is red on the left, teal on the right
 *  - 'birds': three birds on the left, two on the right
 *  - 'bands': the lighthouse has three red bands on the left, two on the right
 *  - 'ball': a beach ball sits on the sand on the left only
 *  - 'coconuts': four coconuts under the palm on the left, three on the right
 *  - 'crab': a little crab walks the sand on the left only
 *  - 'flag': the pier flag is red on the left, yellow on the right
 */
export const DIFFERENCES = [
  { id: 0, kind: 'sunglasses', name: 'Sunglasses on the sun', x: 490, y: 70, r: 44 },
  { id: 1, kind: 'sail', name: 'Sail colour', x: 300, y: 300, r: 38 },
  { id: 2, kind: 'birds', name: 'A missing bird', x: 160, y: 110, r: 26 },
  { id: 3, kind: 'bands', name: 'Lighthouse bands', x: 85, y: 265, r: 34 },
  { id: 4, kind: 'ball', name: 'Beach ball', x: 140, y: 460, r: 28 },
  { id: 5, kind: 'coconuts', name: 'Coconuts', x: 500, y: 288, r: 24 },
  { id: 6, kind: 'crab', name: 'A crab on the sand', x: 410, y: 470, r: 26 },
  { id: 7, kind: 'flag', name: 'Flag colour', x: 272, y: 292, r: 28 },
];
