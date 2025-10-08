// ======================================================
// 🎮 ENIN - 2D 횡스크롤 로그라이크 (Full Integrated, Clean & Commented)
// 기능: 상점 / 직업 / 코인 / 지역배너 / 하트 / 몬스터 / 보스 / 스킬 / 인벤토리 3탭 / 설정 / 맵확대 / 스탯 / 스킬HUD 쿨다운
// 리소스: ./Resource/Boss.jpg
// ======================================================
'use strict';

/* ------------------------------------------------------
 🧱 0) 전역 및 기본 셋업
------------------------------------------------------ */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gravity = 0.8;
const groundLevel = 650;
const moveSpeedBase = 5;
const jumpPower = -12;

let isPaused = false;   // 패널(상점/인벤/설정) 열릴 때 true
let viewScale = 1;      // M 키로 1 ↔ 1.25 줌 토글

const nowSec = () => performance.now() / 1000;
const setPaused = (v) => { isPaused = v; };

/* ------------------------------------------------------
 🌍 1) 지역 & 직업 데이터
------------------------------------------------------ */
const regions = ['숲', '정글', '설원', '제국', '화산', '사막'];
const specialRegion = '황혼';
const regionColors = {
  '숲': '#32CD32', '정글': '#1E8C3A', '설원': '#ADD8E6',
  '제국': '#FFD700', '화산': '#FF4500', '사막': '#DAA520', '황혼': '#9400D3'
};
function chooseRegion() {
  const r = Math.random() * 100;
  return r < 1 ? specialRegion : regions[Math.floor(Math.random() * regions.length)];
}

/** 직업 정의 */
const JOBS = {
  adventurer: { // 기본 직업: 근접 베기
    id: 'adventurer', name: '모험가', desc: '근접 베기',
    passive(p) { /* 없음 */ },
    basic(ctxObj) { meleeSwing(ctxObj, { range: 130, arcRad: Math.PI / 2.2, dmg: rollCrit(player.damage + 2), color: '#ffe08a' }); },
    secondary(ctxObj) { meleeSwing(ctxObj, { range: 90, arcRad: Math.PI / 3, dmg: rollCrit(player.damage + 1), color: '#ffd26a', thin: true }); },
    skills: {
      shift() { dashTowardMouse(140); },
      e(ctxObj) { meleeSwing(ctxObj, { range: 150, arcRad: Math.PI / 2, dmg: rollCrit(player.damage + 3), color: '#fff4a3' }); },
      q() { smallHeal(1); },
      ctrl(ctxObj) { radialBlast(ctxObj.px, ctxObj.py, 6, rollCrit(player.damage + 2), '#ffe28a'); },
      r(ctxObj) { radialBlast(ctxObj.px, ctxObj.py, 12, rollCrit(player.damage + 5), '#ffc04d'); }
    }
  },
  druid: { // 생존형 원거리
    id: 'druid', name: '드루이드', desc: '생존력↑',
    passive(p) { p.maxHearts = Math.min(10, p.maxHearts + 1); },
    basic(ctxObj) { shoot(ctxObj, { speed: 12, dmg: rollCrit(player.damage + 2), color: '#aaff88' }); },
    secondary(ctxObj) { radialBlast(ctxObj.px, ctxObj.py, 5, rollCrit(player.damage + 1), '#88ffbb'); },
    skills: {
      shift() { dashTowardMouse(120); },
      e(ctxObj) { shoot(ctxObj, { speed: 13, dmg: rollCrit(player.damage + 4), color: '#baff99' }); },
      q() { smallHeal(1); },
      ctrl(ctxObj) { radialBlast(ctxObj.px, ctxObj.py, 9, rollCrit(player.damage + 2), '#66ff77'); },
      r(ctxObj) { radialBlast(ctxObj.px, ctxObj.py, 14, rollCrit(player.damage + 6 * (1 + fusionBonus())), '#77ff99'); }
    }
  },
  soldier: { // 기동+사격
    id: 'soldier', name: '병사', desc: '이속/근딜↑',
    passive(p) { p.speed += 0.7; p.damage += 2; },
    basic(ctxObj) { shoot(ctxObj, { speed: 14, dmg: rollCrit(player.damage + 2), color: '#ffd26a' }); },
    secondary(ctxObj) { shootSpread(ctxObj, 3, 0.12, rollCrit(player.damage + 1), '#ffec9a'); },
    skills: {
      shift() { dashTowardMouse(160); },
      e(ctxObj) { shoot(ctxObj, { speed: 15, dmg: rollCrit(player.damage + 4), color: '#ffe28a' }); },
      q() { tempDamageReduce(2.2, 0.6); floatingText.push(new FloatText(player.x, player.y - 70, '피해감소', 'cyan')); },
      ctrl(ctxObj) { shootSpread(ctxObj, 5, 0.2, rollCrit(player.damage + 2), '#ffdd66'); },
      r(ctxObj) { radialBlast(ctxObj.px, ctxObj.py, 16, rollCrit(player.damage + 6 * (1 + fusionBonus())), '#ff944d'); }
    }
  },
  miner: { // 단단+관통
    id: 'miner', name: '광부', desc: '단단함',
    passive(p) { p.maxHearts = Math.min(10, p.maxHearts + 1); },
    basic(ctxObj) { shoot(ctxObj, { speed: 11, dmg: rollCrit(player.damage + 3), color: '#ffcc33', radius: 9, pierce: 1 }); },
    secondary(ctxObj) { radialBlast(ctxObj.px, ctxObj.py, 4, rollCrit(player.damage + 3), '#ffbb55'); },
    skills: {
      shift() { dashTowardMouse(100); },
      e(ctxObj) { shoot(ctxObj, { speed: 12, dmg: rollCrit(player.damage + 5), color: '#ffd04d', radius: 10, pierce: 1 }); },
      q() { smallHeal(1); },
      ctrl(ctxObj) { radialBlast(ctxObj.px, ctxObj.py, 8, rollCrit(player.damage + 3), '#ffaa33'); },
      r(ctxObj) { radialBlast(ctxObj.px, ctxObj.py, 12, rollCrit(player.damage + 7 * (1 + fusionBonus())), '#ffa533'); }
    }
  }
};

