import { vi } from 'vitest';
import { setPlatform } from '~/utils/platform';
import { createTestMockPlatform } from '~/utils/platform/TestMockPlatform';

setPlatform(createTestMockPlatform());

vi.mock('@acab/ecsstatic', () => ({
  css: vi.fn(),
}));

if (!(globalThis as any).OffscreenCanvas) {
  class OffscreenCanvasStub {
    width: number;
    height: number;
    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
    }
    getContext() {
      return {
        drawImage: vi.fn(),
        putImageData: vi.fn(),
        getImageData: vi.fn(() => ({
          data: new Uint8ClampedArray(),
          width: this.width,
          height: this.height,
        })),
      } as any;
    }
    convertToBlob = vi.fn(async () => new Blob());
  }
  (globalThis as any).OffscreenCanvas = OffscreenCanvasStub as any;
}
