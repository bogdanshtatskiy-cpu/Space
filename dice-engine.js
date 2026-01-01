import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export class DiceEngine {
    constructor(containerId, diceType, color = 0x3a94ff) {
        this.container = document.getElementById(containerId);
        this.type = diceType; 
        this.color = color;
        // Уменьшаем размер для массивных кубиков
        this.size = (diceType === 'd6' || diceType === 'd10') ? 7 : 9;
        this.faceNormals = [];
        this.isRolling = false;
        
        this.init();
        this.animate();
    }

    init() {
        this.scene = new THREE.Scene();
        
        this.camera = new THREE.PerspectiveCamera(45, this.container.clientWidth / this.container.clientHeight, 1, 1000);
        this.camera.position.z = 40;

        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.physicallyCorrectLights = true;
        this.container.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 2);
        mainLight.position.set(10, 20, 15);
        this.scene.add(mainLight);
        
        const backLight = new THREE.SpotLight(0x00ffff, 3);
        backLight.position.set(0, 10, -20);
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
            vertices.push(r * Math.cos(angle), k, r * Math.sin(angle)); // Upper ring
            vertices.push(r * Math.cos(angleOffset), -k, r * Math.sin(angleOffset)); // Lower ring
        }

        const upperIndices = [2, 4, 6, 8, 10];
        const lowerIndices = [3, 5, 7, 9, 11];

        for (let i = 0; i < 5; i++) {
            const u = upperIndices[i];
            const nextU = upperIndices[(i + 1) % 5];
            const l = lowerIndices[i];
            
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
            case 'd6': geometry = new THREE.BoxGeometry(this.size*1.8, this.size*1.8, this.size*1.8); break;
            case 'd8': geometry = new THREE.OctahedronGeometry(this.size); break;
            case 'd12': geometry = new THREE.DodecahedronGeometry(this.size); break;
            case 'd10': geometry = this.createD10Geometry(this.size); break;
            case 'd20': default: geometry = new THREE.IcosahedronGeometry(this.size, 0); break;
        }

        const material = new THREE.MeshPhysicalMaterial({
            color: this.color, metalness: 0, roughness: 0.35, transmission: 0.98,
            thickness: 2.0, transparent: true, opacity: 0.9, flatShading: true, side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        this.diceGroup.add(mesh);

        // ИСПОЛЬЗУЕМ EDGES GEOMETRY вместо WireframeGeometry
        // Это убирает диагональные линии сквозь цифры
        const thresholdAngle = this.type === 'd10' ? 15 : 1; 
        const edges = new THREE.EdgesGeometry(geometry, thresholdAngle);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }));
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
            const offset = this.size * 1.8 / 2 + 0.1; // Offset for BoxGeometry
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
            for (let face = 0; face < 10; face++) {
                const iStart = face * 6; 
                const uniqueIndices = new Set();
                for(let k=0; k<6; k++) uniqueIndices.add(indexAttr.getX(iStart + k));
                const center = new THREE.Vector3();
                uniqueIndices.forEach(idx => {
                    center.add(new THREE.Vector3().fromBufferAttribute(posAttr, idx));
                });
                center.divideScalar(uniqueIndices.size);
                
                let num = face + 1;
                let displayNum = (num === 10) ? "0" : num.toString();
                const normal = center.clone().normalize();
                this.faceNormals.push({ normal: normal.clone(), value: num });

                const txt = this.createTextLabel(displayNum);
                txt.position.copy(center.multiplyScalar(1.08));
                txt.lookAt(center.multiplyScalar(2));
                if (face >= 5) txt.rotation.z = Math.PI; // Flip bottom numbers
                this.diceGroup.add(txt);
            }

        } else {
            // D4, D8, D12, D20
            const posAttr = geometry.attributes.position;
            let faceIdx = 0;
            const vectorZ = new THREE.Vector3(0, 0, 1);

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
                txt.lookAt(center.multiplyScalar(2)); // Смотрим от центра
                
                // Корректировка поворота цифр для специфичных кубиков
                if (this.type === 'd4') txt.rotation.z += Math.PI / 3;
                if (this.type === 'd12') {
                    // D12 требует дополнительной подкрутки, чтобы цифры стояли ровно
                    // Это эмпирическая поправка
                     txt.rotation.z += 0; 
                }

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
        if (txt === '6' || txt === '9') txt += '.';
        ctx.fillText(txt, 64, 64);
        
        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.FrontSide });
        const geo = new THREE.PlaneGeometry(this.size/1.5, this.size/1.5);
        return new THREE.Mesh(geo, mat);
    }

    // --- ИСПРАВЛЕННАЯ АНИМАЦИЯ БРОСКА ---
    roll() {
        if (this.isRolling) return;
        this.isRolling = true;

        const idx = Math.floor(Math.random() * this.faceNormals.length);
        const target = this.faceNormals[idx];
        
        // Кватернион цели
        const targetQ = new THREE.Quaternion().setFromUnitVectors(target.normal, new THREE.Vector3(0,0,1));
        
        const startTime = performance.now();
        const duration = 2000; // 2 секунды

        // Сохраняем начальное вращение, чтобы не было скачков
        const startQ = this.diceGroup.quaternion.clone();

        const animateRoll = (time) => {
            const elapsed = time - startTime;
            let t = Math.min(elapsed / duration, 1);

            // Easing function (плавное замедление)
            // t < 0.5: разгон и хаос
            // t > 0.5: доводка до цели
            
            if (t < 1) {
                if (t < 0.5) {
                    // Хаотичное вращение
                    this.diceGroup.rotation.x += 0.2 + (0.5-t)*0.5; 
                    this.diceGroup.rotation.y += 0.2 + (0.5-t)*0.5;
                } else {
                    // Плавная стабилизация к целевому кватерниону
                    // Нормализуем t для второй фазы (от 0 до 1)
                    const smoothT = (t - 0.5) * 2;
                    // Ease out cubic
                    const ease = 1 - Math.pow(1 - smoothT, 3);
                    
                    // Используем slerp от ТЕКУЩЕГО (в момент 0.5) к ЦЕЛЕВОМУ
                    // Чтобы не дергалось, slerp нужно делать аккуратно. 
                    // Самый надежный способ без скачка: просто slerp к target с малым шагом каждый кадр
                    // но это может не успеть.
                    
                    // Лучший способ для "магнита": 
                    this.diceGroup.quaternion.slerp(targetQ, 0.08); 
                }
                requestAnimationFrame(animateRoll);
            } else {
                // Финиш: точно ставим позицию
                this.diceGroup.quaternion.copy(targetQ);
                this.isRolling = false;
            }
        };
        requestAnimationFrame(animateRoll);
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
