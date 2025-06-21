import { Component } from 'solid-js';
import Slider from '~/components/common/control/Slider';
import Icon from '~/components/common/Icon';
import { Tool, ToolType } from '~/models/tool/Tool';
import { setToolStore, toolStore } from '~/stores/EditorStores';
import { vars } from '~/styles/global.css';
import { toolConfigRow, toolConfigRowClickable, toolConfigRowName } from '~/styles/section/pen.css';
import { Consts } from '~/utils/consts';

interface Props {
  tool: Tool;
  isInUse: boolean;
}

const ToolItem: Component<Props> = (props: Props) => {
  let src = '';
  switch (props.tool.type) {
    case ToolType.Pen:
      src = '/icons/tool/pen.png';
      break;
    case ToolType.Eraser:
      src = '/icons/tool/eraser.png';
      break;
    case ToolType.Fill:
      src = '/icons/tool/fill.png';
      break;
    case ToolType.Pipette:
      src = '/icons/tool/pipette.png';
      break;
    case ToolType.RectSelection:
      src = '/icons/tool/rectselect.png';
      break;
    case ToolType.Move:
      src = '/icons/tool/move.png';
      break;
  }
  return (
    <div class={toolConfigRow}>
      {/* <Light on={props.isInUse} /> */}
      <div
        class={toolConfigRowClickable}
        onClick={() => {
          setToolStore({ usingIndex: toolStore.tools.indexOf(props.tool) });
        }}
      >
        <Icon src={src} base={10} scale={2} color={props.isInUse ? vars.color.active : vars.color.onBackground} />
        <p
          class={toolConfigRowName}
          style={{
            color: props.isInUse ? vars.color.active : vars.color.onBackground,
          }}
        >
          {props.tool.name}.
        </p>
      </div>

      {(props.tool.type === ToolType.Pen || props.tool.type === ToolType.Eraser) && (
        <>
          <div style={{ 'flex-grow': 1 }}>
            <Slider
              min={1}
              max={Consts.maxPenSize}
              value={props.tool.size}
              onChange={(newValue) => {
                const penIndex = toolStore.tools.findIndex((p) => p.id === props.tool.id);
                setToolStore('tools', penIndex, 'size', newValue);
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
