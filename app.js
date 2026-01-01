import { DiceEngine } from './dice-engine.js';

// --- ДАННЫЕ ---
const predictions = {
    ru: ["Бесспорно","Предрешено","Никаких сомнений","Определенно да","Можешь быть уверен","Мне кажется — да","Вероятнее всего","Хорошие перспективы","Знаки говорят — да","Да","Пока не ясно","Спроси позже","Лучше не рассказывать","Сконцентрируйся","Даже не думай","Мой ответ — нет","По моим данным — нет","Перспективы не очень","Весьма сомнительно","Звезды говорят нет","Абсолютно точно","Не надейся","Удача на твоей стороне","Слушай сердце","Рискни","Забудь","Время покажет"],
    uk: ["Безперечно","Це вирішено","Жодних сумнівів","Безумовно так","Можеш бути впевнений","Мені здається — так","Найімовірніше","Хороші перспективи","Знаки кажуть — так","Так","Поки не ясно","Спитай пізніше","Краще не розповідати","Сконцентруйся","Навіть не думай","Мій відповідь — ні","За моїми даними — ні","Перспективи не дуже","Дуже сумнівно","Зірки кажуть ні","Абсолютно точно","Не сподівайся","Удача з тобою","Слухай серце","Ризикни","Забудь","Час покаже"]
};

const translations = {
    ru: { ball:"Шар Судьбы", d4:"Кубик D4", d6:"Кубик D6", d8:"Кубик D8", d10:"Кубик D10", d12:"Кубик D12", d20:"Кубик D20", slots:"Слоты", coin:"Монетка", rand:"Рандом", trump:"Козырь", back:"Назад", tap:"Нажми, чтобы бросить", heads:"ОРЕЛ", tails:"РЕШКА", win:"ПОБЕДА!", lose_phrases:["Эх, мимо...", "Попробуй еще!", "Не сегодня", "Упс...", "Пусто", "Почти..."], spin_btn:"КРУТИТЬ", generate:"СТАРТ", reset:"СБРОС", rand_limit_label:"Максимум:", settings:"Настройки" },
    uk: { ball:"Куля Долі", d4:"Кубик D4", d6:"Кубик D6", d8:"Кубик D8", d10:"Кубик D10", d12:"Кубик D12", d20:"Кубик D20", slots:"Слоти", coin:"Монетка", rand:"Рандом", trump:"Козир", back:"Назад", tap:"Натисни, щоб кинути", heads:"ОРЕЛ", tails:"РЕШКА", win:"ВИГРАШ!", lose_phrases:["Ех, мимо...", "Спробуй ще!", "Не сьогодні", "Упс...", "Порожньо", "Майже..."], spin_btn:"КРУТИТИ", generate:"СТАРТ", reset:"СКИДАННЯ", rand_limit_label:"Максимум:", settings:"Налаштування" }
};

let state = {
    lang: localStorage.getItem('mt_lang') || 'uk',
    theme: localStorage.getItem('mt_theme') || 'dark'
};

const engines = {}; 
let isFlippingCoin = false;
let currentCoinRotation = 0;

// Массив для карт (4 уникальные масти)
let currentDeck = ['♠️', '♥️', '♦️', '♣️'];

