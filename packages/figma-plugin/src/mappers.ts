/// <reference types="@figma/plugin-typings" />

// Pure transforms from the FigmaScene contract to the values the Figma
// Plugin API expects. Kept side-effect-free and free of the `figma` global so
// they can be unit-tested in plain Node; `code.ts` owns the imperative node
// building that actually touches the canvas.

import type { FigmaAutoLayout, FigmaGradient, FigmaRgba, FigmaText } from '@open-design/contracts';

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/**
 * Map a numeric CSS font weight to the Figma style name conventionally used
 * for that weight. The plugin tries this style first and falls back when the
 * concrete font family does not ship it.
 */
export function fontStyleForWeight(weight: number): string {
  if (weight <= 100) return 'Thin';
  if (weight <= 200) return 'Extra Light';
  if (weight <= 300) return 'Light';
  if (weight <= 400) return 'Regular';
  if (weight <= 500) return 'Medium';
  if (weight <= 600) return 'Semi Bold';
  if (weight <= 700) return 'Bold';
  if (weight <= 800) return 'Extra Bold';
  return 'Black';
}

/** Convert a 0..1 rgba color into a Figma solid paint (alpha → opacity). */
export function paintFor(color: FigmaRgba): SolidPaint {
  return {
    type: 'SOLID',
    color: { r: color.r, g: color.g, b: color.b },
    opacity: color.a,
  };
}

/**
 * Figma gradient transform for a CSS linear-gradient angle (degrees, 0 = to
 * top, 90 = to right). Figma's identity transform runs left→right, which is
 * CSS 90deg, so we rotate by (angle − 90) about the unit-square center.
 */
export function linearGradientTransform(angleDeg: number): Transform {
  const phi = ((angleDeg - 90) * Math.PI) / 180;
  const c = Math.cos(phi);
  const s = Math.sin(phi);
  const cx = 0.5;
  const cy = 0.5;
  const row0: [number, number, number] = [c, -s, cx - c * cx + s * cy];
  const row1: [number, number, number] = [s, c, cy - s * cx - c * cy];
  return [row0, row1];
}

/** Convert a flattened CSS gradient into a Figma gradient paint. */
export function gradientPaint(gradient: FigmaGradient): GradientPaint {
  const gradientStops: ColorStop[] = gradient.stops.map((stop) => ({
    position: clamp01(stop.position),
    color: stop.color,
  }));
  if (gradient.kind === 'radial') {
    return {
      type: 'GRADIENT_RADIAL',
      gradientTransform: [
        [1, 0, 0],
        [0, 1, 0],
      ],
      gradientStops,
    };
  }
  return {
    type: 'GRADIENT_LINEAR',
    gradientTransform: linearGradientTransform(gradient.angle),
    gradientStops,
  };
}

export function primaryAxisAlign(
  align: FigmaAutoLayout['primaryAxisAlign'],
): 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN' {
  switch (align) {
    case 'center':
      return 'CENTER';
    case 'max':
      return 'MAX';
    case 'space-between':
      return 'SPACE_BETWEEN';
    default:
      return 'MIN';
  }
}

export function counterAxisAlign(
  align: FigmaAutoLayout['counterAxisAlign'],
): 'MIN' | 'CENTER' | 'MAX' {
  switch (align) {
    case 'center':
      return 'CENTER';
    case 'max':
      return 'MAX';
    default:
      return 'MIN';
  }
}

export function textAlignH(
  align: FigmaText['textAlign'],
): 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED' {
  switch (align) {
    case 'center':
      return 'CENTER';
    case 'right':
      return 'RIGHT';
    case 'justified':
      return 'JUSTIFIED';
    default:
      return 'LEFT';
  }
}