// 지역 → 직업 풀
const regionJobs = {
  '숲': [JOBS.druid],
  '제국': [JOBS.soldier],
  '화산': [JOBS.miner],
  '정글': [],
  '설원': [],
  '사막': [],
  '황혼': []
};

/* ------------------------------------------------------
 🖥️ 2) UI 요소 참조
------------------------------------------------------ */
const regionChip = document.getElementById('region-chip');
const coinChip   = document.getElementById('coin-chip');
const jobChip    = document.getElementById('job-chip');
const statChip   = document.getElementById('stat-chip');

const heartsEl   = document.getElementById('hearts');

const shopEl     = document.getElementById('shop');
const shopListEl = document.getElementById('shop-list');
const shopCoinEl = document.getElementById('shop-coin');

const invEl      = document.getElementById('inventory');
const weaponGrid = document.getElementById('weapon-grid');
const skillGrid  = document.getElementById('skill-grid');
const jobListEl  = document.getElementById('job-list');

const settingsEl = document.getElementById('settings');
const volSlider  = document.getElementById('vol');
const volVal     = document.getElementById('vol-val');

/* ------------------------------------------------------
 🎮 3) 게임 상태 컨테이너
------------------------------------------------------ */
const gameState = {
  currentRegion: chooseRegion(),

  monsters: [],
  projectiles: [],
  swordArcs: [],
  floatingText: [],

  monsterSpawnTimer: 0,
  monsterSpawnInterval: 2.2,

  dmgReduce: { active: false, factor: 1, until: 0 },

  showStats: false // Tab로 토글되는 스탯 오버레이
};
const fusionBonus = () => Math.max(0, jobInventory.filter(Boolean).length - 1) * 0.2;

/* ------------------------------------------------------
 🧍 4) 플레이어
------------------------------------------------------ */
class Player {
  constructor() {
    // === 기본 위치 및 스탯 ===
    this.x = 120;
    this.y = groundLevel;
    this.width = 33;
    this.height = 53;
    this.color = 'skyblue';

    this.velY = 0;
    this.jumpCount = 0;
    this.facing = 1; // 1 = 오른쪽, -1 = 왼쪽

    // === 능력치 ===
    this.maxHearts = 4;
    this.hearts = this.maxHearts;
    this.damage = 5;
    this.critChance = 0.05;
    this.critMult = 2.0;
    this.speed = moveSpeedBase;
    this.coins = 0;
    this.invuln = 0;
    this.inTown = false;

    // === 애니메이션 관련 ===
    this.animState = 'idle';  // idle / walk / jumpUp / landing
    this.animFrame = 0;
    this.animTimer = 0;
    this.frameInterval = 0.12;
    this.landingTimer = 0;    // 착지 애니메이션 지속시간 추적용
    this.wasInAir = false;    // 이전 프레임에서 공중이었는지 확인용

    // 이미지 배열
    this.idleImgs = [];
    this.walkImgs = [];
    this.jumpUpImgs = [];
    this.landingImgs = [];

    this.loadImages();
  }

