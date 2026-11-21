// Drawing only: the world's state and the current screen in, pixels out. The 1280x720
// playfield is scaled to fit the window and centred, the margin filled with the backdrop
// colour. The harbour scene is drawn twice, once per panel, from one painter that takes
// the panel variant (0 left, 1 right) and applies the 8 differences. Flat shapes and
// canvas text; text that holds a number is rebuilt only when the number changes.
import { DIFFERENCES, FIELD, FONT, FOOTER, GAME, HEADER, PALETTE, PANEL } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

/** The hint button's rectangle, in field coordinates (also used for hit-testing). */
export const HINT_BUTTON = { x: 24, y: FOOTER.topY + 18, width: 190, height: 52 };

const PANEL_RADIUS = 14;

function cachedLabel(prefix) {
  let value = -1;
  let text = '';
  return function label(next) {
    if (next !== value) {
      value = next;
      text = prefix + next;
    }
    return text;
  };
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const foundLabel = cachedLabel('Found ');
  const timeLabel = cachedLabel('');
  const scoreLabel = cachedLabel('Score ');
  const bestLabel = cachedLabel('Best ');

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  /** Client pixels to field coordinates. */
  function toField(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - view.x / (window.devicePixelRatio || 1)) / (view.scale / (window.devicePixelRatio || 1)),
      y: (clientY - rect.top - view.y / (window.devicePixelRatio || 1)) / (view.scale / (window.devicePixelRatio || 1)),
    };
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align, weight) {
    const key = `${size}/${weight ?? ''}`;
    if (!fonts.has(key)) fonts.set(key, `${weight ? `${weight} ` : ''}${size}px ${FONT}`);
    context.font = fonts.get(key);
    context.fillStyle = color;
    context.textAlign = align ?? 'left';
    context.textBaseline = 'alphabetic';
    context.fillText(value, x, y);
  }

  function roundRect(x, y, w, h, r) {
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r);
    context.arcTo(x, y + h, x, y, r);
    context.arcTo(x, y, x + w, y, r);
    context.closePath();
  }

  function circle(x, y, r) {
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2);
  }

  function ellipse(x, y, rx, ry) {
    context.beginPath();
    context.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  }

  // ---- the harbour scene, painted once per panel ---------------------------

  function drawCloud(x, y, s) {
    context.fillStyle = PALETTE.cloud;
    ellipse(x, y, 34 * s, 16 * s);
    context.fill();
    ellipse(x - 22 * s, y + 5 * s, 22 * s, 12 * s);
    context.fill();
    ellipse(x + 24 * s, y + 5 * s, 24 * s, 13 * s);
    context.fill();
  }

  function drawBird(x, y, s) {
    context.strokeStyle = '#3a2e2a';
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(x - 12 * s, y);
    context.quadraticCurveTo(x - 5 * s, y - 9 * s, x, y);
    context.quadraticCurveTo(x + 5 * s, y - 9 * s, x + 12 * s, y);
    context.stroke();
  }

  function drawSun(variant) {
    // Rays.
    context.strokeStyle = PALETTE.sunCore;
    context.lineWidth = 5;
    context.lineCap = 'round';
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2;
      const x1 = 490 + Math.cos(a) * 50;
      const y1 = 70 + Math.sin(a) * 50;
      const x2 = 490 + Math.cos(a) * 62;
      const y2 = 70 + Math.sin(a) * 62;
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.stroke();
    }
    context.fillStyle = PALETTE.sun;
    circle(490, 70, 40);
    context.fill();
    context.fillStyle = PALETTE.sunCore;
    circle(490, 70, 32);
    context.fill();
    if (variant === 0) {
      // Sunglasses: two dark lenses and a bridge.
      context.fillStyle = '#20242e';
      roundRect(466, 58, 20, 14, 6);
      context.fill();
      roundRect(494, 58, 20, 14, 6);
      context.fill();
      context.fillRect(486, 63, 8, 4);
      context.strokeStyle = '#20242e';
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(466, 64);
      context.lineTo(456, 58);
      context.moveTo(514, 64);
      context.lineTo(524, 58);
      context.stroke();
      // A smile under the glasses.
      context.strokeStyle = '#8a6d1f';
      context.lineWidth = 3;
      context.beginPath();
      context.arc(490, 82, 10, 0.15 * Math.PI, 0.85 * Math.PI);
      context.stroke();
    } else {
      // A plain happy face.
      context.fillStyle = '#8a6d1f';
      circle(478, 64, 3);
      context.fill();
      circle(502, 64, 3);
      context.fill();
      context.strokeStyle = '#8a6d1f';
      context.lineWidth = 3;
      context.beginPath();
      context.arc(490, 76, 12, 0.15 * Math.PI, 0.85 * Math.PI);
      context.stroke();
    }
  }

  function drawLighthouse(variant) {
    // Tower: white with red bands; the middle band is missing on the right panel.
    context.fillStyle = '#f7f3ea';
    context.fillRect(60, 150, 50, 250);
    context.fillStyle = '#d23c33';
    context.fillRect(60, 196, 50, 26);
    if (variant === 0) context.fillRect(60, 258, 50, 26);
    context.fillRect(60, 320, 50, 26);
    // Gallery and light room.
    context.fillStyle = '#3a3f4a';
    context.fillRect(54, 138, 62, 14);
    context.fillStyle = '#ffe9a3';
    context.fillRect(66, 112, 38, 26);
    context.fillStyle = '#3a3f4a';
    context.beginPath();
    context.moveTo(60, 112);
    context.lineTo(85, 92);
    context.lineTo(110, 112);
    context.closePath();
    context.fill();
    // Door.
    context.fillStyle = '#5b4636';
    roundRect(76, 362, 18, 38, 6);
    context.fill();
    // Light beam.
    context.fillStyle = 'rgba(255, 233, 163, 0.25)';
    context.beginPath();
    context.moveTo(104, 125);
    context.lineTo(200, 100);
    context.lineTo(200, 150);
    context.closePath();
    context.fill();
  }

  function drawSailboat(variant) {
    // Hull.
    context.fillStyle = '#7a4a2b';
    context.beginPath();
    context.moveTo(268, 348);
    context.lineTo(336, 348);
    context.lineTo(322, 372);
    context.lineTo(282, 372);
    context.closePath();
    context.fill();
    // Mast.
    context.fillStyle = '#5b4636';
    context.fillRect(298, 252, 5, 98);
    // Sail: red on the left panel, teal on the right.
    context.fillStyle = variant === 0 ? '#d23c33' : '#1f8a8a';
    context.beginPath();
    context.moveTo(303, 256);
    context.lineTo(303, 344);
    context.lineTo(344, 344);
    context.closePath();
    context.fill();
    context.fillStyle = 'rgba(255,255,255,0.35)';
    context.beginPath();
    context.moveTo(303, 256);
    context.lineTo(303, 344);
    context.lineTo(322, 344);
    context.closePath();
    context.fill();
    // Wake.
    context.strokeStyle = 'rgba(255,255,255,0.55)';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(262, 380);
    context.quadraticCurveTo(300, 388, 342, 380);
    context.stroke();
  }

  function drawPier(variant) {
    // Wooden pier reaching into the sea, with a flag on its end.
    context.fillStyle = '#8a6d4b';
    context.fillRect(228, 330, 66, 12);
    context.fillStyle = '#6e5439';
    context.fillRect(236, 342, 8, 40);
    context.fillRect(278, 342, 8, 40);
    // Flag pole and flag: red on the left, yellow on the right.
    context.fillStyle = '#5b4636';
    context.fillRect(270, 280, 4, 52);
    context.fillStyle = variant === 0 ? '#d23c33' : '#f2c94c';
    context.beginPath();
    context.moveTo(274, 282);
    context.lineTo(302, 291);
    context.lineTo(274, 300);
    context.closePath();
    context.fill();
  }

  function drawPalm(variant) {
    // Leaning trunk.
    context.strokeStyle = '#8a6d4b';
    context.lineWidth = 12;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(524, 404);
    context.quadraticCurveTo(516, 340, 500, 282);
    context.stroke();
    // Fronds.
    context.strokeStyle = '#2f7d4f';
    context.lineWidth = 7;
    const fronds = [
      [500, 282, 448, 246],
      [500, 282, 470, 232],
      [500, 282, 512, 228],
      [500, 282, 548, 246],
      [500, 282, 556, 272],
    ];
    for (const [x0, y0, x1, y1] of fronds) {
      context.beginPath();
      context.moveTo(x0, y0);
      context.quadraticCurveTo((x0 + x1) / 2, y1 - 14, x1, y1);
      context.stroke();
    }
    // Coconuts: four on the left panel, three on the right.
    context.fillStyle = '#6e5439';
    const nuts = variant === 0
      ? [[492, 292], [504, 296], [498, 304], [510, 288]]
      : [[492, 292], [504, 296], [498, 304]];
    for (const [x, y] of nuts) {
      circle(x, y, 7);
      context.fill();
    }
  }

  function drawBeachBall(variant) {
    if (variant !== 0) return;
    circle(140, 460, 22);
    context.fillStyle = '#f2f5fa';
    context.fill();
    context.save();
    context.beginPath();
    context.arc(140, 460, 22, 0, Math.PI * 2);
    context.clip();
    context.fillStyle = '#d23c33';
    context.beginPath();
    context.moveTo(140, 460);
    context.lineTo(118, 442);
    context.lineTo(162, 442);
    context.closePath();
    context.fill();
    context.fillStyle = '#2e7f9e';
    context.beginPath();
    context.moveTo(140, 460);
    context.lineTo(162, 442);
    context.lineTo(162, 478);
    context.closePath();
    context.fill();
    context.fillStyle = '#f2c94c';
    context.beginPath();
    context.moveTo(140, 460);
    context.lineTo(118, 478);
    context.lineTo(162, 478);
    context.closePath();
    context.fill();
    context.restore();
    context.strokeStyle = '#c9a86a';
    context.lineWidth = 2;
    circle(140, 460, 22);
    context.stroke();
  }

  function drawCrab(variant) {
    if (variant !== 0) return;
    // Body, claws and legs, scuttling on the sand.
    context.fillStyle = '#d2543a';
    ellipse(410, 470, 16, 11);
    context.fill();
    circle(396, 458, 7);
    context.fill();
    circle(424, 458, 7);
    context.fill();
    context.strokeStyle = '#d2543a';
    context.lineWidth = 3;
    context.lineCap = 'round';
    for (const dx of [-12, -4, 4, 12]) {
      context.beginPath();
      context.moveTo(410 + dx, 478);
      context.lineTo(410 + dx + (dx < 0 ? -6 : 6), 486);
      context.stroke();
    }
    // Eyes on stalks.
    context.beginPath();
    context.moveTo(404, 460);
    context.lineTo(402, 452);
    context.moveTo(416, 460);
    context.lineTo(418, 452);
    context.stroke();
    context.fillStyle = '#20242e';
    circle(402, 450, 2.5);
    context.fill();
    circle(418, 450, 2.5);
    context.fill();
  }

  function drawScene(variant) {
    // Sky.
    const sky = context.createLinearGradient(0, 0, 0, 300);
    sky.addColorStop(0, PALETTE.skyTop);
    sky.addColorStop(0.55, PALETTE.skyMid);
    sky.addColorStop(1, PALETTE.skyBottom);
    context.fillStyle = sky;
    context.fillRect(0, 0, PANEL.width, 300);
    // Sea.
    const sea = context.createLinearGradient(0, 300, 0, 400);
    sea.addColorStop(0, PALETTE.sea);
    sea.addColorStop(1, PALETTE.seaDeep);
    context.fillStyle = sea;
    context.fillRect(0, 300, PANEL.width, 100);
    // Sunlit path on the water.
    context.fillStyle = 'rgba(255, 233, 163, 0.35)';
    context.beginPath();
    context.moveTo(460, 300);
    context.lineTo(520, 300);
    context.lineTo(540, 400);
    context.lineTo(440, 400);
    context.closePath();
    context.fill();
    // Beach.
    context.fillStyle = PALETTE.sand;
    context.fillRect(0, 400, PANEL.width, 120);
    context.fillStyle = PALETTE.sandDark;
    for (let i = 0; i < 26; i += 1) {
      const x = (i * 97) % PANEL.width;
      const y = 412 + ((i * 53) % 96);
      circle(x, y, 2);
      context.fill();
    }
    drawCloud(120, 60, 1);
    drawCloud(300, 40, 0.8);
    drawCloud(420, 110, 0.7);
    drawBird(100, 80, 1);
    if (variant === 0) drawBird(160, 110, 1);
    drawBird(230, 70, 0.9);
    drawSun(variant);
    // Waves.
    context.strokeStyle = 'rgba(255,255,255,0.5)';
    context.lineWidth = 3;
    for (const wy of [318, 348, 378]) {
      context.beginPath();
      for (let x = 0; x <= PANEL.width; x += 24) {
        const y = wy + Math.sin(x / 34 + wy) * 3;
        if (x === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    }
    drawLighthouse(variant);
    drawPier(variant);
    drawSailboat(variant);
    drawPalm(variant);
    // A starfish, the same on both sides.
    context.fillStyle = '#e8836b';
    context.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? 14 : 6;
      const x = 250 + Math.cos(a) * r;
      const y = 486 + Math.sin(a) * r;
      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.fill();
    // Rocks.
    context.fillStyle = PALETTE.rock;
    ellipse(56, 500, 26, 12);
    context.fill();
    ellipse(566, 492, 20, 10);
    context.fill();
    drawBeachBall(variant);
    drawCrab(variant);
  }

  // ---- panels, markers, HUD ------------------------------------------------

  function drawPanel(originX, variant, state) {
    context.save();
    roundRect(originX, PANEL.topY, PANEL.width, PANEL.height, PANEL_RADIUS);
    context.clip();
    context.translate(originX, PANEL.topY);
    drawScene(variant);
    context.restore();
    // Frame.
    context.strokeStyle = PALETTE.panelFrame;
    context.lineWidth = 4;
    roundRect(originX, PANEL.topY, PANEL.width, PANEL.height, PANEL_RADIUS);
    context.stroke();
    // Markers on the differences already found, on both panels alike.
    for (let index = 0; index < DIFFERENCES.length; index += 1) {
      if (!state.found[index]) continue;
      const d = DIFFERENCES[index];
      const cx = originX + d.x;
      const cy = PANEL.topY + d.y;
      context.strokeStyle = PALETTE.good;
      context.lineWidth = 5;
      circle(cx, cy, d.r);
      context.stroke();
      context.fillStyle = PALETTE.good;
      context.beginPath();
      context.moveTo(cx - 12, cy);
      context.lineTo(cx - 3, cy + 10);
      context.lineTo(cx + 14, cy - 10);
      context.lineWidth = 5;
      context.stroke();
    }
    // The hint ring, pulsing on the panel it points at.
    if (state.hintFlash.active) {
      const d = DIFFERENCES[state.hintTarget];
      if (d) {
        const pulse = 1 + 0.12 * Math.sin(state.elapsed * 8);
        context.strokeStyle = PALETTE.accent;
        context.lineWidth = 5;
        context.setLineDash([10, 8]);
        circle(originX + d.x, PANEL.topY + d.y, d.r * pulse + 6);
        context.stroke();
        context.setLineDash([]);
      }
    }
    // The miss X.
    if (state.missFlash.active && state.missFlash.panel === (originX === PANEL.leftX ? 0 : 1)) {
      const mx = originX + state.missFlash.x;
      const my = PANEL.topY + state.missFlash.y;
      context.strokeStyle = PALETTE.danger;
      context.lineWidth = 5;
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(mx - 12, my - 12);
      context.lineTo(mx + 12, my + 12);
      context.moveTo(mx + 12, my - 12);
      context.lineTo(mx - 12, my + 12);
      context.stroke();
    }
  }

  function drawHeader(state) {
    context.fillStyle = PALETTE.header;
    context.fillRect(0, 0, FIELD.width, HEADER.height);
    text('🏖️ Harbour Spotter', 24, 42, 30, PALETTE.text, 'left', 700);
    const remaining = DIFFERENCES.length - state.foundCount;
    text(foundLabel(state.foundCount) + ` / ${DIFFERENCES.length}`, 640, 34, 26, PALETTE.text, 'center', 700);
    text(`${remaining} left`, 640, 58, 16, remaining === 0 ? PALETTE.good : PALETTE.accent, 'center', 700);
    const minutes = Math.floor(state.timeLeft / 60);
    const seconds = Math.floor(state.timeLeft % 60);
    const timeText = `${minutes}:${String(seconds).padStart(2, '0')}`;
    text(timeLabel(timeText), 1000, 42, 30, state.timeLeft <= 30 ? PALETTE.danger : PALETTE.text, 'center', 700);
    text(scoreLabel(state.score), 1256, 42, 30, PALETTE.accent, 'right', 700);
  }

  function drawFooter(state, best) {
    context.fillStyle = PALETTE.header;
    context.fillRect(0, FOOTER.topY, FIELD.width, FOOTER.height);
    // Hint button.
    const enabled = state.hintsLeft > 0 && !state.over;
    context.fillStyle = enabled ? PALETTE.accent : '#3a4358';
    roundRect(HINT_BUTTON.x, HINT_BUTTON.y, HINT_BUTTON.width, HINT_BUTTON.height, 12);
    context.fill();
    text(`💡 Hint (${state.hintsLeft})`, HINT_BUTTON.x + 95, HINT_BUTTON.y + 34, 22, enabled ? '#20242e' : PALETTE.muted, 'center', 700);
    text('Click a difference in either picture  •  Arrow keys move the crosshair, Enter clicks', 240, FOOTER.topY + 32, 20, PALETTE.muted, 'left');
    text('H hint (−25 pts)  •  P pause  •  R restart', 240, FOOTER.topY + 62, 20, PALETTE.muted, 'left');
    text(bestLabel(best), 1256, FOOTER.topY + 32, 20, PALETTE.muted, 'right');
  }

  function drawCrosshair(state) {
    const { x, y } = state.cursor;
    context.strokeStyle = '#ffffff';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x - 14, y);
    context.lineTo(x - 5, y);
    context.moveTo(x + 5, y);
    context.lineTo(x + 14, y);
    context.moveTo(x, y - 14);
    context.lineTo(x, y - 5);
    context.moveTo(x, y + 5);
    context.lineTo(x, y + 14);
    context.stroke();
    context.strokeStyle = 'rgba(0,0,0,0.6)';
    context.lineWidth = 1;
    circle(x, y, 4);
    context.stroke();
  }

  function drawOverlay(title, lines, accent) {
    context.fillStyle = 'rgba(10, 14, 24, 0.72)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = '#20283a';
    roundRect(340, 150, 600, 420, 20);
    context.fill();
    context.strokeStyle = accent;
    context.lineWidth = 3;
    roundRect(340, 150, 600, 420, 20);
    context.stroke();
    text(title, 640, 230, 44, PALETTE.text, 'center', 800);
    let y = 300;
    for (const line of lines) {
      text(line, 640, y, 22, PALETTE.muted, 'center');
      y += 38;
    }
  }

  function draw(state, screen, best, pointer) {
    resize();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawHeader(state);
    drawPanel(PANEL.leftX, 0, state);
    drawPanel(PANEL.rightX, 1, state);
    // A soft ring follows the mouse over a panel, so clicks land where aimed.
    if (pointer && screen === SCREEN_PLAY) {
      const inPanel =
        (pointer.x >= PANEL.leftX && pointer.x <= PANEL.leftX + PANEL.width) ||
        (pointer.x >= PANEL.rightX && pointer.x <= PANEL.rightX + PANEL.width);
      if (inPanel && pointer.y >= PANEL.topY && pointer.y <= PANEL.topY + PANEL.height) {
        context.strokeStyle = 'rgba(255,255,255,0.65)';
        context.lineWidth = 2;
        context.setLineDash([6, 6]);
        circle(pointer.x, pointer.y, 18);
        context.stroke();
        context.setLineDash([]);
      }
    }
    if (screen === SCREEN_PLAY) drawCrosshair(state);
    drawFooter(state, best);
    if (screen === SCREEN_TITLE) {
      drawOverlay('🏖️ Harbour Spotter', [
        'Two pictures of the same sunny harbour — but 8 things differ.',
        'Click a difference in either picture to circle it.',
        'Find all 8 before the 3-minute timer runs out.',
        'Hints cost 25 points. Wrong clicks cost 10.',
        '',
        'Press Space or click to start',
      ], PALETTE.accent);
      text(bestLabel(best), 640, 540, 20, PALETTE.muted, 'center');
    } else if (screen === SCREEN_PAUSED) {
      drawOverlay('Paused', ['Take a breath — the timer is waiting.', '', 'Press P or click to keep playing'], PALETTE.muted);
    } else if (screen === SCREEN_OVER) {
      if (state.won) {
        drawOverlay('🎉 You found them all!', [
          `All 8 differences, with ${Math.ceil(state.timeLeft)} seconds to spare.`,
          `Score ${state.score}   •   Best ${best}`,
          `Hints used: ${state.hintsUsed}   •   Misses: ${state.misses}`,
          '',
          'Press R or click to play again',
        ], PALETTE.good);
      } else {
        drawOverlay("⏰ Time's up!", [
          `You found ${state.foundCount} of 8 differences.`,
          `Score ${state.score}   •   Best ${best}`,
          '',
          'Press R or click to try again',
        ], PALETTE.danger);
      }
    }
  }

  return { draw, toField, resize };
}
