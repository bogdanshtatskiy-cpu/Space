import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export class DiceEngine {
    constructor(containerId, diceType) {
        this.container = document.getElementById(containerId);
        this.type = diceType; 
        // Единый цвет: матовый серо-голубой лед
        this.color = 0x8899aa; 
        
        // Размеры
        this.size = (diceType === 'd6') ? 7 : (diceType === 'd10' ? 6.5 : (diceType === 'd12' ? 7 : 8));
        
        this.faceNormals = [];
        this.isRolling = false;
        
        this.init();
        this.animate();
    }

    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, this.container.clientWidth / this.container.clientHeight, 1, 1000);
        this.camera.position.z = 35;

        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.physicallyCorrectLights = true;
        this.container.appendChild(this.renderer.domElement);

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
        // Пентагональный трапецоэдр (D10)
        // Геометрически это 2 "шапки", соединенные зигзагом
        const vertices = [];
        const indices = [];
        
        // Магия пропорций для красивого D10
        const h = radius * 1.3; // Высота полюсов
        const r = radius * 1.0; // Ширина экватора
        const k = radius * 0.2; // Сдвиг экватора (зигзаг)

        vertices.push(0, h, 0); // 0: Верхний полюс
        vertices.push(0, -h, 0); // 1: Нижний полюс

        // Генерация точек экватора (10 точек)
        for (let i = 0; i < 5; i++) {
            const angle = (i * 72) * (Math.PI / 180);
            const angleOffset = ((i * 72) + 36) * (Math.PI / 180);
            
            // Верхнее кольцо экватора (четные)
            vertices.push(r * Math.cos(angle), k, r * Math.sin(angle));
            // Нижнее кольцо экватора (нечетные)
            vertices.push(r * Math.cos(angleOffset), -k, r * Math.sin(angleOffset));
        }

        // Индексы.
        // Верхние точки: 2, 4, 6, 8, 10
        // Нижние точки: 3, 5, 7, 9, 11
        const upper = [2, 4, 6, 8, 10];
        const lower = [3, 5, 7, 9, 11];

        for (let i = 0; i < 5; i++) {
            const u = upper[i];
            const nextU = upper[(i + 1) % 5];
            const l = lower[i];
            const nextL = lower[(i + 1) % 5];

            // Каждая грань D10 - это "kite" (дельтоид).
            // В 3D мы строим его из 2 треугольников.
            // ВАЖНО: Треугольники должны быть в одной плоскости, чтобы это выглядело как одна грань.

            // Верхние грани (5 штук)
            // Состоят из: Top, Upper[i], Lower[i] + Top, Lower[i], Upper[next]
            // Но в D10 грань соединяет: Top, Upper[i], Lower[i], Upper[next] - это не плоско!
            // Правильная грань D10 соединяет: Top, Lower[i], Upper[next], Lower[next] ??? Нет.
            
            // Простая модель:
            // Грань 1: Top, Upper[i], Lower[i] -- это треугольник? Нет.
            // Грань D10 соединяет Полюс и 3 точки экватора зигзагом.
            
            // Давайте используем простую проверенную триангуляцию:
            // Верхняя грань i: (Top, Upper[i], Lower[i]) + (Top, Lower[i], Upper[next])
            // Чтобы убрать шов, мы используем EdgesGeometry с большим порогом угла.
            
            indices.push(0, u, l);
            indices.push(0, l, nextU);

            // Нижняя грань i
            indices.push(1, l, nextU);
            indices.push(1, nextU, lower[(i+1)%5]);
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

        const material = new THREE.MeshPhysicalMaterial({
            color: this.color,
            metalness: 0.1, roughness: 0.4, transmission: 0.9, thickness: 1.5,
            transparent: true, opacity: 0.9, flatShading: true, side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        this.diceGroup.add(mesh);

        // --- УДАЛЕНИЕ ЛИШНИХ ЛИНИЙ ---
        // Для D10 угол между треугольниками одной грани = 0 (или очень мал).
        // Угол между разными гранями большой.
        // Ставим thresholdAngle = 30 градусов. Все ребра, где угол меньше 30, не будут рисоваться.
        // Это скроет диагональ на гранях D10.
        const threshold = (this.type === 'd10') ? 30 : 1; 
        const edges = new THREE.EdgesGeometry(geometry, threshold);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 }));
        this.diceGroup.add(line);

        // --- ЦИФРЫ ---
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
            // D10: 10 граней (0-9).
            const posAttr = geometry.getAttribute('position');
            const indexAttr = geometry.getIndex();
            
            for (let face = 0; face < 10; face++) {
                // У нас 10 граней. В индексе они идут по 2 треугольника (6 вершин)
                const iStart = face * 6; 
                const uniqueIndices = new Set();
                for(let k=0; k<6; k++) uniqueIndices.add(indexAttr.getX(iStart + k));
                
                const center = new THREE.Vector3();
                uniqueIndices.forEach(idx => {
                    center.add(new THREE.Vector3().fromBufferAttribute(posAttr, idx));
                });
                center.divideScalar(uniqueIndices.size);
                
                let num = face; // 0-9
                let displayNum = num.toString();
                const normal = center.clone().normalize();
                this.faceNormals.push({ normal: normal.clone(), value: num });

                const txt = this.createTextLabel(displayNum);
                // Чуть дальше от центра, чтобы не тонуло
                txt.position.copy(center.multiplyScalar(1.08));
                txt.lookAt(center.multiplyScalar(2));
                
                // Переворачиваем нижние цифры, чтобы они смотрели "наружу" от полюса
                if (face >= 5) txt.rotation.z = Math.PI; 
                this.diceGroup.add(txt);
            }

        } else {
            // D4, D8, D12, D20
            const posAttr = geometry.attributes.position;
            // D12 (Dodecahedron): в Three.js геометрия строится не тривиально
            // Каждая грань (пентагон) состоит из 3 треугольников (9 вершин)
            // Но в 'position' буфере они могут быть дублированы для flat shading
            
            // Определяем сколько вершин на грань
            const vertsPerFace = (this.type === 'd12') ? 9 : 3;
            const totalFaces = posAttr.count / vertsPerFace;

            for (let i = 0; i < totalFaces; i++) {
                let num = i + 1;
                
                // Находим центр грани
                const center = new THREE.Vector3();
                for (let k = 0; k < vertsPerFace; k++) {
                    const v = new THREE.Vector3().fromBufferAttribute(posAttr, i * vertsPerFace + k);
                    center.add(v);
                }
                center.divideScalar(vertsPerFace);
                
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
        // Высокое разрешение для четкости
        const size = 512; 
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(0,0,0,0)'; 
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 250px Arial'; 
        ctx.textAlign = 'center'; 
        ctx.textBaseline = 'middle';
        
        let txt = text;
        if (txt === '6' || txt === '9') txt += '.';
        
        ctx.fillText(txt, size / 2, size / 2);
        
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.FrontSide });
        const planeSize = (this.type === 'd12') ? this.size * 0.8 : this.size * 0.7;
        const geo = new THREE.PlaneGeometry(planeSize, planeSize);
        return new THREE.Mesh(geo, mat);
    }

    // --- НОВАЯ АНИМАЦИЯ БРОСКА ---
    roll() {
        if (this.isRolling) return;
        this.isRolling = true;

        const idx = Math.floor(Math.random() * this.faceNormals.length);
        const target = this.faceNormals[idx];
        
        // Целевая ориентация (грань смотрит в камеру Z+)
        const targetQ = new THREE.Quaternion().setFromUnitVectors(target.normal, new THREE.Vector3(0,0,1));
        
        const duration = 2000; // 2 секунды всего
        const startTime = performance.now();
        
        // Текущая скорость вращения (Эйлеровы углы)
        let rotSpeed = { x: 0.4, y: 0.4 };

        const animateRoll = (time) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1); // 0 -> 1

            if (progress < 1) {
                // ФАЗА 1: Активное вращение (0% - 75% времени)
                if (progress < 0.75) {
                    // Просто вращаем объект быстро
                    this.diceGroup.rotation.x += rotSpeed.x;
                    this.diceGroup.rotation.y += rotSpeed.y;
                    
                    // Постепенно готовимся к перехвату управления
                    // (сохраняем текущую позицию как стартовую для интерполяции)
                    this.midQ = this.diceGroup.quaternion.clone();
                } 
                // ФАЗА 2: Плавная доводка (75% - 100% времени)
                else {
                    // Нормализуем прогресс для этой фазы (0 -> 1)
                    const p2 = (progress - 0.75) * 4; 
                    
                    // Easing (SmoothStep)
                    const ease = p2 * p2 * (3 - 2 * p2);

                    // Сферическая интерполяция от того места, где были в 0.75, к цели
                    this.diceGroup.quaternion.slerpQuaternions(this.midQ, targetQ, ease);
                }
                
                requestAnimationFrame(animateRoll);
            } else {
                // Финиш
                this.diceGroup.quaternion.copy(targetQ);
                this.isRolling = false;
            }
        };
        requestAnimationFrame(animateRoll);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (!this.isRolling) {
            this.diceGroup.rotation.y += 0.001;
        }
        this.renderer.render(this.scene, this.camera);
    }
}
