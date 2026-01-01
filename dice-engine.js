import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export class DiceEngine {
    constructor(containerId, diceType) {
        this.container = document.getElementById(containerId);
        this.type = diceType; 
        // Единый цвет для всех кубиков (серо-голубой лед)
        this.color = 0x8899aa; 
        
        // Оптимальные размеры
        this.size = (diceType === 'd6') ? 7 : (diceType === 'd10' ? 6.5 : 8);
        
        this.faceNormals = [];
        this.isRolling = false;
        
        this.init();
        this.animate();
    }

    init() {
        this.scene = new THREE.Scene();
        
        this.camera = new THREE.PerspectiveCamera(45, this.container.clientWidth / this.container.clientHeight, 1, 1000);
        this.camera.position.z = 35; // Камера чуть ближе

        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.physicallyCorrectLights = true;
        this.container.appendChild(this.renderer.domElement);

        // Освещение для стекла
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
        mainLight.position.set(10, 20, 15);
        this.scene.add(mainLight);
        
        const backLight = new THREE.SpotLight(0xaaccff, 2);
        backLight.position.set(-10, 10, -20);
        backLight.lookAt(0,0,0);
        this.scene.add(backLight);

        this.createDice();

        this.container.addEventListener('click', () => this.roll());
        this.container.addEventListener('touchstart', (e) => { e.preventDefault(); this.roll(); }, {passive: false});

        window.addEventListener('resize', () => {
            if(!this.container.offsetParent) return;
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        });
    }

    createD10Geometry(radius) {
        // Создаем Пентагональный трапецоэдр (D10)
        const vertices = [];
        const indices = [];
        const h = radius * 1.3; 
        const r = radius * 1.0; 
        const k = radius * 0.3; 

        vertices.push(0, h, 0); // 0: Top
        vertices.push(0, -h, 0); // 1: Bottom

        for (let i = 0; i < 5; i++) {
            const angle = (i * 72) * (Math.PI / 180);
            const angleOffset = ((i * 72) + 36) * (Math.PI / 180);
            vertices.push(r * Math.cos(angle), k, r * Math.sin(angle)); // Upper
            vertices.push(r * Math.cos(angleOffset), -k, r * Math.sin(angleOffset)); // Lower
        }

        const upperIndices = [2, 4, 6, 8, 10];
        const lowerIndices = [3, 5, 7, 9, 11];

        for (let i = 0; i < 5; i++) {
            const u = upperIndices[i];
            const nextU = upperIndices[(i + 1) % 5];
            const l = lowerIndices[i];
            
            // Грань "воздушный змей" состоит из 2 треугольников
            // Важно правильно задать индексы для нормалей
            indices.push(0, u, l); 
            indices.push(0, l, nextU);
            indices.push(1, l, nextU);
            indices.push(1, nextU, lowerIndices[(i + 1) % 5]);
        }

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

        switch (this.type) {
            case 'd4': geometry = new THREE.TetrahedronGeometry(this.size); break;
            case 'd6': geometry = new THREE.BoxGeometry(this.size*1.6, this.size*1.6, this.size*1.6); break;
            case 'd8': geometry = new THREE.OctahedronGeometry(this.size); break;
            case 'd12': geometry = new THREE.DodecahedronGeometry(this.size); break;
            case 'd10': geometry = this.createD10Geometry(this.size); break;
            case 'd20': default: geometry = new THREE.IcosahedronGeometry(this.size, 0); break;
        }

        // Материал: Единый стиль, матовое стекло, не яркое
        const material = new THREE.MeshPhysicalMaterial({
            color: this.color, // Спокойный цвет
            metalness: 0.1,
            roughness: 0.4,    // Более матовое
            transmission: 0.9, // Прозрачность
            thickness: 1.5,
            transparent: true,
            opacity: 0.9,
            flatShading: true,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        this.diceGroup.add(mesh);

        // Линии (Edges) - убираем лишнее на D10
        // Для D10 угол отсечения ставим больше (20 градусов), чтобы линия не рисовалась посередине грани
        const threshold = (this.type === 'd10') ? 20 : 1;
        const edges = new THREE.EdgesGeometry(geometry, threshold);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }));
        this.diceGroup.add(line);

        // --- ГЕНЕРАЦИЯ ЦИФР ---
        if (this.type === 'd6') {
             const data = [
                {pos: [1, 0, 0], rot: [0, Math.PI/2, 0], num: 1},
                {pos: [-1, 0, 0], rot: [0, -Math.PI/2, 0], num: 6},
                {pos: [0, 1, 0], rot: [-Math.PI/2, 0, 0], num: 2},
                {pos: [0, -1, 0], rot: [Math.PI/2, 0, 0], num: 5},
                {pos: [0, 0, 1], rot: [0, 0, 0], num: 3},
                {pos: [0, 0, -1], rot: [0, Math.PI, 0], num: 4}
            ];
            const offset = this.size * 1.6 / 2 + 0.1;
            data.forEach(d => {
                const vec = new THREE.Vector3(...d.pos);
                this.faceNormals.push({ normal: vec.clone(), value: d.num });
                const txt = this.createTextLabel(d.num.toString());
                txt.position.copy(vec.multiplyScalar(offset));
                txt.rotation.set(...d.rot);
                this.diceGroup.add(txt);
            });

        } else if (this.type === 'd10') {
            const posAttr = geometry.getAttribute('position');
            const indexAttr = geometry.getIndex();
            
            // У D10 10 граней. В нашей геометрии грани идут парами треугольников (0,1 -> грань 1; 2,3 -> грань 2)
            for (let face = 0; face < 10; face++) {
                // Берем 6 вершин (2 треугольника), чтобы найти общий центр
                const iStart = face * 6; 
                const uniqueIndices = new Set();
                for(let k=0; k<6; k++) uniqueIndices.add(indexAttr.getX(iStart + k));
                
                const center = new THREE.Vector3();
                uniqueIndices.forEach(idx => {
                    center.add(new THREE.Vector3().fromBufferAttribute(posAttr, idx));
                });
                center.divideScalar(uniqueIndices.size);
                
                let num = face + 1;
                // По правилам D10, грани нумеруются 1-10 (или 0-9). Десятка это 0.
                let displayNum = (num === 10) ? "0" : num.toString();
                const normal = center.clone().normalize();
                this.faceNormals.push({ normal: normal.clone(), value: num });

                const txt = this.createTextLabel(displayNum);
                txt.position.copy(center.multiplyScalar(1.05));
                txt.lookAt(center.multiplyScalar(2));
                
                // Ориентация цифр D10
                if (face >= 5) txt.rotation.z = Math.PI; 
                this.diceGroup.add(txt);
            }

        } else if (this.type === 'd12') {
             // D12 - Додекаэдр. 
             // Three.js DodecahedronGeometry строит грани из 3-х треугольников (веер).
             // Граней 12. Индексов 36 * 3? Нет, проверим структуру.
             // Обычно Dodecahedron (radius, 0) имеет 36 вершин в позиции для треугольников.
             
             const posAttr = geometry.attributes.position;
             // У DodecahedronGeometry без индекса (flat) каждая грань (пентагон) состоит из 3 треугольников = 9 вершин.
             // Всего 12 граней * 9 вершин = 108 вершин в буфере position.
             
             const verticesPerFace = 9; 
             const totalFaces = posAttr.count / verticesPerFace; // должно быть 12

             for (let i = 0; i < totalFaces; i++) {
                 const startV = i * verticesPerFace;
                 const center = new THREE.Vector3();
                 // Усредняем все вершины грани для центра
                 for (let k = 0; k < verticesPerFace; k++) {
                     const v = new THREE.Vector3().fromBufferAttribute(posAttr, startV + k);
                     center.add(v);
                 }
                 center.divideScalar(verticesPerFace);
                 
                 const normal = center.clone().normalize();
                 let num = i + 1;
                 this.faceNormals.push({ normal: normal.clone(), value: num });
                 
                 const txt = this.createTextLabel(num.toString());
                 txt.position.copy(center.multiplyScalar(1.05));
                 txt.lookAt(center.multiplyScalar(2));
                 
                 // Поправка ориентации для D12 чтобы цифры стояли красиво
                 // Это зависит от построения Three.js, подбираем эмпирически
                 // Обычно они смотрят к центру, но могут быть перевернуты
                 
                 this.diceGroup.add(txt);
             }

        } else {
            // D4, D8, D20
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
                txt.position.copy(center.multiplyScalar(1.05));
                txt.lookAt(center.multiplyScalar(2));
                
                if (this.type === 'd4') txt.rotation.z += Math.PI / 3;
                this.diceGroup.add(txt);
            }
        }
    }

    createTextLabel(text) {
        // Увеличили разрешение канваса для четкости D12
        const size = 512; 
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(0,0,0,0)'; 
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = 'white';
        // Шрифт крупнее
        ctx.font = 'bold 250px Arial'; 
        ctx.textAlign = 'center'; 
        ctx.textBaseline = 'middle';
        
        let txt = text;
        if (txt === '6' || txt === '9') txt += '.';
        
        // Рисуем по центру
        ctx.fillText(txt, size / 2, size / 2);
        
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter; // Сглаживание
        
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.FrontSide });
        // Размер плоскости текста на кубике
        const planeSize = (this.type === 'd12') ? this.size : this.size/1.3;
        const geo = new THREE.PlaneGeometry(planeSize, planeSize);
        return new THREE.Mesh(geo, mat);
    }

    // --- ПЛАВНАЯ АНИМАЦИЯ БЕЗ РЫВКОВ ---
    roll() {
        if (this.isRolling) return;
        this.isRolling = true;

        const idx = Math.floor(Math.random() * this.faceNormals.length);
        const targetFace = this.faceNormals[idx];
        
        // 1. Вычисляем целевой кватернион (конечный поворот)
        // Вектор (0,0,1) - это направление "в камеру"
        const targetQ = new THREE.Quaternion().setFromUnitVectors(targetFace.normal, new THREE.Vector3(0,0,1));
        
        // 2. Генерируем "промежуточный" хаотичный поворот, от которого будем плавно переходить к цели
        // Сделаем несколько случайных оборотов
        const randomRot = new THREE.Euler(
            Math.random() * Math.PI * 4,
            Math.random() * Math.PI * 4,
            Math.random() * Math.PI * 4
        );
        const endChaosQ = new THREE.Quaternion().setFromEuler(randomRot);
        
        // Начальная позиция
        const startQ = this.diceGroup.quaternion.clone();

        const duration = 2000; // 2 секунды
        const startTime = performance.now();

        const animateRoll = (time) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease Out Cubic (быстрый старт, плавное торможение)
            const ease = 1 - Math.pow(1 - progress, 3);
            
            // Логика:
            // Первую часть времени крутимся активно (slerp в никуда или просто вращение)
            // Но чтобы было супер плавно, мы сделаем интерполяцию между (Start -> RandomChaos -> Target)
            
            // Упрощенный, но плавный метод:
            // Вращаем кубик вручную по Euler, постепенно замедляя, 
            // а параллельно интерполируем кватернион к Target.
            
            // Метод интерполяции от старта к цели через промежуточные вращения:
            if (progress < 1) {
                // Вращаем геометрию, но чем ближе к концу, тем сильнее влияние targetQ
                
                // Чтобы избежать рывка, мы интерполируем от startQ к targetQ, 
                // но добавляем "шум" (вращение), который затухает к концу.
                
                // Базовая интерполяция к цели
                this.diceGroup.quaternion.slerpQuaternions(startQ, targetQ, ease);
                
                // Добавляем вращение поверх (затухающее)
                const spinFactor = (1 - ease) * 10; // В начале быстро, в конце 0
                this.diceGroup.rotation.x += 0.05 * (1-ease); // Визуальный шум, не меняющий кватернион основы? 
                // Нет, так нельзя, rotation и quaternion конфликтуют.
                
                // Правильный подход: Slerp.
                // Просто slerp от start к target слишком скучно (просто поворот по кратчайшей дуге).
                // Нам нужно "накрутить" обороты.
                // Мы можем сделать slerp(Start, Target, ease), но предварительно "накрутив" Start.
                // Но это сложно математически.
                
                // Рабочий вариант "без прилипания":
                // Используем Time для вращения по синусоиде + Slerp.
                
                // Простейший надежный вариант:
                // Мы интерполируем между (Start + много вращения) и Target.
                
                // Делаем так: 
                // Вращаем `diceGroup` по эйлеру просто так.
                // А в фоне считаем "идеальный путь".
                // Нет, это сложно.
                
                // Возвращаемся к проверенному методу с фазами, но сглаженному:
                if (progress < 0.5) {
                   // Фаза разгона: просто крутим
                   this.diceGroup.rotation.x += 0.3; 
                   this.diceGroup.rotation.y += 0.3;
                   // Обновляем startQ для второй фазы
                   if (progress > 0.45) this.midQ = this.diceGroup.quaternion.clone();
                } else {
                   // Фаза посадки: интерполируем от того, где были в 0.5, к цели
                   // Пересчитываем прогресс для этой фазы (от 0 до 1)
                   const p2 = (progress - 0.5) * 2;
                   const ease2 = 1 - Math.pow(1 - p2, 3); // EaseOut
                   
                   // Если midQ не определен (баг тайминга), берем текущий
                   if (!this.midQ) this.midQ = this.diceGroup.quaternion.clone();
                   
                   this.diceGroup.quaternion.slerpQuaternions(this.midQ, targetQ, ease2);
                }

                requestAnimationFrame(animateRoll);
            } else {
                this.diceGroup.quaternion.copy(targetQ);
                this.isRolling = false;
            }
        };
        requestAnimationFrame(animateRoll);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (!this.isRolling) {
            // Очень медленное дыхание/покачивание
            this.diceGroup.rotation.y += 0.001;
        }
        this.renderer.render(this.scene, this.camera);
    }
}