  // ------------------------
  // 🖼️ 이미지 로드
  // ------------------------
  loadImages() {
    for (let i = 2; i <= 2; i++) {
      const img = new Image();
      img.src = `./Resource/Player/playerMove_${i}.jpg`;
      this.idleImgs.push(img);
    }

    for (let i = 1; i <= 4; i++) {
      const img = new Image();
      img.src = `./Resource/Player/playerMove_${i}.jpg`;
      this.walkImgs.push(img);
    }

    for (let i = 1; i <= 4; i++) {
      const img = new Image();
      img.src = `./Resource/Player/playerJump_${i}.jpg`;
      this.jumpUpImgs.push(img);
    }

    for (let i = 5; i <= 7; i++) {
      const img = new Image();
      img.src = `./Resource/Player/playerJump_${i}.jpg`;
      this.landingImgs.push(img);
    }
  }

  // ------------------------
  // 🔁 애니메이션 업데이트
  // ------------------------
  updateAnim(dt, keys) {
    // 방향 결정
    if (keys['a']) this.facing = -1;
    else if (keys['d']) this.facing = 1;

    // 착지 상태 지속 중이면 우선 처리
    if (this.animState === 'landing') {
      this.landingTimer -= dt;
      if (this.landingTimer <= 0) this.animState = 'idle';
    } else {
      // 점프 중 판정
      if (this.y < groundLevel - 1) {
        this.animState = 'jumpUp';
        this.wasInAir = true;
      } else {
        // 지면에 닿았을 때 착지 감지
        if (this.wasInAir) {
          this.animState = 'landing';
          this.animFrame = 0;
          this.landingTimer = 0.25; // 착지 애니메이션 0.25초
          this.wasInAir = false;
        } else if (keys['a'] || keys['d']) {
          this.animState = 'walk';
        } else {
          this.animState = 'idle';
        }
      }
    }

    // 프레임 전환
    this.animTimer += dt;
    if (this.animTimer >= this.frameInterval) {
      this.animTimer = 0;
      const frames = this.getCurrentAnim();
      if (frames.length > 0) this.animFrame = (this.animFrame + 1) % frames.length;
    }
  }

  // ------------------------
  // 🎞️ 상태별 이미지 배열 반환
  // ------------------------
  getCurrentAnim() {
    switch (this.animState) {
      case 'walk': return this.walkImgs;
      case 'jumpUp': return this.jumpUpImgs;
      case 'landing': return this.landingImgs;
      default: return this.idleImgs;
    }
  }

  // ------------------------
  // ❤️ 스탯 및 이동
  // ------------------------
  applyPassives() {
    this.maxHearts = 4;
    this.speed = moveSpeedBase;
    this.damage = 5;
    for (const j of jobInventory) if (j) j.passive(this);
    this.hearts = Math.min(this.hearts, this.maxHearts);
  }

  move(keys) {
    if (keys['a']) this.x -= this.speed;
    if (keys['d']) this.x += this.speed;

    if (keys[' '] && this.jumpCount < 2) {
      this.velY = jumpPower;
      this.jumpCount++;
      keys[' '] = false;
    }

    this.velY += gravity;
    this.y += this.velY;

    if (this.y > groundLevel) {
      this.y = groundLevel;
      this.velY = 0;
      this.jumpCount = 0;
    }

    this.inTown = this.x < 220;
    if (this.invuln > 0) this.invuln -= 1 / 60;
  }

  takeHeartDamage(n = 1) {
    if (n > 0 && this.invuln > 0) return;
    if (n > 0 && gameState.dmgReduce.active) n *= gameState.dmgReduce.factor;

    this.invuln = 0.6;
    this.hearts = Math.max(0, Math.min(this.maxHearts, this.hearts - n));
    updateHeartsUI();
  }

  // ------------------------
  // 🧍 렌더링 (좌우 반전 포함)
  // ------------------------
  draw() {
    const imgs = this.getCurrentAnim();
    const img = imgs[this.animFrame % imgs.length];

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.translate(this.x, this.y - this.height);

      if (this.facing === -1) {
        ctx.scale(-1, 1);
        ctx.drawImage(img, -60, 0, 60, 60);
      } else {
        ctx.drawImage(img, 0, 0, 60, 60);
      }

      ctx.restore();
    } else {
      // 로딩 중에는 기본 사각형 표시
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y - this.height, this.width, this.height);
    }
  }
}


