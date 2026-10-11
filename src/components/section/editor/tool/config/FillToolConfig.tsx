import { Dropdown, Slider } from '@sledge-pdm/ui';
import { Component, Show } from 'solid-js';
import { ToolConfigProps } from '~/components/section/editor/tool/config/ToolConfigProps';
import ToolConfigRow from '~/components/section/editor/tool/config/ToolConfigRow';
import { selectionManager } from '~/features/selection/SelectionManager';
import { FillPresetConfig } from '~/features/tools/Tools';
import { flexCol } from '~/styles/styles';

const FillToolConfig: Component<ToolConfigProps<FillPresetConfig>> = (props) => {
  return (
    <div class={flexCol} style={{ gap: '4px' }}>
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
      <Show when={selectionManager.hasSelection()}>
        <ToolConfigRow label='Selection Fill'>
          <Dropdown
            value={props.config.selectionFillMode!}
            options={[
              { value: 'area', label: 'selection area' },
              { value: 'inside', label: 'inside selection' },
              { value: 'ignore', label: 'ignore selection' },
            ]}
            onChange={(v) => props.onChange('selectionFillMode', v)}
          />
        </ToolConfigRow>
      </Show>
    </div>
  );
};

export default FillToolConfig;
