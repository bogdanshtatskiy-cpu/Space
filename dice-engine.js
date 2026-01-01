import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js";

export class DiceEngine {
    constructor(containerId, diceType, color = 0x3a94ff) {
        this.container = document.getElementById(containerId);
        this.type = diceType; // 'd4', 'd6', 'd8', 'd10', 'd12', 'd20'
        this.color = color;
        this.size = 9;
        this.faceNormals = [];
        this.isRolling = false;
        
        this.init();
        this.animate();
    }

    init() {
        // Сцена
        this.scene = new THREE.Scene();

        // Камера
        this.camera = new THREE.PerspectiveCamera(45, this.container.clientWidth / this.container.clientHeight, 1, 1000);
        this.camera.position.z = 40;

        // Рендер
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.physicallyCorrectLights = true;
        this.container.appendChild(this.renderer.domElement);

        // Свет (для стекла)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 2);
        mainLight.position.set(10, 20, 15);
        this.scene.add(mainLight);
        
        const backLight = new THREE.SpotLight(0x00ffff, 3);
        backLight.position.set(0, 10, -20);
        this.scene.add(backLight);

        // Создание кубика
        this.createDice();

        // Обработчики
        this.container.addEventListener('click', () => this.roll());
        this.container.addEventListener('touchstart', (e) => { e.preventDefault(); this.roll(); }, {passive: false});

        // Ресайз
        window.addEventListener('resize', () => {
            if(!this.container.offsetParent) return;
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        });
    }

    // --- ГЕНЕРАЦИЯ ГЕОМЕТРИИ D10 ---
    createD10Geometry(radius) {
        // D10 - это пентагональный трапецоэдр.
        // Он состоит из 10 граней "воздушных змеев".
        // Мы строим его из 20 треугольников (каждая грань = 2 треугольника),
        // чтобы Three.js мог это отрендерить.
        
        const vertices = [];
        const indices = [];
        
        // Параметры формы
        const h = radius * 1.3; // Высота полюсов
        const r = radius * 1.0; // Радиус экватора
        const k = radius * 0.3; // Смещение экватора по вертикали (зигзаг)

        // 0: Top Pole
        vertices.push(0, h, 0);
        // 1: Bottom Pole
        vertices.push(0, -h, 0);

        // Генерация поясов (Upper and Lower rings)
        // 5 точек сверху, 5 снизу, смещенные на 36 градусов
        for (let i = 0; i < 5; i++) {
            const angle = (i * 72) * (Math.PI / 180);
            const angleOffset = ((i * 72) + 36) * (Math.PI / 180);
            
            // Upper Ring (четные индексы в кольце) -> 2 + 2*i
            vertices.push(r * Math.cos(angle), k, r * Math.sin(angle));
            
            // Lower Ring (нечетные индексы в кольце) -> 2 + 2*i + 1
            vertices.push(r * Math.cos(angleOffset), -k, r * Math.sin(angleOffset));
        }

        // Вершины готовы. Теперь индексы (треугольники).
        // Нам нужно собрать 10 граней. Каждая грань состоит из 2 треугольников.
        // Индексы вершин в массиве:
        // 0 - Top, 1 - Bottom
        // 2,4,6,8,10 - Upper Ring points
        // 3,5,7,9,11 - Lower Ring points

        const upperIndices = [2, 4, 6, 8, 10];
        const lowerIndices = [3, 5, 7, 9, 11];

        // Строим 10 граней
        for (let i = 0; i < 5; i++) {
            const u = upperIndices[i];
            const nextU = upperIndices[(i + 1) % 5];
            const l = lowerIndices[i];
            const prevL = lowerIndices[(i + 4) % 5]; // Предыдущий нижний

            // ВЕРХНИЕ ГРАНИ (сходящиеся к вершине 0)
            // Face Top-i: Состоит из (Top, Upper_i, Lower_i) и (Top, Lower_i, Upper_next) ? Нет.
            // Геометрия D10: Верхняя грань соединяет Top, Upper_i, Lower_i, Upper_next.
            
            // Треугольник 1: Top, Upper[i], Lower[i]
            indices.push(0, u, l); 
            // Треугольник 2: Top, l, Next Upper
            indices.push(0, l, nextU);

            // НИЖНИЕ ГРАНИ (сходящиеся к вершине 1)
            // Аналогично зеркально
            // Треугольник 1: Bottom, Lower[i], Upper[next]
            indices.push(1, l, nextU);
            // Треугольник 2: Bottom, NextUpper, NextLower
            indices.push(1, nextU, lowerIndices[(i + 1) % 5]);
        }

        // Из-за сложности ручной сборки индексов для правильных нормалей, 
        // проще использовать PolyhedronGeometry, но для D10 нет стандартных констант.
        // Поэтому мы конвертируем этот массив в BufferGeometry.
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        
        return geometry;
    }

