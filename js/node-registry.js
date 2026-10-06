// Geometry mirrors Minetest Game node_box definitions from mods/stairs/init.lua.
// Coordinates are Luanti node-local [-0.5, 0.5].

const BOXES = {
  cube: [[-0.5,-0.5,-0.5, 0.5,0.5,0.5]],
  slab: [[-0.5,-0.5,-0.5, 0.5,0.0,0.5]],
  stair: [
    [-0.5,-0.5,-0.5, 0.5,0.0,0.5],
    [-0.5, 0.0, 0.0, 0.5,0.5,0.5]
  ],
  stair_inner: [
    [-0.5,-0.5,-0.5, 0.5,0.0,0.5],
    [-0.5, 0.0, 0.0, 0.5,0.5,0.5],
    [-0.5, 0.0,-0.5, 0.0,0.5,0.0]
  ],
  stair_outer: [
    [-0.5,-0.5,-0.5, 0.5,0.0,0.5],
    [-0.5, 0.0, 0.0, 0.0,0.5,0.5]
  ]
};

const STAIR_RE=/^stairs:(stair_inner|stair_outer|stair|slab)_(.+)$/;

export function nodeShape(name){
  const m=STAIR_RE.exec(name||"");
  if(!m)return "cube";
  return m[1];
}

export function baseNodeFor(name){
  const m=STAIR_RE.exec(name||"");
  if(!m)return name;
  const sub=m[2];
  const aliases={
    wood:"default:wood",junglewood:"default:junglewood",pine_wood:"default:pine_wood",
    acacia_wood:"default:acacia_wood",aspen_wood:"default:aspen_wood",
    stone:"default:stone",cobble:"default:cobble",mossycobble:"default:mossycobble",
    stonebrick:"default:stonebrick",stone_block:"default:stone_block",
    desert_stone:"default:desert_stone",desert_cobble:"default:desert_cobble",
    desert_stonebrick:"default:desert_stonebrick",desert_stone_block:"default:desert_stone_block",
    sandstone:"default:sandstone",sandstonebrick:"default:sandstonebrick",sandstone_block:"default:sandstone_block",
    obsidian:"default:obsidian",obsidianbrick:"default:obsidianbrick",obsidian_block:"default:obsidian_block",
    brick:"default:brick"
  };
  return aliases[sub]||name;
}

export function nodeBoxes(name){
  return BOXES[nodeShape(name)]||BOXES.cube;
}

export function facedirRotation(param2=0){
  // Current studio supports the four horizontal facedir values used by building code.
  // Luanti values 20..23 mean upside-down placement.
  const upside=param2>=20;
  const p=upside?param2-20:param2;
  const yaw=[0,Math.PI/2,Math.PI,-Math.PI/2][p&3]||0;
  return {yaw,upside};
}

export const SHAPE_NAMES=["cube","slab","stair","stair_inner","stair_outer"];