const player = new Player();

/* ------------------------------------------------------
 🧟 5) 몬스터 / 보스
------------------------------------------------------ */
class Slime {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.width = 40; this.height = 30;
    this.maxHp = 40; this.hp = this.maxHp;
    this.speed = 1.2 + Math.random() * 0.8;
    this.dir = Math.random() < 0.5 ? -1 : 1;
    this.touchTick = 0; // 접촉 데미지 간격 제어
  }
  update(dt) {
    this.x += this.dir * this.speed;
    if (this.x < 250) { this.x = 250; this.dir *= -1; }
    if (this.x > canvas.width - 120) { this.x = canvas.width - 120; this.dir *= -1; }

    // 접촉 피해: 0.5초마다 하트 -1
    if (rectOverlap(this, player)) {
      this.touchTick += dt;
      if (this.touchTick >= 0.5) {
        player.takeHeartDamage(1);
        this.touchTick = 0;
      }
    } else {
      this.touchTick = 0;
    }
  }
  draw() {
    ctx.fillStyle = '#55ff88';
    ctx.fillRect(this.x, this.y - this.height, this.width, this.height);
    // HP바 + 수치
    ctx.fillStyle = 'crimson';
    ctx.fillRect(this.x, this.y - this.height - 8, this.width, 5);
    ctx.fillStyle = 'lime';
    ctx.fillRect(this.x, this.y - this.height - 8, (this.hp / this.maxHp) * this.width, 5);
    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial'; ctx.textAlign = 'center';
    ctx.fillText(`${Math.max(0, Math.ceil(this.hp))}/${this.maxHp}`, this.x + this.width / 2, this.y - this.height - 12);
  }
}

class DummyBoss {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.width = 150; this.height = 200;
    this.maxHp = 1000; this.hp = this.maxHp;
    this.image = new Image();
    this.image.src = './Resource/Boss.jpg';
  }
  draw() {
    if (this.image.complete && this.image.naturalWidth) {
      ctx.drawImage(this.image, this.x, this.y - this.height, this.width, this.height);
    } else {
      ctx.fillStyle = 'purple';
      ctx.fillRect(this.x, this.y - this.height, this.width, this.height);
    }
    // HP바 + 수치
    ctx.fillStyle = 'red';
    ctx.fillRect(this.x, this.y - this.height - 20, this.width, 10);
    ctx.fillStyle = 'lime';
    ctx.fillRect(this.x, this.y - this.height - 20, (this.hp / this.maxHp) * this.width, 10);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial'; ctx.textAlign = 'center';
    ctx.fillText(`HP: ${Math.floor(this.hp)}/${this.maxHp}`, this.x + this.width / 2, this.y - this.height - 30);
  }
}
const boss = new DummyBoss(1000, groundLevel + 45);

/* ------------------------------------------------------
 💥 6) 투사체 / 근접 베기 / 유틸 함수
------------------------------------------------------ */
class Attack {
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
  draw() { ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); }
}

