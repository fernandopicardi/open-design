import { FIGMA_SCENE_SCHEMA, type FigmaScene } from '@open-design/contracts';
import { describe, expect, it } from 'vitest';

import { serializeFigmaScene } from '../../src/runtime/exports';

const scene: FigmaScene = {
  schema: FIGMA_SCENE_SCHEMA,
  title: 'My Design',
  width: 390,
  height: 844,
  root: {
    type: 'frame',
    name: 'Artifact',
    x: 0,
    y: 0,
    width: 390,
    height: 844,
    opacity: 1,
    fill: { r: 1, g: 1, b: 1, a: 1 },
    gradient: null,
    stroke: null,
    cornerRadius: 0,
    autoLayout: null,
    text: null,
    imageSrc: null,
    children: [],
  },
};

describe('serializeFigmaScene', () => {
  it('round-trips to a parseable scene carrying the schema marker', () => {
    const parsed = JSON.parse(serializeFigmaScene(scene)) as FigmaScene;
    expect(parsed.schema).toBe(FIGMA_SCENE_SCHEMA);
    expect(parsed.title).toBe('My Design');
    expect(parsed.root.fill).toEqual({ r: 1, g: 1, b: 1, a: 1 });
  });

  it('pretty-prints so downloaded files diff cleanly', () => {
    expect(serializeFigmaScene(scene)).toContain('\n  "schema"');
  });
});
