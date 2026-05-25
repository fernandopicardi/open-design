import { describe, expect, it } from 'vitest';

import {
  FIGMA_SCENE_SCHEMA,
  isFigmaScene,
  type FigmaScene,
  type FigmaSceneNode,
} from '../src/api/figma-scene';

function leaf(): FigmaSceneNode {
  return {
    type: 'frame',
    name: 'div',
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    opacity: 1,
    fill: null,
    gradient: null,
    stroke: null,
    cornerRadius: 0,
    autoLayout: null,
    text: null,
    imageSrc: null,
    children: [],
  };
}

function scene(): FigmaScene {
  return {
    schema: FIGMA_SCENE_SCHEMA,
    title: 'Artifact',
    width: 100,
    height: 200,
    root: { ...leaf(), name: 'Artifact', width: 100, height: 200 },
  };
}

describe('isFigmaScene', () => {
  it('accepts a well-formed scene', () => {
    expect(isFigmaScene(scene())).toBe(true);
  });

  it('rejects a scene with the wrong schema', () => {
    expect(isFigmaScene({ ...scene(), schema: 'open-design.figma-scene.v0' })).toBe(false);
  });

  it('rejects non-objects and missing root', () => {
    expect(isFigmaScene(null)).toBe(false);
    expect(isFigmaScene('not a scene')).toBe(false);
    const { root: _root, ...withoutRoot } = scene();
    expect(isFigmaScene(withoutRoot)).toBe(false);
  });
});