class SwordArc {
  constructor(x, y, ang, arcRad, range, color, thin = false) {
    this.x = x; this.y = y; this.ang = ang;
    this.arc = arcRad; this.range = range; this.color = color;
    this.thin = thin; this.life = 0.2;
  }
  update(dt) { this.life -= dt; }
  draw() {
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

// 충돌/방향/치명타/스킬 공용 유틸
const rectOverlap = (a, b) => {
  const ax1 = a.x, ay1 = a.y - a.height, ax2 = a.x + a.width, ay2 = a.y;
  const bx1 = b.x, by1 = b.y - b.height, bx2 = b.x + b.width, by2 = b.y;
  return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
};
const hitPointRect = (px, py, r) => {
  const rx1 = r.x, ry1 = r.y - r.height, rx2 = r.x + r.width, ry2 = r.y;
  return px > rx1 && px < rx2 && py > ry1 && py < ry2;
};
function dirToMouse() {
  const px = player.x + player.width / 2;
  const py = player.y - player.height / 2;
  const dx = mouse.x - px, dy = mouse.y - py;
  const len = Math.max(0.0001, Math.hypot(dx, dy));
  return { px, py, dx: dx / len, dy: dy / len, ang: Math.atan2(dy, dx) };
}
const rollCrit = (base) => Math.random() < player.critChance ? Math.floor(base * player.critMult) : base;
const shoot = (ctxObj, opts) => gameState.projectiles.push(new Attack(ctxObj.px, ctxObj.py, ctxObj.dx, ctxObj.dy, opts));
function shootSpread(ctxObj, count, spread, dmg, color) {
  for (let i = 0; i < count; i++) {
    const off = (i - (count - 1) / 2) * spread;
    const dx = Math.cos(ctxObj.ang + off), dy = Math.sin(ctxObj.ang + off);
    gameState.projectiles.push(new Attack(ctxObj.px, ctxObj.py, dx, dy, { damage: dmg, color, speed: 12 }));
  }
}
function dashTowardMouse(dist) {
  const d = dirToMouse();
  player.x += d.dx * dist;
  player.y += d.dy * (dist * 0.15);
}
function smallHeal(h = 1) {
  player.takeHeartDamage(-h);
  floatingText.push(new FloatText(player.x, player.y - 70, `+${h}♥`, '#8cf1a5'));
}
function radialBlast(x, y, count, dmg, color) {
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2 + Math.random() * 0.15;
    const dx = Math.cos(ang), dy = Math.sin(ang);
    gameState.projectiles.push(new Attack(x, y, dx, dy, { damage: dmg, color, speed: 11, radius: 7 }));
  }
}
function tempDamageReduce(duration, factor) {
  gameState.dmgReduce.active = true;
  gameState.dmgReduce.factor = factor;
  gameState.dmgReduce.until = nowSec() + duration;
}
function meleeSwing(ctxObj, { range = 120, arcRad = Math.PI / 2.5, dmg = player.damage, color = '#fff', thin = false } = {}) {
  gameState.swordArcs.push(new SwordArc(ctxObj.px, ctxObj.py, ctxObj.ang, arcRad, range, color, thin));

  const inArc = (t) => {
    const cx = t.x + t.width / 2, cy = t.y - t.height / 2;
    const dx = cx - ctxObj.px, dy = cy - ctxObj.py;
    const dist = Math.hypot(dx, dy);
    if (dist > range) return false;
    const angTo = Math.atan2(dy, dx);
    const diff = Math.atan2(Math.sin(angTo - ctxObj.ang), Math.cos(angTo - ctxObj.ang)); // -π..π
    return Math.abs(diff) <= arcRad / 2;
  };

  // 몬스터 타격
  for (const m of gameState.monsters) {
    if (inArc(m)) {
      m.hp -= dmg;
      floatingText.push(new FloatText(m.x + m.width / 2, m.y - m.height, `-${Math.floor(dmg)}`, '#ff6666'));
    }
  }
  // 보스 타격
  if (inArc(boss)) {
    boss.hp = Math.max(0, boss.hp - dmg);
    floatingText.push(new FloatText(boss.x + boss.width / 2, boss.y - boss.height, `-${Math.floor(dmg)}`, '#ffd966'));
  }
}

/* ------------------------------------------------------
 📝 7) 떠다니는 텍스트 & 드랍
------------------------------------------------------ */
class FloatText {
  constructor(x, y, text, color = '#fff') {
    this.x = x; this.y = y; this.text = text; this.color = color;
    this.life = 1.2;
  }
  update(dt) { this.y -= 20 * dt; this.life -= dt; }
  draw() {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / 1.2);
    ctx.fillStyle = this.color;
    ctx.font = '14px Arial'; ctx.textAlign = 'center';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}
let floatingText = gameState.floatingText;

function dropLoot(x, y) {
  // 코인
  const gain = 5 + Math.floor(Math.random() * 5);
  player.coins += gain;
  floatingText.push(new FloatText(x, y - 40, `+${gain} 코인`, '#ffd966'));

  // 직업 드랍 (중복 방지)
  if (Math.random() < 0.2) {
    const pool = (regionJobs[gameState.currentRegion] || []).filter(job => !jobInventory.some(j => j && j.id === job.id));
    if (pool.length) {
      const job = pool[Math.floor(Math.random() * pool.length)];
      if (addJob(job)) floatingText.push(new FloatText(x, y - 60, `새 직업: ${job.name}`, '#b4f0ff'));
    }
  }
  updateMetaUI();
}

/* ------------------------------------------------------
 🧰 8) 직업 인벤토리 (3칸, 중복 불가)
------------------------------------------------------ */
let jobInventory = [null, null, null];
let activeJobIdx = -1;

function setActiveJob(i) { if (jobInventory[i]) { activeJobIdx = i; refreshJobUI(); } }
function currentJob() { return jobInventory[activeJobIdx] || JOBS.adventurer; }

function addJob(jobObj) {
  if (jobInventory.some(j => j && j.id === jobObj.id)) {
    floatingText.push(new FloatText(player.x, player.y - 80, `${jobObj.name} 이미 보유`, '#aaa'));
    return false;
  }
  for (let i = 0; i < jobInventory.length; i++) {
    if (!jobInventory[i]) {
      jobInventory[i] = jobObj;
      if (activeJobIdx === -1) activeJobIdx = i;
      player.applyPassives();
      refreshJobUI();
      refreshJobListUI();
      return true;
    }
  }
  floatingText.push(new FloatText(player.x, player.y - 80, '직업 슬롯 가득참', '#ff9a9a'));
  return false;
}
// 시작 시 모험가 지급
if (!jobInventory[0]) addJob(JOBS.adventurer);

/* ------------------------------------------------------
 🧭 9) 인벤토리 탭(무기/스킬/직업) + 빌드
------------------------------------------------------ */
const tabs = document.querySelectorAll('#inv-tabs .tab');
const tabContents = document.querySelectorAll('.tab-content');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    tabContents.forEach(tc => tc.classList.toggle('hidden', !tc.id.includes(target)));
  });
});

