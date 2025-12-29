export const regions = ['숲', '정글', '설원', '제국', '화산', '사막'];
export const specialRegion = '황혼';
export const regionColors = {
  '숲': '#32CD32', '정글': '#1E8C3A', '설원': '#ADD8E6',
  '제국': '#FFD700', '화산': '#FF4500', '사막': '#DAA520', '황혼': '#9400D3'
};

export function chooseRegion() {
  const r = Math.random() * 100;
  return r < 1 ? specialRegion : regions[Math.floor(Math.random() * regions.length)];
}
