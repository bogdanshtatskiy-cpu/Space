import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export class DiceEngine {
    constructor(containerId, diceType) {
        this.container = document.getElementById(containerId);
        this.type = diceType; 
        
        // Цвет: Матовое серо-голубое стекло (спокойный)
        this.color = 0x8899aa; 
        
        // Размеры кубиков
        this.size = (diceType === 'd6') ? 6.5 : (diceType === 'd10' ? 6.5 : (diceType === 'd12' ? 7 : 8));
        
        this.textMeshes = {}; // Хранилище ссылок на меши цифр для ориентации
        this.resultValues = []; // Доступные значения
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

        // Освещение
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
        const vertices = [];
        const indices = [];
        const h = radius * 1.3; 
        const r = radius * 1.0; 
        const k = radius * 0.2; 

        vertices.push(0, h, 0); // 0: Top
        vertices.push(0, -h, 0); // 1: Bottom

        for (let i = 0; i < 5; i++) {
            const angle = (i * 72) * (Math.PI / 180);
            const angleOffset = ((i * 72) + 36) * (Math.PI / 180);
            vertices.push(r * Math.cos(angle), k, r * Math.sin(angle)); // Upper
            vertices.push(r * Math.cos(angleOffset), -k, r * Math.sin(angleOffset)); // Lower
        }

        const upper = [2, 4, 6, 8, 10];
        const lower = [3, 5, 7, 9, 11];

        for (let i = 0; i < 5; i++) {
            const u = upper[i];
            const nextU = upper[(i + 1) % 5];
            const l = lower[i];
            
            indices.push(0, u, l);
            indices.push(0, l, nextU);
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

        // Линии (скрываем внутренние швы для D10)
        const threshold = (this.type === 'd10') ? 30 : 1;
        const edges = new THREE.EdgesGeometry(geometry, threshold);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 }));
        this.diceGroup.add(line);

        // --- РАССТАНОВКА ЦИФР ---
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
                this.addText(d.num, vec.multiplyScalar(offset), (mesh) => {
                    mesh.rotation.set(...d.rot);
                });
            });

        } else if (this.type === 'd10') {
            const posAttr = geometry.getAttribute('position');
            const indexAttr = geometry.getIndex();
            
            for (let face = 0; face < 10; face++) {
                const iStart = face * 6; 
                const uniqueIndices = new Set();
                for(let k=0; k<6; k++) uniqueIndices.add(indexAttr.getX(iStart + k));
                
                const center = new THREE.Vector3();
                uniqueIndices.forEach(idx => {
                    center.add(new THREE.Vector3().fromBufferAttribute(posAttr, idx));
                });
                center.divideScalar(uniqueIndices.size);
                
                let num = face; // 0-9
                this.addText(num, center.multiplyScalar(1.08), (mesh) => {
                    mesh.lookAt(center.multiplyScalar(2));
                    // D10 специфика: нижние цифры переворачиваем, чтобы читались от полюса
                    if (face >= 5) mesh.rotation.z = Math.PI;
                });
            }

        } else {
            // D4, D8, D12, D20
            const posAttr = geometry.attributes.position;
            const vertsPerFace = (this.type === 'd12') ? 9 : 3;
            const totalFaces = posAttr.count / vertsPerFace;

            for (let i = 0; i < totalFaces; i++) {
                let num = i + 1;
                const center = new THREE.Vector3();
                for (let k = 0; k < vertsPerFace; k++) {
                    center.add(new THREE.Vector3().fromBufferAttribute(posAttr, i * vertsPerFace + k));
                }
                center.divideScalar(vertsPerFace);
                
                this.addText(num, center.multiplyScalar(1.05), (mesh) => {
                    mesh.lookAt(center.multiplyScalar(2));
                    if (this.type === 'd4') mesh.rotation.z += Math.PI / 3;
                });
            }
        }
    }

    addText(num, pos, orientCallback) {
        let displayNum = num.toString();
        // Для D10 цифра 10 обычно это 0
        if (this.type === 'd10' && num === 10) displayNum = "0"; // Если логика 1-10
        
        const txt = this.createTextLabel(displayNum);
        txt.position.copy(pos);
        orientCallback(txt);
        
        this.diceGroup.add(txt);
        
        // Сохраняем ссылку на меш текста для этого числа
        this.textMeshes[num] = txt;
        this.resultValues.push(num);
    }

    createTextLabel(text) {
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
        
        // Рисуем текст по центру
        ctx.fillText(text, size / 2, size / 2);
        
        // Точка для 6 и 9 (внизу справа)
        if (text === '6' || text === '9' || text === '06' || text === '09') {
             ctx.font = 'bold 200px Arial';
             ctx.fillText('.', size / 2 + 80, size / 2 + 80);
        }
        
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.FrontSide });
        const planeSize = (this.type === 'd12') ? this.size * 0.8 : this.size * 0.7;
        const geo = new THREE.PlaneGeometry(planeSize, planeSize);
        return new THREE.Mesh(geo, mat);
    }

    // --- ПЛАВНАЯ АНИМАЦИЯ С ПРАВИЛЬНОЙ ОРИЕНТАЦИЕЙ ---
    roll() {
        if (this.isRolling) return;
        this.isRolling = true;

        // 1. Выбираем случайное число из доступных
        const resultVal = this.resultValues[Math.floor(Math.random() * this.resultValues.length)];
        
        // 2. Получаем меш текста для этого числа
        const targetMesh = this.textMeshes[resultVal];

        // 3. Вычисляем целевой поворот (Target Quaternion)
        // Идея: Мы хотим, чтобы targetMesh оказался повернут лицом к камере (identity rotation в мире, если камера смотрит по Z)
        // Но targetMesh имеет локальный поворот относительно diceGroup.
        // DiceGroup.quaternion * targetMesh.quaternion = WorldRotation
        // Мы хотим WorldRotation = Identity (или FacingCamera)
        // Значит: TargetDiceGroupQ = (targetMesh.quaternion)^-1
        
        // Тонкость: Камера смотрит в -Z, а текст мы создавали глядя на нормали.
        // Обычно lookAt ориентирует +Z объекта на цель.
        // Чтобы текст смотрел в камеру, его +Z должен смотреть на +Z камеры (которая на позиции z=35).
        
        const targetQ = targetMesh.quaternion.clone().invert();

        // 4. Параметры анимации
        const duration = 2000; // 2 секунды
        const startTime = performance.now();
        
        // Менее агрессивное начальное вращение
        let rotSpeed = { x: 0.15 + Math.random()*0.1, y: 0.15 + Math.random()*0.1 };

        const animateRoll = (time) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);

            if (progress < 1) {
                // ФАЗА 1: Свободное вращение (0% - 60%)
                if (progress < 0.6) {
                    this.diceGroup.rotation.x += rotSpeed.x;
                    this.diceGroup.rotation.y += rotSpeed.y;
                    
                    // Сохраняем текущее положение для плавного перехода
                    this.midQ = this.diceGroup.quaternion.clone();
                } 
                // ФАЗА 2: Плавная доводка до идеального угла (60% - 100%)
                else {
                    // Нормализуем прогресс для этой фазы (0 -> 1)
                    const p2 = (progress - 0.6) * 2.5; 
                    
                    // Ease Out Cubic (плавное замедление)
                    const ease = 1 - Math.pow(1 - p2, 3);

                    // Интерполяция от "где мы были" к "куда надо"
                    this.diceGroup.quaternion.slerpQuaternions(this.midQ, targetQ, ease);
                }
                
                requestAnimationFrame(animateRoll);
            } else {
                // Финиш: жестко ставим идеальный угол
                this.diceGroup.quaternion.copy(targetQ);
                this.isRolling = false;
            }
        };
        requestAnimationFrame(animateRoll);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (!this.isRolling) {
            // Легкое покачивание (дыхание)
            this.diceGroup.rotation.y += 0.001;
        }
        this.renderer.render(this.scene, this.camera);
    }
}