function buildInventoryGrids() {
  weaponGrid.innerHTML = '';
  skillGrid.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const w = document.createElement('div'); w.className = 'cell'; w.textContent = '무기 슬롯'; weaponGrid.appendChild(w);
  }
  for (let i = 0; i < 8; i++) {
    const s = document.createElement('div'); s.className = 'cell'; s.textContent = '스킬 슬롯'; skillGrid.appendChild(s);
  }
  refreshJobListUI();
}
function refreshJobListUI() {
  jobListEl.innerHTML = '';
  jobInventory.forEach(job => {
    if (!job) return;
    const div = document.createElement('div');
    div.className = 'job-item';
    div.textContent = `${job.name} (${job.desc})`;
    jobListEl.appendChild(div);
  });
}
buildInventoryGrids();

/* ------------------------------------------------------
 🧪 10) 스킬 시스템 (쿨다운/바인딩)
------------------------------------------------------ */
const skillCd   = { shift: 0.6, e: 0.35, q: 8, ctrl: 10, r: 16 };
const skillLast = { shift: -99, e: -99, q: -99, ctrl: -99, r: -99 };
const cdReady = (k) => nowSec() - skillLast[k] >= skillCd[k];
const markCd  = (k) => { skillLast[k] = nowSec(); };

function useBasic() { const d = dirToMouse(); currentJob().basic(d); }
function useSecondary() { const d = dirToMouse(); if (currentJob().secondary) currentJob().secondary(d); }
function useSkill(k) {
  if (!cdReady(k)) return;
  const d = dirToMouse();
  const cj = currentJob();
  if (cj.skills && cj.skills[k]) { cj.skills[k](d); markCd(k); }
}

/* ------------------------------------------------------
 🏪 11) 상점 / 설정 / 패널 공통
------------------------------------------------------ */
let shopOpen = false;
const JOB_COST = 25;

function renderShop() {
  // 이미 보유한 직업은 목록에서 제외
  const pool = (regionJobs[gameState.currentRegion] || []).filter(job => !jobInventory.some(j => j && j.id === job.id));
  const offers = pool.slice(0, 3);
  shopListEl.innerHTML = '';
  offers.forEach(job => {
    const div = document.createElement('div');
    div.className = 'shop-item';
    div.innerHTML = `
      <div class="meta">
        <div class="name">${job.name}</div>
        <div class="desc">${job.desc}</div>
      </div>
      <button>구매 ${JOB_COST}</button>`;
    const btn = div.querySelector('button');
    btn.disabled = player.coins < JOB_COST;
    btn.addEventListener('click', () => {
      if (player.coins >= JOB_COST) {
        if (addJob(job)) {
          player.coins -= JOB_COST;
          updateMetaUI();
          renderShop();
        }
      }
    });
    shopListEl.appendChild(div);
  });
  shopCoinEl.textContent = '보유 코인: ' + Math.floor(player.coins);
}
function toggleShop() {
  if (!player.inTown) { floatingText.push(new FloatText(player.x, player.y - 70, '마을에서만 이용 가능', '#ffaaaa')); return; }
  if (shopEl.classList.contains('hidden')) { renderShop(); panelOpen(shopEl); shopOpen = true; }
  else { panelClose(shopEl); shopOpen = false; }
}
function panelOpen(p)  { p.classList.remove('hidden'); setPaused(true); }
function panelClose(p) { p.classList.add('hidden'); if ([shopEl, invEl, settingsEl].every(el => el.classList.contains('hidden'))) setPaused(false); }
function togglePanel(p){ p.classList.contains('hidden') ? panelOpen(p) : panelClose(p); }

