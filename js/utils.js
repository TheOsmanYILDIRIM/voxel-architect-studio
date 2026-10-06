export function vec3(v,name){
  if(!Array.isArray(v)||v.length!==3||v.some(n=>!Number.isFinite(n))) throw new Error(`${name} [x,y,z] olmalı`);
  return v.map(Math.round);
}
export function linePoints(a,b){
  const [x0,y0,z0]=a,[x1,y1,z1]=b;
  const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),Math.abs(z1-z0));
  const pts=[];
  for(let i=0;i<=n;i++){
    const t=n?i/n:0;
    pts.push([Math.round(x0+(x1-x0)*t),Math.round(y0+(y1-y0)*t),Math.round(z0+(z1-z0)*t)]);
  }
  return [...new Map(pts.map(p=>[p.join(","),p])).values()];
}
export const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9_-]+/g,"_").replace(/^_+|_+$/g,"")||"structure";
export const safeLuaString=s=>JSON.stringify(String(s));
export function download(name,text,type="text/plain"){
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([text],{type}));
  a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
