import { DiceEngine } from './dice-engine.js';

// --- Конфигурация ---
const translations = {
    ru: {
        ball: "Шар Судьбы", d4: "Кубик D4", d6: "Кубик D6", d8: "Кубик D8", 
        d10: "Кубик D10", d12: "Кубик D12", d20: "Кубик D20",
        slots: "Слоты", coin: "Монетка", rand: "Рандом",
        back: "Назад", tap: "Нажми, чтобы бросить",
        heads: "ОРЕЛ", tails: "РЕШКА", win: "ПОБЕДА!", lose: "УВЫ...",
        settings: "Настройки"
    },
    uk: {
        ball: "Куля Долі", d4: "Кубик D4", d6: "Кубик D6", d8: "Кубик D8",
        d10: "Кубик D10", d12: "Кубик D12", d20: "Кубик D20",
        slots: "Слоти", coin: "Монетка", rand: "Рандом",
        back: "Назад", tap: "Натисни, щоб кинути",
        heads: "ОРЕЛ", tails: "РЕШКА", win: "ВИГРАШ!", lose: "СПРОБУЙ ЩЕ",
        settings: "Налаштування"
    }
};

const magicAnswers = {
    ru: ["Да", "Нет", "Возможно", "Спроси позже", "Точно да", "Вряд ли"],
    uk: ["Так", "Ні", "Можливо", "Спитай пізніше", "Точно так", "Навряд чи"]
};

// --- Состояние ---
let state = {
    lang: localStorage.getItem('mt_lang') || 'uk',
    theme: localStorage.getItem('mt_theme') || 'dark',
    activeScreen: 'menu'
};

// --- Инициализация ---
document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    applyLang();
    setupNavigation();
    setupTools();
});

// --- Навигация и Настройки ---
function setupNavigation() {
    // Язык
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.onclick = () => {
            state.lang = btn.dataset.lang;
            localStorage.setItem('mt_lang', state.lang);
            applyLang();
        };
    });

    // Тема
    const themeBtn = document.getElementById('theme-toggle');
    themeBtn.onclick = () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('mt_theme', state.theme);
        applyTheme();
    };

    // Переходы
    window.openScreen = (id) => {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('menu-screen').style.display = 'none';
        
        const target = document.getElementById(id);
        target.style.display = 'flex';
        // Небольшая задержка для анимации
        setTimeout(() => target.classList.add('active'), 10);
        
        // Если это экран кубика, инициализируем 3D движок (если еще нет)
        if(id.startsWith('d') && id.includes('-screen')) {
            initDice3D(id);
        }
    };

    window.goBack = () => {
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
            setTimeout(() => s.style.display = 'none', 300);
        });
        const menu = document.getElementById('menu-screen');
        menu.style.display = 'flex';
        setTimeout(() => menu.classList.add('active'), 10);
    };
}

function applyTheme() {
    if (state.theme === 'light') document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
    
    document.getElementById('theme-icon').textContent = state.theme === 'light' ? '☀️' : '🌙';
}

function applyLang() {
    document.querySelectorAll('.lang-btn').forEach(b => 
        b.classList.toggle('active', b.dataset.lang === state.lang));
    
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.dataset.key;
        if(translations[state.lang][key]) el.textContent = translations[state.lang][key];
    });
}

// --- 3D Кубики ---
// Хранилище созданных движков, чтобы не создавать заново
const engines = {}; 

function initDice3D(screenId) {
    const diceType = screenId.replace('-screen', ''); // d4, d6...
    if (engines[diceType]) return; // Уже создан

    // Находим контейнер
    const containerId = `${diceType}-scene`;
    // Цвет кубика зависит от типа
    const colors = { d4: 0xff3333, d6: 0x33ff33, d8: 0x3333ff, d10: 0xff33ff, d12: 0xffff33, d20: 0x0a84ff };
    
    // Создаем экземпляр движка
    engines[diceType] = new DiceEngine(containerId, diceType, colors[diceType]);
}


// --- Логика Мини-игр ---
function setupTools() {
    // Magic Ball
    window.askBall = () => {
        const text = document.getElementById('ball-text');
        const ball = document.querySelector('.magic-ball-outer');
        text.style.opacity = 0;
        ball.classList.add('ball-animate');
        setTimeout(() => {
            const opts = magicAnswers[state.lang];
            text.textContent = opts[Math.floor(Math.random() * opts.length)];
            text.style.opacity = 1;
            ball.classList.remove('ball-animate');
        }, 500);
    };

    // Coin
    window.flipCoin = () => {
        const coin = document.querySelector('.coin');
        const rot = 1800 + (Math.random() > 0.5 ? 0 : 180);
        coin.style.transform = `rotateY(${rot}deg)`;
    };

    // Slots
    window.spinSlots = () => {
        const syms = ["🍒","🍋","7️⃣","💎"];
        [1,2,3].forEach(i => {
            const el = document.getElementById(`reel-${i}`);
            let count = 0;
            const interval = setInterval(() => {
                el.textContent = syms[Math.floor(Math.random()*syms.length)];
                count++;
                if(count > 10 + i*5) clearInterval(interval);
            }, 50);
        });
    };
    
    // Randomizer
    window.generateRandom = () => {
        const max = document.getElementById('rand-max').value;
        document.getElementById('rand-display').textContent = Math.floor(Math.random() * max) + 1;
    }
}