// 패널 X 버튼
document.querySelectorAll('.xbtn').forEach(btn => btn.addEventListener('click', () => {
  const id = btn.getAttribute('data-close');
  if (id === 'shop') panelClose(shopEl);
  if (id === 'inventory') panelClose(invEl);
  if (id === 'settings') panelClose(settingsEl);
}));

// 설정(음량 슬라이더)
let masterVolume = 1.0;
volSlider.addEventListener('input', () => {
  masterVolume = Number(volSlider.value) / 100;
  volVal.textContent = Math.round(masterVolume * 100) + '%';
});

/* ------------------------------------------------------
 ⌨️ 12) 입력 처리 (WASD/Space/LMB/RMB/Shift/E/Q/Ctrl/R/F/V/ESC/M/Tab)
------------------------------------------------------ */
const keys = {};
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  keys[k] = true;

  if (k === 'f')       toggleShop();
  if (k === 'v')       togglePanel(invEl);
  if (k === 'escape')  togglePanel(settingsEl);
  if (k === 'm')       viewScale = viewScale === 1 ? 1.25 : 1;
  if (k === 'tab')    { e.preventDefault(); gameState.showStats = !gameState.showStats; }

  if (isPaused) return; // 게임 일시정지 상태에서는 스킬 발동 금지

  if (k === 'shift')   useSkill('shift');
  if (k === 'e')       useSkill('e');
  if (k === 'q')       useSkill('q');
  if (k === 'control') useSkill('ctrl');
  if (k === 'r')       useSkill('r');
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

