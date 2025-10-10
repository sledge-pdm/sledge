import { Slider } from '@sledge/ui';
import { Component } from 'solid-js';
import { updateToolPresetConfig } from '~/features/tools/ToolController';
import { DEFAULT_PRESET, ToolCategoryId } from '~/features/tools/Tools';
import { toolStore } from '~/stores/EditorStores';
import { flexCol, flexRow } from '~/styles';

interface Props {
  categoryId: ToolCategoryId;
  presetId?: string;
}

const PresetEditor: Component<Props> = (props: Props) => {
  const preset = () => toolStore.tools[props.categoryId]?.presets?.options[props.presetId ?? 'default'];

  return (
    <div class={flexCol} style={{ width: '100%', 'align-items': 'center' }}>
      <div class={flexRow} style={{ width: '100%' }}>
        <p style={{ width: '35%' }}>size.</p>
        <p style={{ margin: '0 12px' }}>{preset()?.size}</p>
        <Slider
          labelMode='none'
          min={1}
          max={30}
          allowFloat={false}
          value={preset()?.size ?? 0}
          onChange={(v) => {
            updateToolPresetConfig(props.categoryId, props.presetId ?? DEFAULT_PRESET, 'size', v);
          }}
        />
      </div>
    </div>
  );
};

export default PresetEditor;
