export const MATERIALS=[
  ["default:stone","Stone","#777"],
  ["default:cobble","Cobblestone","#666"],
  ["default:stonebrick","Stone Brick","#858585"],
  ["default:wood","Apple Wood","#9a7444"],
  ["default:acacia_wood","Acacia Wood","#9b4d2e"],
  ["default:junglewood","Jungle Wood","#4e3b24"],
  ["default:pine_wood","Pine Wood","#d2ae72"],
  ["default:aspen_wood","Aspen Wood","#c9bfaa"],
  ["default:desert_stone","Desert Stone","#7a4a38"],
  ["default:desert_stonebrick","Desert Stone Brick","#8d5542"],
  ["default:sandstone","Sandstone","#c7bf8d"],
  ["default:sandstonebrick","Sandstone Brick","#c2b887"],
  ["default:obsidian","Obsidian","#222631"],
  ["default:brick","Brick","#8a4037"],
  ["default:dirt","Dirt","#765232"]
];

export function materialColor(name){
  return MATERIALS.find(m=>m[0]===name)?.[2]||"#8aa0b5";
}

export function mountMaterialGrid(root,onSelect){
  root.innerHTML="";
  for(const [name,label,color] of MATERIALS){
    const card=document.createElement("div");
    card.className="mat-card";
    card.innerHTML=`<span class="mat-swatch" style="background:${color}"></span><div><b>${label}</b><code>${name}</code></div>`;
    card.onclick=()=>onSelect?.(name);
    root.appendChild(card);
  }
}
