import { DiceEngine } from './dice-engine.js';
import { predictions } from './predictions.js';

// --- DATA ---
const translations = {
    ru: { ball:"Шар Судьбы", d4:"Кубик D4", d6:"Кубик D6", d8:"Кубик D8", d10:"Кубик D10", d12:"Кубик D12", d20:"Кубик D20", slots:"Слоты", coin:"Монетка", rand:"Рандом", trump:"Козырь", back:"Назад", tap:"Нажми, чтобы бросить", heads:"ОРЕЛ", tails:"РЕШКА", win:"ПОБЕДА!", lose_phrases:["Эх, мимо...", "Попробуй еще!", "Не сегодня", "Упс...", "Пусто", "Почти..."], spin_btn:"КРУТИТЬ", generate:"СТАРТ", reset:"СБРОС", rand_limit_label:"Максимум:", 
    hp:"HP", score:"Счет", names:"Имена", wheel:"Колесо", rps:"К-Н-Б", notes:"Заметки",
    confirm_clear:"Вы точно хотите удалить содержимое?", dev:"Разработчик:" },
    uk: { ball:"Куля Долі", d4:"Кубик D4", d6:"Кубик D6", d8:"Кубик D8", d10:"Кубик D10", d12:"Кубик D12", d20:"Кубик D20", slots:"Слоти", coin:"Монетка", rand:"Рандом", trump:"Козир", back:"Назад", tap:"Натисни, щоб кинути", heads:"ОРЕЛ", tails:"РЕШКА", win:"ВИГРАШ!", lose_phrases:["Ех, мимо...", "Спробуй ще!", "Не сьогодні", "Упс...", "Порожньо", "Майже..."], spin_btn:"КРУТИТИ", generate:"СТАРТ", reset:"СКИДАННЯ", rand_limit_label:"Максимум:", 
    hp:"HP", score:"Рахунок", names:"Імена", wheel:"Колесо", rps:"К-Н-Б", notes:"Нотатки",
    confirm_clear:"Ви точно хочете видалити вміст?", dev:"Розробник:" }
};

// --- D&D NAMES ---
const nameAdjectives = {
    ru: ["Внезапный","Пьяный","Святой","Проклятый","Трусливый","Безумный","Жадный","Героический","Лысый","Бородатый","Сонный","Грязный","Золотой","Мертвый","Дикий","Древний","Юный","Злобный","Добрый","Хитрый","Тупой","Ловкий","Невидимый","Горящий","Ледяной","Мокрый","Громкий","Тихий","Слепой","Одноглазый","Хромой","Везучий","Неудачливый","Богатый","Нищий","Влюбленный","Одинокий","Жестокий","Милый","Страшный","Вонючий","Душистый","Быстрый","Медленный","Кровавый","Теневой","Звездный","Лунный","Солнечный","Забытый"],
    uk: ["Раптовий","П'яний","Святий","Проклятий","Боягузливий","Божевільний","Жадібний","Героїчний","Лисий","Бородатий","Сонний","Брудний","Золотий","Мертвий","Дикий","Стародавній","Юний","Злісний","Добрий","Хитрий","Тупий","Спритний","Невидимий","Палаючий","Крижаний","Мокрий","Гучний","Тихий","Сліпий","Одноокий","Кульгавий","Везучий","Невдачливий","Багатий","Жебрак","Закоханий","Самотній","Жорстокий","Милий","Страшний","Смердючий","Запашний","Швидкий","Повільний","Кривавий","Тіньовий","Зоряний","Місячний","Сонячний","Забутий"]
};
const nameClasses = {
    ru: ["Стражник","Орк","Эльф","Темный Эльф","Бард","Паладин","Маг","Лучник","Разбойник","Некромант","Воин","Варвар","Жрец","Друид","Монах","Следопыт","Чародей","Колдун","Изобретатель","Гном","Полурослик","Драконорожденный","Тифлинг","Гоблин","Вампир","Оборотень"],
    uk: ["Стражник","Орк","Ельф","Темний Ельф","Бард","Паладин","Маг","Лучник","Розбійник","Некромант","Воїн","Варвар","Жрець","Друїд","Монах","Слідопит","Чародій","Чаклун","Винахідник","Гном","Напіврослик","Дракононароджений","Тіфлінг","Гоблін","Вампір","Перевертень"]
};

