// js/enemy/monsterDB.js

export const MONSTER_DB = {
  // 🟢 슬라임 (일반 몬스터)
  slime: {
    type: "monster",      // monster 또는 boss
    name: "슬라임",
    width: 40,
    height: 30,
    hp: 40,
    dmg: 7,
    speed: 1.4,
    touchInterval: 1.0,   // 공격 주기 (초)
    ai: "chase",          // AI 타입 (추적형)
    imgPath: "./Resource/Monster/slime/",
    animations: {
      idle: ["slime.jpg"], 
      walk: ["slime.jpg"], // 걷는 이미지가 따로 있다면 교체
      die: ["slime.jpg"]   // 사망 이미지가 따로 있다면 교체
    }
  },

  // 🔴 더미 보스
  DummyBoss: {
    type: "boss",
    name: "더미 보스",
    width: 180,
    height: 240,
    hp: 1000,
    dmg: 15,
    speed: 0,             // 움직이지 않음
    touchInterval: 0.5,
    ai: "stationary",     // AI 타입 (고정형)
    imgPath: "./Resource/Boss/",
    animations: {
      idle: ["Boss.jpg"],
      attack: ["Boss.jpg"],
      die: ["Boss.jpg"]
    }
  }
};
