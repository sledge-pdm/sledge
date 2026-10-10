import { Dropdown } from '@sledge-pdm/ui';
import { Component } from 'solid-js';
import { SelectionModeSelector } from '~/components/section/editor/tool/config/SelectionModeSelector';
import { ToolConfigProps } from '~/components/section/editor/tool/config/ToolConfigProps';
import ToolConfigRow from '~/components/section/editor/tool/config/ToolConfigRow';
import { LassoSelectionPresetConfig } from '~/features/tools/Tools';
import { flexCol } from '~/styles/styles';

const LassoSelectionToolConfig: Component<ToolConfigProps<LassoSelectionPresetConfig>> = (props) => {
  return (
    <div class={flexCol} style={{ gap: '4px' }}>
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
