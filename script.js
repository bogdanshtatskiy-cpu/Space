import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import * as CANNON from "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js";

let currentLang = 'uk';
let isSpinning = false;

// --- UI TEXTS ---
const magicPhrases = {
  ru: ["Бесспорно","Предрешено","Никаких сомнений","Определенно да","Можешь быть уверен","Мне кажется — да","Вероятнее всего","Хорошие перспективы","Знаки говорят — да","Да","Пока не ясно","Спроси позже","Лучше не рассказывать","Сконцентрируйся и спроси","Даже не думай","Мой ответ — нет","По моим данным — нет","Перспективы не очень","Весьма сомнительно","Звезды в шоке","А оно тебе надо?","Забей","Спроси у мамы","Не сегодня","Успокойся","Рискни","Это фиаско"],
  uk: ["Безперечно","Це вирішено","Жодних сумнівів","Безумовно так","Можеш бути впевнений","Мені здається — так","Найімовірніше","Хороші перспективи","Знаки кажуть — так","Так","Поки не ясно","Спитай пізніше","Краще не розповідати","Сконцентруйся і спитай","Навіть не думай","Мій відповідь — ні","За моїми даними — ні","Перспективи не дуже","Дуже сумнівно","Зірки в шоці","А воно тобі треба?","Забий","Спитай у мами","Не сьогодні","Заспокойся","Ризикни","Це фіаско"]
};

const uiText = {
  uk: { ball_title:"Куля Долі", d6_title:"Кубик D6", d20_title:"Кубик D20", rand_title:"Рандом", coin_title:"Монетка", slots_title:"Слоти", back:"Назад", ball_hint:"Натисни на кулю", tap_roll:"Натисни, щоб кинути", rand_limit_label:"Максимум:", generate:"Старт", spin_btn:"КРУТИТИ", heads:"ОРЕЛ", tails:"РЕШКА", win:"ВИГРАШ!", lose:"СПРОБУЙ ЩЕ" },
  ru: { ball_title:"Шар Судьбы", d6_title:"Кубик D6", d20_title:"Кубик D20", rand_title:"Рандомайзер", coin_title:"Монетка", slots_title:"Слоты", back:"Назад", ball_hint:"Нажми на шар", tap_roll:"Нажми, чтобы бросить", rand_limit_label:"Максимум:", generate:"Старт", spin_btn:"КРУТИТЬ", heads:"ОРЕЛ", tails:"РЕШКА", win:"ПОБЕДА!", lose:"ПОПРОБУЙ ЕЩЕ" }
};

const slotSymbols = ["🍒", "🍋", "🍇", "💎", "7️⃣", "🔔"];

document.addEventListener('DOMContentLoaded', () => {
  setLang('uk');
  initD20();
});

// --- Language ---
window.setLang = function(lang) {
  currentLang = lang;

  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');

  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.getAttribute('data-key');
    if (uiText[lang][key]) el.innerText = uiText[lang][key];
  });

  const h = document.getElementById('coin-heads');
  const t = document.getElementById('coin-tails');
  if (h) h.innerText = uiText[lang].heads;
  if (t) t.innerText = uiText[lang].tails;
}

