import { Component, Show } from 'solid-js';
import ToolPresetDropDown from '~/components/section/editor/tool/ToolPresetDropDown';
import { updateToolPresetConfig } from '~/features/tools/ToolController';
import { ToolCategoryId } from '~/features/tools/Tools';
import { toolStore } from '~/stores/EditorStores';
import { flexCol } from '~/styles';
import ToolPresetConfigForm from './ToolPresetConfigForm';

interface Props {
  toolId: ToolCategoryId;
}

const ToolPresetManager: Component<Props> = (props) => {
  const currentTool = () => toolStore.tools[props.toolId];
  const presets = () => currentTool()?.presets;
  const selectedPreset = () => presets()?.selected;

  const handleConfigChange = (key: string, value: any) => {
    if (!selectedPreset()) return;
    updateToolPresetConfig(props.toolId, selectedPreset()!, key, value);
  };

  return (
    <div class={flexCol}>
      <div class={flexCol} style={{ gap: '8px', 'margin-top': '8px' }}>
        <Show when={presets() && Object.keys(presets()!.options).length > 1}>
          <ToolPresetDropDown toolId={props.toolId} />
        </Show>

        <ToolPresetConfigForm toolId={props.toolId} onConfigChange={handleConfigChange} />
      </div>
    </div>
  );
};

export default ToolPresetManager;
