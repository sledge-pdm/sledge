import { css } from '@acab/ecsstatic';
import { Component, Match, Show, Switch } from 'solid-js';
import AutoSelectionToolConfig from '~/components/section/editor/tool/config/AutoSelectionToolConfig';
import EraserToolConfig from '~/components/section/editor/tool/config/EraserToolConfig';
import FillToolConfig from '~/components/section/editor/tool/config/FillToolConfig';
import LassoSelectionToolConfig from '~/components/section/editor/tool/config/LassoSelectionToolConfig';
import PenToolConfig from '~/components/section/editor/tool/config/PenToolConfig';
import RectSelectionToolConfig from '~/components/section/editor/tool/config/RectSelectionToolConfig';
import ToolPresetDropDown from '~/components/section/editor/tool/ToolPresetDropDown';
import { getCurrentPresetConfig, updateToolPresetConfig } from '~/features/tools/ToolController';
import { TOOL_CATEGORIES, ToolCategoryId } from '~/features/tools/Tools';
import { toolStore } from '~/stores/EditorStores';
import { flexCol } from '~/styles/styles';

const presetContent = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  padding: 0 8px;
`;

interface Props {
  toolId: ToolCategoryId;
}

const ToolPresetManager: Component<Props> = (props) => {
  const currentTool = () => toolStore.tools[props.toolId];
  const presets = () => currentTool()?.presets;
  const selectedPreset = () => presets()?.selected;
  const config = () => getCurrentPresetConfig(props.toolId);

  const handleConfigChange = (key: string, value: any) => {
    if (!selectedPreset()) return;
    updateToolPresetConfig(props.toolId, selectedPreset()!, key, value);
  };

  return (
    <div class={flexCol}>
      <div class={presetContent}>
        <Show when={presets() && Object.keys(presets()!.options).length > 1}>
          <ToolPresetDropDown toolId={props.toolId} />
        </Show>

        <Show when={config()}>
          <Switch>
            <Match when={props.toolId === TOOL_CATEGORIES.PEN}>
              <PenToolConfig config={config()!} onChange={handleConfigChange} />
            </Match>
            <Match when={props.toolId === TOOL_CATEGORIES.ERASER}>
              <EraserToolConfig config={config()!} onChange={handleConfigChange} />
            </Match>
            <Match when={props.toolId === TOOL_CATEGORIES.FILL}>
              <FillToolConfig config={config()!} onChange={handleConfigChange} />
            </Match>
            <Match when={props.toolId === TOOL_CATEGORIES.RECT_SELECTION}>
              <RectSelectionToolConfig />
            </Match>
            <Match when={props.toolId === TOOL_CATEGORIES.LASSO_SELECTION}>
              <LassoSelectionToolConfig config={config()!} onChange={handleConfigChange} />
            </Match>
            <Match when={props.toolId === TOOL_CATEGORIES.AUTO_SELECTION}>
              <AutoSelectionToolConfig config={config()!} onChange={handleConfigChange} />
            </Match>
          </Switch>
        </Show>
      </div>
    </div>
  );
};

export default ToolPresetManager;
