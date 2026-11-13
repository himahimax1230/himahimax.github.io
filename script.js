const hasPlayedOpeningShutter = sessionStorage.getItem('openingShutterPlayed') === 'true';
if (hasPlayedOpeningShutter) {
  document.getElementById('shutter').remove();
} else {
  sessionStorage.setItem('openingShutterPlayed', 'true');
}

const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
const shutter = document.getElementById('shutter');

let width, height;
let lines = [];
let mode = 'spectrum'; // 'spectrum'（スペクトラム） -> 'text'（文字形成）
let time = 0;

const TARGET_TEXT = '飛沫。';
const CREAM_COLORS = ['#fdf6e2', '#f4ebd0', '#e6dec5'];

function init() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  createLineSegments();
}

// 文字の輪郭をスキャンし、「縦の線分」の集まりとしてデータ化する
function createLineSegments() {
  lines = [];
  const offCanvas = document.createElement('canvas');
  const offCtx = offCanvas.getContext('2d');
  offCanvas.width = width;
  offCanvas.height = height;

  const fontSize = Math.min(width * 0.13, 130);
  offCtx.font = `900 ${fontSize}px "Helvetica Neue", Arial, sans-serif`;
  offCtx.fillStyle = '#ffffff';
  offCtx.textAlign = 'center';
  offCtx.textBaseline = 'middle';
  offCtx.fillText(TARGET_TEXT, width / 2, height / 2);

  const imageData = offCtx.getImageData(0, 0, width, height).data;

  const stepX = width < 768 ? 5 : 6;
  const lineWidth = width < 768 ? 1.5 : 2;

  const specAreaWidth = Math.min(width * 0.75, 800);
  const specStartX = (width - specAreaWidth) / 2;

  for (let x = 0; x < width; x += stepX) {
    let inStroke = false;
    let startY = 0;

    for (let y = 0; y < height; y++) {
      const index = (y * width + x) * 4;
      const isFilled = imageData[index + 3] > 128;

      if (isFilled && !inStroke) {
        inStroke = true;
        startY = y;
      } else if (!isFilled && inStroke) {
        inStroke = false;
        const segmentHeight = y - startY;
        const normX = x / width;

        lines.push({
          x: specStartX + normX * specAreaWidth,
          y: height / 2,
          height: 2,
          width: lineWidth,
          targetX: x,
          targetY: startY,
          targetHeight: segmentHeight,
          specX: specStartX + normX * specAreaWidth,
          seed1: Math.random() * 100,
          seed2: Math.random() * 50,
          speed: 0.15 + Math.random() * 0.35,
          maxJump: 30 + Math.random() * 110,
          ease: 0.06 + Math.random() * 0.05,
          color: CREAM_COLORS[Math.floor(Math.random() * CREAM_COLORS.length)]
        });
      }
    }
  }
}

function animate() {
  ctx.fillStyle = 'rgba(18, 31, 23, 0.4)';
  ctx.fillRect(0, 0, width, height);

  time += 0.14;
  const centerY = height / 2 + 40;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];

    if (mode === 'spectrum') {
      const waveA = Math.sin(time * l.speed + l.seed1);
      const waveB = Math.cos(time * (l.speed * 1.7) - l.seed2);
      const spike = Math.pow(Math.abs(waveA * waveB), 1.5);

      const currentHeight = 4 + spike * l.maxJump;
      const targetY = centerY - currentHeight;

      l.x += (l.specX - l.x) * 0.15;
      l.y += (targetY - l.y) * 0.25;
      l.height += (currentHeight - l.height) * 0.25;
    } else if (mode === 'text') {
      l.x += (l.targetX - l.x) * l.ease;
      l.y += (l.targetY - l.y) * l.ease;
      l.height += (l.targetHeight - l.height) * l.ease;
    }

    ctx.fillStyle = l.color;
    ctx.fillRect(l.x, l.y, l.width, Math.max(1.5, l.height));
  }

  if (!shutter.classList.contains('is-open')) {
    requestAnimationFrame(animate);
  }
}

if (!hasPlayedOpeningShutter) {
  init();
  animate();

  // タイムライン制御
  setTimeout(() => {
    mode = 'text';
  }, 2800);

  setTimeout(() => {
    shutter.classList.add('is-open');
  }, 4800);
}

// ウィンドウサイズが変わったときの再計算
window.addEventListener('resize', () => {
  if (!hasPlayedOpeningShutter && !shutter.classList.contains('is-open')) {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    createLineSegments();
  }
});
