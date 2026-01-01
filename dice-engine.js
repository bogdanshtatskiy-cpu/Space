import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class DiceEngine {
    constructor(containerId, diceType) {
        this.container = document.getElementById(containerId);
        this.type = diceType; 
        this.color = 0x8899aa; 
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
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.container.appendChild(this.renderer.domElement);

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const mainLight = new THREE.DirectionalLight(0xffffee, 2);
        mainLight.position.set(10, 20, 15);
        this.scene.add(mainLight);
        const rimLight = new THREE.SpotLight(0xccddff, 5);
        rimLight.position.set(-15, 10, -10);
        rimLight.lookAt(0, 0, 0);
        this.scene.add(rimLight);
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
        const vertices = [], indices = []; const h=radius*1.3, r=radius, k=radius*0.2;
        vertices.push(0,h,0); vertices.push(0,-h,0);
        for(let i=0;i<5;i++){ let a=i*72*Math.PI/180; let ao=(i*72+36)*Math.PI/180; vertices.push(r*Math.cos(a),k,r*Math.sin(a)); vertices.push(r*Math.cos(ao),-k,r*Math.sin(ao)); }
        let u=[2,4,6,8,10], l=[3,5,7,9,11];
        for(let i=0;i<5;i++){ indices.push(0,u[i],l[i]); indices.push(0,l[i],u[(i+1)%5]); indices.push(1,l[i],u[(i+1)%5]); indices.push(1,u[(i+1)%5],l[(i+1)%5]); }
        let g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3)); g.setIndex(indices); g=g.toNonIndexed(); g.computeVertexNormals(); return g;
    }

    createDice() {
        this.diceGroup = new THREE.Group(); this.scene.add(this.diceGroup);
        let g; switch(this.type){
            case 'd4': g=new THREE.TetrahedronGeometry(this.size); break;
            case 'd6': g=new THREE.BoxGeometry(this.size*1.6,this.size*1.6,this.size*1.6); break;
            case 'd8': g=new THREE.OctahedronGeometry(this.size); break;
            case 'd12': g=new THREE.DodecahedronGeometry(this.size); break;
            case 'd10': g=this.createD10Geometry(this.size); break;
            case 'd20': default: g=new THREE.IcosahedronGeometry(this.size,0); break;
        }
        const m = new THREE.MeshPhysicalMaterial({ color:this.color, metalness:0.05, roughness:0.15, transmission:0.95, thickness:3, clearcoat:1, side:THREE.DoubleSide });
        this.diceGroup.add(new THREE.Mesh(g, m));
        this.diceGroup.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, this.type==='d10'?40:1), new THREE.LineBasicMaterial({color:0xffffff, transparent:true, opacity:0.2})));
        
        if(this.type==='d6'){ const d=[{pos:[1,0,0],rot:[0,Math.PI/2,0],num:1},{pos:[-1,0,0],rot:[0,-Math.PI/2,0],num:6},{pos:[0,1,0],rot:[-Math.PI/2,0,0],num:2},{pos:[0,-1,0],rot:[Math.PI/2,0,0],num:5},{pos:[0,0,1],rot:[0,0,0],num:3},{pos:[0,0,-1],rot:[0,Math.PI,0],num:4}]; const o=this.size*1.6/2+0.05; d.forEach(x=>this.addText(x.num,new THREE.Vector3(...x.pos).multiplyScalar(o),m=>m.rotation.set(...x.rot))); }
        else if(this.type==='d10'){ const p=g.getAttribute('position'); for(let f=0;f<10;f++){ const c=new THREE.Vector3(); for(let k=0;k<6;k++)c.add(new THREE.Vector3().fromBufferAttribute(p,f*6+k)); c.divideScalar(6); this.addText(f,c.multiplyScalar(1.02),m=>{m.lookAt(c.multiplyScalar(2)); if(f>=5)m.rotation.z=Math.PI;}); } }
        else { const p=g.attributes.position; const v=this.type==='d12'?9:3; const tf=p.count/v; for(let i=0;i<tf;i++){ const c=new THREE.Vector3(); for(let k=0;k<v;k++)c.add(new THREE.Vector3().fromBufferAttribute(p,i*v+k)); c.divideScalar(v); this.addText(i+1,c.multiplyScalar(1.03),m=>{m.lookAt(c.multiplyScalar(2)); if(this.type==='d4')m.rotation.z+=Math.PI/3;}); } }
    }

    addText(num,pos,cb) { let dn=num.toString(); const t=this.createTextLabel(dn); t.position.copy(pos); cb(t); this.diceGroup.add(t); this.textMeshes[num]=t; this.resultValues.push(num); }
    createTextLabel(txt) { const c=document.createElement('canvas'); c.width=512; c.height=512; const x=c.getContext('2d'); x.fillStyle='rgba(0,0,0,0)'; x.fillRect(0,0,512,512); x.fillStyle='white'; x.font='bold 250px Arial'; x.textAlign='center'; x.textBaseline='middle'; if(txt==='6'||txt==='9')txt+='.'; x.fillText(txt,256,256); const tex=new THREE.CanvasTexture(c); tex.minFilter=THREE.LinearFilter; return new THREE.Mesh(new THREE.PlaneGeometry(this.size*0.7,this.size*0.7), new THREE.MeshPhysicalMaterial({map:tex,transparent:true,side:THREE.FrontSide,roughness:0.8,metalness:0,clearcoat:0.5})); }

    roll() { 
        if(this.isRolling)return; this.isRolling=true; const rv=this.resultValues[Math.floor(Math.random()*this.resultValues.length)]; const tm=this.textMeshes[rv]; const tq=tm.quaternion.clone().invert(); const dur=2000; const st=performance.now(); const rs={x:0.15+Math.random()*0.1,y:0.15+Math.random()*0.1};
        const ani=(t)=>{ const el=t-st; const p=Math.min(el/dur,1); if(p<1){ if(p<0.6){this.diceGroup.rotation.x+=rs.x; this.diceGroup.rotation.y+=rs.y; this.midQ=this.diceGroup.quaternion.clone();} else {const p2=(p-0.6)*2.5; const e=1-Math.pow(1-p2,3); this.diceGroup.quaternion.slerpQuaternions(this.midQ,tq,e);} requestAnimationFrame(ani); } else {this.diceGroup.quaternion.copy(tq); this.isRolling=false;} }; requestAnimationFrame(ani);
    }

    animate() { requestAnimationFrame(() => this.animate()); if (this.diceGroup && !this.isRolling) { this.diceGroup.rotation.y += 0.001; } this.renderer.render(this.scene, this.camera); }
}
