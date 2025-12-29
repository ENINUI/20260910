import { togglePanel, uiRefs } from './ui/uiControl.js';
import { useEquippedSkill, useBasic, useSecondary } from './job/jobSystem.js';
import { gameState } from './state.js';
import { camera } from './rendering/draw.js';

export const keys = {};
export const mouse = { x: 0, y: 0 };
export let isPaused = false;
export const setPaused = (v) => { isPaused = v; };

let viewScale = 1; 
export const getViewScale = () => viewScale;

window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;

    if (k === 'v') togglePanel(uiRefs.invEl);
    if (k === 'escape') togglePanel(uiRefs.settingsEl);
    if (k === 'm') viewScale = viewScale === 1 ? 1.25 : 1;
    if (k === 'tab') { e.preventDefault(); gameState.showStats = !gameState.showStats; }
    
    if (isPaused) return;

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
