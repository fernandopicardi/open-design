# @open-design/figma-plugin

A Figma plugin that imports a design generated in Open Design as **native,
editable Figma layers** — frames with auto-layout, text, images, fills,
strokes and corner radii.

## How it works

1. In Open Design, open a rendered design and pick **Share → Export to
   Figma**. The web app walks the already-rendered DOM inside the preview
   iframe and downloads a `<title>.odfig.json` file (the
   [`FigmaScene`](../contracts/src/api/figma-scene.ts) contract).
2. In Figma, run this plugin and choose that `.odfig.json` file. The plugin
   rebuilds the scene as Figma layers on the current page.

No Figma `.fig` file is produced — that format is closed. The Plugin API is
the supported way to create editable Figma content programmatically, so the
plugin reconstructs the scene directly on the canvas.

## Build & load in Figma (local dev)

```bash
pnpm --filter @open-design/figma-plugin build
```

This bundles `src/code.ts` into `dist/code.js`. Then in the Figma desktop app:

- **Plugins → Development → Import plugin from manifest…**
- Select `packages/figma-plugin/manifest.json`.
- Run **Open Design → Figma** from the development plugins list.

## Scope and known limitations (v1)

- **Geometry** comes from the live browser layout, so position and size are
  accurate. Flex containers become Figma auto-layout frames; everything else
  is absolutely positioned.
- **Text**: leaf text elements import as editable text. Mixed inline content
  (e.g. `<p>Hello <b>world</b></p>`) keeps the child runs but drops the
  parent's loose text — a known v1 gap.
- **Fonts** fall back to the family's Regular, then Inter, when the exact
  family/weight isn't installed in Figma.
- **Images**: inlined `data:` URIs import for real; remote-URL images show a
  neutral placeholder rectangle to replace. Fetching remote images is a
  planned follow-up.
- CSS `grid`, background images, gradients, shadows and transforms are not
  mapped yet.
