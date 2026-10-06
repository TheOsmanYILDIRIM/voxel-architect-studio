import {state,voxelKey} from "./state.js";
import {materialColor} from "./materials.js";

let canvas,ctx;
let dragging=false,lastX=0,lastY=0,shiftDrag=false;

function surfaceVoxels(){
  const dirs=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],out=[];
  for(const v of state.voxels.values()){
    if(dirs.some(d=>!state.voxels.has(voxelKey(v.x+d[0],v.y+d[1],v.z+d[2]))))out.push(v);
  }
  return out;
}
function project(v){
  const c=state.camera,cy=Math.cos(c.yaw),sy=Math.sin(c.yaw),cp=Math.cos(c.pitch),sp=Math.sin(c.pitch);
  const xr=v.x*cy-v.z*sy,zr=v.x*sy+v.z*cy;
  const yr=v.y*cp-zr*sp,depth=v.y*sp+zr*cp;
  return{x:xr*c.zoom+canvas.clientWidth/2+c.panX,y:-yr*c.zoom+canvas.clientHeight/2+c.panY,d:depth};
}
export function render(){
  if(!ctx)return;
  const w=canvas.clientWidth,h=canvas.clientHeight;
  ctx.clearRect(0,0,w,h);ctx.fillStyle="#0a0d11";ctx.fillRect(0,0,w,h);
  const surf=surfaceVoxels();
  const items=surf.map(v=>({v,p:project(v)})).sort((a,b)=>a.p.d-b.p.d);
  const s=Math.max(1.2,state.camera.zoom*.72);
  for(const {v,p} of items){
    ctx.fillStyle=materialColor(v.mat);
    ctx.fillRect(p.x-s/2,p.y-s/2,s,s);
  }
  ctx.fillStyle="rgba(255,255,255,.55)";ctx.font="11px system-ui";
  ctx.fillText(`${surf.length.toLocaleString()} yüzey / ${state.voxels.size.toLocaleString()} voxel`,12,18);
}
export function fit(bounds){
  const maxDim=Math.max(...bounds.size,1);
  state.camera.zoom=Math.max(2,Math.min(12,Math.min(canvas.clientWidth,canvas.clientHeight)*.7/maxDim));
  state.camera.panX=0;state.camera.panY=35;render();
}
export function initRenderer(el,zoomEl){
  canvas=el;ctx=canvas.getContext("2d");
  const resize=()=>{
    const r=canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);
    canvas.width=Math.max(1,Math.floor(r.width*dpr));canvas.height=Math.max(1,Math.floor(r.height*dpr));
    ctx.setTransform(dpr,0,0,dpr,0,0);render();
  };
  canvas.addEventListener("pointerdown",e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;shiftDrag=e.shiftKey;canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener("pointerup",()=>dragging=false);
  canvas.addEventListener("pointermove",e=>{
    if(!dragging)return;
    const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;
    if(shiftDrag||e.shiftKey){state.camera.panX+=dx;state.camera.panY+=dy}
    else{state.camera.yaw+=dx*.01;state.camera.pitch=Math.max(.12,Math.min(1.25,state.camera.pitch+dy*.006))}
    render();
  });
  canvas.addEventListener("wheel",e=>{
    e.preventDefault();
    state.camera.zoom=Math.max(2,Math.min(18,state.camera.zoom*(e.deltaY>0?.9:1.1)));
    zoomEl.value=Math.round(state.camera.zoom);render();
  },{passive:false});
  zoomEl.oninput=e=>{state.camera.zoom=+e.target.value;render()};
  new ResizeObserver(resize).observe(canvas);window.addEventListener("resize",resize);resize();
}
