import { Dropdown } from '@sledge-pdm/ui';
import { Component } from 'solid-js';
import { SelectionModeSelector } from '~/components/section/editor/tool/config/common/SelectionModeSelector';
import { ToolConfigProps } from '~/components/section/editor/tool/config/common/ToolConfigProps';
import ToolConfigRow from '~/components/section/editor/tool/config/common/ToolConfigRow';
import { toolConfigForm } from '~/components/section/editor/tool/config/common/ToolConfigStyles';
import { LassoSelectionPresetConfig } from '~/features/tools/Tools';

const LassoSelectionToolConfig: Component<ToolConfigProps<LassoSelectionPresetConfig>> = (props) => {
  return (
    <div class={toolConfigForm}>
      <ToolConfigRow label='Mode'>
        <SelectionModeSelector />
      </ToolConfigRow>
      <ToolConfigRow label='fill mode'>
        <Dropdown
          value={props.config.fillMode!}
          options={[
            { value: 'nonzero', label: 'nonzero' },
            { value: 'evenodd', label: 'evenodd' },
          ]}
          onChange={(v) => props.onChange('fillMode', v)}
        />
      </ToolConfigRow>
    </div>
  );
};

export default LassoSelectionToolConfig;
