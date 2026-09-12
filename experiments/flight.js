import * as THREE from '../vendor/three.module.js';

// Decorative, procedural flight: these positions are not observation data.
const host=document.querySelector('#flight-scene');
const cover=document.querySelector('.flight-cover');
const button=document.querySelector('#flight-pause');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduced.matches,visible=true,frame=0,previous=0,time=0;
let renderer;
try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{button.hidden=true;}
if(renderer){
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));host.append(renderer.domElement);
  const scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x897853,.018);
  const camera=new THREE.PerspectiveCamera(42,1,.1,180);camera.position.set(0,0,38);
  const flock=new THREE.Group();scene.add(flock);
  const material=new THREE.MeshBasicMaterial({color:0x102723,side:THREE.DoubleSide});
  const gold=new THREE.MeshBasicMaterial({color:0xd8b373,side:THREE.DoubleSide});
  const geometry=new THREE.BufferGeometry();
  // Swept wing silhouette, with each side articulated around its root.
  geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,.2, 1.2,.05,-.22, .55,0,-.38, 0,0,.2,.55,0,-.38,0,0,-.25],3));
  const birds=[];
  let seed=3179;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  for(let i=0;i<160;i++){
    const bird=new THREE.Group();const left=new THREE.Mesh(geometry,i%17===0?gold:material);const right=left.clone();right.scale.x=-1;bird.add(left,right);
    const scale=.11+rand()*.32;bird.scale.setScalar(scale);
    const phase=rand()*Math.PI*2,depth=(rand()-.5)*37;
    birds.push({bird,left,right,phase,depth,offset:rand()*Math.PI*2,radius:4+rand()*8,speed:.09+rand()*.08});flock.add(bird);
  }
  // The setting sun is a distant scene element, behind the flock.
  const sun=new THREE.Mesh(new THREE.CircleGeometry(3.3,96),new THREE.MeshBasicMaterial({color:0xe7b76c,transparent:true,opacity:.78,fog:false}));sun.position.set(14,3,-22);scene.add(sun);
  const pointer={x:0,y:0};
  cover.addEventListener('pointermove',e=>{if(paused)return;const r=cover.getBoundingClientRect();pointer.x=(e.clientX/r.width-.5)*2;pointer.y=((e.clientY-r.top)/r.height-.5)*2;},{passive:true});
  cover.addEventListener('pointerleave',()=>{pointer.x=0;pointer.y=0;});
  function draw(){
    for(const b of birds){const a=b.offset+time*b.speed;const x=Math.cos(a)*b.radius;
      b.bird.position.set(9+x,Math.sin(a*2+b.phase*.15)*b.radius*.27+2,b.depth+Math.sin(a)*3);
      b.bird.rotation.set(.4+Math.sin(a)*.14,-.4,Math.cos(a)*.2);
      const flap=Math.sin(time*(3.5+b.speed*9)+b.phase)*.72;
      b.left.rotation.z=flap;b.right.rotation.z=-flap;
    }
    camera.position.x+=(pointer.x*1.8-camera.position.x)*.035;camera.position.y+=(-pointer.y-camera.position.y)*.035;
    camera.lookAt(0,0,0);renderer.render(scene,camera);
  }
  function tick(now){frame=0;if(paused||!visible||document.hidden)return;time+=Math.min((now-previous)/1000,.05);previous=now;draw();frame=requestAnimationFrame(tick);}
  function sync(){cancelAnimationFrame(frame);frame=0;button.textContent=paused?'Play motion':'Pause motion';button.setAttribute('aria-pressed',String(paused));if(!paused&&visible&&!document.hidden){previous=performance.now();frame=requestAnimationFrame(tick);}}
  const resize=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();draw();});resize.observe(host);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(cover);
  button.addEventListener('click',()=>{paused=!paused;sync();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;sync();});document.addEventListener('visibilitychange',sync);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;sync();button.hidden=true;});
  draw();sync();
}