let state = {
    lang: localStorage.getItem('mt_lang') || 'uk',
    theme: localStorage.getItem('mt_theme') || 'dark',
    dnd_mode: localStorage.getItem('mt_dnd') === 'true',
    hp_p1: parseInt(localStorage.getItem('mt_hp_p1')) || 20,
    hp_p2: parseInt(localStorage.getItem('mt_hp_p2')) || 20,
    score_p1: parseInt(localStorage.getItem('mt_score_p1')) || 0,
    score_p2: parseInt(localStorage.getItem('mt_score_p2')) || 0,
    saved_name: localStorage.getItem('mt_name') || null,
    wheel_segments: JSON.parse(localStorage.getItem('mt_wheel')) || [],
    notes: localStorage.getItem('mt_notes') || ""
};

const engines = {}; 
let isFlippingCoin = false;
let currentCoinRotation = 0;
let currentDeck = ['♠️', '♥️', '♦️', '♣️'];
let wheelAngle = 0;

function vibrate(ms = 50) {
    if (navigator.vibrate) navigator.vibrate(ms);
}

// --- DND MODE ---
window.toggleDNDMode = () => {
    state.dnd_mode = !state.dnd_mode;
    localStorage.setItem('mt_dnd', state.dnd_mode);
    applyDNDMode();
    vibrate();
};

function applyDNDMode() {
    const btn = document.getElementById('dnd-btn');
    const tiles = document.querySelectorAll('.dnd-hide');
    
    if (state.dnd_mode) {
        btn.classList.add('active');
        btn.textContent = 'DND ON';
        tiles.forEach(t => t.classList.add('hidden-tile'));
    } else {
        btn.classList.remove('active');
        btn.textContent = 'DND OFF';
        tiles.forEach(t => t.classList.remove('hidden-tile'));
    }
}

// --- NOTES ---
function initNotes() {
    const area = document.getElementById('notes-area');
    area.value = state.notes;
    area.addEventListener('input', (e) => {
        state.notes = e.target.value;
        localStorage.setItem('mt_notes', state.notes);
    });
}

window.resetNotes = () => {
    if (confirm(translations[state.lang].confirm_clear)) {
        state.notes = "";
        localStorage.setItem('mt_notes', "");
        document.getElementById('notes-area').value = "";
        vibrate();
    }
};

// --- HEADER STATUS UPDATE ---
function updateHeaderStatus() {
    const statsRow = document.getElementById('status-stats');
    const nameRow = document.getElementById('status-name');
    
    statsRow.innerHTML = '';
    nameRow.innerHTML = '';
    
    if (state.hp_p1 !== 20 || state.hp_p2 !== 20) {
        statsRow.innerHTML += `<div class="status-item">❤️ ${state.hp_p1}</div>`;
    }
    if (state.score_p1 !== 0 || state.score_p2 !== 0) {
        statsRow.innerHTML += `<div class="status-item">🏆 ${state.score_p1}</div>`;
    }
    if (state.saved_name) {
        nameRow.innerHTML = `<div class="status-item">👤 ${state.saved_name}</div>`;
    }
}

// --- GLOBAL FUNCTIONS ---
window.openScreen = (id) => {
    const menu = document.getElementById('menu-screen');
    menu.classList.remove('active');
    setTimeout(() => {
        menu.style.display = 'none';
        const target = document.getElementById(id);
        target.style.display = 'flex';
        void target.offsetWidth; target.classList.add('active');
        
        if(id.startsWith('d') && id.includes('-screen')) setTimeout(() => initDice3D(id), 50);
        if(id === 'trump-screen') shuffleDeck();
        if(id === 'hp-screen') renderCounter('hp', 1);
        if(id === 'score-screen') renderCounter('score', 1);
        if(id === 'wheel-screen') drawWheel();
        if(id === 'name-screen') document.getElementById('generated-name').textContent = state.saved_name || "...";
        if(id === 'notes-screen') initNotes();
    }, 200);
};

