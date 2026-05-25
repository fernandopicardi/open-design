/// <reference types="@figma/plugin-typings" />

// Main-thread entry: receives an Open Design `.odfig.json` scene from the UI
// and rebuilds it as native Figma layers. The DOM walk already happened in
// the web app (see apps/web/src/runtime/srcdoc.ts `injectFigmaBridge`); here
// we only translate the resulting `FigmaScene` tree into Figma nodes.

import type {
  FigmaScene,
  FigmaSceneNode,
} from '@open-design/contracts';

import {
  counterAxisAlign,
  fontStyleForWeight,
  gradientPaint,
  paintFor,
  primaryAxisAlign,
  textAlignH,
} from './mappers';

// Must match FIGMA_SCENE_SCHEMA in @open-design/contracts. Duplicated as a
// literal so this plugin bundle stays free of the contracts runtime (the
// import above is type-only and erased at build).
const SCENE_SCHEMA = 'open-design.figma-scene.v1';

const PLACEHOLDER_FILL: SolidPaint = {
  type: 'SOLID',
  color: { r: 0.9, g: 0.9, b: 0.9 },
  opacity: 1,
};

figma.showUI(__html__, { width: 320, height: 220 });

figma.ui.onmessage = async (message: { type?: string; json?: string }) => {
  if (!message || message.type !== 'import') return;
  try {
    const scene = parseScene(message.json ?? '');
    await importScene(scene);
    figma.ui.postMessage({ type: 'done', title: scene.title });
    figma.notify(`Imported "${scene.title}"`);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    figma.ui.postMessage({ type: 'error', reason });
    figma.notify(`Import failed: ${reason}`, { error: true });
  }
};

function parseScene(json: string): FigmaScene {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    throw new Error('File is not valid JSON');
  }
  const scene = value as Partial<FigmaScene> | null;
  if (!scene || scene.schema !== SCENE_SCHEMA || !scene.root) {
    throw new Error('Not an Open Design .odfig.json scene');
  }
  return scene as FigmaScene;
}

async function importScene(scene: FigmaScene): Promise<void> {
  const root = await buildNode(scene.root);
  figma.currentPage.appendChild(root);
  figma.currentPage.selection = [root];
  figma.viewport.scrollAndZoomIntoView([root]);
}

async function buildNode(node: FigmaSceneNode): Promise<SceneNode> {
  if (node.type === 'text' && node.text) return buildText(node);
  if (node.type === 'image') return buildImage(node);
  return buildFrame(node);
}

async function buildFrame(node: FigmaSceneNode): Promise<FrameNode> {
  const frame = figma.createFrame();
  frame.name = node.name || 'Frame';
  frame.resize(Math.max(1, node.width), Math.max(1, node.height));
  frame.fills = node.gradient
    ? [gradientPaint(node.gradient)]
    : node.fill
      ? [paintFor(node.fill)]
      : [];
  frame.opacity = node.opacity;
  frame.cornerRadius = node.cornerRadius;
  // Measured geometry can sit slightly outside a parent's box; don't clip so
  // the import stays faithful to what the browser rendered.
  frame.clipsContent = false;
  if (node.stroke) {
    frame.strokes = [paintFor(node.stroke.color)];
    frame.strokeWeight = node.stroke.weight;
  }

  if (node.autoLayout) {
    const layout = node.autoLayout;
    frame.layoutMode = layout.direction === 'vertical' ? 'VERTICAL' : 'HORIZONTAL';
    frame.itemSpacing = layout.gap;
    frame.paddingTop = layout.paddingTop;
    frame.paddingRight = layout.paddingRight;
    frame.paddingBottom = layout.paddingBottom;
    frame.paddingLeft = layout.paddingLeft;
    frame.primaryAxisAlignItems = primaryAxisAlign(layout.primaryAxisAlign);
    frame.counterAxisAlignItems = counterAxisAlign(layout.counterAxisAlign);
    frame.primaryAxisSizingMode = 'FIXED';
    frame.counterAxisSizingMode = 'FIXED';
  }

  for (const childNode of node.children) {
    const child = await buildNode(childNode);
    frame.appendChild(child);
    // Auto-layout positions children itself; only absolute frames need x/y.
    if (!node.autoLayout) {
      child.x = childNode.x;
      child.y = childNode.y;
    }
  }
  return frame;
}

async function buildText(node: FigmaSceneNode): Promise<TextNode> {
  const spec = node.text!;
  const font = await ensureFont(spec.fontFamily, spec.fontWeight);
  const text = figma.createText();
  text.name = node.name || 'Text';
  text.fontName = font;
  text.characters = spec.characters;
  text.fontSize = spec.fontSize;
  text.fills = spec.gradient ? [gradientPaint(spec.gradient)] : [paintFor(spec.color)];
  text.textAlignHorizontal = textAlignH(spec.textAlign);
  text.opacity = node.opacity;
  if (spec.lineHeight) text.lineHeight = { value: spec.lineHeight, unit: 'PIXELS' };
  if (spec.letterSpacing) text.letterSpacing = { value: spec.letterSpacing, unit: 'PIXELS' };
  text.textAutoResize = 'NONE';
  text.resize(Math.max(1, node.width), Math.max(1, node.height));
  return text;
}

async function buildImage(node: FigmaSceneNode): Promise<RectangleNode> {
  const rect = figma.createRectangle();
  rect.name = node.name || 'Image';
  rect.resize(Math.max(1, node.width), Math.max(1, node.height));
  rect.cornerRadius = node.cornerRadius;
  rect.opacity = node.opacity;
  const bytes = node.imageSrc ? decodeDataUri(node.imageSrc) : null;
  if (bytes) {
    try {
      const image = figma.createImage(bytes);
      rect.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: image.hash }];
      return rect;
    } catch {
      /* fall through to placeholder */
    }
  }
  // Remote-URL images aren't fetched in this version; show a neutral box the
  // user can replace. Inlined data-URI images import for real.
  rect.fills = [PLACEHOLDER_FILL];
  return rect;
}

// Font loading with graceful fallback: try the requested family+style, then
// that family's Regular, then Inter at the mapped style, then Inter Regular.
const loadedFonts = new Map<string, FontName>();

async function ensureFont(family: string, weight: number): Promise<FontName> {
  const style = fontStyleForWeight(weight);
  const key = `${family}|${style}`;
  const cached = loadedFonts.get(key);
  if (cached) return cached;

  const candidates: FontName[] = [
    { family, style },
    { family, style: 'Regular' },
    { family: 'Inter', style },
    { family: 'Inter', style: 'Regular' },
  ];
  for (const candidate of candidates) {
    try {
      await figma.loadFontAsync(candidate);
      loadedFonts.set(key, candidate);
      return candidate;
    } catch {
      /* try next candidate */
    }
  }
  // Inter Regular is always available in Figma; this line is effectively
  // unreachable, but keeps the function total.
  const fallback: FontName = { family: 'Inter', style: 'Regular' };
  await figma.loadFontAsync(fallback);
  return fallback;
}

function decodeDataUri(src: string): Uint8Array | null {
  if (!src.startsWith('data:')) return null;
  const comma = src.indexOf(',');
  if (comma < 0) return null;
  const meta = src.slice(5, comma);
  if (meta.indexOf('base64') < 0) return null;
  try {
    return figma.base64Decode(src.slice(comma + 1));
  } catch {
    return null;
  }
}
