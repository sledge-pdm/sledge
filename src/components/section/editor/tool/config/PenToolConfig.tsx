import { Dropdown, Slider } from '@sledge-pdm/ui';
import { Component } from 'solid-js';
import { ToolConfigProps } from '~/components/section/editor/tool/config/ToolConfigProps';
import ToolConfigRow from '~/components/section/editor/tool/config/ToolConfigRow';
import SizeHistoryRow from '~/components/section/editor/tool/SizeHistoryRow';
import { Consts } from '~/Consts';
import { PenPresetConfig, TOOL_CATEGORIES } from '~/features/tools/Tools';
import { flexCol } from '~/styles/styles';

const PenToolConfig: Component<ToolConfigProps<PenPresetConfig>> = (props) => {
  return (
    <div class={flexCol} style={{ gap: '4px' }}>
      <ToolConfigRow label='Size'>
        <Slider
          labelMode='left'
          labelWidth={40}
          value={props.config.size}
          min={1}
          max={Consts.maxPenSize}
          allowFloat={false}
          allowDirectInput
          wheelSpin
          customFormat={(v) => `${v} px`}
          onChange={(v) => props.onChange('size', v)}
        />
      </ToolConfigRow>
      <ToolConfigRow>
        <SizeHistoryRow categoryId={TOOL_CATEGORIES.PEN} />
      </ToolConfigRow>
      <ToolConfigRow label='Opacity'>
        <Slider
          labelMode='left'
          labelWidth={40}
          value={props.config.opacity}
          min={1}
          max={100}
          allowFloat={false}
          allowDirectInput
          wheelSpin
          customFormat={(v) => `${v} %`}
          onChange={(v) => props.onChange('opacity', v)}
        />
      </ToolConfigRow>
      <ToolConfigRow label='Shape'>
        <Dropdown
          value={props.config.shape!}
          options={[
            { value: 'square', label: 'Square' },
            { value: 'circle', label: 'Circle' },
          ]}
          onChange={(v) => props.onChange('shape', v)}
        />
      </ToolConfigRow>
    </div>
  );
};

export default PenToolConfig;
