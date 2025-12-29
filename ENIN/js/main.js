import { gameState } from './state.js';
import { chooseRegion } from './map/map.js';
import { gameLoop } from './gameLoop.js';
// 필요한 초기화 모듈 import
import './input.js'; 
import './ui/uiControl.js';

// 초기 설정
gameState.currentRegion = chooseRegion();

// 루프 시작
requestAnimationFrame(gameLoop);

console.log("Game Modules Loaded.");
