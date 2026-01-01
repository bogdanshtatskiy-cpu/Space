import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class DiceEngine {
    constructor(containerId, diceType) {
        this.container = document.getElementById(containerId);
        this.type = diceType; 
        
        // Цвет: Матовый серо-голубой лед
        this.color = 0x8899aa; 
        
        // Размеры
        this.size = (diceType === 'd6') ? 7 : (diceType === 'd10' ? 7 : (diceType === 'd12' ? 7.5 : 8));
        
        this.textMeshes = {};
        this.resultValues = [];
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
        
        // Настройка тона для реалистичных бликов
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        
        this.container.appendChild(this.renderer.domElement);

        // --- УЛУЧШЕННОЕ ОСВЕЩЕНИЕ ---
        // 1. Мягкий общий свет (чтобы не было черных дыр)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); 
        this.scene.add(ambientLight);
        
        // 2. Основной свет (Key Light) - теплый
        const mainLight = new THREE.DirectionalLight(0xffffee, 2);
        mainLight.position.set(10, 20, 15);
        this.scene.add(mainLight);

        // 3. Контровой свет (Rim Light) - холодный, для контуров стекла
        const rimLight = new THREE.SpotLight(0xccddff, 5);
        rimLight.position.set(-15, 10, -10);
        rimLight.lookAt(0, 0, 0);
        this.scene.add(rimLight);

        // 4. Заполняющий свет с "темной" стороны (Fix для D10)
        const fillLight = new THREE.DirectionalLight(0xaaccff, 1);
        fillLight.position.set(-10, 0, 10);
        this.scene.add(fillLight);

        // 5. Нижний свет
        const bottomLight = new THREE.PointLight(0x0a84ff, 1);
        bottomLight.position.set(0, -15, 0);
        this.scene.add(bottomLight);

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
        const vertices = [];
        const indices = [];
        const h = radius * 1.3; 
        const r = radius * 1.0; 
        const k = radius * 0.2; 

        vertices.push(0, h, 0); // 0
        vertices.push(0, -h, 0); // 1

        for (let i = 0; i < 5; i++) {
            const angle = (i * 72) * (Math.PI / 180);
            const angleOffset = ((i * 72) + 36) * (Math.PI / 180);
            vertices.push(r * Math.cos(angle), k, r * Math.sin(angle)); 
            vertices.push(r * Math.cos(angleOffset), -k, r * Math.sin(angleOffset)); 
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

        let geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        
        // ВАЖНО: Делаем грани независимыми (Non-Indexed).
        // Это заставляет движок считать нормали для каждого треугольника отдельно,
        // что убирает "черные пятна" сглаживания на острых углах D10.
        geometry = geometry.toNonIndexed(); 
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

        // Материал: Полированная смола (Resin/Glass)
        const material = new THREE.MeshPhysicalMaterial({
            color: this.color,
            metalness: 0.05,
            roughness: 0.15,      // Гладкое, чтобы бликовало
            transmission: 0.95,   // Очень прозрачное
            thickness: 3.0,       // Толстое стекло (преломление)
            clearcoat: 1.0,       // Лак сверху
            clearcoatRoughness: 0.1,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        this.diceGroup.add(mesh);

        // Линии (делаем тоньше)
        const threshold = (this.type === 'd10') ? 35 : 1; // Угол отсечения для D10
        const edges = new THREE.EdgesGeometry(geometry, threshold);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 }));
        this.diceGroup.add(line);

        // --- ЦИФРЫ ---
        if (this.type === 'd6') {
             const data = [
                {pos: [1, 0, 0], rot: [0, Math.PI/2, 0], num: 1}, {pos: [-1, 0, 0], rot: [0, -Math.PI/2, 0], num: 6},
                {pos: [0, 1, 0], rot: [-Math.PI/2, 0, 0], num: 2}, {pos: [0, -1, 0], rot: [Math.PI/2, 0, 0], num: 5},
                {pos: [0, 0, 1], rot: [0, 0, 0], num: 3}, {pos: [0, 0, -1], rot: [0, Math.PI, 0], num: 4}
            ];
            const offset = this.size * 1.6 / 2 + 0.05;
            data.forEach(d => {
                const vec = new THREE.Vector3(...d.pos);
                this.addText(d.num, vec.multiplyScalar(offset), (mesh) => { mesh.rotation.set(...d.rot); });
            });
        } else if (this.type === 'd10') {
            // Для D10 (Non-Indexed) нужно находить центры граней хитрее, т.к. вершин стало больше.
            // Но логика простая: у нас 10 граней, каждая состоит из 2 треугольников (6 вершин).
            // Порядок не изменился после toNonIndexed.
            const posAttr = geometry.getAttribute('position');
            
            for (let face = 0; face < 10; face++) {
                const iStart = face * 6; // 6 вершин на грань (2 треугольника)
                const center = new THREE.Vector3();
                // Берем 4 уникальные точки из 6 вершин (так как 2 повторяются)
                // Или просто усредняем все 6 - центр будет тем же.
                for(let k=0; k<6; k++) {
                    center.add(new THREE.Vector3().fromBufferAttribute(posAttr, iStart + k));
                }
                center.divideScalar(6);
                
                let num = face; // 0-9
                this.addText(num, center.multiplyScalar(1.02), (mesh) => {
                    mesh.lookAt(center.multiplyScalar(2));
                    // Нижний ряд переворачиваем
                    if (face >= 5) mesh.rotation.z = Math.PI;
                });
            }
        } else {
            const posAttr = geometry.attributes.position;
            const vertsPerFace = (this.type === 'd12') ? 9 : 3;
            const totalFaces = posAttr.count / vertsPerFace;
            for (let i = 0; i < totalFaces; i++) {
                let num = i + 1;
                const center = new THREE.Vector3();
                for (let k = 0; k < vertsPerFace; k++) { center.add(new THREE.Vector3().fromBufferAttribute(posAttr, i * vertsPerFace + k)); }
                center.divideScalar(vertsPerFace);
                this.addText(num, center.multiplyScalar(1.03), (mesh) => {
                    mesh.lookAt(center.multiplyScalar(2));
                    if (this.type === 'd4') mesh.rotation.z += Math.PI / 3;
                });
            }
        }
    }

    addText(num, pos, orientCallback) {
        let displayNum = num.toString();
        const txt = this.createTextLabel(displayNum);
        txt.position.copy(pos);
        orientCallback(txt);
        this.diceGroup.add(txt);
        this.textMeshes[num] = txt;
        this.resultValues.push(num);
    }

    createTextLabel(text) {
        const size = 512; 
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 250px Arial'; 
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        
        let label = text;
        // Добавляем точку для 6 и 9, чтобы различать
        if (text === '6' || text === '9') label += '.';
        
        ctx.fillText(label, size / 2, size / 2);
        
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        const mat = new THREE.MeshPhysicalMaterial({ 
            map: tex, transparent: true, side: THREE.FrontSide,
            roughness: 0.5, metalness: 0, clearcoat: 0.5
        });
        const planeSize = (this.type === 'd12') ? this.size * 0.75 : this.size * 0.7;
        const geo = new THREE.PlaneGeometry(planeSize, planeSize);
        return new THREE.Mesh(geo, mat);
    }

    roll() {
        if (this.isRolling) return;
        this.isRolling = true;

        const resultVal = this.resultValues[Math.floor(Math.random() * this.resultValues.length)];
        const targetMesh = this.textMeshes[resultVal];
        
        // Инвертируем поворот текста, чтобы он смотрел на камеру (Z+)
        const targetQ = targetMesh.quaternion.clone().invert();
        
        const duration = 2000; const startTime = performance.now();
        let rotSpeed = { x: 0.15 + Math.random()*0.1, y: 0.15 + Math.random()*0.1 };

        const animateRoll = (time) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);

            if (progress < 1) {
                if (progress < 0.6) {
                    this.diceGroup.rotation.x += rotSpeed.x;
                    this.diceGroup.rotation.y += rotSpeed.y;
                    this.midQ = this.diceGroup.quaternion.clone();
                } else {
                    const p2 = (progress - 0.6) * 2.5; 
                    const ease = 1 - Math.pow(1 - p2, 3);
                    this.diceGroup.quaternion.slerpQuaternions(this.midQ, targetQ, ease);
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
        if (this.diceGroup && !this.isRolling) {
            this.diceGroup.rotation.y += 0.001;
        }
        this.renderer.render(this.scene, this.camera);
    }
}
