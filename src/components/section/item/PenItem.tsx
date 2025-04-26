import { Component } from 'solid-js';
import Light from '~/components/common/Light';
import Slider from '~/components/common/Slider';
import { sayRandomQuote } from '~/components/common/companion/QuotePool';
import { setToolStore, toolStore } from '~/stores/internal/toolsStore';
import { penConfigRow, penConfigRowName } from '~/styles/section/pen.css';
import { Tool, ToolType } from '~/types/Tool';

interface Props {
  pen: Tool;
  isInUse: boolean;
}

const PenItem: Component<Props> = (props: Props) => {
  return (
    <div class={penConfigRow}>
      <Light on={props.isInUse} />

      <p
        class={penConfigRowName}
        style={{
          color: props.isInUse ? 'red' : 'unset',
        }}
        onClick={() => {
          setToolStore({ usingIndex: toolStore.tools.indexOf(props.pen) });
        }}
      >
        {props.pen.name}.
      </p>

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
