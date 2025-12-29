import { canvas, mapWidth, mapHeight } from '../state.js';
import { player } from '../player/player.js';

export let camera = {
  x: 0, y: 0, width: canvas.width, height: canvas.height,
  lerpSpeed: 0.1, lookDir: 1, dirSmooth: 0.05
};

export function updateCamera() {
  camera.lookDir += (player.facing - camera.lookDir) * camera.dirSmooth;
  const offsetAhead = 150;
  const aheadX = player.x + camera.lookDir * offsetAhead;
  const targetX = aheadX - camera.width / 2 + player.width / 2;
  
  camera.x += (targetX - camera.x) * camera.lerpSpeed;
  camera.x = Math.max(0, Math.min(camera.x, mapWidth - camera.width));
}

