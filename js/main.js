import {SAMPLE_CASTLE} from "./sample-castle.js";
import {compile,getBounds} from "./compiler.js";
import {initRenderer,render,fit} from "./renderer.js";
import {mountMaterialGrid} from "./materials.js";
import {exportWorldEdit,exportLua,exportCompiledJSON} from "./exporters.js";
import {state} from "./state.js";

const $=s=>document.querySelector(s);
const codeEl=$("#code"),errorBox=$("#errorBox"),statusBadge=$("#statusBadge"),voxelBadge=$("#voxelBadge"),statsEl=$("#stats");
const zoomEl=$("#zoom");

function updateStats(){
  const b=getBounds(),mats=new Map();
  for(const v of state.voxels.values())mats.set(v.mat,(mats.get(v.mat)||0)+1);
  const top=[...mats.entries()].sort((a,b)=>b[1]-a[1]).slice(0,4).map(([m,n])=>`${m}: ${n}`).join("<br>");
  statsEl.innerHTML=`
    <div class="stat"><b>${state.voxels.size.toLocaleString()}</b><span>voxel</span></div>
    <div class="stat"><b>${b.size.join("×")}</b><span>boyut X×Y×Z</span></div>
    <div class="stat"><b>${mats.size}</b><span>node türü</span></div>
    <div class="stat"><b>${state.plan?.ops?.length||0}</b><span>parametrik işlem</span></div>
    <div class="stat" style="grid-column:1/-1"><span>${top||"—"}</span></div>`;
  voxelBadge.textContent=`${state.voxels.size.toLocaleString()} voxel`;
}
function build(){
  errorBox.classList.add("hidden");
  try{
    compile(JSON.parse(codeEl.value));
    updateStats();fit(getBounds());zoomEl.value=Math.round(state.camera.zoom);
    statusBadge.textContent="Derlendi";
  }catch(err){
    errorBox.textContent=err.message;errorBox.classList.remove("hidden");statusBadge.textContent="Hata";
  }
}
function loadSample(){codeEl.value=JSON.stringify(SAMPLE_CASTLE,null,2);build()}

$("#sampleBtn").onclick=loadSample;
$("#buildBtn").onclick=build;
$("#fitBtn").onclick=()=>fit(getBounds());
$("#weBtn").onclick=exportWorldEdit;
$("#luaBtn").onclick=exportLua;
$("#jsonBtn").onclick=exportCompiledJSON;

mountMaterialGrid($("#materialGrid"),async name=>{
  try{await navigator.clipboard.writeText(name);statusBadge.textContent=`Kopyalandı: ${name}`}
  catch{statusBadge.textContent=name}
});

async function boot(){
  statusBadge.textContent="3D hazırlanıyor";
  await initRenderer($("#view"),zoomEl);
  loadSample();
}

boot().catch(err=>{
  errorBox.textContent=err.message;
  errorBox.classList.remove("hidden");
  statusBadge.textContent="3D hata";
});