window.goBack = () => {
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen && activeScreen.id !== 'menu-screen') {
        activeScreen.classList.remove('active');
        setTimeout(() => {
            activeScreen.style.display = 'none';
            const menu = document.getElementById('menu-screen');
            menu.style.display = 'flex'; 
            requestAnimationFrame(() => { menu.classList.add('active'); });
        }, 300);
    }
};

// --- MAGIC BALL ---
window.askBall = () => {
    vibrate();
    const text = document.getElementById('ball-text');
    const ball = document.querySelector('.magic-ball-outer');
    text.style.opacity = 0; ball.classList.add('ball-animate');
    setTimeout(() => {
        const opts = predictions[state.lang];
        text.textContent = opts[Math.floor(Math.random() * opts.length)];
        text.style.opacity = 1; ball.classList.remove('ball-animate');
    }, 500);
};

// --- COIN ---
window.flipCoin = () => {
    if(isFlippingCoin) return;
    isFlippingCoin = true; vibrate();
    const coin = document.querySelector('.coin');
    const outcome = Math.random() > 0.5 ? 0 : 180;
    const targetRotation = currentCoinRotation + 1800 + outcome;
    const startTime = performance.now(); const duration = 2500; 
    function animate(time) {
        const elapsed = time - startTime; const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const currentRot = currentCoinRotation + (targetRotation - currentCoinRotation) * ease;
        let scale = 1; let translateY = 0;
        if (progress < 1) {
            const jumpProgress = Math.sin(progress * Math.PI); 
            scale = 1 + jumpProgress * 0.5; translateY = jumpProgress * -100;
        }
        coin.style.transform = `translateY(${translateY}px) scale(${scale}) rotateY(${currentRot}deg)`;
        if (progress < 1) requestAnimationFrame(animate);
        else { currentCoinRotation = targetRotation; coin.style.transform = `rotateY(${targetRotation}deg)`; isFlippingCoin = false; vibrate(100); }
    }
    requestAnimationFrame(animate);
};

// --- CARDS ---
function shuffleDeck() {
    currentDeck = ['♠️', '♥️', '♦️', '♣️'];
    for (let i = currentDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentDeck[i], currentDeck[j]] = [currentDeck[j], currentDeck[i]];
    }
}
window.flipTrumpCard = (card, index) => {
    if (card.classList.contains('flipped')) return;
    vibrate();
    const suit = currentDeck[index];
    const face = card.querySelector('.card-front-side');
    face.textContent = suit;
    face.className = 'card-face card-front-side ' + ((suit==='♥️'||suit==='♦️')?'suit-red':'suit-black');
    card.classList.add('flipped');
};
window.resetTrumpCards = () => {
    vibrate();
    document.querySelectorAll('.playing-card').forEach(c => {
        c.classList.remove('flipped');
        setTimeout(() => c.querySelector('.card-front-side').textContent='', 300);
    });
    setTimeout(shuffleDeck, 300);
};

// --- SLOTS ---
window.spinSlots = () => {
    vibrate();
    const syms = ["🍒","🍋","7️⃣","💎", "🔔", "🍇"];
    const msg = document.getElementById('slot-msg'); msg.textContent = "";
    let results = [];
    [1,2,3].forEach((i) => {
        const el = document.getElementById(`reel-${i}`);
        let count = 0; const max = 10 + i * 5;
        const interval = setInterval(() => {
            el.textContent = syms[Math.floor(Math.random()*syms.length)];
            count++;
            if(count > max) { clearInterval(interval); results.push(el.textContent); if(results.length===3) checkSlotWin(results, msg); }
        }, 60);
    });
};
function checkSlotWin(res, msgEl) {
    if(res[0] === res[1] && res[1] === res[2]) { msgEl.textContent = translations[state.lang].win; msgEl.style.color='#0f0'; vibrate([100,50,100]); } 
    else { const ph = translations[state.lang].lose_phrases; msgEl.textContent = ph[Math.floor(Math.random()*ph.length)]; msgEl.style.color='inherit'; }
}

