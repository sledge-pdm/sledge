import { flexCol } from '@sledge/core';
import { Component, Show } from 'solid-js';
import { getCurrentPresetConfig, setActiveToolPreset, updateToolPresetConfig } from '~/controllers/tool/ToolController';
import { toolStore } from '~/stores/EditorStores';
import { configFormNoPreset } from '~/styles/components/config/config_form.css';
import { ToolCategoryId } from '~/tools/Tools';
import ToolPresetConfigForm from './ToolPresetConfigForm';

interface Props {
  toolId: ToolCategoryId;
}

const ToolPresetManager: Component<Props> = (props) => {
  const currentTool = () => toolStore.tools[props.toolId];
  const presets = () => currentTool()?.presets;
  const selectedPreset = () => presets()?.selected;
  const currentPresetConfig = (): Record<string, any> | undefined => getCurrentPresetConfig(props.toolId);

  // プリセット選択肢を作成
  const presetOptions = () => {
    if (!presets()) return [];

    return Object.keys(presets()!.options).map((key) => ({
      value: key,
      label: key === 'default' ? 'Default' : key.charAt(0).toUpperCase() + key.slice(1),
    }));
  };

  const handlePresetChange = (presetName: string) => {
    setActiveToolPreset(props.toolId, presetName);
  };

  const handleConfigChange = (key: string, value: any) => {
    if (!selectedPreset()) return;
    updateToolPresetConfig(props.toolId, selectedPreset()!, key, value);
  };

  console.log(currentPresetConfig());
  return (
    <div class={flexCol}>
      {/* プリセット設定フォーム */}
      <Show when={currentPresetConfig() && Object.keys(currentPresetConfig()!).length > 0} fallback={<p class={configFormNoPreset}>no preset.</p>}>
        <div class={flexCol} style={{ gap: '8px', 'margin-top': '8px' }}>
          <ToolPresetConfigForm toolId={props.toolId} presetConfig={currentPresetConfig()!} onConfigChange={handleConfigChange} />
        </div>
      </Show>
    </div>
  );
};

export default ToolPresetManager;
