import { beforeEach, describe, expect, it, vi } from 'vitest';
import { allLayers, BlendMode, findLayerById, LayerType, setLayerName } from '~/features/layer';
import { setLayerListStore } from '~/stores/ProjectStores';

// Mock external dependencies
vi.mock('~/utils/EventBus', () => ({
  eventBus: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

vi.mock('~/controllers/layer/LayerAgentManager', () => ({
  getAgentOf: vi.fn(),
  getBufferOf: vi.fn(),
  layerAgentManager: {
    registerAgent: vi.fn(),
  },
}));

describe('Layer Feature - Service Functions', () => {
  const testLayer = {
    id: 'test-layer-1',
    name: 'Test Layer',
    type: LayerType.Dot,
    typeDescription: 'dot layer.',
    opacity: 1,
    mode: BlendMode.normal,
    enabled: true,
    dotMagnification: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup test layer in store
    setLayerListStore('layers', [testLayer]);
    setLayerListStore('activeLayerId', testLayer.id);
  });

  describe('Layer name management', () => {
    it('should set layer name successfully', () => {
      const result = setLayerName(testLayer.id, 'New Layer Name');
      expect(result).toBe(true);

      const updatedLayer = findLayerById(testLayer.id);
      expect(updatedLayer?.name).toBe('New Layer Name');
    });

    it('should reject empty layer names', () => {
      const result = setLayerName(testLayer.id, '');
      expect(result).toBe(false);
    });

    it('should reject whitespace-only layer names', () => {
      const result = setLayerName(testLayer.id, '   ');
      expect(result).toBe(false);
    });
  });

  describe('Layer queries', () => {
    it('should find layer by ID', () => {
      const found = findLayerById(testLayer.id);
      expect(found).toEqual(testLayer);
    });

    it('should return undefined for non-existent layer ID', () => {
      const found = findLayerById('non-existent-id');
      expect(found).toBeUndefined();
    });

    it('should return all layers', () => {
      const layers = allLayers();
      expect(Array.isArray(layers)).toBe(true);
      expect(layers).toHaveLength(1);
      expect(layers[0]).toEqual(testLayer);
    });
  });
});
