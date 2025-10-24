import { autoSelectionPresetMeta } from '~/features/tools/presets/AutoSelectionPresets';
import { rectSelectionPresetMeta } from '~/features/tools/presets/RectSelectionPresets';
import { eraserPresetMeta } from './EraserPresets';
import { fillPresetMeta } from './FillPresets';
import { lassoSelectionPresetMeta } from './LassoSelectionPresets';
import { penPresetMeta } from './PenPresets';
import { ToolPresetMeta } from './PresetMeta';

export const toolPresetMetas: ToolPresetMeta[] = [
  penPresetMeta,
  eraserPresetMeta,
  fillPresetMeta,
  autoSelectionPresetMeta,
  lassoSelectionPresetMeta,
  rectSelectionPresetMeta,
];

export const getPresetMetaByToolId = (toolId: string): ToolPresetMeta | undefined => {
  return toolPresetMetas.find((meta) => meta.toolId === toolId);
};

export * from './AutoSelectionPresets';
export * from './EraserPresets';
export * from './FillPresets';
export * from './LassoSelectionPresets';
export * from './PenPresets';
export * from './PresetMeta';
export * from './RectSelectionPresets';
