import { vars } from '@sledge/theme';
import { Icon, Slider } from '@sledge/ui';
import { Component } from 'solid-js';
import { setActiveToolType, setToolSize } from '~/controllers/tool/ToolController';
import { Consts } from '~/models/Consts';
import { toolConfigRow, toolConfigRowClickable, toolConfigRowName } from '~/styles/section/tools.css';
import { Tool, ToolType } from '~/tools/Tools';

interface Props {
  toolType: ToolType;
  tool: Tool;
  isInUse: boolean;
}

const ToolItemMain: Component<Props> = (props: Props) => {
  return (
    <div class={toolConfigRow}>
      {/* <Light on={props.isInUse} /> */}
      <div class={toolConfigRowClickable} onClick={() => setActiveToolType(props.toolType)}>
        <Icon src={props.tool.iconSrc ?? ''} base={10} scale={2} color={props.isInUse ? vars.color.active : vars.color.onBackground} />
        <p
          class={toolConfigRowName}
          style={{
            color: props.isInUse ? vars.color.active : vars.color.onBackground,
          }}
        >
          {props.tool.familiarName}.
        </p>
      </div>

      {props.tool.size !== undefined && (
        <>
          <div style={{ 'flex-grow': 1 }}>
            <Slider
              min={1}
              max={Consts.maxPenSize}
              value={props.tool.size}
              onChange={(newValue) => {
                setToolSize(props.toolType, newValue);
              }}
              labelMode={'none'}
            />
          </div>

          <p style={{ width: 'auto' }}>{props.tool.size}.</p>
        </>
      )}
    </div>
  );
};

export default ToolItemMain;
