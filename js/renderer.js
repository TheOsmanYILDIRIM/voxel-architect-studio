import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import {state,voxelKey} from "./state.js";
import {getMaterial} from "./materials.js";
import {nodeBoxes,nodeShape,baseNodeFor,facedirRotation} from "./node-registry.js";

let host, renderer, scene, camera, world, zoomEl;
let dragging=false,lastX=0,lastY=0,shiftDrag=false;
let yaw=Math.PI*0.22,pitch=Math.PI*0.28,distance=72;
const target=new THREE.Vector3(0,7,0);
const textureCache=new Map();
const materialCache=new Map();
const geometryCache=new Map();

function isFullCube(v){return nodeShape(v.mat)==="cube"}

function isHiddenFullCube(v){
  if(!isFullCube(v))return false;
  const dirs=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  return dirs.every(([dx,dy,dz])=>{
    const n=state.voxels.get(voxelKey(v.x+dx,v.y+dy,v.z+dz));
    return n&&isFullCube(n);
  });
}

function textureFor(nodeName){
  const base=baseNodeFor(nodeName);
  if(textureCache.has(base))return textureCache.get(base);
  const info=getMaterial(base);
  if(!info.url){
    textureCache.set(base,null);
    return null;
  }
  const tex=new THREE.TextureLoader().load(info.url,()=>render(),undefined,()=>{});
  tex.magFilter=THREE.NearestFilter;
  tex.minFilter=THREE.NearestFilter;
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.wrapS=THREE.RepeatWrapping;
  tex.wrapT=THREE.RepeatWrapping;
  textureCache.set(base,tex);
  return tex;
}

function materialFor(nodeName){
  const base=baseNodeFor(nodeName);
  if(materialCache.has(base))return materialCache.get(base);
  const map=textureFor(nodeName);
  const mat=new THREE.MeshLambertMaterial({
    map:map||null,
    color:map?0xffffff:0x8b949e,
    transparent:false
  });
  materialCache.set(base,mat);
  return mat;
}

function boxGeometry(box){
  const key=box.join(",");
  if(geometryCache.has(key))return geometryCache.get(key);
  const [x1,y1,z1,x2,y2,z2]=box;
  const sx=x2-x1,sy=y2-y1,sz=z2-z1;
  const g=new THREE.BoxGeometry(sx,sy,sz);
  g.translate((x1+x2)/2,(y1+y2)/2,(z1+z2)/2);
  geometryCache.set(key,g);
  return g;
}

function clearWorld(){
  while(world.children.length){
    const obj=world.children.pop();
    if(obj.parent)obj.parent.remove(obj);
    obj.dispose?.();
  }
}

function buildGroups(){
  const groups=new Map();
  for(const v of state.voxels.values()){
    if(isHiddenFullCube(v))continue;
    const boxes=nodeBoxes(v.mat);
    const {yaw,upside}=facedirRotation(v.param2||0);
    boxes.forEach((box,boxIndex)=>{
      const k=`${v.mat}|${v.param2||0}|${boxIndex}`;
      if(!groups.has(k))groups.set(k,{name:v.mat,param2:v.param2||0,box,items:[]});
      groups.get(k).items.push({v,yaw,upside});
    });
  }
  return groups;
}

function matrixFor(item){
  const {v,yaw,upside}=item;
  const pos=new THREE.Vector3(v.x,v.y,v.z);
  const qYaw=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw);
  const qFlip=upside
    ?new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI)
    :new THREE.Quaternion();
  const q=qYaw.multiply(qFlip);
  const m=new THREE.Matrix4();
  m.compose(pos,q,new THREE.Vector3(1,1,1));
  return m;
}

function updateCamera(){
  const cp=Math.cos(pitch),sp=Math.sin(pitch);
  camera.position.set(
    target.x+Math.sin(yaw)*cp*distance,
    target.y+sp*distance,
    target.z+Math.cos(yaw)*cp*distance
  );
  camera.lookAt(target);
}

