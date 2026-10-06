# Voxel Architect Studio

AI-friendly parametric voxel construction studio for Luanti.

The browser app accepts a small `voxelbuild/1` JSON language, compiles it to voxels, previews it, and exports WorldEdit, Lua and compiled JSON.

## Architecture

- `index.html`: app shell only
- `css/`: visual system
- `js/compiler.js`: VoxelBuild → voxel compiler
- `js/renderer.js`: canvas preview
- `js/materials.js`: embedded Luanti material catalog
- `js/exporters.js`: WorldEdit / Lua / JSON export
- `js/sample-castle.js`: default demo
- `js/main.js`: UI wiring only

No build step is required.