    createDice() {
        this.diceGroup = new THREE.Group();
        this.scene.add(this.diceGroup);

        let geometry;
        const labels = [];

        // Выбор геометрии
        switch (this.type) {
            case 'd4':
                geometry = new THREE.TetrahedronGeometry(this.size);
                break;
            case 'd6':
                geometry = new THREE.BoxGeometry(this.size * 1.5, this.size * 1.5, this.size * 1.5);
                break;
            case 'd8':
                geometry = new THREE.OctahedronGeometry(this.size);
                break;
            case 'd12':
                geometry = new THREE.DodecahedronGeometry(this.size);
                break;
            case 'd10': 
                // Используем нашу новую функцию для настоящего D10
                geometry = this.createD10Geometry(this.size);
                break;
            case 'd20':
            default:
                geometry = new THREE.IcosahedronGeometry(this.size, 0);
                break;
        }

        // Материал: Матовое стекло
        const material = new THREE.MeshPhysicalMaterial({
            color: this.color,
            metalness: 0,
            roughness: 0.35,
            transmission: 0.98,
            thickness: 2.0,
            transparent: true,
            opacity: 0.9,
            flatShading: true,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        this.diceGroup.add(mesh);

        // Wireframe (Сетка)
        const wf = new THREE.LineSegments(
            new THREE.WireframeGeometry(geometry),
            new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 })
        );
        this.diceGroup.add(wf);

        // --- ГЕНЕРАЦИЯ ЦИФР ---
        if (this.type === 'd6') {
             // ... (Логика D6 остается без изменений, см. прошлый код, если нужно - скопируйте)
             // Для краткости я использую логику полиэдров, но для D6 лучше ручные координаты
             // Вставим универсальный блок для D6:
            const data = [
                {pos: [1, 0, 0], rot: [0, Math.PI/2, 0], num: 1},
                {pos: [-1, 0, 0], rot: [0, -Math.PI/2, 0], num: 6},
                {pos: [0, 1, 0], rot: [-Math.PI/2, 0, 0], num: 2},
                {pos: [0, -1, 0], rot: [Math.PI/2, 0, 0], num: 5},
                {pos: [0, 0, 1], rot: [0, 0, 0], num: 3},
                {pos: [0, 0, -1], rot: [0, Math.PI, 0], num: 4}
            ];
            const offset = this.size * 1.5 / 2 + 0.1;
            data.forEach(d => {
                const vec = new THREE.Vector3(...d.pos);
                this.faceNormals.push({ normal: vec.clone(), value: d.num });
                const txt = this.createTextLabel(d.num.toString());
                txt.position.copy(vec.multiplyScalar(offset));
                txt.rotation.set(...d.rot);
                this.diceGroup.add(txt);
            });

        } else if (this.type === 'd10') {
            // --- СПЕЦИАЛЬНАЯ ЛОГИКА ДЛЯ D10 ---
            // Нам нужно найти центры граней нашей кастомной геометрии.
            // Геометрия D10 имеет 10 "логических" граней, но 20 треугольников.
            // Мы должны объединить пары треугольников, чтобы найти центр "воздушного змея".
            
            // У нас 5 верхних граней и 5 нижних.
            // Индексы треугольников мы строили в createD10Geometry.
            // Каждые 2 треугольника (6 вершин в index array) образуют одну грань.
            
            const posAttr = geometry.getAttribute('position');
            const indexAttr = geometry.getIndex();
            
            for (let face = 0; face < 10; face++) {
                // Каждая грань состоит из 2-х треугольников = 6 индексов
                const iStart = face * 6; 
                
                // Берем вершины, чтобы найти среднюю точку всей грани (4 уникальные вершины)
                const uniqueIndices = new Set();
                for(let k=0; k<6; k++) uniqueIndices.add(indexAttr.getX(iStart + k));
                
                const center = new THREE.Vector3();
                uniqueIndices.forEach(idx => {
                    const v = new THREE.Vector3().fromBufferAttribute(posAttr, idx);
                    center.add(v);
                });
                center.divideScalar(uniqueIndices.size);
                
                const normal = center.clone().normalize();
                
                // Числа:
                // Верхние грани (0-4): Четные числа? Или 0-9 по порядку?
                // Обычно на D10: 0, 1, 2...
                // Давайте сделаем: верхний ряд нечетные, нижний четные или по порядку.
                // Для простоты: 1..10.
                let num = face + 1;
                // Превращаем 10 в 0
                let displayNum = (num === 10) ? "0" : num.toString();

                this.faceNormals.push({ normal: normal.clone(), value: num }); // value для логики (1-10)

                const txt = this.createTextLabel(displayNum);
                
                // Позиция
                txt.position.copy(center.multiplyScalar(1.08)); // Чуть дальше, чтобы не тонуло
                
                // Поворот: текст должен смотреть от центра
                txt.lookAt(center.multiplyScalar(2));
                
                // Коррекция поворота текста, чтобы он стоял "вертикально" относительно полюса
                // Для верхних граней (face < 5) верх текста к полюсу.
                // Для нижних граней (face >= 5) низ текста к полюсу.
                if (face < 5) {
                    // Верхние грани - ориентируем к Y+
                } else {
                    // Нижние грани - переворачиваем, чтобы читалось снизу
                    txt.rotation.z = Math.PI; 
                }

                this.diceGroup.add(txt);
            }

        } else {
            // --- ЛОГИКА ДЛЯ D4, D8, D12, D20 ---
            const posAttr = geometry.attributes.position;
            let faceIdx = 0;
            
            for (let i = 0; i < posAttr.count; i += 3) {
                faceIdx++;
                let num = faceIdx;
                
                const v1 = new THREE.Vector3().fromBufferAttribute(posAttr, i);
                const v2 = new THREE.Vector3().fromBufferAttribute(posAttr, i + 1);
                const v3 = new THREE.Vector3().fromBufferAttribute(posAttr, i + 2);
                
                const center = new THREE.Vector3().addVectors(v1, v2).add(v3).divideScalar(3);
                const normal = center.clone().normalize();
                
                this.faceNormals.push({ normal: normal.clone(), value: num });
                
                const txt = this.createTextLabel(num.toString());
                txt.position.copy(center.multiplyScalar(1.03));
                txt.lookAt(center.multiplyScalar(2));
                
                if (this.type === 'd4') txt.rotation.z += Math.PI / 3;

                this.diceGroup.add(txt);
            }
        }
    }

