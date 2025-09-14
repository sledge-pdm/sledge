import { DropdownOption } from '@sledge/ui';

export type Canvas = {
  width: number;
  height: number;
};

export type ImageRenderingAttribute = 'auto' | 'pixelated' | 'crisp-edges';
export type CanvasRenderingMode = 'adaptive' | 'pixelated' | 'crisp-edges';

export const canvasSizePresets: Record<string, Canvas | undefined> = {
  custom: undefined,

  Icon_XS: { width: 8, height: 8 },
  Icon_S: { width: 16, height: 16 },
  Icon_M: { width: 32, height: 32 },
  Icon_L: { width: 64, height: 64 },

  Default: { width: 1024, height: 1024 },

  FHD: { width: 1920, height: 1080 },
  'FHD+': { width: 2560, height: 1440 },
  '4K': { width: 3840, height: 2160 },

  A4: { width: 2894, height: 4093 },
  A4_LS: { width: 4093, height: 2894 },
};

export const canvasSizePresetsDropdownOptions: DropdownOption<string>[] = Object.entries(canvasSizePresets).map(([key, value]) => {
  if (value !== undefined) {
    return {
      label: `${key} / ${value.width}x${value.height}`,
      value: JSON.stringify(value),
    };
  } else {
    return {
      label: `${key}`,
      value: 'undefined',
    };
  }
});
