import { Component } from 'solid-js';
import Slider from '~/components/common/control/Slider';
import Icon from '~/components/common/Icon';
import { setActiveToolType, setToolSize } from '~/controllers/tool/ToolController';
import { Consts } from '~/models/Consts';
import { vars } from '~/styles/global.css';
import { toolConfigRow, toolConfigRowClickable, toolConfigRowName } from '~/styles/section/pen.css';
import { Tool, ToolType } from '~/tools/Tools';

interface Props {
  toolType: ToolType;
  tool: Tool;
  isInUse: boolean;
}

const ToolItem: Component<Props> = (props: Props) => {
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

export default ToolItem;
