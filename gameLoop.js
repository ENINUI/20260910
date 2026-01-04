import { gameState, ctx, canvas, mapWidth, mapHeight, groundLevel, isPaused } from './state.js';
import { player } from './player/player.js';
import { keys, getViewScale } from './input.js';
import { updateCamera, drawRegionInfo, camera } from './rendering/draw.js';
import { spawnEntity } from './enemy/monster.js';
import { updateProjectiles } from './combat.js';

let lastTime = performance.now();

export function gameLoop(now = 0) {
    const deltaMs = now - lastTime;
    let dt = Math.min(deltaMs / 1000, 0.05);
    lastTime = now;
    const viewScale = getViewScale();

    // 1. 카메라 업데이트 & 화면 초기화
    updateCamera();
    ctx.setTransform(viewScale, 0, 0, viewScale, -camera.x * viewScale, -camera.y * viewScale);
    ctx.clearRect(camera.x, camera.y, camera.width, camera.height);

    // 2. 배경 그리기
    ctx.fillStyle = '#333';
    ctx.fillRect(0, groundLevel + 1, mapWidth, mapHeight - groundLevel);

    if (!isPaused) {
        player.applyPassives();
        player.move(keys);
        player.updateAnim(dt, keys);
        
        // 몬스터 스폰 타이머
        gameState.monsterSpawnTimer += dt;
        if (gameState.monsterSpawnTimer > 5) {
             // spawnEntity('slime', camera.x + 800, groundLevel); // 필요 시 주석 해제
             gameState.monsterSpawnTimer = 0;
        }

        for (const m of gameState.monsters) m.update(dt);
        updateProjectiles(dt);
        
        // 텍스트 업데이트
        gameState.floatingText = gameState.floatingText.filter(t => t.life > 0);
        for (const t of gameState.floatingText) t.update(dt);
    }

    // 3. 그리기 (Render)
    player.draw(ctx);
    if (gameState.boss) gameState.boss.draw(ctx);
    for (const m of gameState.monsters) m.draw(ctx);
    for (const p of gameState.projectiles) p.draw(ctx);
    for (const a of gameState.swordArcs) a.draw(ctx);
    for (const t of gameState.floatingText) t.draw(ctx);

    // ★ 추가된 부분: 지역 배너 그리기 함수 호출
    // 화면 좌표계를 사용하기 위해 transform 초기화 후 그리기
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // UI는 카메라 영향을 받지 않도록 초기화
    drawRegionInfo(dt);
    ctx.restore();

    requestAnimationFrame(gameLoop);
}