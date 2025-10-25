import { css } from '@acab/ecsstatic';
import { ColorBox } from '@sledge/ui';
import { Component } from 'solid-js';
import { currentColor, PaletteType, selectPalette } from '~/features/color';
import { colorStore } from '~/stores/EditorStores';

export const root = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-left: 12px;
`;
export const container = css`
  display: flex;
  flex-direction: row;
`;
export const containerInactive = css`
  opacity: 0.15;
`;

export const label = css`
  width: 10px;
  color: var(--color-muted);
`;

const Palette: Component = () => {
  return (
    <div class={root}>
      <div class={container}>
        <p class={label}>1</p>
        <div class={colorStore.currentPalette !== PaletteType.primary ? containerInactive : undefined}>
          <ColorBox
            color={colorStore.primary}
            sizePx={30}
            onClick={(color) => selectPalette(PaletteType.primary)}
            enableUsingSelection={false}
            currentColor={currentColor}
            showDisabledBorder={true}
          />
        </div>
      </div>
      <div class={container}>
        <p class={label}>2</p>
        <div class={colorStore.currentPalette !== PaletteType.secondary ? containerInactive : undefined}>
          <ColorBox
            color={colorStore.secondary}
            sizePx={30}
            onClick={(color) => selectPalette(PaletteType.secondary)}
            enableUsingSelection={false}
            currentColor={currentColor}
            showDisabledBorder={true}
          />
        </div>
      </div>
    </div>
  );
};

export default Palette;
