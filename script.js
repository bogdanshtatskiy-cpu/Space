import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import * as CANNON from "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js";

let currentLang = 'uk';
let isSpinning = false;

// ---- Magic phrases / UI ----
const magicPhrases = {
  ru: ["Бесспорно","Предрешено","Никаких сомнений","Определенно да","Можешь быть уверен","Мне кажется — да","Вероятнее всего","Хорошие перспективы","Знаки говорят — да","Да","Пока не ясно","Спроси позже","Лучше не рассказывать","Сконцентрируйся и спроси","Даже не думай","Мой ответ — нет","По моим данным — нет","Перспективы не очень","Весьма сомнительно","Звезды в шоке","А оно тебе надо?","Забей","Спроси у мамы","Не сегодня","Успокойся","Рискни","Это фиаско"],
  uk: ["Безперечно","Це вирішено","Жодних сумнівів","Безумовно так","Можеш бути впевнений","Мені здається — так","Найімовірніше","Хороші перспективи","Знаки кажуть — так","Так","Поки не ясно","Спитай пізніше","Краще не розповідати","Сконцентруйся і спитай","Навіть не думай","Мій відповідь — ні","За моїми даними — ні","Перспективи не дуже","Дуже сумнівно","Зірки в шоці","А воно тобі треба?","Забий","Спитай у мами","Не сьогодні","Заспокойся","Ризикни","Це фіаско"]
};

const uiText = {
  uk: { ball_title:"Куля Долі", d6_title:"Кубик D6", d20_title:"Кубик D20", rand_title:"Рандом", coin_title:"Монетка", slots_title:"Слоти", back:"Назад", ball_hint:"Натисни на кулю", tap_roll:"Натисни, щоб кинути", rand_limit_label:"Максимум:", generate:"Старт", spin_btn:"КРУТИТИ", heads:"ОРЕЛ", tails:"РЕШКА", win:"ВИГРАШ!", lose:"СПРОБУЙ ЩЕ" },
  ru: { ball_title:"Шар Судьбы", d6_title:"Кубик D6", d20_title:"Кубик D20", rand_title:"Рандомайзер", coin_title:"Монетка", slots_title:"Слоты", back:"Назад", ball_hint:"Нажми на шар", tap_roll:"Нажми, чтобы бросить", rand_limit_label:"Максимум:", generate:"Старт", spin_btn:"КРУТИТЬ", heads:"ОРЕЛ", tails:"РЕШКА", win:"ПОБЕДА!", lose:"ПОПРОБУЙ ЕЩЕ" }
};

const slotSymbols = ["🍒", "🍋", "🍇", "💎", "7️⃣", "🔔"];

// ============
// Navigation
// ============
function openTool(toolId) {
  const menu = document.getElementById('menu-screen');
  const tool = document.getElementById(toolId + '-screen');
  if (menu && tool) {
    menu.classList.remove('active');
    setTimeout(() => {
      menu.style.display = 'none';
      tool.style.display = 'flex';
      setTimeout(() => tool.classList.add('active'), 10);
    }, 200);
  }
}

function goBack() {
  const active = document.querySelector('.screen.active');
  if(active) active.classList.remove('active');
  setTimeout(() => {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    const menu = document.getElementById('menu-screen');
    menu.style.display = 'flex';
    setTimeout(() => menu.classList.add('active'), 10);
  }, 200);
}

// ============
// Language
// ============
function setLang(lang) {
  currentLang = lang;

  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  if (typeof event !== "undefined" && event && event.target) event.target.classList.add('active');

  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.getAttribute('data-key');
    if (uiText[lang][key]) el.innerText = uiText[lang][key];
  });

  const h = document.getElementById('coin-heads');
  const t = document.getElementById('coin-tails');
  if (h) h.innerText = uiText[lang].heads;
  if (t) t.innerText = uiText[lang].tails;
}

// ============
// Magic Ball
// ============
function askBall() {
  const ballOuter = document.querySelector('.magic-ball-outer');
  const textEl = document.getElementById('ball-text');
  const answers = magicPhrases[currentLang];

  textEl.style.opacity = 0;
  ballOuter.classList.add('ball-animate');
  setTimeout(() => ballOuter.classList.remove('ball-animate'), 600);

  setTimeout(() => {
    textEl.innerText = answers[Math.floor(Math.random() * answers.length)];
    textEl.style.opacity = 1;
  }, 600);
}

// ============
// D6
// ============
function rollD6() {
  const cube = document.getElementById('dice-cube');
  const result = Math.floor(Math.random() * 6) + 1;

  let x = 0, y = 0;
  switch(result) {
    case 1: x=0; y=0; break;
    case 6: x=0; y=180; break;
    case 2: x=90; y=0; break;
    case 5: x=-90; y=0; break;
    case 3: x=0; y=-90; break;
    case 4: x=0; y=90; break;
  }

  x += 360 * 3 + (Math.random() * 20 - 10);
  y += 360 * 3 + (Math.random() * 20 - 10);

  cube.style.transition = "transform 0.8s ease-in-out";
  cube.style.transform = `rotateX(${x}deg) rotateY(${y}deg)`;

  setTimeout(() => {
    const cleanX = Math.round(x / 90) * 90;
    const cleanY = Math.round(y / 90) * 90;
    cube.style.transform = `rotateX(${cleanX}deg) rotateY(${cleanY}deg)`;
  }, 800);
}