// --- RANDOM ---
window.generateRandom = () => {
    vibrate();
    const max = document.getElementById('rand-max').value;
    const d = document.getElementById('rand-display');
    let c = 0; const int = setInterval(() => {
        d.textContent = Math.floor(Math.random() * max) + 1; c++;
        if(c > 10) clearInterval(int);
    }, 50);
};

// --- COUNTERS (HP / SCORE) ---
window.setPlayers = (type, num) => {
    vibrate();
    document.querySelectorAll(`#${type}-screen .mode-btn`).forEach((b, i) => b.classList.toggle('active', i+1 === num));
    renderCounter(type, num);
};

function renderCounter(type, players) {
    const container = document.getElementById(`${type}-container`);
    container.innerHTML = '';
    
    const createBox = (pIndex, inverted) => {
        const key = `${type}_p${pIndex}`;
        const val = state[key];
        return `
        <div class="counter-box ${inverted ? 'inverted-player' : ''}">
            <input type="number" class="counter-val-input" id="${key}-val" value="${val}" onchange="manualCounterUpdate('${type}', ${pIndex}, this.value)">
            <div class="counter-btns">
                <button class="counter-btn" onclick="updateCounter('${type}', ${pIndex}, -1)">-</button>
                <button class="counter-btn" onclick="updateCounter('${type}', ${pIndex}, 1)">+</button>
            </div>
        </div>`;
    };

    if (players === 2) {
        container.innerHTML += createBox(2, true);
        container.innerHTML += createBox(1, false);
    } else {
        container.innerHTML += createBox(1, false);
    }
}

window.manualCounterUpdate = (type, pIndex, newVal) => {
    const key = `${type}_p${pIndex}`;
    state[key] = parseInt(newVal) || 0;
    localStorage.setItem(`mt_${key}`, state[key]);
    updateHeaderStatus();
};

window.updateCounter = (type, pIndex, delta) => {
    vibrate(30);
    const key = `${type}_p${pIndex}`;
    state[key] += delta;
    document.getElementById(`${key}-val`).value = state[key];
    localStorage.setItem(`mt_${key}`, state[key]);
    updateHeaderStatus();
};

window.resetCounter = (type) => {
    vibrate();
    const def = (type === 'hp') ? 20 : 0;
    state[`${type}_p1`] = def; state[`${type}_p2`] = def;
    localStorage.setItem(`mt_${type}_p1`, def);
    localStorage.setItem(`mt_${type}_p2`, def);
    const isTwo = document.querySelectorAll(`#${type}-screen .mode-btn`)[1].classList.contains('active');
    renderCounter(type, isTwo ? 2 : 1);
    updateHeaderStatus();
};

// --- NAME GENERATOR ---
window.generateName = () => {
    vibrate();
    const adj = nameAdjectives[state.lang][Math.floor(Math.random() * nameAdjectives[state.lang].length)];
    const cls = nameClasses[state.lang][Math.floor(Math.random() * nameClasses[state.lang].length)];
    const name = `${adj} ${cls}`;
    state.saved_name = name;
    localStorage.setItem('mt_name', name);
    document.getElementById('generated-name').textContent = name;
    updateHeaderStatus();
};
window.resetName = () => {
    vibrate();
    state.saved_name = null;
    localStorage.removeItem('mt_name');
    document.getElementById('generated-name').textContent = "...";
    updateHeaderStatus();
};

