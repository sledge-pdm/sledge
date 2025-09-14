import { describe, expect, it } from 'vitest';
import {
  BlendMode,
  blendModeOptions,
  changeBaseLayerColor,
  createBaseLayer,
  createLayer,
  getBaseLayerColor,
  getBlendModeId,
  LayerType,
} from '~/features/layer';

describe('Layer Feature - Model Functions', () => {
  describe('BaseLayer functions', () => {
    it('should create base layer with specified color mode', () => {
      const baseLayer = createBaseLayer('white');
      expect(baseLayer.colorMode).toBe('white');
      expect(baseLayer.customColor).toBeUndefined();
    });

    it('should get correct RGBA color for transparent mode', () => {
      const baseLayer = createBaseLayer('transparent');
      const color = getBaseLayerColor(baseLayer);
      expect(color).toEqual([0, 0, 0, 0]);
    });

    it('should get correct RGBA color for white mode', () => {
      const baseLayer = createBaseLayer('white');
      const color = getBaseLayerColor(baseLayer);
      expect(color).toEqual([1, 1, 1, 1]);
    });

    it('should get correct RGBA color for custom mode with hex color', () => {
      const baseLayer = createBaseLayer('custom');
      baseLayer.customColor = '#ff0000';
      const color = getBaseLayerColor(baseLayer);
      expect(color).toEqual([1, 0, 0, 1]); // Red in 0-1 range
    });

    it('should change base layer color mode', () => {
      const baseLayer = createBaseLayer('transparent');
      const updated = changeBaseLayerColor(baseLayer, 'white');
      expect(updated.colorMode).toBe('white');
      expect(updated.customColor).toBeUndefined();
    });
  });

  describe('Layer factory functions', () => {
    it('should create layer with all required properties', () => {
      const layer = createLayer({
        name: 'Test Layer',
        type: LayerType.Dot,
        opacity: 0.8,
        mode: BlendMode.normal,
        enabled: true,
        dotMagnification: 2,
        initImage: undefined,
      });

      expect(layer.id).toBeDefined();
      expect(layer.name).toBe('Test Layer');
      expect(layer.type).toBe(LayerType.Dot);
      expect(layer.typeDescription).toBe('dot layer.');
      expect(layer.opacity).toBe(0.8);
      expect(layer.mode).toBe(BlendMode.normal);
      expect(layer.enabled).toBe(true);
      expect(layer.dotMagnification).toBe(2);
    });
  });

  describe('BlendMode utilities', () => {
    it('should provide correct blend mode IDs', () => {
      expect(getBlendModeId(BlendMode.normal)).toBe(0);
      expect(getBlendModeId(BlendMode.multiply)).toBe(1);
      expect(getBlendModeId(BlendMode.screen)).toBe(2);
    });

    it('should provide dropdown options for all blend modes', () => {
      expect(blendModeOptions).toBeDefined();
      expect(blendModeOptions.length).toBeGreaterThan(0);

      const normalOption = blendModeOptions.find((opt) => opt.value === BlendMode.normal);
      expect(normalOption).toBeDefined();
      expect(normalOption?.label).toBeDefined();
    });
  });
});