// ГЛОБАЛЬНЫЕ ФУНКЦИИ
window.openScreen = (id) => {
    const menu = document.getElementById('menu-screen');
    menu.classList.remove('active');
    setTimeout(() => {
        menu.style.display = 'none';
        const target = document.getElementById(id);
        target.style.display = 'flex';
        void target.offsetWidth; 
        target.classList.add('active');
        if(id.startsWith('d') && id.includes('-screen')) setTimeout(() => initDice3D(id), 50);
        
        // Перемешиваем карты при входе в экран карт, если они еще не были тронуты
        if (id === 'trump-screen') {
             // Можно раскомментировать, если хотите, чтобы при каждом входе мешалось
             // shuffleDeck(); 
        }
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

window.askBall = () => {
    const text = document.getElementById('ball-text');
    const ball = document.querySelector('.magic-ball-outer');
    text.style.opacity = 0;
    ball.classList.add('ball-animate');
    setTimeout(() => {
        const opts = predictions[state.lang];
        text.textContent = opts[Math.floor(Math.random() * opts.length)];
        text.style.opacity = 1;
        ball.classList.remove('ball-animate');
    }, 500);
};

window.flipCoin = () => {
    if(isFlippingCoin) return;
    isFlippingCoin = true;
    const coin = document.querySelector('.coin');
    const outcome = Math.random() > 0.5 ? 0 : 180;
    const targetRotation = currentCoinRotation + 1800 + outcome;
    const startTime = performance.now();
    const duration = 2500; 

    function animate(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const currentRot = currentCoinRotation + (targetRotation - currentCoinRotation) * ease;
        let scale = 1; let translateY = 0;
        if (progress < 1) {
            const jumpProgress = Math.sin(progress * Math.PI); 
            scale = 1 + jumpProgress * 0.5; 
            translateY = jumpProgress * -100;
        }
        coin.style.transform = `translateY(${translateY}px) scale(${scale}) rotateY(${currentRot}deg)`;
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            currentCoinRotation = targetRotation; 
            coin.style.transform = `rotateY(${targetRotation}deg)`; 
            isFlippingCoin = false;
        }
    }
    requestAnimationFrame(animate);
};

// --- ФУНКЦИИ ДЛЯ КАРТ (КОЗЫРЬ) ---

// Функция перемешивания (Fisher-Yates)
function shuffleDeck() {
    currentDeck = ['♠️', '♥️', '♦️', '♣️'];
    for (let i = currentDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentDeck[i], currentDeck[j]] = [currentDeck[j], currentDeck[i]];
    }
}

window.flipTrumpCard = (card, index) => {
    if (card.classList.contains('flipped')) return;
    
    // Берем масть из заранее перемешанного массива по индексу карты (0-3)
    const assignedSuit = currentDeck[index];
    
    const frontFace = card.querySelector('.card-front-side');
    frontFace.textContent = assignedSuit;
    frontFace.classList.remove('suit-red', 'suit-black');
    
    if (assignedSuit === '♥️' || assignedSuit === '♦️') frontFace.classList.add('suit-red');
    else frontFace.classList.add('suit-black');
    
    card.classList.add('flipped');
};

window.resetTrumpCards = () => {
    const cards = document.querySelectorAll('.playing-card');
    cards.forEach(card => {
        card.classList.remove('flipped');
        setTimeout(() => { card.querySelector('.card-front-side').textContent = ''; }, 300);
    });
    
    // Перемешиваем колоду, пока карты перевернуты
    setTimeout(() => {
        shuffleDeck();
    }, 300);
};

window.spinSlots = () => {
    const syms = ["🍒","🍋","7️⃣","💎", "🔔", "🍇"];
    const msg = document.getElementById('slot-msg');
    msg.textContent = "";
    let results = [];
    [1,2,3].forEach((i) => {
        const el = document.getElementById(`reel-${i}`);
        let count = 0;
        const maxCount = 10 + i * 5;
        const interval = setInterval(() => {
            el.textContent = syms[Math.floor(Math.random()*syms.length)];
            count++;
            if(count > maxCount) {
                clearInterval(interval);
                results.push(el.textContent);
                if(results.length === 3) checkWin(results, msg);
            }
        }, 60);
    });
};

window.generateRandom = () => {
    const max = document.getElementById('rand-max').value;
    const display = document.getElementById('rand-display');
    let count = 0;
    const interval = setInterval(() => {
        display.textContent = Math.floor(Math.random() * max) + 1;
        count++;
        if(count > 10) clearInterval(interval);
    }, 50);
};

function checkWin(res, msgEl) {
    if(res[0] === res[1] && res[1] === res[2]) {
        msgEl.textContent = translations[state.lang].win;
        msgEl.style.color = '#0f0';
    } else {
        const phrases = translations[state.lang].lose_phrases;
        msgEl.textContent = phrases[Math.floor(Math.random() * phrases.length)];
        msgEl.style.color = 'inherit';
    }
}

function initDice3D(screenId) {
    const diceType = screenId.replace('-screen', ''); 
    if (engines[diceType]) return; 
    const containerId = `${diceType}-scene`;
    if (document.getElementById(containerId)) {
        engines[diceType] = new DiceEngine(containerId, diceType);
    }
}

function setupNavigation() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.onclick = () => {
            state.lang = btn.dataset.lang;
            localStorage.setItem('mt_lang', state.lang);
            applyLang();
        };
    });
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.onclick = () => {
            state.theme = state.theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('mt_theme', state.theme);
            applyTheme();
        };
    }
}

function applyTheme() {
    if (state.theme === 'light') document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
    const icon = document.getElementById('theme-icon');
    if(icon) icon.textContent = state.theme === 'light' ? '☀️' : '🌙';
}

function applyLang() {
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === state.lang));
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.dataset.key;
        if(translations[state.lang][key]) el.textContent = translations[state.lang][key];
    });
}

document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    applyLang();
    setupNavigation();
    shuffleDeck(); // Инициализация колоды при запуске
});
