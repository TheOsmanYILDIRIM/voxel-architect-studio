const BASE="https://raw.githubusercontent.com/luanti-org/minetest_game/master/mods/default/textures/";

export const MATERIALS=[
  ["default:stone","Stone","default_stone.png"],
  ["default:cobble","Cobblestone","default_cobble.png"],
  ["default:stonebrick","Stone Brick","default_stone_brick.png"],
  ["default:wood","Apple Wood","default_wood.png"],
  ["default:acacia_wood","Acacia Wood","default_acacia_wood.png"],
  ["default:junglewood","Jungle Wood","default_junglewood.png"],
  ["default:pine_wood","Pine Wood","default_pine_wood.png"],
  ["default:aspen_wood","Aspen Wood","default_aspen_wood.png"],
  ["default:desert_stone","Desert Stone","default_desert_stone.png"],
  ["default:desert_stonebrick","Desert Stone Brick","default_desert_stone_brick.png"],
  ["default:sandstone","Sandstone","default_sandstone.png"],
  ["default:sandstonebrick","Sandstone Brick","default_sandstone_brick.png"],
  ["default:obsidian","Obsidian","default_obsidian.png"],
  ["default:brick","Brick","default_brick.png"],
  ["default:dirt","Dirt","default_dirt.png"],
  ["stairs:stair_stonebrick","Stone Brick Stair","default_stone_brick.png"],
  ["stairs:slab_stonebrick","Stone Brick Slab","default_stone_brick.png"],
  ["stairs:stair_inner_stonebrick","Inner Stone Brick Stair","default_stone_brick.png"],
  ["stairs:stair_outer_stonebrick","Outer Stone Brick Stair","default_stone_brick.png"]
];

export const MATERIAL_MAP=new Map(MATERIALS.map(([name,label,file])=>[
  name,{name,label,file,url:BASE+file}
]));

export function getMaterial(name){
  if(MATERIAL_MAP.has(name)) return MATERIAL_MAP.get(name);
  const m=/^stairs:(?:stair_inner|stair_outer|stair|slab)_(.+)$/.exec(name||"");
  if(m){
    const aliases={stonebrick:"default:stonebrick",stone:"default:stone",cobble:"default:cobble",wood:"default:wood",brick:"default:brick",sandstonebrick:"default:sandstonebrick",sandstone:"default:sandstone",obsidian:"default:obsidian",desert_stonebrick:"default:desert_stonebrick"};
    const base=aliases[m[1]];
    if(base&&MATERIAL_MAP.has(base)) return MATERIAL_MAP.get(base);
  }
  return {name,label:name,file:null,url:null};
}

export function mountMaterialGrid(root,onSelect){
  root.innerHTML="";
  for(const [name,label,file] of MATERIALS){
    const card=document.createElement("div");
    card.className="mat-card";
    const url=BASE+file;
    card.innerHTML=`<img src="${url}" alt=""><div><b>${label}</b><code>${name}</code></div>`;
    card.onclick=()=>onSelect?.(name);
    root.appendChild(card);
  }
}
