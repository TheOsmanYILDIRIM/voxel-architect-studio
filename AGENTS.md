# AGENTS.md

## Current direction

Voxel Architect Studio is an independent static web application for designing Luanti-compatible structures from AI-generated parametric code.

## Architectural rules

- Do not collapse the application into one HTML file.
- Keep HTML, styles, compiler, renderer, exporters, material catalog and examples separate.
- `index.html` should remain a thin app shell.
- Prefer small ES modules with clear responsibilities.
- The AI-facing format is `voxelbuild/1`; do not make AI emit giant raw voxel arrays unless exporting compiled output.
- Preserve WorldEdit and direct Luanti export paths.
- The default page must open with a visible example castle.
- Use real Luanti node names for materials.\n- Material textures are not decorative metadata: the 3D preview must render actual Luanti texture imagery on voxel faces.\n- Preview is a true Three.js/WebGL 3D renderer, not an isometric sprite renderer.
- Reproduce Luanti node geometry from authoritative node definitions: node_box for slabs/stairs/etc. and mesh geometry for drawtype="mesh" nodes when added.
- Use InstancedMesh grouped by node geometry/material/orientation; do not create one Mesh per voxel.
- Preserve param2/facedir in preview and exports.
- For GitHub Pages this repository should remain build-free and static.

## Handoff

Initial modular repository scaffold created. Core compiler/renderer/exporter modules are being added next.
