// js/enemy/monster.js
import { ctx, mapWidth, groundLevel, rectOverlap, floatingText, FloatText, gameState } from '../state.js';
import { player } from '../player/player.js';
import { updateMetaUI } from '../ui/uiControl.js';
import { MONSTER_DB } from './monsterDB.js'; // 🌟 DB import

export class Entity {
  constructor(id, x, y) {
    // 1. DB에서 데이터 조회
    const data = MONSTER_DB[id];
    if (!data) {
      console.error(`❌ 존재하지 않는 몬스터 ID: ${id}`);
      return;
    }

    // 2. 기본 스탯 설정
    this.id = id;
    this.type = data.type; // 'monster' | 'boss'
    this.name = data.name;
    this.ai = data.ai || "patrol"; // DB에 없으면 기본값 patrol

    this.x = x; 
    this.y = y;
    this.width = data.width;
    this.height = data.height;
    
    this.maxHp = data.hp;
    this.hp = this.maxHp;
    this.dmg = data.dmg;
    this.speed = data.speed;
    this.touchInterval = data.touchInterval || 1.0;

    // 3. 상태 변수
    this.dead = false;
    this.dir = Math.random() < 0.5 ? -1 : 1;
    this.touchTimer = 0;
    
    // 4. 애니메이션 로드
    this.animations = {};
    this.animState = "idle";
    this.animFrame = 0;
    this.animTimer = 0;
    this.frameInterval = 0.15;
    this.loadAnimations(data.imgPath, data.animations);
  }

  loadAnimations(path, animDefs) {
    for (const [state, files] of Object.entries(animDefs)) {
      this.animations[state] = files.map(file => {
        const img = new Image();
        img.src = path + file;
        return img;
      });
    }
  }
  
  updateAnim(dt) {
    this.animTimer += dt;
    if (this.animTimer >= this.frameInterval) {
      this.animTimer = 0;
      const arr = this.animations[this.animState];
      if (arr) this.animFrame = (this.animFrame + 1) % arr.length;
    }
  }

  update(dt) {
    if (this.dead) return;

    // === AI 로직 분기 ===
    
    // 1) 추적형 AI (예: 슬라임)
    if (this.ai === "chase") {
      const dx = player.x - this.x;
      const distance = Math.abs(dx);

      // 60px 이상 떨어져 있으면 추적
      if (distance > 60) {
        this.dir = Math.sign(dx);
        this.x += this.dir * this.speed;
        this.animState = "walk";
      } else {
        // 근접 시 공격
        this.animState = "idle";
        this.touchTimer += dt;
        if (this.touchTimer >= 1.0) {
          player.takeHeartDamage(1);
          floatingText.push(new FloatText(this.x, this.y - this.height - 10, "공격!", "#ffaaaa"));
          this.touchTimer = 0;
        }
      }
    } 
    // 2) 일반 순찰 AI (patrol)
    else if (this.ai === "patrol") {
        this.x += this.dir * this.speed;
        if (this.x < 250) { this.x = 250; this.dir *= -1; }
        if (this.x > mapWidth - 100) { this.x = mapWidth - 100; this.dir *= -1; }

        // 플레이어 몸통 박치기
        if (rectOverlap(this, player)) {
            this.touchTimer += dt;
            if (this.touchTimer >= this.touchInterval) {
                player.takeHeartDamage(1);
                this.touchTimer = 0;
            }
        } else {
            this.touchTimer = 0;
        }
    }
    // 3) 고정형 (보스 등) - 이동 없음, 충돌 체크만
    else if (this.ai === "stationary") {
       if (rectOverlap(this, player)) {
            this.touchTimer += dt;
            if (this.touchTimer >= this.touchInterval) {
                player.takeHeartDamage(1);
                this.touchTimer = 0;
            }
       }
    }

    this.updateAnim(dt);
  }

  takeDamage(dmg) {
      this.hp -= dmg;
      floatingText.push(new FloatText(this.x + this.width/2, this.y - this.height, `-${Math.floor(dmg)}`, "#ff5555"));
      
      if (this.hp <= 0 && !this.dead) {
          this.dead = true;
          this.animState = "die";
          this.dropLoot();
      }
  }

  dropLoot() {
      const gain = 5 + Math.floor(Math.random() * 5);
      player.coins += gain;
      floatingText.push(new FloatText(this.x, this.y - 40, `+${gain} 코인`, '#ffd966'));
      updateMetaUI();
  }

  draw(ctx) {
      const arr = this.animations[this.animState];
      const img = arr ? arr[this.animFrame % arr.length] : null;

      if (img && img.complete && img.naturalWidth) {
        ctx.save();
        // 방향에 따른 이미지 반전
        if (this.dir < 0) {
          ctx.scale(-1, 1);
          ctx.drawImage(img, -this.x - this.width, this.y - this.height, this.width, this.height);
        } else {
          ctx.drawImage(img, this.x, this.y - this.height, this.width, this.height);
        }
        ctx.restore();
      } else {
        // 이미지 로딩 전 대체 박스
        ctx.fillStyle = this.type === "boss" ? "purple" : "green";
        ctx.fillRect(this.x, this.y - this.height, this.width, this.height);
      }

      // HP bar
      ctx.fillStyle = "red"; 
      ctx.fillRect(this.x, this.y - this.height - 10, this.width, 5);
      ctx.fillStyle = "lime"; 
      ctx.fillRect(this.x, this.y - this.height - 10, (this.hp / this.maxHp) * this.width, 5);
  }
}

// 🏭 소환 함수 수정 (id를 인자로 받음)
export function spawnEntity(id, x, y) {
  // DB에 있는지 확인
  if (!MONSTER_DB[id]) {
      console.warn(`스폰 실패: ID '${id}'는 데이터베이스에 없습니다.`);
      return null;
  }

  const e = new Entity(id, x, y);
  
  if (e.type === "boss") {
      gameState.boss = e;
      floatingText.push(new FloatText(x, y - 100, "⚠️ 보스 출현! ⚠️", "#ff0000"));
  } else {
      gameState.monsters.push(e);
  }
  return e;
}
