import { DropdownOption } from '@sledge/ui';

export enum LayerType {
  Base,
  Dot,
  Image,
  Automate,
}

export enum BlendMode {
  normal = 'Normal',
  multiply = 'Multiply',
  screen = 'Screen',
  overlay = 'Overlay',
  softLight = 'Soft Light',
  hardLight = 'Hard Light',
  linearLight = 'Linear Light',
  vividLight = 'Vivid Light',
}

export const blendModeIds = {
  [BlendMode.normal]: 0,
  [BlendMode.multiply]: 1,
  [BlendMode.screen]: 2,
  [BlendMode.overlay]: 3,
  [BlendMode.softLight]: 4,
  [BlendMode.hardLight]: 5,
  [BlendMode.linearLight]: 6,
  [BlendMode.vividLight]: 7,
};

export const getBlendModeId = (mode: BlendMode): number => blendModeIds[mode];

export const BlendModeOptions: DropdownOption<BlendMode>[] = Object.entries(BlendMode).map(([label, value]) => ({
  value,
  label,
}));

export function getBlendModeName(mode: BlendMode): string {
  return BlendModeOptions.find((option) => option.value === mode)?.label || 'Unknown';
}

export type Layer = {
  id: string;
  name: string;
  type: LayerType;
  typeDescription: string; // 各タイプの説明
  enabled: boolean;
  opacity: number;
  mode: BlendMode;
  dotMagnification: number;
};