// ============
// Slots
// ============
function spinSlots() {
  if(isSpinning) return;
  isSpinning = true;

  document.getElementById('slot-msg').innerText = "";
  const reels = [document.getElementById('reel-1'), document.getElementById('reel-2'), document.getElementById('reel-3')];
  reels.forEach(r => r.classList.add('blur'));

  let intervals = reels.map(reel => setInterval(() => {
    reel.innerText = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
  }, 50));

  let results = [];

  setTimeout(() => { clearInterval(intervals[0]); reels[0].classList.remove('blur'); results[0] = reels[0].innerText; }, 1000);
  setTimeout(() => { clearInterval(intervals[1]); reels[1].classList.remove('blur'); results[1] = reels[1].innerText; }, 1500);
  setTimeout(() => {
    clearInterval(intervals[2]);
    reels[2].classList.remove('blur');
    results[2] = reels[2].innerText;
    checkWin(results);
    isSpinning = false;
  }, 2000);
}

function checkWin(results) {
  const msg = document.getElementById('slot-msg');
  if (results[0] === results[1] && results[1] === results[2]) {
    msg.innerText = uiText[currentLang].win + " 🏆";
    msg.style.color = "#00ff00";
  } else {
    msg.innerText = uiText[currentLang].lose;
    msg.style.color = "rgba(255,255,255,0.5)";
  }
}

// ============
// Coin
// ============
function flipCoin() {
  const coin = document.getElementById('coin');
  const outcome = Math.random() < 0.5 ? 0 : 1;

  coin.style.transition = 'none';
  coin.style.transform = 'rotateY(0deg)';

  setTimeout(() => {
    coin.style.transition = 'transform 2.5s cubic-bezier(0.1, 0.9, 0.2, 1)';
    const rotation = 1800 + (outcome * 180);
    coin.style.transform = `rotateY(${rotation}deg)`;
  }, 50);
}

// ============
// Randomizer
// ============
function generateRandom() {
  const maxInput = document.getElementById('rand-max');
  const max = parseInt(maxInput.value) || 100;
  const disp = document.getElementById('rand-display');

  let counter = 0;
  let interval = setInterval(() => {
    disp.innerText = Math.floor(Math.random() * max) + 1;
    counter++;
    if(counter > 15) {
      clearInterval(interval);
      disp.innerText = Math.floor(Math.random() * max) + 1;
    }
  }, 50);
}

// ======================
// D20: Three.js + Cannon
// ======================
let d20Inited = false;
let d20Busy = false;
let d20TapLockUntil = 0;

let scene, camera, renderer;
let world, diceBody, diceMesh, diceGeo;
let wrapEl, resultEl, wrapperEl;

function initD20() {
  wrapEl = document.getElementById("d20-canvas-wrap");
  resultEl = document.getElementById("d20-result");
  wrapperEl = document.querySelector(".d20-wrapper");
  if (!wrapEl || d20Inited) return;

  // THREE
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 4.2, 7.5);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(wrapEl.clientWidth, wrapEl.clientHeight, false);
  wrapEl.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x88aaff, 0.55));
  const dir = new THREE.DirectionalLight(0xffffff, 1.1);
  dir.position.set(4, 8, 6);
  scene.add(dir);

  // ground visual
  const groundMesh = new THREE.Mesh(
    new THREE.CircleGeometry(4.0, 64),
    new THREE.MeshStandardMaterial({ color: 0x0a84ff, transparent: true, opacity: 0.12 })
  );
  groundMesh.rotation.x = -Math.PI/2;
  groundMesh.position.y = -1.2;
  scene.add(groundMesh);

  // dice
  const r = 1.25;
  diceGeo = new THREE.IcosahedronGeometry(r, 0); // d20 форма [web:83]
  const mat = new THREE.MeshStandardMaterial({ color: 0x0a84ff, metalness: 0.25, roughness: 0.2 });
  diceMesh = new THREE.Mesh(diceGeo, mat);
  scene.add(diceMesh);

  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(diceGeo),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 })
  );
  diceMesh.add(wire);

  // physics
  world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -18, 0),
    allowSleep: true
  });

  // Сферическая коллизия = стабильность и “как настоящий” визуально
  diceBody = new CANNON.Body({
    mass: 1.2,
    shape: new CANNON.Sphere(r * 0.98),
    angularDamping: 0.15,
    linearDamping: 0.12
  });
  diceBody.position.set(0, 2.0, 0);
  world.addBody(diceBody);

  const groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
  groundBody.quaternion.setFromEuler(-Math.PI/2, 0, 0);
  groundBody.position.set(0, -1.2, 0);
  world.addBody(groundBody);

  // walls
  const wallDist = 3.2;
  const wallH = 2.8;
  const wallShape = new CANNON.Plane();
  function addWall(px, py, pz, ex, ey, ez) {
    const b = new CANNON.Body({ mass: 0, shape: wallShape });
    b.position.set(px, py, pz);
    b.quaternion.setFromEuler(ex, ey, ez);
    world.addBody(b);
  }
  addWall(-wallDist, -1.2 + wallH/2, 0, 0,  Math.PI/2, 0);
  addWall( wallDist, -1.2 + wallH/2, 0, 0, -Math.PI/2, 0);
  addWall(0, -1.2 + wallH/2, -wallDist, 0, 0, 0);
  addWall(0, -1.2 + wallH/2,  wallDist, 0, Math.PI, 0);

  requestAnimationFrame(loop);
  d20Inited = true;
}

