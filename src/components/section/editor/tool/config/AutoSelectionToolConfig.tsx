import { Slider } from '@sledge-pdm/ui';
import { Component } from 'solid-js';
import { SelectionModeSelector } from '~/components/section/editor/tool/config/common/SelectionModeSelector';
import { ToolConfigProps } from '~/components/section/editor/tool/config/common/ToolConfigProps';
import ToolConfigRow from '~/components/section/editor/tool/config/common/ToolConfigRow';
import { toolConfigForm } from '~/components/section/editor/tool/config/common/ToolConfigStyles';
import { AutoSelectionPresetConfig } from '~/features/tools/Tools';

const AutoSelectionToolConfig: Component<ToolConfigProps<AutoSelectionPresetConfig>> = (props) => {
  return (
    <div class={toolConfigForm}>
      <ToolConfigRow label='Mode'>
        <SelectionModeSelector />
      </ToolConfigRow>
      <ToolConfigRow label='Threshold'>
        <Slider
          labelMode='left'
          labelWidth={40}
          value={props.config.threshold}
          min={0}
          max={255}
          allowFloat={false}
          allowDirectInput
          wheelSpin
          onChange={(v) => props.onChange('threshold', v)}
        />
      </ToolConfigRow>
    </div>
  );
};

export default AutoSelectionToolConfig;
