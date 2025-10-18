import { css } from '@acab/ecsstatic';
import { ColorBox } from '@sledge/ui';
import { Component } from 'solid-js';
import { currentColor, PaletteType, selectPalette } from '~/features/color';
import { colorStore } from '~/stores/EditorStores';

export const paletteRoot = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-left: 12px;
`;
export const paletteColorBoxContainer = css`
  display: flex;
  flex-direction: row;
`;

export const paletteColorBoxCaption = css`
  width: 10px;
  color: var(--color-muted);
`;

const Palette: Component = () => {
  return (
    <div class={paletteRoot}>
      <div class={paletteColorBoxContainer}>
        <p class={paletteColorBoxCaption}>1</p>
        <ColorBox
          color={colorStore.primary}
          sizePx={30}
          onClick={(color) => selectPalette(PaletteType.primary)}
          enableUsingSelection={colorStore.currentPalette === PaletteType.primary}
          currentColor={currentColor}
        />
      </div>
      <div class={paletteColorBoxContainer}>
        <p class={paletteColorBoxCaption}>2</p>
        <ColorBox
          color={colorStore.secondary}
          sizePx={30}
          onClick={(color) => selectPalette(PaletteType.secondary)}
          enableUsingSelection={colorStore.currentPalette === PaletteType.secondary}
          currentColor={currentColor}
        />
      </div>
    </div>
  );
};

export default Palette;