function resizeD20IfNeeded() {
  const w = wrapEl.clientWidth;
  const h = wrapEl.clientHeight;
  const need =
    renderer.domElement.width !== Math.floor(w * renderer.getPixelRatio()) ||
    renderer.domElement.height !== Math.floor(h * renderer.getPixelRatio());
  if (!need) return;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

function loop() {
  if (d20Inited) {
    resizeD20IfNeeded();
    world.fixedStep(1/60);

    diceMesh.position.copy(diceBody.position);
    diceMesh.quaternion.copy(diceBody.quaternion);

    renderer.render(scene, camera);
  }
  requestAnimationFrame(loop);
}

function readTopFaceValue() {
  const up = new THREE.Vector3(0, 1, 0);
  const pos = diceGeo.attributes.position;
  const index = diceGeo.index;

  let bestDot = -Infinity;
  let bestFace = 1;

  const q = diceMesh.quaternion;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const ab = new THREE.Vector3(), ac = new THREE.Vector3(), n = new THREE.Vector3();

  const faceCount = index ? index.count / 3 : pos.count / 3;
  for (let f = 0; f < faceCount; f++) {
    let ia, ib, ic;
    if (index) {
      ia = index.getX(f*3+0);
      ib = index.getX(f*3+1);
      ic = index.getX(f*3+2);
    } else {
      ia = f*3+0; ib = f*3+1; ic = f*3+2;
    }

    a.fromBufferAttribute(pos, ia);
    b.fromBufferAttribute(pos, ib);
    c.fromBufferAttribute(pos, ic);

    ab.subVectors(b, a);
    ac.subVectors(c, a);
    n.crossVectors(ab, ac).normalize();
    n.applyQuaternion(q);

    const dot = n.dot(up);
    if (dot > bestDot) {
      bestDot = dot;
      bestFace = f + 1;
    }
  }

  return bestFace; // 1..20 (номер треугольной грани)
}

function rollD20() {
  initD20(); // если экран открылся впервые

  const now = Date.now();
  if (d20Busy || now < d20TapLockUntil) return;
  d20Busy = true;
  d20TapLockUntil = now + 1700;

  wrapperEl.classList.remove("crit","fail");

  resultEl.style.opacity = 0;
  resultEl.style.transform = "translate(-50%, -50%) scale(0.6)";

  diceBody.velocity.set(0, 0, 0);
  diceBody.angularVelocity.set(0, 0, 0);
  diceBody.position.set((Math.random()*0.6-0.3), 2.2, (Math.random()*0.6-0.3));
  diceBody.quaternion.setFromEuler(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);

  const fx = (Math.random()*2-1) * 3.5;
  const fz = (Math.random()*2-1) * 3.5;
  diceBody.applyImpulse(new CANNON.Vec3(fx, 6.5, fz), new CANNON.Vec3(0.2, 0, 0.15));

  setTimeout(() => {
    diceBody.angularDamping = 0.35;
    diceBody.linearDamping = 0.25;
  }, 700);

  setTimeout(() => {
    const value = readTopFaceValue();

    resultEl.innerText = value;
    if (value === 20) wrapperEl.classList.add("crit");
    if (value === 1) wrapperEl.classList.add("fail");

    resultEl.style.opacity = 1;
    resultEl.style.transform = "translate(-50%, -50%) scale(1)";

    setTimeout(() => {
      diceBody.angularDamping = 0.15;
      diceBody.linearDamping = 0.12;
      d20Busy = false;
    }, 200);
  }, 1500);
}

// init on load (и сразу язык)
document.addEventListener("DOMContentLoaded", () => {
  setLang("uk");
  initD20();
});

// IMPORTANT: вернуть функции в global scope для HTML onclick [web:97]
Object.assign(window, {
  setLang,
  openTool,
  goBack,
  askBall,
  rollD6,
  rollD20,
  spinSlots,
  flipCoin,
  generateRandom
});
