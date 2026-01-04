import { canvas, ctx, mapWidth, gameState } from '../state.js'; // ★ ctx, gameState 추가
import { player } from '../player/player.js';
import { regionColors } from '../map/map.js'; // ★ regionColors 추가

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

// === 지역 배너 그리기 (누락되었던 부분) ===
let regionAlpha = 0;
let regionVisible = true;
let regionTimer = 0;
let regionPhase = 'fadeIn';

export function drawRegionInfo(dt) {
  // 페이드 인/아웃 로직
  if (regionPhase === 'fadeIn') {
    regionAlpha += dt * 0.5;
    if (regionAlpha >= 1) { regionAlpha = 1; regionPhase = 'hold'; regionTimer = 0; }
  } else if (regionPhase === 'hold') {
    regionTimer += dt;
    if (regionTimer >= 3) regionPhase = 'fadeOut';
  } else if (regionPhase === 'fadeOut') {
    regionAlpha -= dt * 0.5;
    if (regionAlpha <= 0) { regionAlpha = 0; regionVisible = false; }
  }
  
  if (!regionVisible) return;
  
  // 그리기
  ctx.save();
  ctx.globalAlpha = regionAlpha;
  ctx.fillStyle = regionColors[gameState.currentRegion] || '#fff';
  ctx.font = '48px bold Arial'; 
  ctx.textAlign = 'center';
  // 화면 중앙 상단에 고정 표시 (카메라 좌표 영향 안 받음)
  ctx.fillText(gameState.currentRegion, canvas.width / 2, 80);
  ctx.restore();
}