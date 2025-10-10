import { Dropdown } from '@sledge/ui';
import { Component } from 'solid-js';
import { ToolCategoryId } from '~/features/tools/Tools';
import { setToolStore, toolStore } from '~/stores/EditorStores';
import { eventBus } from '~/utils/EventBus';

interface Props {
  toolId: ToolCategoryId;
}

const ToolPresetDropDown: Component<Props> = (props) => {
  const presets = () => toolStore.tools[props.toolId].presets;
  const selectedPreset = () => presets()?.selected;

  const presetOptions = () => {
    if (!presets()?.options) return [];
    return Object.keys(presets()!.options).map((key) => ({ label: key, value: key }));
  };

  return (
    <Dropdown
      noBackground={false}
      options={presetOptions()}
      value={selectedPreset() ?? 'default'}
      onChange={(v) => {
        console.log(v);
        setToolStore('tools', props.toolId, 'presets', 'selected', v);
        eventBus.emit('tools:presetLoaded', { toolId: props.toolId });
      }}
    />
  );
};

export default ToolPresetDropDown;
