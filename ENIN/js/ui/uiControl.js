import { player } from '../player/player.js';
import { gameState, FloatText, floatingText, setPaused } from '../state.js';
import { jobInventory, addJob, currentJob } from '../job/jobSystem.js';
import { regionJobs, JOBS } from '../job/jobDB.js'; 
import { spawnEntity } from '../enemy/monster.js';

// ======================================================
// 1️⃣ DOM 요소 참조
// ======================================================
export const uiRefs = {
  // 상단 정보
  regionChip: document.getElementById('region-chip'),
  coinChip: document.getElementById('coin-chip'),
  jobChip: document.getElementById('job-chip'),
  statChip: document.getElementById('stat-chip'),
  heartsEl: document.getElementById('hearts'),

  // 패널들
  shopEl: document.getElementById('shop'),
  invEl: document.getElementById('inventory'),
  settingsEl: document.getElementById('settings'),
  skillPanel: document.getElementById('skill-panel'),
  jobPanel: document.getElementById('job-panel'),
  ctrlPanel: document.getElementById('control-panel'),

  // 상점 내부
  shopListEl: document.getElementById('shop-list'),
  shopCoinEl: document.getElementById('shop-coin'),

  // 인벤토리 내부
  weaponGrid: document.getElementById('weapon-grid'),
  skillGrid: document.getElementById('skill-grid'),
  jobListEl: document.getElementById('job-list'),

  // 설정
  volSlider: document.getElementById('vol'),
  volVal: document.getElementById('vol-val'),
  fullscreenBtn: document.getElementById('fullscreenBtn'),

  // 몬스터 제어 및 디버그
  toggleSpawnChk: document.getElementById('toggle-spawn-chk'),
  spawnSlimeBtn: document.getElementById('spawn-slime'),
  spawnBossBtn: document.getElementById('spawn-boss'),
  clearMonBtn: document.getElementById('clear-monsters'),
  ctrlClose: document.getElementById('ctrl-close'),
  jobButtonsContainer: document.getElementById('job-buttons'), // 디버그용 직업 버튼
};

// ======================================================
// 2️⃣ HUD 및 상태 업데이트
// ======================================================

export function updateMetaUI() {
  if (uiRefs.coinChip) uiRefs.coinChip.textContent = '코인: ' + Math.floor(player.coins);
  if (uiRefs.regionChip) uiRefs.regionChip.textContent = '지역: ' + gameState.currentRegion;
  if (uiRefs.statChip) {
    uiRefs.statChip.textContent = `DMG ${player.damage} | CRIT ${Math.round(player.critChance * 100)}% | x${player.critMult}`;
  }
}

export function updateHeartsUI() {
  if (!uiRefs.heartsEl) return;
  uiRefs.heartsEl.innerHTML = '';
  for (let i = 0; i < player.maxHearts; i++) {
    const d = document.createElement('div');
    d.className = 'heart' + (i < player.hearts ? '' : ' empty');
    uiRefs.heartsEl.appendChild(d);
  }
}

export function refreshJobUI() {
  const cj = currentJob();
  if (uiRefs.jobChip) uiRefs.jobChip.textContent = `직업: ${cj.name}`;
  // 직업 패널이나 디버그 버튼 상태 갱신 필요 시 호출
  renderJobPanel(); 
}

// ======================================================
// 3️⃣ 패널 제어 (열기/닫기)
// ======================================================

export function togglePanel(panelEl) {
  if (!panelEl) return;
  const wasHidden = panelEl.classList.contains('hidden');
  
  [uiRefs.shopEl, uiRefs.invEl, uiRefs.settingsEl, uiRefs.skillPanel, uiRefs.jobPanel].forEach(p => {
    if(p) p.classList.add('hidden');
  });

  if (wasHidden) {
    panelEl.classList.remove('hidden');
    setPaused(true);
    
    if (panelEl === uiRefs.shopEl) renderShop();
    if (panelEl === uiRefs.invEl) renderInventory();
    if (panelEl === uiRefs.jobPanel) renderJobPanel();
    if (panelEl === uiRefs.skillPanel) renderSkillPanel();
  } else {
    setPaused(false);
  }
}

document.querySelectorAll('.xbtn').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-close');
    const target = document.getElementById(id);
    if (target) {
      target.classList.add('hidden');
      setPaused(false);
    }
  });
});

// ======================================================
// 4️⃣ 상점 시스템
// ======================================================
const JOB_COST = 25;

export function renderShop() {
  if (!uiRefs.shopListEl) return;
  
  const regionPool = regionJobs[gameState.currentRegion] || [];
  const offers = regionPool.filter(job => !jobInventory.some(j => j && j.id === job.id)).slice(0, 3);

  uiRefs.shopListEl.innerHTML = '';
  
  if (offers.length === 0) {
    uiRefs.shopListEl.innerHTML = '<div style="padding:20px; text-align:center;">판매할 직업이 없습니다.</div>';
  }

  offers.forEach(job => {
    const div = document.createElement('div');
    div.className = 'shop-item';
    div.innerHTML = `
      <div class="meta">
        <div class="name">${job.name}</div>
        <div class="desc">${job.desc}</div>
      </div>
      <button>구매 ${JOB_COST} G</button>`;
    
    const btn = div.querySelector('button');
    btn.disabled = player.coins < JOB_COST;
    
    btn.addEventListener('click', () => {
      if (player.coins >= JOB_COST) {
        if (addJob(job)) {
          player.coins -= JOB_COST;
          updateMetaUI();
          floatingText.push(new FloatText(player.x, player.y - 70, '구매 완료!', '#ffd700'));
          renderShop(); 
        }
      }
    });
    uiRefs.shopListEl.appendChild(div);
  });

  if (uiRefs.shopCoinEl) uiRefs.shopCoinEl.textContent = '보유 코인: ' + Math.floor(player.coins);
}

