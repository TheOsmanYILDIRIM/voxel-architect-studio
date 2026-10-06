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
- Use real Luanti node names for materials.
- For GitHub Pages this repository should remain build-free and static.

## Handoff

Initial modular repository scaffold created. Core compiler/renderer/exporter modules are being added next.