    createTextLabel(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 70px Arial';
        ctx.textAlign = 'center'; 
        ctx.textBaseline = 'middle';
        
        let txt = text;
        // Точки для 6 и 9, чтобы различать
        if (txt === '6' || txt === '9') txt += '.';
        ctx.fillText(txt, 64, 64);
        
        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.FrontSide });
        const geo = new THREE.PlaneGeometry(this.size/1.5, this.size/1.5);
        return new THREE.Mesh(geo, mat);
    }

    roll() {
        if (this.isRolling) return;
        this.isRolling = true;

        const idx = Math.floor(Math.random() * this.faceNormals.length);
        const target = this.faceNormals[idx];
        
        const targetQ = new THREE.Quaternion().setFromUnitVectors(target.normal, new THREE.Vector3(0,0,1));
        
        let progress = 0;
        
        const animateRoll = () => {
            progress += 0.015;
            if (progress < 1) {
                if (progress < 0.6) {
                    this.diceGroup.rotation.x += 0.3;
                    this.diceGroup.rotation.y += 0.3;
                } else {
                    this.diceGroup.quaternion.slerp(targetQ, 0.1);
                }
                requestAnimationFrame(animateRoll);
            } else {
                this.diceGroup.quaternion.copy(targetQ);
                this.isRolling = false;
            }
        };
        animateRoll();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (!this.isRolling) {
            this.diceGroup.rotation.y += 0.002;
            this.diceGroup.rotation.x += 0.001;
        }
        this.renderer.render(this.scene, this.camera);
    }
}