// --- Navigation ---
window.openTool = function(toolId) {
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

window.goBack = function() {
  const active = document.querySelector('.screen.active');
  if(active) active.classList.remove('active');
  setTimeout(() => {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    const menu = document.getElementById('menu-screen');
    menu.style.display = 'flex';
    setTimeout(() => menu.classList.add('active'), 10);
  }, 200);
}

// --- Magic Ball ---
window.askBall = function() {
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

// --- D6 ---
window.rollD6 = function() {
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

// --- Slots ---
window.spinSlots = function() {
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

// --- Coin ---
window.flipCoin = function() {
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

// --- Randomizer ---
window.generateRandom = function() {
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
// D20: three.js + cannon
// ======================
let d20 = null;

function initD20() {
  const wrap = document.getElementById("d20-canvas-wrap");
  if (!wrap || d20) return;

  // THREE
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 4.2, 7.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(wrap.clientWidth, wrap.clientHeight, false);
  wrap.appendChild(renderer.domElement);

  const light1 = new THREE.DirectionalLight(0xffffff, 1.1);
  light1.position.set(4, 8, 6);
  scene.add(light1);

  const light2 = new THREE.AmbientLight(0x88aaff, 0.55);
  scene.add(light2);

  // Ground (visual)
  const groundGeo = new THREE.CircleGeometry(4.0, 64);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x0a84ff, transparent: true, opacity: 0.12 });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = -1.2;
  scene.add(groundMesh);

  // Dice mesh
  const diceRadius = 1.25;
  const diceGeo = new THREE.IcosahedronGeometry(diceRadius, 0); // d20 shape [web:83]

  // Material
  const diceMat = new THREE.MeshStandardMaterial({
    color: 0x0a84ff,
    metalness: 0.25,
    roughness: 0.2
  });

  const diceMesh = new THREE.Mesh(diceGeo, diceMat);
  scene.add(diceMesh);

  // (Optional) wireframe lines for "edges"
  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(diceGeo),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 })
  );
  diceMesh.add(wire);

  // Face labels (20 sprites, one per face)
  const labels = makeFaceLabels(diceGeo);
  labels.forEach(s => diceMesh.add(s));

  // CANNON
  const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -18, 0),
    allowSleep: true
  });

  const diceBody = new CANNON.Body({
    mass: 1.2,
    shape: new CANNON.Sphere(diceRadius * 0.98), // стабильнее на мобилке
    angularDamping: 0.15,
    linearDamping: 0.12
  });
  diceBody.position.set(0, 1.8, 0);
  world.addBody(diceBody);

  const groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  groundBody.position.set(0, -1.2, 0);
  world.addBody(groundBody);

  // Walls (коробка)
  const wallDist = 3.2;
  const wallH = 2.8;
  const wallShape = new CANNON.Plane();

  const walls = [];
  function addWall(px, py, pz, ex, ey, ez) {
    const b = new CANNON.Body({ mass: 0, shape: wallShape });
    b.position.set(px, py, pz);
    b.quaternion.setFromEuler(ex, ey, ez);
    world.addBody(b);
    walls.push(b);
  }
  addWall(-wallDist, -1.2 + wallH/2, 0, 0, Math.PI/2, 0);
  addWall( wallDist, -1.2 + wallH/2, 0, 0, -Math.PI/2, 0);
  addWall(0, -1.2 + wallH/2, -wallDist, 0, 0, 0);
  addWall(0, -1.2 + wallH/2,  wallDist, 0, Math.PI, 0);

  // state
  const resultEl = document.getElementById("d20-result");
  const wrapper = document.querySelector(".d20-wrapper");
  let busy = false;
  let tapLockUntil = 0;

  function resizeIfNeeded() {
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    const need = (renderer.domElement.width !== Math.floor(w * renderer.getPixelRatio())) ||
                 (renderer.domElement.height !== Math.floor(h * renderer.getPixelRatio()));
    if (!need) return;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  function step() {
    resizeIfNeeded();
    world.fixedStep(1/60);

    diceMesh.position.copy(diceBody.position);
    diceMesh.quaternion.copy(diceBody.quaternion);

    renderer.render(scene, camera);
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);

  // compute result: choose face whose normal is most aligned with world up
  function readTopFace() {
    const up = new THREE.Vector3(0, 1, 0);

    // Geometry in modern three is BufferGeometry; use normal attribute.
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
      n.applyQuaternion(q); // rotate normal into world

      const dot = n.dot(up);
      if (dot > bestDot) {
        bestDot = dot;
        bestFace = f + 1; // face index 1..20
      }
    }

    // Map faceIndex -> dice value 1..20.
    // Для простоты: значение = номер грани. Если хочешь “реальную раскладку d20” (как на настоящем),
    // сделаю точный маппинг под твою текстуру/нумерацию.
    return bestFace;
  }

  // roll handler
  window.rollD20 = function() {
    const now = Date.now();
    if (busy || now < tapLockUntil) return;
    busy = true;
    tapLockUntil = now + 1700;

    wrapper.classList.remove("crit", "fail");

    resultEl.style.opacity = 0;
    resultEl.style.transform = "translate(-50%, -50%) scale(0.6)";

    // reset
    diceBody.velocity.set(0, 0, 0);
    diceBody.angularVelocity.set(0, 0, 0);
    diceBody.position.set((Math.random()*0.6-0.3), 2.2, (Math.random()*0.6-0.3));
    diceBody.quaternion.setFromEuler(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);

    // impulse + spin
    const fx = (Math.random()*2-1) * 3.5;
    const fz = (Math.random()*2-1) * 3.5;
    diceBody.applyImpulse(new CANNON.Vec3(fx, 6.5, fz), new CANNON.Vec3(0.2, 0, 0.15));

    // wait to settle
    setTimeout(() => {
      // “успокоить” чуть сильнее, чтобы не крутился бесконечно
      diceBody.angularDamping = 0.35;
      diceBody.linearDamping = 0.25;
    }, 700);

    setTimeout(() => {
      const value = readTopFace();

      resultEl.innerText = value;
      if (value === 20) wrapper.classList.add("crit");
      if (value === 1) wrapper.classList.add("fail");

      resultEl.style.opacity = 1;
      resultEl.style.transform = "translate(-50%, -50%) scale(1)";

      // вернуть демпферы к обычным для следующего броска
      setTimeout(() => {
        diceBody.angularDamping = 0.15;
        diceBody.linearDamping = 0.12;
        busy = false;
      }, 200);
    }, 1500);
  };

  d20 = { scene, camera, renderer, world, diceMesh, diceBody };
}

// Create 20 number sprites placed at each face center
function makeFaceLabels(geo) {
  const pos = geo.attributes.position;
  const index = geo.index;
  const faceCount = index ? index.count / 3 : pos.count / 3;

  const labels = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), center = new THREE.Vector3();

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

    center.addVectors(a, b).add(c).multiplyScalar(1/3);

    const sprite = makeTextSprite(String(f + 1));
    sprite.position.copy(center.clone().multiplyScalar(1.02)); // чуть наружу
    sprite.scale.set(0.9, 0.45, 1);
    labels.push(sprite);
  }

  return labels;
}

function makeTextSprite(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fill
