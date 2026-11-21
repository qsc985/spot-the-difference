// The screenshot scenes behind ?shot=start|play|play2|end. Each one sets the world to
// a fixed state by playing the real rules: the play scenes click real differences, the
// end scene finds them all, so every frame is what a short game really looks like and
// the same seed always gives the same frame. The play shots keep several differences
// unfound and the counter visible, as the bounty asks.
import { DIFFERENCES, PANEL } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/** Click a difference by its index, at its centre on the left panel. */
function find(world, index) {
  const d = DIFFERENCES[index];
  world.click(PANEL.leftX + d.x, PANEL.topY + d.y);
}

export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    find(world, 0);
    find(world, 1);
    find(world, 3);
    world.state.timeLeft = 122;
    world.state.elapsed = 58;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'play2') {
    find(world, 0);
    find(world, 1);
    find(world, 3);
    find(world, 4);
    find(world, 6);
    world.useHint();
    world.state.timeLeft = 74;
    world.state.elapsed = 106;
    // Keep the hint ring on for the shot.
    world.state.hintFlash.until = world.state.elapsed + 2.5;
    return { screen: SCREEN_PLAY, best: 300 };
  }
  if (name === 'end') {
    for (let index = 0; index < DIFFERENCES.length; index += 1) find(world, index);
    world.state.timeLeft = 41;
    world.state.elapsed = 139;
    return { screen: SCREEN_OVER, best: 900 };
  }
  return { screen: SCREEN_TITLE, best: 300 };
}
