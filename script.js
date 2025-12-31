// --- CONFIG & STATE ---
let currentLang = 'uk';

// Вшиваем фразы прямо сюда, чтобы работало без локального сервера
const magicPhrases = {
    ru: [
        "Бесспорно", "Предрешено", "Никаких сомнений", "Определенно да", "Можешь быть уверен",
        "Мне кажется — да", "Вероятнее всего", "Хорошие перспективы", "Знаки говорят — да", "Да",
        "Пока не ясно", "Спроси позже", "Лучше не рассказывать", "Сконцентрируйся и спроси", "Даже не думай",
        "Мой ответ — нет", "По моим данным — нет", "Перспективы не очень", "Весьма сомнительно", "Звезды в шоке",
        "А оно тебе надо?", "Забей", "Спроси у мамы", "Не сегодня", "Успокойся",
        "Рискни", "Это фиаско, братан", "Шанс 1 из 100", "Интернет говорит нет", "Попробуй перезагрузить жизнь",
        "Слишком сложно", "Ответ 404", "Поспи и всё пройдет", "Карты говорят — дичь", "Слушай сердце, а не шар",
        "Ты серьезно?", "Не стоит", "Ой, всё", "Твоя интуиция врет", "Полный провал", "Удача на твоей стороне"
    ],
    uk: [
        "Безперечно", "Це вирішено", "Жодних сумнівів", "Безумовно так", "Можеш бути впевнений",
        "Мені здається — так", "Найімовірніше", "Хороші перспективи", "Знаки кажуть — так", "Так",
        "Поки не ясно", "Спитай пізніше", "Краще не розповідати", "Сконцентруйся і спитай", "Навіть не думай",
        "Мій відповідь — ні", "За моїми даними — ні", "Перспективи не дуже", "Дуже сумнівно", "Зірки в шоці",
        "А воно тобі треба?", "Забий", "Спитай у мами", "Не сьогодні", "Заспокойся",
        "Ризикни", "Це фіаско", "Шанс 1 зі 100", "Інтернет каже ні", "Спробуй перезавантажити життя",
        "Занадто складно", "Відповідь 404", "Поспи і все мине", "Карти кажуть — дичина", "Слухай серце, а не кулю",
        "Ти серйозно?", "Не варто", "Ой, все", "Твоя інтуїція бреше", "Повний провал", "Удача на твоєму боці"
    ]
};

const uiText = {
    uk: {
        ball_title: "Куля Долі", d6_title: "Кубик D6", d20_title: "Кубик D20", rand_title: "Рандом", coin_title: "Монетка",
        back: "Назад", ball_hint: "Натисни на кулю", tap_roll: "Натисни, щоб кинути",
        rand_limit_label: "Максимум:", generate: "Старт",
        heads: "ОРЕЛ", tails: "РЕШКА"
    },
    ru: {
        ball_title: "Шар Судьбы", d6_title: "Кубик D6", d20_title: "Кубик D20", rand_title: "Рандомайзер", coin_title: "Монетка",
        back: "Назад", ball_hint: "Нажми на шар", tap_roll: "Нажми, чтобы бросить",
        rand_limit_label: "Максимум:", generate: "Старт",
        heads: "ОРЕЛ", tails: "РЕШКА"
    }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("App Loaded"); // Проверка в консоли
    setLang('uk');
});

// --- NAVIGATION ---
function setLang(lang) {
    currentLang = lang;
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    // Проверка, чтобы не было ошибки при клике
    if(event && event.target) event.target.classList.add('active');

    // Update UI Text
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if (uiText[lang][key]) el.innerText = uiText[lang][key];
    });

    // Update Coin Pseudo-elements via CSS
    const styleId = 'dynamic-styles';
    let styleElem = document.getElementById(styleId);
    if (!styleElem) {
        styleElem = document.createElement("style");
        styleElem.id = styleId;
        document.head.appendChild(styleElem);
    }
    styleElem.innerHTML = `
        .side-a::after { content: "${uiText[lang].heads}"; }
        .side-b::after { content: "${uiText[lang].tails}"; }
    `;
}

// Эта функция должна быть глобальной, чтобы работать из HTML onclick
window.openTool = function(toolId) {
    console.log("Opening tool:", toolId);
    const menu = document.getElementById('menu-screen');
    const tool = document.getElementById(toolId + '-screen');
    
    if (menu && tool) {
        menu.classList.remove('active');
        setTimeout(() => {
            menu.style.display = 'none';
            tool.style.display = 'flex';
            setTimeout(() => tool.classList.add('active'), 10);
        }, 200);
    } else {
        console.error("Tool or Menu not found:", toolId);
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

// --- MAGIC BALL ---
window.askBall = function() {
    const ballOuter = document.querySelector('.magic-ball-outer');
    const textEl = document.getElementById('ball-text');
    const answers = magicPhrases[currentLang];

    textEl.style.opacity = 0;
    ballOuter.classList.add('ball-animate');
    setTimeout(() => ballOuter.classList.remove('ball-animate'), 600);

    setTimeout(() => {
        const randomAnswer = answers[Math.floor(Math.random() * answers.length)];
        textEl.innerText = randomAnswer;
        textEl.style.opacity = 1;
    }, 600);
}

// --- D6 CUBE LOGIC ---
window.rollD6 = function() {
    const cube = document.getElementById('dice-cube');
    const result = Math.floor(Math.random() * 6) + 1;
    
    let x = 0, y = 0;
    // Координаты для каждого числа, чтобы оно смотрело "в камеру"
    switch(result) {
        case 1: x=0; y=0; break;
        case 6: x=0; y=180; break; 
        case 2: x=90; y=0; break; 
        case 5: x=-90; y=0; break; 
        case 3: x=0; y=-90; break; 
        case 4: x=0; y=90; break; 
    }

    // Добавляем лишние обороты для эффекта вращения
    x += 360 * 3 + (Math.random() * 20 - 10); // Немного "шума"
    y += 360 * 3 + (Math.random() * 20 - 10);

    // Сначала рандомное вращение
    cube.style.transition = "transform 0.8s ease-in-out";
    cube.style.transform = `rotateX(${x}deg) rotateY(${y}deg)`;

    // Потом доворот до четкой грани
    setTimeout(() => {
        // Убираем шум, оставляем четкие углы
        const cleanX = Math.round(x / 90) * 90;
        const cleanY = Math.round(y / 90) * 90;
        cube.style.transform = `rotateX(${cleanX}deg) rotateY(${cleanY}deg)`;
    }, 800);
}

// --- D20 LOGIC ---
window.rollD20 = function() {
    const svg = document.getElementById('d20-svg');
    const text = document.getElementById('d20-result');
    
    svg.classList.add('d20-spin');
    text.style.opacity = 0;

    setTimeout(() => {
        svg.classList.remove('d20-spin');
        const res = Math.floor(Math.random() * 20) + 1;
        text.innerHTML = res;
        text.style.opacity = 1;
    }, 500);
}

// --- COIN LOGIC ---
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

// --- RANDOMIZER ---
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
