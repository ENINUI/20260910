export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d');

export const gravity = 0.8;
export const groundLevel = 750;
export const mapWidth = 4000;
export const mapHeight = 800;

// === 게임 상태 ===
export const gameState = {
    currentRegion: '숲',
    monsters: [],
    projectiles: [],
    swordArcs: [],
    floatingText: [],
    monsterSpawnTimer: 0,
    monsterSpawnInterval: 5.0,
    dmgReduce: { active: false, factor: 1, until: 0 },
    showStats: false,
    boss: null
};

// === 유틸리티 함수 ===
export const nowSec = () => performance.now() / 1000;

export const rectOverlap = (a, b) => {
    const ax1 = a.x, ay1 = a.y - a.height, ax2 = a.x + a.width, ay2 = a.y;
    const bx1 = b.x, by1 = b.y - b.height, bx2 = b.x + b.width, by2 = b.y;
    return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
};

export const hitPointRect = (px, py, r) => {
    const rx1 = r.x, ry1 = r.y - r.height, rx2 = r.x + r.width, ry2 = r.y;
    return px > rx1 && px < rx2 && py > ry1 && py < ry2;
};

export function randomColor() {
    const c = ['#ff6666', '#66ff66', '#6666ff', '#ffff66', '#66ffff', '#ff66ff'];
    return c[Math.floor(Math.random() * c.length)];
}

// === 텍스트 이펙트 ===
export class FloatText {
    constructor(x, y, text, color = '#fff') {
        this.x = x; this.y = y; this.text = text; this.color = color;
        this.life = 1.2;
    }
    update(dt) { this.y -= 20 * dt; this.life -= dt; }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life / 1.2);
        ctx.fillStyle = this.color;
        ctx.font = '14px Arial'; ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}
export const floatingText = gameState.floatingText;
