import * as THREE from 'three';
import { Dice, SUPPORTED_DICE_SIDES } from './dice.js';

const $ = id => document.getElementById(id);
const canvas = $('dice-canvas');
const stage = $('canvas-stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
scene.add(new THREE.HemisphereLight(0xfff8e8, 0x386a59, 2.8));
const keyLight = new THREE.DirectionalLight(0xfff3df, 3.2);
keyLight.position.set(-5, 8, 10);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xcce9ff, 1.8);
fillLight.position.set(6, -2, 5);
scene.add(fillLight);

const POSITIONS = {
  1: [[0, 0]],
  2: [[-2.7, 0], [2.7, 0]],
  3: [[-2.7, 2.5], [2.7, 2.5], [0, -2.5]],
  4: [[-2.7, 2.5], [2.7, 2.5], [-2.7, -2.5], [2.7, -2.5]],
};
const COLORS = [0xe69462, 0x499a89, 0x668dc7, 0xb787ad];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const storageKey = 'roll-it:3d:v1';
let diceArray = [];
let diceCount = 1;
let diceSides = 20;
let isRolling = false;
let contextLost = false;
let history = [];
try {
  const saved = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
  if (Array.isArray(saved)) {
    history = saved.slice(0, 30).filter(h => h && SUPPORTED_DICE_SIDES.includes(h.sides)
      && Number.isSafeInteger(h.num) && h.num > 0 && Array.isArray(h.values)
      && h.values.length >= 1 && h.values.length <= 4
      && h.values.every(v => Number.isInteger(v) && v >= 1 && v <= h.sides));
  }
} catch { /* Storage can be unavailable in private browsing. */ }
let rollCount = Math.max(0, ...history.map(h => h.num));
const rollBtn = $('roll-btn');
const selectors = document.querySelectorAll('.count-btn, .sides-btn');

function saveHistory() {
  try { sessionStorage.setItem(storageKey, JSON.stringify(history)); }
  catch { $('storage-note').textContent = '이 브라우저에서는 이동 후 기록을 유지할 수 없어요.'; }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

function renderHistory() {
  $('history-list').replaceChildren();
  $('history-count').textContent = history.length + '회';
  $('clear-btn').style.visibility = history.length ? 'visible' : 'hidden';
  if (!history.length) {
    $('history-list').append(element('div', 'history-empty', '첫 번째 행운을 기다리는 중. 한 번 던져볼까요?'));
  }
  for (const h of history) {
    const row = element('div', 'history-item', '');
    const values = element('div', 'hist-values', '');
    for (const value of h.values) values.append(element('span', 'mini-die', value));
    row.append(element('span', 'hist-num', h.num), element('span', 'hist-kind', 'D' + h.sides), values,
      element('span', 'hist-sum', h.values.reduce((a, b) => a + b, 0)));
    $('history-list').append(row);
  }
}

function resize() {
  const { width, height } = stage.getBoundingClientRect();
  camera.aspect = width / Math.max(height, 1);
  // Fit the complete group in the stage, including the result labels.
  const halfHeight = diceCount > 2 ? 6.4 : 4.2;
  const halfWidth = diceCount > 1 ? 5.5 : 3.3;
  camera.position.set(0, 0, Math.max(halfHeight, halfWidth / camera.aspect) / Math.tan(Math.PI / 8) + 3);
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function rebuildDice() {
  diceArray.forEach(d => d.dispose());
  diceArray = POSITIONS[diceCount].map(([x, y], index) => {
    const die = new Dice(scene, new THREE.Vector3(x, y, 0), diceSides);
    die.materials.forEach(material => {
      material.color.setHex(COLORS[index]);
      material.roughness = 0.3;
      material.metalness = 0.05;
      material.clearcoat = 0.45;
    });
    return die;
  });
  $('result-name').textContent = '준비됐나요?';
  $('result-name').className = 'clr-ready';
  $('result-desc').textContent = `D${diceSides} · ${diceCount}개를 굴려볼까요?`;
  resize();
}

selectors.forEach(btn => btn.addEventListener('click', () => {
  if (isRolling || contextLost) return;
  if (btn.dataset.count) diceCount = Number(btn.dataset.count);
  else diceSides = Number(btn.dataset.sides);
  selectors.forEach(control => {
    const active = control.dataset.count ? Number(control.dataset.count) === diceCount : Number(control.dataset.sides) === diceSides;
    control.classList.toggle('active', active);
    control.setAttribute('aria-pressed', String(active));
  });
  rebuildDice();
}));

async function roll() {
  if (isRolling || contextLost) return;
  isRolling = true;
  rollBtn.disabled = true;
  rollBtn.textContent = '굴리는 중…';
  selectors.forEach(btn => btn.disabled = true);
  $('clear-btn').disabled = true;
  $('result-area').setAttribute('aria-busy', 'true');
  $('result-name').className = 'clr-ready';
  $('result-name').textContent = '두근두근';
  $('result-desc').textContent = '어떤 숫자가 나올까요?';
  try {
    const values = await Promise.all(diceArray.map(d => d.roll()));
    if (contextLost) return;
    $('result-name').textContent = values.reduce((a, b) => a + b, 0);
    $('result-name').className = 'result-pop';
    $('result-desc').textContent = values.length > 1 ? values.join(' + ') + ' · 합계' : `D${diceSides} 결과`;
    history.unshift({ sides: diceSides, values, num: ++rollCount });
    history.splice(30);
    saveHistory();
    renderHistory();
    if (navigator.vibrate) navigator.vibrate(25);
  } catch {
    $('result-name').textContent = '다시 시도해 주세요';
    $('result-name').className = 'clr-ready';
    $('result-desc').textContent = '던지기를 완료하지 못했어요';
  } finally {
    isRolling = false;
    rollBtn.disabled = contextLost;
    rollBtn.textContent = contextLost ? '새로고침이 필요해요' : '다시 던지기';
    selectors.forEach(btn => btn.disabled = contextLost);
    $('clear-btn').disabled = false;
    $('result-area').setAttribute('aria-busy', 'false');
  }
}

rollBtn.addEventListener('click', roll);
$('clear-btn').addEventListener('click', () => {
  history = [];
  rollCount = 0;
  saveHistory();
  renderHistory();
});
document.addEventListener('keydown', event => {
  if (['Space', 'Enter'].includes(event.code) && document.activeElement === document.body) {
    event.preventDefault();
    roll();
  }
});
canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  contextLost = true;
  rollBtn.disabled = true;
  rollBtn.textContent = '새로고침이 필요해요';
  selectors.forEach(btn => btn.disabled = true);
  $('result-area').setAttribute('aria-busy', 'false');
  $('clear-btn').disabled = false;
  $('webgl-error').hidden = false;
});

const timer = new THREE.Timer();
timer.connect(document);
function animate() {
  requestAnimationFrame(animate);
  if (contextLost) return;
  timer.update();
  const delta = Math.min(timer.getDelta(), 0.05);
  // Keep the same physics but skip visible movement when motion is reduced.
  const steps = reducedMotion.matches && isRolling ? 120 : 1;
  for (let i = 0; i < steps; i++) diceArray.forEach(d => d.update(steps > 1 ? 1 / 60 : delta));
  if (!reducedMotion.matches || !isRolling) renderer.render(scene, camera);
}
new ResizeObserver(resize).observe(stage);
rebuildDice();
renderHistory();
rollBtn.disabled = false;
rollBtn.textContent = '주사위 던지기';
animate();
