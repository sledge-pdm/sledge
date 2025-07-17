import { eraserPresetMeta } from './EraserPresets';
import { fillPresetMeta } from './FillPresets';
import { penPresetMeta } from './PenPresets';
import { ToolPresetMeta } from './PresetMeta';

export const toolPresetMetas: ToolPresetMeta[] = [penPresetMeta, eraserPresetMeta, fillPresetMeta];

export const getPresetMetaByToolId = (toolId: string): ToolPresetMeta | undefined => {
  return toolPresetMetas.find((meta) => meta.toolId === toolId);
};

export * from './EraserPresets';
export * from './FillPresets';
export * from './PenPresets';
export * from './PresetMeta';