// --- WHEEL ---
window.addWheelSegment = () => {
    const input = document.getElementById('wheel-add-input');
    if(input.value) {
        state.wheel_segments.push(input.value);
        localStorage.setItem('mt_wheel', JSON.stringify(state.wheel_segments));
        input.value = '';
        drawWheel();
    }
};
window.resetWheel = () => {
    state.wheel_segments = [];
    localStorage.setItem('mt_wheel', JSON.stringify(state.wheel_segments));
    drawWheel();
};
function drawWheel() {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    const segments = state.wheel_segments;
    
    ctx.clearRect(0,0,300,300);
    
    if (segments.length === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.beginPath(); ctx.arc(150, 150, 140, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "white"; ctx.font = "14px Arial"; ctx.textAlign = "center";
        ctx.fillText("Добавьте варианты", 150, 150);
        return;
    }

    const arc = Math.PI * 2 / segments.length;
    const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"];
    
    ctx.translate(150, 150);
    ctx.rotate(wheelAngle);
    
    segments.forEach((seg, i) => {
        ctx.beginPath();
        ctx.arc(0, 0, 140, i * arc, (i + 1) * arc);
        ctx.lineTo(0, 0);
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.save();
        ctx.rotate(i * arc + arc / 2);
        ctx.fillStyle = "white"; ctx.font = "bold 14px Arial";
        ctx.textAlign = "right"; ctx.fillText(seg, 130, 5);
        ctx.restore();
    });
    ctx.rotate(-wheelAngle);
    ctx.translate(-150, -150);
}

window.spinWheel = () => {
    if (state.wheel_segments.length === 0) return;
    vibrate();
    const duration = 3000;
    const start = performance.now();
    const spin = Math.random() * 10 + 10;
    function animate(time) {
        const p = Math.min((time - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        wheelAngle = spin * ease;
        drawWheel();
        if(p < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
};

// --- RPS ---
window.playRPS = () => {
    vibrate();
    const opts = ['🪨', '✂️', '📄']; 
    const topEl = document.getElementById('rps-top');
    const botEl = document.getElementById('rps-bottom');
    let c = 0;
    const int = setInterval(() => {
        topEl.querySelector('span').textContent = opts[c % 3];
        botEl.querySelector('span').textContent = opts[(c+1) % 3];
        c++;
        if(c > 20) {
            clearInterval(int);
            const r1 = Math.floor(Math.random()*3);
            const r2 = Math.floor(Math.random()*3);
            topEl.querySelector('span').textContent = opts[r1];
            botEl.querySelector('span').textContent = opts[r2];
            topEl.className = 'rps-side inverted';
            botEl.className = 'rps-side';
            if(r1 === r2) { /* Tie */ }
            else if((r2 === 0 && r1 === 1) || (r2 === 1 && r1 === 2) || (r2 === 2 && r1 === 0)) {
                botEl.classList.add('win'); topEl.classList.add('lose'); vibrate([50,50,50]);
            } else {
                topEl.classList.add('win'); botEl.classList.add('lose'); vibrate([50,50,50]);
            }
        }
    }, 50);
};

// INIT
document.addEventListener('DOMContentLoaded', () => {
    const langBtns = document.querySelectorAll('.lang-btn');
    langBtns.forEach(btn => btn.onclick = () => { state.lang = btn.dataset.lang; localStorage.setItem('mt_lang', state.lang); applyLang(); });
    document.getElementById('theme-toggle').onclick = () => { state.theme = state.theme==='dark'?'light':'dark'; localStorage.setItem('mt_theme', state.theme); applyTheme(); };
    applyTheme(); applyLang(); updateHeaderStatus(); applyDNDMode();
});

function applyTheme() {
    if (state.theme === 'light') document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
    document.getElementById('theme-icon').textContent = state.theme === 'light' ? '☀️' : '🌙';
}
function applyLang() {
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === state.lang));
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.dataset.key;
        if(translations[state.lang][key]) el.textContent = translations[state.lang][key];
    });
}
function initDice3D(screenId) {
    const diceType = screenId.replace('-screen', ''); 
    if (engines[diceType]) return; 
    const containerId = `${diceType}-scene`;
    if (document.getElementById(containerId)) {
        engines[diceType] = new DiceEngine(containerId, diceType);
    }
}
