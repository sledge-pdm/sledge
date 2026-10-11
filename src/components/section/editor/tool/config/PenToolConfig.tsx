import { css } from '@acab/ecsstatic';
import { color, Dropdown, Icon, Slider } from '@sledge-pdm/ui';
import { Component } from 'solid-js';
import { ToolConfigProps } from '~/components/section/editor/tool/config/common/ToolConfigProps';
import ToolConfigRow from '~/components/section/editor/tool/config/common/ToolConfigRow';
import { toolConfigForm } from '~/components/section/editor/tool/config/common/ToolConfigStyles';
import ToolSizeInput from '~/components/section/editor/tool/config/common/ToolSizeInput';
import { Consts } from '~/Consts';
import { PenPresetConfig, TOOL_CATEGORIES } from '~/features/tools/Tools';
import SizeHistoryRow from '../SizeHistoryRow';

const penSizeContainer = css`
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
`;
const penSizeControls = css`
  display: flex;
  align-items: center;
  width: 100%;
  flex: 1;
  gap: 10px;
`;
const penSizeIcon = css`
  min-width: 8px;
  min-height: 8px;
`;

const PenToolConfig: Component<ToolConfigProps<PenPresetConfig>> = (props) => {
  const addPenSizeSafe = (amount: number) => {
    if (props.config.size === undefined) return;
    const afterSize = props.config.size + amount;
    if (afterSize >= 1 && afterSize <= Consts.maxPenSize) {
      props.onChange('size', afterSize);
    }
  };

  return (
    <div class={toolConfigForm}>
      <ToolConfigRow label='Size'>
        <div class={penSizeContainer}>
          <ToolSizeInput value={props.config.size} onChange={(v) => props.onChange('size', v)} />
          <div class={penSizeControls}>
            <Icon
              class={penSizeIcon}
              src='/assets/icons/misc/minus.png'
              base={8}
              pointerCursor
              color={props.config.size === 1 ? color.muted : color.onBackground}
              hoverColor={props.config.size === 1 ? color.muted : color.active}
              onClick={(e) => addPenSizeSafe(-1)}
            />
            <Slider
              labelMode='none'
              value={props.config.size}
              min={1}
              max={Consts.maxPenSize}
              allowFloat={false}
              wheelSpin
              onChange={(v) => props.onChange('size', v)}
            />
            <Icon
              class={penSizeIcon}
              src='/assets/icons/misc/add.png'
              base={8}
              pointerCursor
              color={props.config.size === Consts.maxPenSize ? color.muted : color.onBackground}
              hoverColor={props.config.size === Consts.maxPenSize ? color.muted : color.active}
              onClick={(e) => addPenSizeSafe(1)}
            />
          </div>
        </div>
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
