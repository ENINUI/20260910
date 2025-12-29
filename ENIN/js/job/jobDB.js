import { player } from '../player/player.js';
import { spawnEntity } from '../enemy/monster.js';
import { dashTowardMouse } from '../job/jobSystem.js';
import { 
    rollCrit, shoot, shootSpread, radialBlast, meleeSwing, tempDamageReduce, smallHeal 
} from '../combat.js';
import { gameState, FloatText, floatingText, groundLevel } from '../state.js';
import { camera } from '../rendering/draw.js';

export const JOBS = {
  // === 기본 ===
  adventurer: {
    id: 'adventurer', name: '모험가', desc: '평범한 탐험가',
    passive(p) { /* 없음 */ },
    basic(ctx) {
      meleeSwing(ctx, { range: 120, dmg: rollCrit(player.damage), color: '#ffe08a' });
    },
    secondary(ctx) {
      meleeSwing(ctx, { range: 90, dmg: rollCrit(player.damage - 1), color: '#ffd26a', thin: true });
    },
    skills: {}
  },

  // === 숲 예시 (드루이드) ===
  druid: {
    id: 'druid', name: '드루이드', desc: '자연과 회복의 수호자',
    passive(p) { p.maxHearts += 3; }, 
    basic(ctx) {
      shoot(ctx, { dmg: rollCrit(player.damage + 2), color: '#77ff99' });
    },
    secondary(ctx) {
      radialBlast(ctx.px, ctx.py, 5, rollCrit(player.damage + 1), '#99ffaa');
    },
    skills: {
      shift() {
        const dist = 150;
        const oldX = player.x;
        dashTowardMouse(dist);
        for (let i = 0; i < 5; i++) {
          const vineX = oldX + i * (dist / 5) * player.facing;
          floatingText.push(new FloatText(vineX, groundLevel - 20, "🌿", "#55aa55"));
          setTimeout(() => radialBlast(vineX, groundLevel, 3, 2, '#55aa55'), i * 100);
        }
      },
      e() { smallHeal(1); },
      q() {
        spawnEntity("slime", player.x + 80, groundLevel);
        floatingText.push(new FloatText(player.x, player.y - 60, "🐺 늑대 소환!", "#aaffaa"));
      },
      r(ctx) {
        for (let i = 0; i < 20; i++) {
          const x = camera.x + Math.random() * camera.width;
          const y = groundLevel - Math.random() * 100;
          setTimeout(() => radialBlast(x, y, 6, rollCrit(player.damage + 5), '#66ff88'), i * 50);
        }
        floatingText.push(new FloatText(player.x, player.y - 80, "🌳 대자연의 분노!", "#88ff88"));
      }
    }
  },

  // 🪓 나무꾼
  lumberjack: {
    id: 'lumberjack', name: '나무꾼', desc: '튼튼한 근접 전사',
    passive(p) { p.maxHearts += 2; },
    basic(ctx) {
      meleeSwing(ctx, { range: 140, dmg: rollCrit(player.damage + 2), color: '#cfa26a' });
      // 기본공격 시 가시 생성
      radialBlast(player.x, groundLevel, 3, 1, '#997744');
    },
    secondary(ctx) {
      meleeSwing(ctx, { range: 160, dmg: rollCrit(player.damage + 3), color: '#dca86f' });
    },
    skills: {
      // 돌진 + 베기
      shift() {
        dashTowardMouse(100);
        meleeSwing({ px: player.x, py: player.y, dx: 1, dy: 0, ang: 0 },
          { range: 120, dmg: rollCrit(player.damage + 3), color: '#cc8855' });
      },
      // 방패 생성 (피해감소)
      e() {
        tempDamageReduce(3, 0.6);
        floatingText.push(new FloatText(player.x, player.y - 70, '🌲 방패 생성', '#55ff55'));
      },
      // 통나무 투척
      q(ctx) {
        shoot(ctx, { speed: 9, dmg: rollCrit(player.damage + 4), color: '#996633', radius: 10 });
      },
      // 거목 소환 (거대한 슬라임 대신)
      r() {
        spawnEntity("slime", player.x + 200, groundLevel);
        floatingText.push(new FloatText(player.x, player.y - 90, '🌳 거목 소환!', '#33ff33'));
      }
    }
  },

  // ✨ 정령사
  spiritMage: {
    id: 'spiritMage', name: '정령사', desc: '정령의 힘을 다루는 서포터',
    passive(p) { p.critChance += 0.1; },
    basic(ctx) { shoot(ctx, { dmg: rollCrit(player.damage + 2), color: '#aaffff' }); },
    secondary(ctx) { shootSpread(ctx, 3, 0.1, rollCrit(player.damage + 2), '#99ffff'); },
    skills: {
      // 짧은 순간 이동
      shift() { dashTowardMouse(180); },
      // 정령 구슬 발사
      e(ctx) { shoot(ctx, { dmg: rollCrit(player.damage + 3), color: '#aaffff', radius: 6, speed: 14 }); },
      // 정령 보호막
      q() {
        tempDamageReduce(3, 0.5);
        floatingText.push(new FloatText(player.x, player.y - 70, '🌀 보호막 생성', '#88ffff'));
      },
      // 정령 해방 (광역 피해 + 스턴)
      r(ctx) {
        radialBlast(ctx.px, ctx.py, 12, rollCrit(player.damage + 6), '#77ffff');
        floatingText.push(new FloatText(player.x, player.y - 70, '정령 해방!', '#aaffff'));
      }
    }
  },

  // 🧝‍♀️ 엘프 (히든)
  elf: {
    id: 'elf', name: '엘프', desc: '[히든] 궁극의 궁술사',
    passive(p) { p.speed += 1; },
    basic(ctx) { shoot(ctx, { speed: 18, dmg: rollCrit(player.damage + 3), color: '#ccffcc' }); },
    secondary(ctx) { shootSpread(ctx, 5, 0.12, rollCrit(player.damage + 2), '#bbffbb'); },
    skills: {
      // 공중 점프 후 활 시위 (단순 이펙트)
      shift() {
        player.y -= 40;
        shoot(ctxObjFromPlayer(), { dmg: rollCrit(player.damage + 4), color: '#aaffaa' });
        setTimeout(() => { player.y += 40; }, 300);
      },
      // 강력한 관통 화살
      e(ctx) { shoot(ctx, { dmg: rollCrit(player.damage + 6), color: '#aaffaa', pierce: 5 }); },
      // 화살비
      q(ctx) {
        for (let i = 0; i < 10; i++) {
          setTimeout(() => shoot({ px: player.x, py: player.y - 100, dx: 1, dy: 1 },
            { dmg: rollCrit(player.damage + 2), color: '#aaffaa' }), i * 100);
        }
      },
      // 일정 시간 무한 관통 (강화 모드)
      r() {
        floatingText.push(new FloatText(player.x, player.y - 80, '엘븐 스피릿!', '#aaffaa'));
        player.critChance += 0.3;
        setTimeout(() => player.critChance -= 0.3, 5000);
      }
    }
  },


  // ======================
  // 🌴 정글 - 탐험가 / 화가 / 주술사(히든)
  // ======================
  explorer: {
    id: 'explorer', name: '탐험가', desc: '정글을 누비는 모험가',
    passive(p) { p.speed += 1; },
    basic(ctx) { meleeSwing(ctx, { range: 110, dmg: rollCrit(player.damage + 2), color: '#cfcf7a' }); },
    secondary(ctx) { shoot(ctx, { speed: 12, dmg: rollCrit(player.damage + 3), color: '#eedd66' }); },
    skills: {
      shift() { dashTowardMouse(160); },
      e(ctx) { shootSpread(ctx, 3, 0.1, rollCrit(player.damage + 3), '#eedd66'); },
      q() { floatingText.push(new FloatText(player.x, player.y - 70, '탐험모드 발동!', '#ffcc66')); },
      r(ctx) { radialBlast(ctx.px, ctx.py, 14, rollCrit(player.damage + 5), '#ffcc66'); }
    }
  },
  painter: {
    id: 'painter', name: '화가', desc: '색의 마법으로 세상을 물들인다',
    passive(p) { p.critChance += 0.05; },
    basic(ctx) { shoot(ctx, { dmg: rollCrit(player.damage + 2), color: randomColor() }); },
    secondary(ctx) { radialBlast(ctx.px, ctx.py, 5, rollCrit(player.damage + 3), randomColor()); },
    skills: {
      shift() { dashTowardMouse(120); },
      e(ctx) { radialBlast(ctx.px, ctx.py, 8, rollCrit(player.damage + 5), randomColor()); },
      q(ctx) { smallHeal(1); },
      r(ctx) { radialBlast(ctx.px, ctx.py, 20, rollCrit(player.damage + 8), randomColor()); }
    }
  },
  shaman: {
    id: 'shaman', name: '주술사', desc: '[히든] 혼령을 부리는 마법사',
    passive(p) { p.maxHearts += 2; },
    basic(ctx) { shoot(ctx, { dmg: rollCrit(player.damage + 3), color: '#aa66ff' }); },
    secondary(ctx) { radialBlast(ctx.px, ctx.py, 5, rollCrit(player.damage + 3), '#cc88ff'); },
    skills: {
      shift() { dashTowardMouse(100); },
      e(ctx) { radialBlast(ctx.px, ctx.py, 8, rollCrit(player.damage + 6), '#cc88ff'); },
      q(ctx) { tempDamageReduce(2, 0.7); },
      r(ctx) { radialBlast(ctx.px, ctx.py, 18, rollCrit(player.damage + 12), '#9933ff'); }
    }
  },

  // ======================
  // ❄️ 설원 - 영매사 / 이누에트 / 스팀펑크 / ???(히든)
  // ======================
  medium: {
    id: 'medium', name: '영매사', desc: '죽은 영혼과 교감한다',
    passive(p) { p.maxHearts += 1; },
    basic(ctx) { shoot(ctx, { dmg: rollCrit(player.damage + 3), color: '#99ddff' }); },
    secondary(ctx) { radialBlast(ctx.px, ctx.py, 6, rollCrit(player.damage + 2), '#aaffff'); },
    skills: {
      shift() { dashTowardMouse(120); },
      e(ctx) { radialBlast(ctx.px, ctx.py, 8, rollCrit(player.damage + 5), '#bbffff'); },
      q(ctx) { smallHeal(1); },
      r(ctx) { radialBlast(ctx.px, ctx.py, 18, rollCrit(player.damage + 9), '#88ccff'); }
    }
  },
  inueet: {
    id: 'inueet', name: '이누에트', desc: '냉기의 생존자',
    passive(p) { p.damage += 1; },
    basic(ctx) { meleeSwing(ctx, { range: 100, dmg: rollCrit(player.damage + 2), color: '#aaffff' }); },
    secondary(ctx) { shoot(ctx, { dmg: rollCrit(player.damage + 3), color: '#ccffff' }); },
    skills: {
      shift() { dashTowardMouse(100); },
      e(ctx) { radialBlast(ctx.px, ctx.py, 8, rollCrit(player.damage + 4), '#aaffff'); },
      q() { tempDamageReduce(3, 0.5); },
      r(ctx) { radialBlast(ctx.px, ctx.py, 14, rollCrit(player.damage + 7), '#aaffff'); }
    }
  },
  steampunk: {
    id: 'steampunk', name: '스팀펑크', desc: '기계와 증기의 기술자',
    passive(p) { p.damage += 1; p.speed += 0.5; },
    basic(ctx) { shoot(ctx, { dmg: rollCrit(player.damage + 3), color: '#ffcc99' }); },
    secondary(ctx) { shootSpread(ctx, 3, 0.12, rollCrit(player.damage + 2), '#ffcc99'); },
    skills: {
      shift() { dashTowardMouse(150); },
      e(ctx) { shootSpread(ctx, 5, 0.2, rollCrit(player.damage + 3), '#ffcc99'); },
      q(ctx) { tempDamageReduce(3, 0.7); },
      r(ctx) { radialBlast(ctx.px, ctx.py, 16, rollCrit(player.damage + 8), '#ffcc99'); }
    }
  },
  chronos: {
    id: 'chronos', name: '시간술사', desc: '[히든] 시간의 지배자',
    passive(p) { p.critChance += 0.1; },
    basic(ctx) { shoot(ctx, { dmg: rollCrit(player.damage + 4), color: '#99ccff' }); },
    secondary(ctx) { radialBlast(ctx.px, ctx.py, 6, rollCrit(player.damage + 3), '#99ccff'); },
    skills: {
      shift() { dashTowardMouse(200); },
      e(ctx) { radialBlast(ctx.px, ctx.py, 10, rollCrit(player.damage + 6), '#99ccff'); },
      q(ctx) { tempDamageReduce(4, 0.5); },
      r(ctx) { floatingText.push(new FloatText(player.x, player.y - 70, '시간 정지!', '#99ccff')); }
    }
  },

  // ======================
  // 🏰 제국 - 병사 / 성직자 / 네크로멘서(히든)
  // ======================
  soldier: {
    id: 'soldier', name: '병사', desc: '근거리 전투 전문가',
    passive(p) { p.speed += 0.7; p.damage += 2; },
    basic(ctx) { shoot(ctx, { speed: 14, dmg: rollCrit(player.damage + 2), color: '#ffd26a' }); },
    secondary(ctx) { shootSpread(ctx, 3, 0.12, rollCrit(player.damage + 1), '#ffec9a'); },
    skills: {
      shift() { dashTowardMouse(160); },
      e(ctx) { shoot(ctx, { speed: 15, dmg: rollCrit(player.damage + 4), color: '#ffe28a' }); },
      q() { tempDamageReduce(2.2, 0.6); floatingText.push(new FloatText(player.x, player.y - 70, '피해감소', 'cyan')); },
      r(ctx) { radialBlast(ctx.px, ctx.py, 16, rollCrit(player.damage + 6), '#ff944d'); }
    }
  },
  priest: {
    id: 'priest', name: '성직자', desc: '신성한 치유자',
    passive(p) { p.maxHearts += 2; },
    basic(ctx) { shoot(ctx, { dmg: rollCrit(player.damage + 2), color: '#fff4cc' }); },
    secondary(ctx) { smallHeal(1); },
    skills: {
      shift() { dashTowardMouse(100); },
      e(ctx) { smallHeal(2); },
      q(ctx) { tempDamageReduce(2, 0.5); },
      r(ctx) { radialBlast(ctx.px, ctx.py, 12, rollCrit(player.damage + 5), '#ffffcc'); }
    }
  },
  necromancer: {
    id: 'necromancer', name: '네크로멘서', desc: '[히든] 죽음의 지배자',
    passive(p) { p.maxHearts += 2; p.critChance += 0.05; },
    basic(ctx) { shoot(ctx, { dmg: rollCrit(player.damage + 3), color: '#b388ff' }); },
    secondary(ctx) { radialBlast(ctx.px, ctx.py, 5, rollCrit(player.damage + 3), '#bb88ff'); },
    skills: {
      shift() { dashTowardMouse(100); },
      e(ctx) { radialBlast(ctx.px, ctx.py, 8, rollCrit(player.damage + 5), '#cc99ff'); },
      q(ctx) { smallHeal(1); },
      r(ctx) { radialBlast(ctx.px, ctx.py, 16, rollCrit(player.damage + 10), '#cc99ff'); }
    }
  },

  // ======================
  // 🌋 화산 - 광부 / 테러리스트 / 대장장이(히든)
  // ======================
  miner: {
    id: 'miner', name: '광부', desc: '단단한 근거리 전사',
    passive(p) { p.maxHearts += 1; },
    basic(ctx) { shoot(ctx, { speed: 11, dmg: rollCrit(player.damage + 3), color: '#ffcc33', radius: 9, pierce: 1 }); },
    secondary(ctx) { radialBlast(ctx.px, ctx.py, 4, rollCrit(player.damage + 3), '#ffbb55'); },
    skills: {
      shift() { dashTowardMouse(100); },
      e(ctx) { shoot(ctx, { speed: 12, dmg: rollCrit(player.damage + 5), color: '#ffd04d', radius: 10, pierce: 1 }); },
      q() { smallHeal(1); },
      r(ctx) { radialBlast(ctx.px, ctx.py, 12, rollCrit(player.damage + 7), '#ffa533'); }
    }
  },
  terrorist: {
    id: 'terrorist', name: '테러리스트', desc: '폭발의 전문가',
    passive(p) { p.damage += 3; },
    basic(ctx) { shoot(ctx, { dmg: rollCrit(player.damage + 4), color: '#ff7744' }); },
    secondary(ctx) { radialBlast(ctx.px, ctx.py, 6, rollCrit(player.damage + 5), '#ff5500'); },
    skills: {
      shift() { dashTowardMouse(150); },
      e(ctx) { radialBlast(ctx.px, ctx.py, 8, rollCrit(player.damage + 7), '#ff5500'); },
      q(ctx) { tempDamageReduce(1, 0.6); },
      r(ctx) { radialBlast(ctx.px, ctx.py, 20, rollCrit(player.damage + 15), '#ff3300'); }
    }
  },
  blacksmith: {
    id: 'blacksmith', name: '대장장이', desc: '[히든] 불의 대장장이',
    passive(p) { p.damage += 4; },
    basic(ctx) { shoot(ctx, { dmg: rollCrit(player.damage + 4), color: '#ff8844' }); },
    secondary(ctx) { radialBlast(ctx.px, ctx.py, 6, rollCrit(player.damage + 5), '#ffaa55'); },
    skills: {
      shift() { dashTowardMouse(120); },
      e(ctx) { radialBlast(ctx.px, ctx.py, 10, rollCrit(player.damage + 8), '#ffaa55'); },
      q(ctx) { smallHeal(1); },
      r(ctx) { radialBlast(ctx.px, ctx.py, 20, rollCrit(player.damage + 15), '#ffaa33'); }
    }
  },

  // ======================
  // 🏜️ 사막 - 총상인 / 수집가 / 초월자(히든)
  // ======================
  gunseller: {
    id: 'gunseller', name: '총상인', desc: '돈으로 공격하는 상인',
    passive(p) { p.damage += Math.floor(player.coins * 0.1); },
    basic(ctx) { shoot(ctx, { dmg: rollCrit(player.damage + 3), color: '#ffee99' }); },
    secondary(ctx) { shootSpread(ctx, 3, 0.12, rollCrit(player.damage + 2), '#ffee99'); },
    skills: {
      shift() { dashTowardMouse(140); },
      e(ctx) { shootSpread(ctx, 5, 0.18, rollCrit(player.damage + 4), '#ffee99'); },
      q(ctx) { floatingText.push(new FloatText(player.x, player.y - 70, '+코인 공격력', '#ffcc66')); },
      r(ctx) { radialBlast(ctx.px, ctx.py, 16, rollCrit(player.damage + 8), '#ffee66'); }
    }
  },
  collector: {
    id: 'collector', name: '수집가', desc: '아이템을 모으는 자',
    passive(p) { p.maxHearts += 1; },
    basic(ctx) { shoot(ctx, { dmg: rollCrit(player.damage + 2), color: '#ffee88' }); },
    secondary(ctx) { radialBlast(ctx.px, ctx.py, 6, rollCrit(player.damage + 2), '#ffee88'); },
    skills: {
      shift() { dashTowardMouse(120); },
      e(ctx) { smallHeal(1); },
      q(ctx) { floatingText.push(new FloatText(player.x, player.y - 70, '드랍률 +', '#ffcc66')); },
      r(ctx) { radialBlast(ctx.px, ctx.py, 14, rollCrit(player.damage + 6), '#ffee66'); }
    }
  },
  transcendent: {
    id: 'transcendent', name: '초월자', desc: '[히든] 모든 능력 초월',
    passive(p) { p.damage *= 2; p.critChance += 0.1; p.speed += 1; },
    basic(ctx) { shoot(ctx, { dmg: rollCrit(player.damage + 6), color: '#ffff99' }); },
    secondary(ctx) { radialBlast(ctx.px, ctx.py, 8, rollCrit(player.damage + 6), '#ffff99'); },
    skills: {
      shift() { dashTowardMouse(200); },
      e(ctx) { radialBlast(ctx.px, ctx.py, 12, rollCrit(player.damage + 8), '#ffff99'); },
      q(ctx) { tempDamageReduce(3, 0.5); },
      r(ctx) { radialBlast(ctx.px, ctx.py, 24, rollCrit(player.damage + 15), '#ffff99'); }
    }
  },

  // ======================
  // 🌌 황혼 - 마법사 / 원소술사 / 차원술사 / 창조자(히든)
  // ======================
  wizard: {
    id: 'wizard', name: '마법사', desc: '기본 마법 공격',
    passive(p) { p.critChance += 0.05; },
    basic(ctx) { shoot(ctx, { dmg: rollCrit(player.damage + 3), color: '#cc99ff' }); },
    secondary(ctx) { radialBlast(ctx.px, ctx.py, 5, rollCrit(player.damage + 2), '#cc99ff'); },
    skills: {
      shift() { dashTowardMouse(140); },
      e(ctx) { shoot(ctx, { dmg: rollCrit(player.damage + 5), color: '#cc99ff' }); },
      q(ctx) { smallHeal(1); },
      r(ctx) { radialBlast(ctx.px, ctx.py, 16, rollCrit(player.damage + 7), '#cc99ff'); }
    }
  },
  elementalist: {
    id: 'elementalist', name: '원소술사', desc: '속성 조합의 달인',
    passive(p) { p.damage += 2; },
    basic(ctx) { shoot(ctx, { dmg: rollCrit(player.damage + 3), color: '#ffaaee' }); },
    secondary(ctx) { radialBlast(ctx.px, ctx.py, 6, rollCrit(player.damage + 3), '#ffaaee'); },
    skills: {
      shift() { dashTowardMouse(160); },
      e(ctx) { radialBlast(ctx.px, ctx.py, 10, rollCrit(player.damage + 6), '#ffaaee'); },
      q(ctx) { smallHeal(1); },
      r(ctx) { radialBlast(ctx.px, ctx.py, 20, rollCrit(player.damage + 12), '#ffaaee'); }
    }
  },
  dimensionist: {
    id: 'dimensionist', name: '차원술사', desc: '공간을 넘나드는 마법사',
    passive(p) { p.speed += 1; },
    basic(ctx) { shoot(ctx, { dmg: rollCrit(player.damage + 3), color: '#aa77ff' }); },
    secondary(ctx) { radialBlast(ctx.px, ctx.py, 6, rollCrit(player.damage + 3), '#aa77ff'); },
    skills: {
      shift() { dashTowardMouse(200); },
      e(ctx) { radialBlast(ctx.px, ctx.py, 10, rollCrit(player.damage + 6), '#aa77ff'); },
      q(ctx) { smallHeal(1); },
      r(ctx) { radialBlast(ctx.px, ctx.py, 20, rollCrit(player.damage + 15), '#aa77ff'); }
    }
  },
  creator: {
    id: 'creator', name: '창조자', desc: '[히든] 모든 것의 창조자',
    passive(p) { p.damage *= 2; p.maxHearts += 5; p.speed += 1; },
    basic(ctx) { shoot(ctx, { dmg: rollCrit(player.damage + 8), color: '#ffffff' }); },
    secondary(ctx) { radialBlast(ctx.px, ctx.py, 10, rollCrit(player.damage + 8), '#ffffff'); },
    skills: {
      shift() { dashTowardMouse(300); },
      e(ctx) { radialBlast(ctx.px, ctx.py, 16, rollCrit(player.damage + 12), '#ffffff'); },
      q(ctx) { smallHeal(2); },
      r(ctx) { radialBlast(ctx.px, ctx.py, 40, rollCrit(player.damage + 30), '#ffffff'); floatingText.push(new FloatText(player.x, player.y - 80, '세계 재창조!', '#fff')); }
    }
  }
};

export const regionJobs = {
  '숲': [JOBS.druid, JOBS.lumberjack, JOBS.spiritMage, JOBS.elf],
  '정글': [JOBS.explorer, JOBS.painter, JOBS.shaman],
  '설원': [JOBS.medium, JOBS.inueet, JOBS.steampunk, JOBS.chronos],
  '제국': [JOBS.soldier, JOBS.priest, JOBS.necromancer],
  '화산': [JOBS.miner, JOBS.terrorist, JOBS.blacksmith],
  '사막': [JOBS.gunseller, JOBS.collector, JOBS.transcendent],
  '황혼': [JOBS.wizard, JOBS.elementalist, JOBS.dimensionist, JOBS.creator]
};