// ======================================================
// 5️⃣ 인벤토리 & 스킬
// ======================================================
function renderInventory() {
    // 무기 그리드 로직 (생략 - 필요 시 추가)
}

function renderSkillPanel() {
  const container = document.getElementById('skill-list-container');
  if (!container) return;
  container.innerHTML = '';

  const allSkills = [];
  jobInventory.forEach(job => {
    if (!job || !job.skills) return;
    Object.entries(job.skills).forEach(([key, func]) => {
      allSkills.push({ jobName: job.name, key, name: `${job.name} - ${key.toUpperCase()}` });
    });
  });

  allSkills.forEach((skill) => {
    const cell = document.createElement('div');
    cell.className = 'skill-cell';
    cell.textContent = skill.name;
    cell.draggable = true;
    cell.style.background = '#333';
    cell.style.margin = '4px';
    cell.style.padding = '8px';

    cell.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('skillJob', skill.jobName);
      e.dataTransfer.setData('skillKey', skill.key);
    });
    container.appendChild(cell);
  });
}

function initSkillDragDrop() {
    const slots = document.querySelectorAll('.skill-equip-slot');
    slots.forEach(slot => {
        slot.addEventListener('dragover', e => e.preventDefault());
        slot.addEventListener('drop', e => {
            const jobName = e.dataTransfer.getData('skillJob');
            const skillKey = e.dataTransfer.getData('skillKey');
            slot.textContent = `${jobName} - ${skillKey.toUpperCase()}`;
            slot.style.background = '#2a5';
        });
    });
}

// ======================================================
// 6️⃣ 직업 패널 & 디버그 버튼
// ======================================================

export function renderJobPanel() {
  const container = document.getElementById('job-slot-container');
  if (!container) return;
  container.innerHTML = '';

  for (let i = 0; i < 3; i++) {
    const ji = jobInventory[i];
    const slot = document.createElement('div');
    slot.className = 'job-slot';
    slot.style.border = '1px solid #666';
    slot.style.margin = '10px';
    slot.style.padding = '20px';

    if (ji) {
      slot.classList.add('filled');
      slot.innerHTML = `
        <div style="font-size:1.2em; font-weight:bold; color:#fdb;">${ji.name}</div>
        <div style="font-size:0.8em; color:#ccc;">${ji.desc}</div>
        <button class="drop-job-btn" style="margin-top:10px; background:#a33;">버리기</button>
      `;
      slot.querySelector('.drop-job-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm('직업을 버리시겠습니까?')) {
            jobInventory[i] = null;
            player.applyPassives();
            renderJobPanel();
            updateMetaUI();
          }
      });
    } else {
      slot.innerHTML = `<div style="color:#555;">(빈 슬롯)</div>`;
    }
    container.appendChild(slot);
  }
}

// ★ jobSystem.js에서 import하는 함수 (디버그 패널용)
export function renderJobButtons() {
    if (!uiRefs.jobButtonsContainer) return;
    uiRefs.jobButtonsContainer.innerHTML = '';
    
    // 모든 직업 목록을 버튼으로 표시
    Object.values(JOBS).forEach(job => {
        const btn = document.createElement('button');
        btn.textContent = job.name;
        btn.style.margin = '3px';
        btn.addEventListener('click', () => {
            if(addJob(job)) {
                floatingText.push(new FloatText(player.x, player.y - 70, `${job.name} 획득!`, '#b4f0ff'));
            }
        });
        uiRefs.jobButtonsContainer.appendChild(btn);
    });
}

// ======================================================
// 7️⃣ 초기화 및 기타
// ======================================================

export function initMonsterControls() {
    if (uiRefs.spawnSlimeBtn) uiRefs.spawnSlimeBtn.onclick = () => spawnEntity('slime', player.x + 200, 750);
    if (uiRefs.spawnBossBtn) uiRefs.spawnBossBtn.onclick = () => spawnEntity('DummyBoss', player.x + 400, 750);
    if (uiRefs.clearMonBtn) uiRefs.clearMonBtn.onclick = () => { gameState.monsters = []; gameState.boss = null; };
    if (uiRefs.ctrlClose) uiRefs.ctrlClose.onclick = () => uiRefs.ctrlPanel.classList.add('hidden');
}

// (수정) 함수로 감싸서, main.js가 부를 때까지 기다림
export function initUI() {
    initSkillDragDrop();
    initMonsterControls();
    renderJobButtons();
    updateMetaUI();
    console.log("✅ UI Initialized");
}
