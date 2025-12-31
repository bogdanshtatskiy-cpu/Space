// --- CONFIG & STATE ---
let currentLang = 'uk';
let isSpinning = false;
let d20Busy = false;

const magicPhrases = {
  ru: ["Бесспорно","Предрешено","Никаких сомнений","Определенно да","Можешь быть уверен","Мне кажется — да","Вероятнее всего","Хорошие перспективы","Знаки говорят — да","Да","Пока не ясно","Спроси позже","Лучше не рассказывать","Сконцентрируйся и спроси","Даже не думай","Мой ответ — нет","По моим данным — нет","Перспективы не очень","Весьма сомнительно","Звезды в шоке","А оно тебе надо?","Забей","Спроси у мамы","Не сегодня","Успокойся","Рискни","Это фиаско"],
  uk: ["Безперечно","Це вирішено","Жодних сумнівів","Безумовно так","Можеш бути впевнений","Мені здається — так","Найімовірніше","Хороші перспективи","Знаки кажуть — так","Так","Поки не ясно","Спитай пізніше","Краще не розповідати","Сконцентруйся і спитай","Навіть не думай","Мій відповідь — ні","За моїми даними — ні","Перспективи не дуже","Дуже сумнівно","Зірки в шоці","А воно тобі треба?","Забий","Спитай у мами","Не сьогодні","Заспокойся","Ризикни","Це фіаско"]
};

const uiText = {
  uk: { ball_title:"Куля Долі", d6_title:"Кубик D6", d20_title:"Кубик D20", rand_title:"Рандом", coin_title:"Монетка", slots_title:"Слоти", back:"Назад", ball_hint:"Натисни на кулю", tap_roll:"Натисни, щоб кинути", rand_limit_label:"Максимум:", generate:"Старт", spin_btn:"КРУТИТИ", heads:"ОРЕЛ", tails:"РЕШКА", win:"ВИГРАШ!", lose:"СПРОБУЙ ЩЕ" },
  ru: { ball_title:"Шар Судьбы", d6_title:"Кубик D6", d20_title:"Кубик D20", rand_title:"Рандомайзер", coin_title:"Монетка", slots_title:"Слоты", back:"Назад", ball_hint:"Нажми на шар", tap_roll:"Нажми, чтобы бросить", rand_limit_label:"Максимум:", generate:"Старт", spin_btn:"КРУТИТЬ", heads:"ОРЕЛ", tails:"РЕШКА", win:"ПОБЕДА!", lose:"ПОПРОБУЙ ЕЩЕ" }
};

const slotSymbols = ["🍒", "🍋", "🍇", "💎", "7️⃣", "🔔"];

document.addEventListener('DOMContentLoaded', () => { setLang('uk'); });

function setLang(lang) {
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

// --- D20 ---
const d20Orientations = {
  1:  { x:  20, y: -25,  z: 0 },
  2:  { x:  20, y: -97,  z: 0 },
  3:  { x:  20, y: -169, z: 0 },
  4:  { x:  20, y: -241, z: 0 },
  5:  { x:  20, y: -313, z: 0 },

  6:  { x:   0, y: -61,  z: 0 },
  7:  { x:   0, y: -133, z: 0 },
  8:  { x:   0, y: -205, z: 0 },
  9:  { x:   0, y: -277, z: 0 },
  10: { x:   0, y: -349, z: 0 },

  11: { x: -20, y: -25,  z: 180 },
  12: { x: -20, y: -97,  z: 180 },
  13: { x: -20, y: -169, z: 180 },
  14: { x: -20, y: -241, z: 180 },
  15: { x: -20, y: -313, z: 180 },

  16: { x: 180, y: -61,  z: 0 },
  17: { x: 180, y: -133, z: 0 },
  18: { x: 180, y: -205, z: 0 },
  19: { x: 180, y: -277, z: 0 },
  20: { x: 180, y: -349, z: 0 },
};

window.rollD20 = function() {
  if (d20Busy) return;
  d20Busy = true;

  const wrapper = document.querySelector('.d20-wrapper');
  const spinner = document.getElementById('d20-spinner');
  const resultText = document.getElementById('d20-result');

  wrapper.classList.remove('crit','fail');

  resultText.style.opacity = 0;
  resultText.style.transform = "translate(-50%, -50%) translateZ(140px) scale(0.6)";

  spinner.style.transition = 'transform 1.4s cubic-bezier(0.2, 0.8, 0.2, 1)';

  const preX = 360 * (3 + Math.floor(Math.random() * 3)) + (Math.random() * 40 - 20);
  const preY = 360 * (3 + Math.floor(Math.random() * 3)) + (Math.random() * 40 - 20);
  const preZ = 360 * (1 + Math.floor(Math.random() * 2)) + (Math.random() * 40 - 20);

  spinner.style.transform = `rotateX(${preX}deg) rotateY(${preY}deg) rotateZ(${preZ}deg)`;

  const roll = Math.floor(Math.random() * 20) + 1;

  setTimeout(() => {
    const o = d20Orientations[roll] || { x: 0, y: 0, z: 0 };

    spinner.style.transition = 'transform 0.75s cubic-bezier(0.1, 0.9, 0.2, 1)';
    spinner.style.transform = `rotateX(${o.x}deg) rotateY(${o.y}deg) rotateZ(${o.z}deg)`;

    resultText.innerText = roll;

    if (roll === 20) wrapper.classList.add('crit');
    if (roll === 1) wrapper.classList.add('fail');

    resultText.style.opacity = 1;
    resultText.style.transform = "translate(-50%, -50%) translateZ(140px) scale(1)";

    d20Busy = false;
  }, 1400);
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
