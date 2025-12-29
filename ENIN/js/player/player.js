import { gravity, groundLevel, mapWidth, gameState, ctx } from '../state.js';
import { jobInventory } from '../job/jobSystem.js';
import { updateHeartsUI } from '../ui/uiControl.js';

export class Player {
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

  applyPassives() {
    this.maxHearts = 4;
    this.speed = 5;
    this.damage = 5;
    for (const j of jobInventory) if (j) j.passive(this);
    this.hearts = Math.min(this.hearts, this.maxHearts);
  }

  move(keys) {
    if (keys['a']) { this.x -= this.speed; this.facing = -1; }
    if (keys['d']) { this.x += this.speed; this.facing = 1; }
    if (keys[' '] && this.jumpCount < 2) {
      this.velY = -14;
      this.jumpCount++;
      keys[' '] = false;
    }
    this.velY += gravity;
    this.y += this.velY;
    if (this.y > groundLevel) { this.y = groundLevel; this.velY = 0; this.jumpCount = 0; }
    
    this.inTown = this.x < 220;
    if (this.invuln > 0) this.invuln -= 1 / 60;
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > mapWidth) this.x = mapWidth - this.width;
  }

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

  takeHeartDamage(n = 1) {
    if (n > 0 && this.invuln > 0) return;
    if (n > 0 && gameState.dmgReduce.active) n *= gameState.dmgReduce.factor;
    this.invuln = 0.6;
    this.hearts = Math.max(0, Math.min(this.maxHearts, this.hearts - n));
    updateHeartsUI(); // UI 업데이트 호출
  }

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


export const player = new Player();