// 마우스 입력
let mouse = { x: 0, y: 0 };
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - rect.left) / viewScale;
  mouse.y = (e.clientY - rect.top) / viewScale;
});
canvas.addEventListener('mousedown', (e) => {
  if (isPaused) return;
  if (e.button === 0) useBasic();
  else if (e.button === 2) useSecondary();
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

/* ------------------------------------------------------
 🧩 13) HUD & 배너 & 스킬HUD 쿨다운
------------------------------------------------------ */
function updateMetaUI() {
  // 상단 칩
  if (coinChip)   coinChip.textContent   = '코인: ' + Math.floor(player.coins);
  if (regionChip) regionChip.textContent = '지역: ' + gameState.currentRegion;
}
function updateHeartsUI() {
  if (!heartsEl) return;
  heartsEl.innerHTML = '';
  for (let i = 0; i < player.maxHearts; i++) {
    const d = document.createElement('div');
    d.className = 'heart' + (i < player.hearts ? '' : ' empty');
    heartsEl.appendChild(d);
  }
}
function refreshJobUI() {
  const cj = currentJob();
  if (jobChip)  jobChip.textContent  = `직업: ${cj.name}`;
  if (statChip) statChip.textContent = `DMG ${player.damage} | CRIT ${Math.round(player.critChance * 100)}% | x${player.critMult}`;
}
updateMetaUI(); updateHeartsUI(); refreshJobUI();

// 지역 배너
let regionAlpha = 0, regionVisible = true, regionTimer = 0, regionPhase = 'fadeIn';
function drawRegionInfo(deltaMs) {
  const dt = deltaMs / 1000;
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
  ctx.save();
  ctx.globalAlpha = regionAlpha;
  ctx.fillStyle = regionColors[gameState.currentRegion] || '#fff';
  ctx.font = '48px bold Arial'; ctx.textAlign = 'center';
  ctx.fillText(gameState.currentRegion, canvas.width / 2, 80);
  ctx.restore();
}

// 스킬 HUD 쿨다운 표시
const skillSlots = document.querySelectorAll('.skill-slot');
function updateSkillHUD() {
  const now = nowSec();
  skillSlots.forEach(slot => {
    const key = slot.dataset.key;
    const cd  = skillCd[key];
    const rem = cd ? Math.max(0, cd - (now - skillLast[key])) : 0;
    if (rem > 0) {
      slot.style.background = `linear-gradient(to top, rgba(100,100,100,0.9) ${(rem / cd) * 100}%, #222 0%)`;
      slot.textContent = rem.toFixed(1);
    } else {
      slot.style.background = 'rgba(40,40,40,0.9)';
      slot.textContent = key.toUpperCase();
    }
  });
}

/* ------------------------------------------------------
 🔁 14) 메인 루프
------------------------------------------------------ */
let lastTime = performance.now();
function gameLoop(now = 0) {
  const deltaMs = now - lastTime;
  let dt = Math.min(deltaMs / 1000, 0.05);
  lastTime = now;

  // 피해감소 버프 해제 타이밍
  if (gameState.dmgReduce.active && nowSec() > gameState.dmgReduce.until) {
    gameState.dmgReduce.active = false; gameState.dmgReduce.factor = 1;
  }

  // 캔버스 초기화 + 바닥/마을영역
  ctx.setTransform(viewScale, 0, 0, viewScale, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#333';
  ctx.fillRect(0, groundLevel + 1, canvas.width, canvas.height - groundLevel);
  ctx.fillStyle = 'rgba(255,255,255,.06)';
  ctx.fillRect(0, groundLevel - 120, 220, 120);

  if (!isPaused) {
    // 갱신
    player.applyPassives();
    player.move(keys);
	player.updateAnim(dt, keys);


    // 몬스터 스폰
    gameState.monsterSpawnTimer += dt;
    if (gameState.monsterSpawnTimer > gameState.monsterSpawnInterval) {
      gameState.monsterSpawnTimer = 0;
      gameState.monsters.push(new Slime(350 + Math.random() * (canvas.width - 550), groundLevel));
    }

    // 유닛/투사체 업데이트
    for (const m of gameState.monsters) m.update(dt);
    for (const p of gameState.projectiles) p.update(dt);
    for (const a of gameState.swordArcs) a.update(dt);

    // 투사체 충돌
    for (const p of gameState.projectiles) {
      for (const m of gameState.monsters) {
        if (hitPointRect(p.x, p.y, m) && p.life > 0) {
          m.hp -= p.damage;
          floatingText.push(new FloatText(m.x + m.width / 2, m.y - m.height, `-${Math.floor(p.damage)}`, '#ff6666'));
          if (p.pierce > 0) p.pierce--; else p.life = 0;
        }
      }
      if (hitPointRect(p.x, p.y, boss) && p.life > 0) {
        boss.hp = Math.max(0, boss.hp - p.damage);
        floatingText.push(new FloatText(boss.x + boss.width / 2, boss.y - boss.height, `-${Math.floor(p.damage)}`, '#ffd966'));
        if (p.pierce > 0) p.pierce--; else p.life = 0;
      }
    }

    // 생존 필터
    gameState.projectiles = gameState.projectiles.filter(p => p.life > 0);
    gameState.swordArcs = gameState.swordArcs.filter(a => a.life > 0);

    // 몬스터 사망 처리
    const alive = [];
    for (const m of gameState.monsters) {
      if (m.hp <= 0) dropLoot(m.x + m.width / 2, m.y - m.height);
      else alive.push(m);
    }
    gameState.monsters = alive;

    // 텍스트
    for (const t of floatingText) t.update(dt);
    floatingText = floatingText.filter(t => t.life > 0);
  }

  // 렌더 순서: 플레이어 → 보스 → 몬스터/투사체/베기 → 텍스트 → 배너 → HUD
  player.draw();
  boss.draw();
  for (const m of gameState.monsters) m.draw();
  for (const p of gameState.projectiles) p.draw();
  for (const a of gameState.swordArcs) a.draw();
  for (const t of floatingText) t.draw();
  drawRegionInfo(deltaMs);
  updateSkillHUD();

  // 스탯 오버레이 (Tab)
  if (gameState.showStats) {
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(20, 130, 280, 150);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial'; ctx.textAlign = 'left';
    const jobs = jobInventory.filter(Boolean).map(j => j.name).join(', ') || '없음';
    ctx.fillText(`직업: ${jobs}`, 30, 155);
    ctx.fillText(`HP: ${player.hearts}/${player.maxHearts}`, 30, 175);
    ctx.fillText(`DMG: ${player.damage}`, 30, 195);
    ctx.fillText(`CRIT: ${Math.round(player.critChance * 100)}% x${player.critMult}`, 30, 215);
    ctx.fillText(`코인: ${Math.floor(player.coins)}`, 30, 235);
    ctx.fillText(`지역: ${gameState.currentRegion}`, 30, 255);
    ctx.restore();
  }

  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

/* ------------------------------------------------------
 ✅ 15) 초기 로그 / 힌트
------------------------------------------------------ */
console.log(`[ENIN Controls]
- 이동: A/D, 점프: Space(2단)
- 기본공격: 마우스 좌클릭 / 보조: 우클릭
- 스킬: Shift / E / Q / Ctrl / R
- 상점: F (마을 좌측 영역)
- 인벤토리: V (무기/스킬/직업 탭)
- 설정: ESC (음량), 열리면 일시정지
- 맵확대: M, 스탯 오버레이: Tab
`);
