import { Component } from 'solid-js';
import Slider from '~/components/common/basics/Slider';
import { sayRandomQuote } from '~/components/common/companion/QuotePool';
import { setToolStore, toolStore } from '~/stores/EditorStores';
import { toolConfigRow, toolConfigRowClickable, toolConfigRowIcon, toolConfigRowName } from '~/styles/section/pen.css';
import { Tool, ToolType } from '~/types/Tool';
import { Consts } from '~/utils/consts';

interface Props {
  tool: Tool;
  isInUse: boolean;
}

const ToolItem: Component<Props> = (props: Props) => {
  let src = '';
  switch (props.tool.type) {
    case ToolType.Pen:
      src = '/pen.png';
      break;
    case ToolType.Eraser:
      src = '/eraser_b.png';
      break;
    case ToolType.Fill:
      src = '/fill_G_x10.png';
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
        <img
          class={toolConfigRowIcon}
          style={{
            'image-rendering': 'pixelated',
            filter: props.isInUse
              ? 'invert(11%) sepia(92%) saturate(7351%) hue-rotate(0deg) brightness(99%) contrast(109%)'
              : 'none',
          }}
          src={src}
          width={20}
          height={20}
        />
        <p
          class={toolConfigRowName}
          style={{
            color: props.isInUse ? 'red' : 'unset',
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
              default={props.tool.size}
              onValueChanged={(newValue) => {
                sayRandomQuote('pen-resize');
                console.log('size set to ' + newValue);
                const penIndex = toolStore.tools.findIndex((p) => p.id === props.tool.id);
                setToolStore('tools', penIndex, 'size', newValue);
              }}
            />
          </div>

          <p style={{ width: 'auto' }}>{props.tool.size}.</p>
        </>
      )}
    </div>
  );
};

export default ToolItem;
