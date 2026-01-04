import { togglePanel, uiRefs } from './ui/uiControl.js';
import { useEquippedSkill, useBasic, useSecondary } from './job/jobSystem.js';
import { gameState, isPaused } from './state.js'; // ★ 변경: isPaused를 state.js에서 가져옴
import { camera } from './rendering/draw.js';

export const keys = {};
export const mouse = { x: 0, y: 0 };
// 기존에 있던 export let isPaused... 코드는 삭제되었습니다.

let viewScale = 1; 
export const getViewScale = () => viewScale;

window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;

    if (k === 'v') togglePanel(uiRefs.invEl);
    if (k === 'escape') togglePanel(uiRefs.settingsEl);
    if (k === 'm') viewScale = viewScale === 1 ? 1.25 : 1;
    if (k === 'tab') { e.preventDefault(); gameState.showStats = !gameState.showStats; }
    
    // F8 키 디버그용 (추가 권장)
    if (e.key === "F8") document.getElementById('control-panel').classList.toggle("hidden");

    if (isPaused) return; // 가져온 isPaused 사용

    if (k === 'shift') useEquippedSkill('shift');
    if (k === 'e') useEquippedSkill('e');
    if (k === 'q') useEquippedSkill('q');
    if (k === 'r') useEquippedSkill('r');
});

window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

const canvas = document.getElementById('gameCanvas');
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) / viewScale + camera.x;
    mouse.y = (e.clientY - rect.top) / viewScale + camera.y;
});

canvas.addEventListener('mousedown', (e) => {
    if (isPaused) return;
    if (e.button === 0) useBasic();
    else if (e.button === 2) useSecondary();
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());