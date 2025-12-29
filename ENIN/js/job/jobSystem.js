import { JOBS } from './jobDB.js';
import { player } from '../player/player.js';
import { floatingText, FloatText, nowSec, mapWidth } from '../state.js';
import { mouse } from '../input.js';
import { updateMetaUI, refreshJobUI, renderJobButtons } from '../ui/uiControl.js';

export let jobInventory = [null, null, null];
let activeJobIdx = -1;

export function currentJob() { return jobInventory[activeJobIdx] || JOBS.adventurer; }

export function addJob(jobObj) {
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
      return true;
    }
  }
  floatingText.push(new FloatText(player.x, player.y - 80, '직업 슬롯 가득참', '#ff9a9a'));
  return false;
}

// 초기 지급
if (!jobInventory[0]) addJob(JOBS.adventurer);

// === 전투 보조 함수 ===
export function dirToMouse() {
    const px = player.x + player.width / 2;
    const py = player.y - player.height / 2;
    const dx = mouse.x - px, dy = mouse.y - py;
    const len = Math.max(0.0001, Math.hypot(dx, dy));
    return { px, py, dx: dx / len, dy: dy / len, ang: Math.atan2(dy, dx) };
}

export function dashTowardMouse(dist) {
  const dirX = player.facing;
  player.x += dirX * dist;
  player.y -= dist * 0.1;
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > mapWidth) player.x = mapWidth - player.width;
}

// === 스킬 쿨다운 및 사용 ===
const skillCd = { shift: 0.6, e: 0.35, q: 8, r: 16 };
const skillLast = { shift: -99, e: -99, q: -99, r: -99 };
const cdReady = (k) => nowSec() - skillLast[k] >= skillCd[k];
const markCd = (k) => { skillLast[k] = nowSec(); };

export function useBasic() { const d = dirToMouse(); currentJob().basic(d); }
export function useSecondary() { const d = dirToMouse(); if (currentJob().secondary) currentJob().secondary(d); }

export function useEquippedSkill(k) {
    if (!cdReady(k)) return;
    const d = dirToMouse();
    const cj = currentJob();
    if (cj.skills && cj.skills[k]) { 
        cj.skills[k](d); 
        markCd(k); 
    }
}
