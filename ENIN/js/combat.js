import { ctx, gameState, nowSec, hitPointRect } from './state.js';
import { player } from './player/player.js';

// === 투사체 클래스 ===
export class Attack {
  constructor(x, y, dx, dy, opts = {}) {
    this.x = x; this.y = y;
    this.dx = dx; this.dy = dy;
    this.speed = opts.speed ?? 12;
    this.life = opts.life ?? 1.2;
    this.radius = opts.radius ?? 8;
    this.damage = opts.damage ?? 6;
    this.color = opts.color ?? 'yellow';
    this.pierce = opts.pierce ?? 0;
  }
  update(dt) { this.x += this.dx * this.speed; this.y += this.dy * this.speed; this.life -= dt; }
  draw(ctx) { ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); }
}

// === 근접 베기 클래스 ===
export class SwordArc {
  constructor(x, y, ang, arcRad, range, color, thin = false) {
    this.x = x; this.y = y; this.ang = ang;
    this.arc = arcRad; this.range = range; this.color = color;
    this.thin = thin; this.life = 0.2;
  }
  update(dt) { this.life -= dt; }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.ang);
    ctx.globalAlpha = Math.max(0, this.life / 0.2) * 0.7;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.thin ? 6 : 12;
    ctx.beginPath(); ctx.arc(0, 0, this.range, -this.arc / 2, this.arc / 2); ctx.stroke();
    ctx.restore();
  }
}

// === 전투 함수 ===
// player 객체는 함수가 실행될 때 참조되므로 순환 참조 문제 없이 작동합니다.
export const rollCrit = (base) => Math.random() < player.critChance ? Math.floor(base * player.critMult) : base;

export const shoot = (ctxObj, opts) => gameState.projectiles.push(new Attack(ctxObj.px, ctxObj.py, ctxObj.dx, ctxObj.dy, opts));

export function shootSpread(ctxObj, count, spread, dmg, color) {
  for (let i = 0; i < count; i++) {
    const off = (i - (count - 1) / 2) * spread;
    const dx = Math.cos(ctxObj.ang + off), dy = Math.sin(ctxObj.ang + off);
    gameState.projectiles.push(new Attack(ctxObj.px, ctxObj.py, dx, dy, { damage: dmg, color, speed: 12 }));
  }
}

export function radialBlast(x, y, count, dmg, color) {
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2 + Math.random() * 0.15;
    const dx = Math.cos(ang), dy = Math.sin(ang);
    gameState.projectiles.push(new Attack(x, y, dx, dy, { damage: dmg, color, speed: 11, radius: 7 }));
  }
}

export function meleeSwing(ctxObj, { range = 120, arcRad = Math.PI / 2.5, dmg = player.damage, color = '#fff', thin = false } = {}) {
  gameState.swordArcs.push(new SwordArc(ctxObj.px, ctxObj.py, ctxObj.ang, arcRad, range, color, thin));
  const hitFn = (t) => {
    const cx = t.x + t.width / 2, cy = t.y - t.height / 2;
    const dx = cx - ctxObj.px, dy = cy - ctxObj.py;
    const dist = Math.hypot(dx, dy);
    if (dist > range) return false;
    const angTo = Math.atan2(dy, dx);
    const diff = Math.atan2(Math.sin(angTo - ctxObj.ang), Math.cos(angTo - ctxObj.ang));
    return Math.abs(diff) <= arcRad / 2;
  };

  // 피격 판정
  for (const m of gameState.monsters) if (hitFn(m)) m.takeDamage(dmg);
  if (gameState.boss && hitFn(gameState.boss)) gameState.boss.takeDamage(dmg);
}

export function tempDamageReduce(duration, factor) {
  gameState.dmgReduce.active = true;
  gameState.dmgReduce.factor = factor;
  gameState.dmgReduce.until = nowSec() + duration;
}

export function smallHeal(h = 1) {
  player.takeHeartDamage(-h); // 음수 데미지 = 힐
}

// === 투사체 업데이트 로직 ===
export function updateProjectiles(dt) {
    for (const p of gameState.projectiles) {
        p.update(dt);
        for (const m of gameState.monsters) {
            if (!m.dead && hitPointRect(p.x, p.y, m) && p.life > 0) {
                m.takeDamage(p.damage);
                if (p.pierce > 0) p.pierce--; else p.life = 0;
            }
        }
        if (gameState.boss && hitPointRect(p.x, p.y, gameState.boss)) {
            gameState.boss.takeDamage(p.damage);
            if (p.pierce > 0) p.pierce--; else p.life = 0;
        }
    }
}