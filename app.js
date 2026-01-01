import { DiceEngine } from './dice-engine.js';
import { predictions } from './predictions.js';

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

let state = {
    lang: localStorage.getItem('mt_lang') || 'uk',
    theme: localStorage.getItem('mt_theme') || 'dark'
};

// Для монетки (храним текущий угол, чтобы крутить дальше, а не с нуля)
let coinTotalRotation = 0;

document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    applyLang();
    setupNavigation();
    setupTools();
});

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

    // Открытие экрана
    window.openScreen = (id) => {
        const menu = document.getElementById('menu-screen');
        menu.classList.remove('active');
        // Ждем пока исчезнет
        setTimeout(() => {
            menu.style.display = 'none';
            const target = document.getElementById(id);
            target.style.display = 'flex';
            setTimeout(() => target.classList.add('active'), 10);
            
            if(id.startsWith('d') && id.includes('-screen')) {
                initDice3D(id);
            }
        }, 200);
    };

    // Возврат назад (ИСПРАВЛЕНО: Теперь корректно переключает display)
    window.goBack = () => {
        // Находим активный экран
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen && activeScreen.id !== 'menu-screen') {
            activeScreen.classList.remove('active');
            
            setTimeout(() => {
                activeScreen.style.display = 'none';
                
                const menu = document.getElementById('menu-screen');
                menu.style.display = 'flex'; // Явно включаем
                // Форсируем перерисовку
                requestAnimationFrame(() => {
                    menu.classList.add('active');
                });
            }, 300); // Тайминг CSS анимации
        }
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

// 3D Engine Singleton
const engines = {}; 
function initDice3D(screenId) {
    const diceType = screenId.replace('-screen', ''); 
    if (engines[diceType]) return; 

    const containerId = `${diceType}-scene`;
    // Разные цвета для кубиков
    const colors = { d4: 0xff4444, d6: 0x44ff44, d8: 0x4444ff, d10: 0xff44ff, d12: 0xffff44, d20: 0x0a84ff };
    engines[diceType] = new DiceEngine(containerId, diceType, colors[diceType]);
}

function setupTools() {
    // Шар Судьбы (Использует новый файл)
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

    // Монетка (ИСПРАВЛЕНО: Накопительное вращение)
    window.flipCoin = () => {
        const coin = document.querySelector('.coin');
        const wrapper = document.querySelector('.coin-wrapper'); // Для анимации прыжка
        
        // Добавляем к текущему углу минимум 5 оборотов (1800) + результат
        const outcome = Math.random() > 0.5 ? 0 : 180;
        coinTotalRotation += (1800 + outcome); 
        
        // Прыжок
        wrapper.classList.remove('coin-toss');
        void wrapper.offsetWidth; // Триггер рефлоу для перезапуска анимации
        wrapper.classList.add('coin-toss');

        coin.style.transform = `rotateY(${coinTotalRotation}deg)`;
    };

    // Слоты
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
                const sym = syms[Math.floor(Math.random()*syms.length)];
                el.textContent = sym;
                count++;
                if(count > maxCount) {
                    clearInterval(interval);
                    results.push(sym);
                    if(results.length === 3) checkWin(results, msg);
                }
            }, 60);
        });
    };

    function checkWin(res, msgEl) {
        if(res[0] === res[1] && res[1] === res[2]) {
            msgEl.textContent = translations[state.lang].win;
            msgEl.style.color = '#0f0';
        } else {
            msgEl.textContent = translations[state.lang].lose;
            msgEl.style.color = 'inherit';
        }
    }
    
    // Рандомайзер
    window.generateRandom = () => {
        const max = document.getElementById('rand-max').value;
        const display = document.getElementById('rand-display');
        let count = 0;
        const interval = setInterval(() => {
            display.textContent = Math.floor(Math.random() * max) + 1;
            count++;
            if(count > 10) clearInterval(interval);
        }, 50);
    }
}
