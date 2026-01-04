import { gameState } from './state.js';
import { chooseRegion } from './map/map.js';
import { gameLoop } from './gameLoop.js';
import './input.js'; 
import { initUI } from './ui/uiControl.js'; // ★ initUI 가져오기

// 1. 초기 지역 설정
gameState.currentRegion = chooseRegion();

// 2. UI 및 이벤트 리스너 초기화 (이제 여기서 안전하게 실행됨)
initUI();

// 3. 게임 루프 시작
requestAnimationFrame(gameLoop);

console.log("🚀 Game Started: Modules Loaded.");