import { DiceEngine } from './dice-engine.js';

// --- ДАННЫЕ (Переводы и Предсказания) ---
const predictions = {
    ru: [
        "Бесспорно", "Предрешено", "Никаких сомнений", "Определенно да",
        "Можешь быть уверен", "Мне кажется — да", "Вероятнее всего", 
        "Хорошие перспективы", "Знаки говорят — да", "Да", 
        "Пока не ясно, попробуй снова", "Спроси позже", "Лучше не рассказывать", 
        "Сейчас нельзя предсказать", "Сконцентрируйся и спроси опять", 
        "Даже не думай", "Мой ответ — нет", "По моим данным — нет", 
        "Перспективы не очень", "Весьма сомнительно", "Звезды говорят нет",
        "Абсолютно точно", "Не надейся", "Удача на твоей стороне",
        "Слушай свое сердце", "Рискни", "Забудь об этом", "Время покажет"
    ],
    uk: [
        "Безперечно", "Це вирішено", "Жодних сумнівів", "Безумовно так",
        "Можеш бути впевнений", "Мені здається — так", "Найімовірніше",
        "Хороші перспективи", "Знаки кажуть — так", "Так",
        "Поки не ясно, спробуй знову", "Спитай пізніше", "Краще не розповідати",
        "Зараз не можна передбачити", "Сконцентруйся і спитай знову",
        "Навіть не думай", "Мій відповідь — ні", "За моїми даними — ні",
        "Перспективи не дуже", "Дуже сумнівно", "Зірки кажуть ні",
        "Абсолютно точно", "Не сподівайся", "Удача на твоєму боці",
        "Слухай своє серце", "Ризикни", "Забудь про це", "Час покаже"
    ]
};

const translations = {
    ru: {
        ball: "Шар Судьбы", d4: "Кубик D4", d6: "Кубик D6", d8: "Кубик D8", 
        d10: "Кубик D10", d12: "Кубик D12", d20: "Кубик D20",
        slots: "Слоты", coin: "Монетка", rand: "Рандом",
        back: "Назад", tap: "Нажми, чтобы бросить",
        heads: "ОРЕЛ", tails: "РЕШКА", 
        win: "ПОБЕДА!", 
        lose_phrases: ["Эх, мимо...", "Попробуй еще!", "Не сегодня", "Упс...", "Пусто", "Почти..."],
        spin_btn: "КРУТИТЬ",
        generate: "СТАРТ",
        rand_limit_label: "Максимум:",
        settings: "Настройки"
    },
    uk: {
        ball: "Куля Долі", d4: "Кубик D4", d6: "Кубик D6", d8: "Кубик D8",
        d10: "Кубик D10", d12: "Кубик D12", d20: "Кубик D20",
        slots: "Слоти", coin: "Монетка", rand: "Рандом",
        back: "Назад", tap: "Натисни, щоб кинути",
        heads: "ОРЕЛ", tails: "РЕШКА", win: "ВИГРАШ!", 
        lose_phrases: ["Ех, мимо...", "Спробуй ще!", "Не сьогодні", "Упс...", "Порожньо", "Майже..."],
        spin_btn: "КРУТИТИ",
        generate: "СТАРТ",
        rand_limit_label: "Максимум:",
        settings: "Налаштування"
    }
};

// Состояние
let state = {
    lang: localStorage.getItem('mt_lang') || 'uk',
    theme: localStorage.getItem('mt_theme') || 'dark'
};

let coinTotalRotation = 0;
const engines = {}; 

// --- ФУНКЦИИ (Глобальные для HTML) ---
window.openScreen = (id) => {
    const menu = document.getElementById('menu-screen');
    menu.classList.remove('active');
    setTimeout(() => {
        menu.style.display = 'none';
        const target = document.getElementById(id);
        target.style.display = 'flex';
        target.classList.add('active');
        
        if(id.startsWith('d') && id.includes('-screen')) {
            initDice3D(id);
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
            requestAnimationFrame(() => menu.classList.add('active'));
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
    const coin = document.querySelector('.coin');
    const wrapper = document.querySelector('.coin-wrapper');
    const outcome = Math.random() > 0.5 ? 0 : 180;
    coinTotalRotation += (1800 + outcome); 
    wrapper.classList.remove('coin-toss');
    void wrapper.offsetWidth; 
    wrapper.classList.add('coin-toss');
    coin.style.transform = `rotateY(${coinTotalRotation}deg)`;
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

// --- Вспомогательные ---
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
    themeBtn.onclick = () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('mt_theme', state.theme);
        applyTheme();
    };
}

function applyTheme() {
    if (state.theme === 'light') document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
    document.getElementById('theme-icon').textContent = state.theme === 'light' ? '☀️' : '🌙';
}

function applyLang() {
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === state.lang));
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.dataset.key;
        if(translations[state.lang][key]) {
            // Если это input placeholder или что-то подобное, нужно другое свойство, но у нас textContent
            el.textContent = translations[state.lang][key];
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    applyLang();
    setupNavigation();
});
