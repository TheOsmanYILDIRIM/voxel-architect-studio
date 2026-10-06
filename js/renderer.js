import {state,voxelKey} from "./state.js";
import {getMaterial} from "./materials.js";

let host,app,world,zoomEl;
let dragging=false,lastX=0,lastY=0,dragStartX=0,dragStartY=0;
const tileCache=new Map();
const TILE_W=64,TILE_H=64,TOP_H=18,SIDE_H=28;

function surfaceVoxels(){
  const dirs=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],out=[];
  for(const v of state.voxels.values()){
    if(dirs.some(d=>!state.voxels.has(voxelKey(v.x+d[0],v.y+d[1],v.z+d[2]))))out.push(v);
  }
  return out;
}

function loadImage(url){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.crossOrigin="anonymous";
    img.onload=()=>resolve(img);
    img.onerror=reject;
    img.src=url;
  });
}

function drawFace(ctx,img,kind){
  ctx.save();
  if(kind==="top"){
    ctx.beginPath();
    ctx.moveTo(TILE_W/2,0);ctx.lineTo(TILE_W,TOP_H);ctx.lineTo(TILE_W/2,TOP_H*2);ctx.lineTo(0,TOP_H);ctx.closePath();ctx.clip();
    ctx.setTransform(2,1.125,-2,1.125,0,0);
    ctx.drawImage(img,0,0,16,16,0,0,16,16);
  }else if(kind==="left"){
    ctx.beginPath();
    ctx.moveTo(0,TOP_H);ctx.lineTo(TILE_W/2,TOP_H*2);ctx.lineTo(TILE_W/2,TOP_H*2+SIDE_H);ctx.lineTo(0,TOP_H+SIDE_H);ctx.closePath();ctx.clip();
    ctx.setTransform(2,1.125,0,1.75,0,TOP_H);
    ctx.drawImage(img,0,0,16,16,0,0,16,16);
    ctx.fillStyle="rgba(0,0,0,.24)";ctx.fillRect(-100,-100,300,300);
  }else{
    ctx.beginPath();
    ctx.moveTo(TILE_W,TOP_H);ctx.lineTo(TILE_W/2,TOP_H*2);ctx.lineTo(TILE_W/2,TOP_H*2+SIDE_H);ctx.lineTo(TILE_W,TOP_H+SIDE_H);ctx.closePath();ctx.clip();
    ctx.setTransform(-2,1.125,0,1.75,TILE_W,TOP_H);
    ctx.drawImage(img,0,0,16,16,0,0,16,16);
    ctx.fillStyle="rgba(0,0,0,.38)";ctx.fillRect(-100,-100,300,300);
  }
  ctx.restore();
}

async function cubeTexture(name){
  if(tileCache.has(name))return tileCache.get(name);
  const material=getMaterial(name);
  const c=document.createElement("canvas");c.width=TILE_W;c.height=TOP_H*2+SIDE_H;
  const ctx=c.getContext("2d");
  ctx.imageSmoothingEnabled=false;
  if(material.url){
    try{
      const img=await loadImage(material.url);
      drawFace(ctx,img,"top");drawFace(ctx,img,"left");drawFace(ctx,img,"right");
    }catch{
      ctx.fillStyle="#7d8793";ctx.fillRect(0,0,c.width,c.height);
    }
  }else{
    ctx.fillStyle="#7d8793";ctx.fillRect(0,0,c.width,c.height);
  }
  const tex=window.PIXI.Texture.from(c);
  tileCache.set(name,tex);
  return tex;
}

function rotateXZ(x,z){
  const a=state.camera.yaw,c=Math.cos(a),s=Math.sin(a);
  return {x:x*c-z*s,z:x*s+z*c};
}

function iso(v){
  const r=rotateXZ(v.x,v.z);
  const unit=state.camera.zoom/7;
  return {
    x:(r.x-r.z)*(TILE_W/2)*unit,
    y:(r.x+r.z)*(TOP_H/1.05)*unit-v.y*SIDE_H*unit,
    depth:r.x+r.z+v.y*.02
  };
}

export async function render(){
  if(!app||!world)return;
  world.removeChildren().forEach(c=>c.destroy?.());
  const surf=surfaceVoxels();
  const prepared=[];
  for(const v of surf){
    const p=iso(v);
    prepared.push({v,p,tex:await cubeTexture(v.mat)});
  }
  prepared.sort((a,b)=>a.p.depth-b.p.depth||a.v.y-b.v.y);
  const unit=state.camera.zoom/7;
  for(const item of prepared){
    const sprite=new window.PIXI.Sprite(item.tex);
    sprite.anchor.set(.5,1);
    sprite.position.set(item.p.x,item.p.y);
    sprite.scale.set(unit);
    world.addChild(sprite);
  }
  world.position.set(app.renderer.width/2+state.camera.panX,app.renderer.height*.66+state.camera.panY);
}

export async function fit(bounds){
  if(!app)return;
  const maxDim=Math.max(bounds.size[0]+bounds.size[2],bounds.size[1]*2,1);
  state.camera.zoom=Math.max(2,Math.min(10,Math.min(app.renderer.width,app.renderer.height)*.18/maxDim*7));
  state.camera.panX=0;state.camera.panY=0;
  if(zoomEl)zoomEl.value=Math.round(state.camera.zoom);
  await render();
}

export async function initRenderer(el,zEl){
  host=el;zoomEl=zEl;
  app=new window.PIXI.Application();
  await app.init({
    resizeTo:host,
    backgroundAlpha:0,
    antialias:false,
    preference:"webgl",
    powerPreference:"low-power"
  });
  host.replaceChildren(app.canvas);
  world=new window.PIXI.Container();
  app.stage.addChild(world);

  host.addEventListener("pointerdown",e=>{
    dragging=true;lastX=e.clientX;lastY=e.clientY;dragStartX=e.clientX;dragStartY=e.clientY;
    host.setPointerCapture?.(e.pointerId);
  });
  host.addEventListener("pointerup",()=>dragging=false);
  host.addEventListener("pointercancel",()=>dragging=false);
  host.addEventListener("pointermove",async e=>{
    if(!dragging)return;
    const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;
    if(e.shiftKey){
      state.camera.panX+=dx;state.camera.panY+=dy;
    }else{
      state.camera.yaw+=dx*.012;
      state.camera.panY+=dy*.25;
    }
    await render();
  });
  host.addEventListener("wheel",async e=>{
    e.preventDefault();
    state.camera.zoom=Math.max(2,Math.min(18,state.camera.zoom*(e.deltaY>0?.9:1.1)));
    zoomEl.value=Math.round(state.camera.zoom);
    await render();
  },{passive:false});
  zoomEl.oninput=async e=>{state.camera.zoom=+e.target.value;await render()};
}