export async function render(){
  if(!renderer||!scene)return;
  clearWorld();
  const groups=buildGroups();
  for(const group of groups.values()){
    const geo=boxGeometry(group.box);
    const mat=materialFor(group.name);
    const mesh=new THREE.InstancedMesh(geo,mat,group.items.length);
    mesh.frustumCulled=true;
    mesh.castShadow=false;
    mesh.receiveShadow=false;
    group.items.forEach((item,i)=>mesh.setMatrixAt(i,matrixFor(item)));
    mesh.instanceMatrix.needsUpdate=true;
    world.add(mesh);
  }
  updateCamera();
  renderer.render(scene,camera);
}

export async function fit(bounds){
  if(!camera)return;
  const cx=(bounds.min[0]+bounds.max[0])/2;
  const cy=(bounds.min[1]+bounds.max[1])/2;
  const cz=(bounds.min[2]+bounds.max[2])/2;
  target.set(cx,cy,cz);
  const radius=Math.max(bounds.size[0],bounds.size[1],bounds.size[2],8);
  distance=Math.max(16,radius*2.25);
  if(zoomEl){
    const z=Math.max(2,Math.min(18,Math.round(180/distance)));
    state.camera.zoom=z;zoomEl.value=z;
  }
  updateCamera();
  renderer.render(scene,camera);
}

function resize(){
  if(!renderer||!host)return;
  const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
  renderer.setSize(w,h,false);
  camera.aspect=w/h;camera.updateProjectionMatrix();
  renderer.render(scene,camera);
}

export async function initRenderer(el,zEl){
  host=el;zoomEl=zEl;
  renderer=new THREE.WebGLRenderer({
    antialias:false,
    alpha:true,
    powerPreference:"high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  host.replaceChildren(renderer.domElement);

  scene=new THREE.Scene();
  scene.background=new THREE.Color(0x0b0e12);

  camera=new THREE.PerspectiveCamera(45,1,0.05,1000);
  world=new THREE.Group();
  scene.add(world);

  scene.add(new THREE.HemisphereLight(0xffffff,0x34404d,1.8));
  const sun=new THREE.DirectionalLight(0xffffff,2.2);
  sun.position.set(30,50,20);
  scene.add(sun);

  const grid=new THREE.GridHelper(200,200,0x27313b,0x161d24);
  grid.position.y=-0.505;
  scene.add(grid);

  host.addEventListener("pointerdown",e=>{
    dragging=true;lastX=e.clientX;lastY=e.clientY;shiftDrag=e.shiftKey;
    host.setPointerCapture?.(e.pointerId);
  });
  host.addEventListener("pointerup",()=>dragging=false);
  host.addEventListener("pointercancel",()=>dragging=false);
  host.addEventListener("pointermove",e=>{
    if(!dragging)return;
    const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;
    if(shiftDrag||e.shiftKey){
      const scale=distance*0.0015;
      const right=new THREE.Vector3().setFromMatrixColumn(camera.matrix,0);
      const up=new THREE.Vector3(0,1,0);
      target.addScaledVector(right,-dx*scale);
      target.addScaledVector(up,dy*scale);
    }else{
      yaw-=dx*0.009;
      pitch=Math.max(-0.05,Math.min(Math.PI*.48,pitch+dy*0.007));
    }
    updateCamera();renderer.render(scene,camera);
  });
  host.addEventListener("wheel",e=>{
    e.preventDefault();
    distance=Math.max(4,Math.min(350,distance*(e.deltaY>0?1.1:.9)));
    state.camera.zoom=Math.max(2,Math.min(18,Math.round(180/distance)));
    zoomEl.value=state.camera.zoom;
    updateCamera();renderer.render(scene,camera);
  },{passive:false});
  zoomEl.oninput=e=>{
    state.camera.zoom=+e.target.value;
    distance=180/state.camera.zoom;
    updateCamera();renderer.render(scene,camera);
  };

  new ResizeObserver(resize).observe(host);
  window.addEventListener("resize",resize);
  resize();
}
