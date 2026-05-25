// Open Design → Figma scene contract.
//
// The web app walks a rendered artifact's DOM inside the sandboxed preview
// iframe and emits a `FigmaScene`: a normalized, browser-independent scene
// graph. The companion Figma plugin (`packages/figma-plugin`) consumes the
// same shape and rebuilds it as native Figma nodes.
//
// This file is the single source of truth for that boundary. Keep it pure:
// no DOM, Node, or Figma types — only plain data the producer and consumer
// both agree on. Bump the schema string on any breaking shape change so an
// older plugin can reject a newer file instead of mis-importing it.

export const FIGMA_SCENE_SCHEMA = 'open-design.figma-scene.v1';

/** sRGB channels plus alpha, each in the 0..1 range Figma expects. */
export interface FigmaRgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Auto-layout hints derived from a CSS flex container. When present on a
 * frame, the plugin lays children out with Figma auto-layout (and ignores
 * their absolute x/y); when null, children keep their captured x/y.
 */
export interface FigmaAutoLayout {
  direction: 'horizontal' | 'vertical';
  gap: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  primaryAxisAlign: 'min' | 'center' | 'max' | 'space-between';
  counterAxisAlign: 'min' | 'center' | 'max';
}

export interface FigmaGradientStop {
  /** 0..1 along the gradient axis. */
  position: number;
  color: FigmaRgba;
}

/**
 * A CSS gradient flattened to what Figma needs. `angle` is in CSS degrees
 * (0 = to top, 90 = to right); the plugin turns it into a Figma gradient
 * transform. `radial` and `conic` collapse to their nearest Figma kind.
 */
export interface FigmaGradient {
  kind: 'linear' | 'radial';
  angle: number;
  stops: FigmaGradientStop[];
}

export interface FigmaText {
  characters: string;
  /** First family in the CSS font stack, unquoted (e.g. "Inter"). */
  fontFamily: string;
  /** Numeric CSS weight (400, 700, …); the plugin maps it to a Figma style. */
  fontWeight: number;
  fontSize: number;
  /** Resolved line height in px, or null for CSS `normal`. */
  lineHeight: number | null;
  letterSpacing: number;
  textAlign: 'left' | 'center' | 'right' | 'justified';
  color: FigmaRgba;
  /** Set when the text paints with a gradient (e.g. background-clip: text). */
  gradient: FigmaGradient | null;
}

export type FigmaNodeType = 'frame' | 'text' | 'image';

export interface FigmaSceneNode {
  type: FigmaNodeType;
  /** Short human label for the Figma layers panel (e.g. "div.card"). */
  name: string;
  /** Position relative to the parent node's top-left, in CSS pixels. */
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  /** Solid background fill, or null when transparent. */
  fill: FigmaRgba | null;
  /** CSS gradient background; takes precedence over `fill` when set. */
  gradient: FigmaGradient | null;
  stroke: { color: FigmaRgba; weight: number } | null;
  cornerRadius: number;
  /** Set when the source element was a flex container; otherwise null. */
  autoLayout: FigmaAutoLayout | null;
  /** Set on `text` nodes; otherwise null. */
  text: FigmaText | null;
  /** Set on `image` nodes: the resolved <img> src (URL or data URI). */
  imageSrc: string | null;
  children: FigmaSceneNode[];
}

export interface FigmaScene {
  schema: typeof FIGMA_SCENE_SCHEMA;
  title: string;
  /** Captured document size in CSS pixels. */
  width: number;
  height: number;
  /** The captured root (the artifact <body>), modeled as a frame. */
  root: FigmaSceneNode;
}

/**
 * Structural guard used by the plugin to reject files that are not a scene
 * for this schema version. Intentionally shallow — it validates the envelope,
 * not every node, so a partially-degraded scene still imports.
 */
export function isFigmaScene(value: unknown): value is FigmaScene {
  if (typeof value !== 'object' || value === null) return false;
  const scene = value as Record<string, unknown>;
  return (
    scene.schema === FIGMA_SCENE_SCHEMA &&
    typeof scene.title === 'string' &&
    typeof scene.width === 'number' &&
    typeof scene.height === 'number' &&
    typeof scene.root === 'object' &&
    scene.root !== null
  );
}
