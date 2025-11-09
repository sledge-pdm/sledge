import { css } from '@acab/ecsstatic';
import { ColorBox } from '@sledge/ui';
import { Component, For } from 'solid-js';
import { currentColor, getColorHistory, RGBAToHex, setCurrentColor } from '~/features/color';

const container = css`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  position: relative;
  gap: var(--spacing-xs);
  margin-bottom: 12px;
`;

const ColorHistory: Component = (props) => {
  return (
    <div class={container}>
      <For each={getColorHistory()}>
        {(item, index) => (
          <ColorBox
            color={`#${RGBAToHex(item)}`}
            sizePx={12}
            onClick={(color) => {
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
