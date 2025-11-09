import { css } from '@acab/ecsstatic';
import { ColorBox } from '@sledge/ui';
import { Component, For } from 'solid-js';
import { currentColor, getColorHistory, hexToRGBA, registerColorChange, RGBAToHex, setCurrentColor } from '~/features/color';

const container = css`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  position: relative;
  gap: 4px;
  margin-bottom: 12px;
`;

const ColorHistory: Component = (props) => {
  return (
    <div class={container}>
      <For each={getColorHistory()}>
        {(item, index) => (
          <ColorBox
            color={`#${RGBAToHex(item)}`}
            sizePx={15}
            onClick={(color) => {
              registerColorChange(hexToRGBA(currentColor()), hexToRGBA(color), {
                replaceSameColor: true,
              });
              setCurrentColor(color);
            }}
            enableUsingSelection={true}
            currentColor={currentColor}
          />
        )}
      </For>
    </div>
  );
};

export default ColorHistory;
