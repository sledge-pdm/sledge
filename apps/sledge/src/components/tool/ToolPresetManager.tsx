import { flexCol } from '@sledge/core';
import { Component, Show } from 'solid-js';
import { getCurrentPresetConfig, setActiveToolPreset, toolStore, updateToolPresetConfig } from '~/stores/EditorStores';
import { configFormFieldHeader, configFormFields } from '~/styles/components/config/config_form.css';
import { ToolCategoryId } from '~/tools/Tools';
import ToolPresetConfigForm from './ToolPresetConfigForm';

interface Props {
  toolId: ToolCategoryId;
}

const ToolPresetManager: Component<Props> = (props) => {
  const currentTool = () => toolStore.tools[props.toolId];
  const presets = () => currentTool()?.presets;
  const selectedPreset = () => presets()?.selected;
  const currentPresetConfig = () => getCurrentPresetConfig(props.toolId);

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

  // プリセットが存在しないツールの場合
  if (!presets()) {
    return (
      <div class={configFormFields}>
        <p class={configFormFieldHeader}>No presets available for this tool.</p>
      </div>
    );
  }

  return (
    <div class={flexCol}>
      {/* プリセット選択 */}

      {/* プリセット設定フォーム */}
      <Show when={currentPresetConfig()}>
        <div class={flexCol} style={{ gap: '8px', 'margin-top': '8px' }}>
          <ToolPresetConfigForm toolId={props.toolId} presetConfig={currentPresetConfig()!} onConfigChange={handleConfigChange} />
        </div>
      </Show>
    </div>
  );
};

export default ToolPresetManager;
