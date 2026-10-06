import {state,voxelKey} from "./state.js";
import {vec3,linePoints} from "./utils.js";

function setVoxel(x,y,z,mat,param2=0){
  x=Math.round(x);y=Math.round(y);z=Math.round(z);
  state.voxels.set(voxelKey(x,y,z),{x,y,z,mat,param2:Math.round(param2)||0});
}
function delVoxel(x,y,z){state.voxels.delete(voxelKey(Math.round(x),Math.round(y),Math.round(z)))}
function matName(plan,mat){return plan.palette?.[mat]||mat||"default:stone"}

function fillBox(a,b,mat,hollow=false){
  const min=a.map((n,i)=>Math.min(n,b[i])),max=a.map((n,i)=>Math.max(n,b[i]));
  for(let x=min[0];x<=max[0];x++)for(let y=min[1];y<=max[1];y++)for(let z=min[2];z<=max[2];z++){
    if(!hollow||x===min[0]||x===max[0]||y===min[1]||y===max[1]||z===min[2]||z===max[2])setVoxel(x,y,z,mat);
  }
}

function wall(op,plan){
  const a=vec3(op.from,"wall.from"),b=vec3(op.to,"wall.to");
  const h=Math.max(1,Math.round(op.height??5)),t=Math.max(1,Math.round(op.thickness??1)),m=matName(plan,op.mat);
  const pts=linePoints(a,b),xMajor=Math.abs(b[0]-a[0])>=Math.abs(b[2]-a[2]);
  for(const p of pts)for(let oy=0;oy<h;oy++)for(let w=-Math.floor((t-1)/2);w<=Math.ceil((t-1)/2);w++){
    if(xMajor)setVoxel(p[0],p[1]+oy,p[2]+w,m);else setVoxel(p[0]+w,p[1]+oy,p[2],m);
  }
}

function roundTower(op,plan){
  const [cx,cy,cz]=vec3(op.center,"round_tower.center");
  const r=Math.max(2,Math.round(op.radius??5)),h=Math.max(1,Math.round(op.height??10)),t=Math.max(1,Math.round(op.thickness??2)),m=matName(plan,op.mat);
  for(let x=-r;x<=r;x++)for(let z=-r;z<=r;z++){
    const d=Math.hypot(x,z);
    if(d<=r&&d>=r-t)for(let y=0;y<h;y++)setVoxel(cx+x,cy+y,cz+z,m);
  }
}

function cylinder(op,plan){
  const [cx,cy,cz]=vec3(op.center,"cylinder.center");
  const r=Math.max(1,Math.round(op.radius??3)),h=Math.max(1,Math.round(op.height??5)),m=matName(plan,op.mat);
  const hollow=!!op.hollow,t=Math.max(1,Math.round(op.thickness??1));
  for(let x=-r;x<=r;x++)for(let z=-r;z<=r;z++){
    const d=Math.hypot(x,z);
    if(d<=r&&(!hollow||d>=r-t))for(let y=0;y<h;y++)setVoxel(cx+x,cy+y,cz+z,m);
  }
}

function gate(op){
  const [cx,cy,cz]=vec3(op.center,"gate.center");
  const width=Math.max(1,Math.round(op.width??4)),height=Math.max(1,Math.round(op.height??5)),depth=Math.max(1,Math.round(op.depth??3));
  const axis=op.axis==="z"?"z":"x";
  for(let y=0;y<height;y++)for(let w=-Math.floor(width/2);w<=Math.floor((width-1)/2);w++)for(let d=-Math.floor(depth/2);d<=Math.floor((depth-1)/2);d++){
    axis==="x"?delVoxel(cx+w,cy+y,cz+d):delVoxel(cx+d,cy+y,cz+w);
  }
}

function battlement(op,plan){
  const pts=linePoints(vec3(op.from,"battlement.from"),vec3(op.to,"battlement.to"));
  const step=Math.max(2,Math.round(op.step??3)),h=Math.max(1,Math.round(op.height??2)),m=matName(plan,op.mat);
  pts.forEach((p,i)=>{if(i%step===0)for(let y=0;y<h;y++)setVoxel(p[0],p[1]+y,p[2],m)});
}

function stairs(op,plan){
  let [x,y,z]=vec3(op.from,"stairs.from"),[dx,,dz]=vec3(op.dir??[1,0,0],"stairs.dir");
  dx=Math.sign(dx);dz=Math.sign(dz);if(dx===0&&dz===0)dx=1;
  const width=Math.max(1,Math.round(op.width??1)),steps=Math.max(1,Math.round(op.steps??5)),rise=Math.max(1,Math.round(op.rise??1)),run=Math.max(1,Math.round(op.run??1)),m=matName(plan,op.mat);
  const px=-dz,pz=dx;
  for(let s=0;s<steps;s++)for(let r=0;r<run;r++)for(let w=0;w<width;w++){
    const lateral=w-Math.floor(width/2);
    setVoxel(x+dx*(s*run+r)+px*lateral,y+s*rise,z+dz*(s*run+r)+pz*lateral,m);
  }
}

function clear(op){
  const a=vec3(op.from,"clear.from"),b=vec3(op.to,"clear.to");
  const min=a.map((n,i)=>Math.min(n,b[i])),max=a.map((n,i)=>Math.max(n,b[i]));
  for(let x=min[0];x<=max[0];x++)for(let y=min[1];y<=max[1];y++)for(let z=min[2];z<=max[2];z++)delVoxel(x,y,z);
}

export function compile(plan){
  if(plan.format!=="voxelbuild/1")throw new Error('format "voxelbuild/1" olmalı');
  if(!Array.isArray(plan.ops))throw new Error("ops bir dizi olmalı");
  state.voxels.clear();
  plan.ops.forEach((op,i)=>{
    try{
      switch(op.op){
        case "box":fillBox(vec3(op.from,"box.from"),vec3(op.to,"box.to"),matName(plan,op.mat),!!op.hollow);break;
        case "node":{
          const [x,y,z]=vec3(op.pos,"node.pos");
          setVoxel(x,y,z,matName(plan,op.mat||op.name),op.param2||0);
          break;
        }
        case "wall":wall(op,plan);break;
        case "round_tower":roundTower(op,plan);break;
        case "cylinder":cylinder(op,plan);break;
        case "gate":gate(op);break;
        case "battlement":battlement(op,plan);break;
        case "stairs":stairs(op,plan);break;
        case "clear":clear(op);break;
        default:throw new Error(`bilinmeyen op: ${op.op}`);
      }
    }catch(err){throw new Error(`ops[${i}] ${op.op||"?"}: ${err.message}`)}
  });
  state.plan=plan;
  return state.voxels;
}

export function getBounds(){
  if(!state.voxels.size)return{min:[0,0,0],max:[0,0,0],size:[0,0,0]};
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(const v of state.voxels.values()){
    min[0]=Math.min(min[0],v.x);min[1]=Math.min(min[1],v.y);min[2]=Math.min(min[2],v.z);
    max[0]=Math.max(max[0],v.x);max[1]=Math.max(max[1],v.y);max[2]=Math.max(max[2],v.z);
  }
  return{min,max,size:max.map((n,i)=>n-min[i]+1)};
}
