import { Component } from 'solid-js';
import Slider from '~/components/common/Slider';
import { sayRandomQuote } from '~/components/common/companion/QuotePool';
import { setToolStore, toolStore } from '~/stores/EditorStores';
import { penConfigRow, penConfigRowClickable, penConfigRowIcon, penConfigRowName } from '~/styles/section/pen.css';
import { Tool, ToolType } from '~/types/Tool';

interface Props {
  pen: Tool;
  isInUse: boolean;
}

const PenItem: Component<Props> = (props: Props) => {
  let src = '';
  switch (props.pen.type) {
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
    <div class={penConfigRow}>
      {/* <Light on={props.isInUse} /> */}
      <div
        class={penConfigRowClickable}
        onClick={() => {
          setToolStore({ usingIndex: toolStore.tools.indexOf(props.pen) });
        }}
      >
        <img
          class={penConfigRowIcon}
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
          class={penConfigRowName}
          style={{
            color: props.isInUse ? 'red' : 'unset',
          }}
        >
          {props.pen.name}.
        </p>
      </div>

      {(props.pen.type === ToolType.Pen || props.pen.type === ToolType.Eraser) && (
        <>
          <div style={{ 'flex-grow': 1 }}>
            <Slider
              min={1}
              max={30}
              default={props.pen.size}
              onValueChanged={(newValue) => {
                sayRandomQuote('pen-resize');
                console.log('size set to ' + newValue);
                const penIndex = toolStore.tools.findIndex((p) => p.id === props.pen.id);
                setToolStore('tools', penIndex, 'size', newValue);
              }}
            />
          </div>

          <p style={{ width: 'auto' }}>{props.pen.size}.</p>
        </>
      )}
    </div>
  );
};

export default PenItem;
