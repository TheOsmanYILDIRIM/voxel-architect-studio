export const state = {
  voxels:new Map(),
  plan:null,
  camera:{yaw:-0.78,pitch:0.58,zoom:7,panX:0,panY:30}
};
export const voxelKey=(x,y,z)=>`${x}|${y}|${z}`;
