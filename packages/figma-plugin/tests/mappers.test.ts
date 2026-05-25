import { describe, expect, it } from 'vitest';

import {
  counterAxisAlign,
  fontStyleForWeight,
  gradientPaint,
  linearGradientTransform,
  paintFor,
  primaryAxisAlign,
  textAlignH,
} from '../src/mappers';

describe('fontStyleForWeight', () => {
  it('maps numeric CSS weights to Figma style names', () => {
    expect(fontStyleForWeight(300)).toBe('Light');
    expect(fontStyleForWeight(400)).toBe('Regular');
    expect(fontStyleForWeight(500)).toBe('Medium');
    expect(fontStyleForWeight(600)).toBe('Semi Bold');
    expect(fontStyleForWeight(700)).toBe('Bold');
    expect(fontStyleForWeight(900)).toBe('Black');
  });
});

describe('paintFor', () => {
  it('converts a 0..1 rgba into a solid paint with alpha as opacity', () => {
    expect(paintFor({ r: 1, g: 0.5, b: 0, a: 0.8 })).toEqual({
      type: 'SOLID',
      color: { r: 1, g: 0.5, b: 0 },
      opacity: 0.8,
    });
  });
});

describe('gradient mapping', () => {
  it('90deg (to right) yields Figma\'s identity-style transform', () => {
    const t = linearGradientTransform(90);
    expect(t[0][0]).toBeCloseTo(1);
    expect(t[0][1]).toBeCloseTo(0);
    expect(t[1][0]).toBeCloseTo(0);
    expect(t[1][1]).toBeCloseTo(1);
  });

  it('builds a linear gradient paint and clamps stop positions', () => {
    const paint = gradientPaint({
      kind: 'linear',
      angle: 90,
      stops: [
        { position: 0, color: { r: 1, g: 0, b: 0, a: 1 } },
        { position: 1.5, color: { r: 0, g: 0, b: 1, a: 1 } },
      ],
    });
    expect(paint.type).toBe('GRADIENT_LINEAR');
    expect(paint.gradientStops).toHaveLength(2);
    expect(paint.gradientStops[1].position).toBe(1);
  });

  it('maps radial gradients to GRADIENT_RADIAL', () => {
    const paint = gradientPaint({
      kind: 'radial',
      angle: 0,
      stops: [
        { position: 0, color: { r: 0, g: 0, b: 0, a: 1 } },
        { position: 1, color: { r: 1, g: 1, b: 1, a: 1 } },
      ],
    });
    expect(paint.type).toBe('GRADIENT_RADIAL');
  });
});

describe('alignment mapping', () => {
  it('maps flex + text alignment to Figma enums', () => {
    expect(primaryAxisAlign('space-between')).toBe('SPACE_BETWEEN');
    expect(primaryAxisAlign('center')).toBe('CENTER');
    expect(primaryAxisAlign('min')).toBe('MIN');
    expect(counterAxisAlign('max')).toBe('MAX');
    expect(textAlignH('justified')).toBe('JUSTIFIED');
    expect(textAlignH('left')).toBe('LEFT');
  });
});
