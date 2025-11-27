import { css } from '@acab/ecsstatic';
import { clsx } from '@sledge/core';
import { ColorBox } from '@sledge/ui';
import { Component } from 'solid-js';
import { currentColor, getPaletteColor, PaletteType, selectPalette } from '~/features/color';
import { colorStore } from '~/stores/EditorStores';

export const container = css`
  display: flex;
  flex-direction: row;
`;
export const containerInactive = css`
  opacity: 0.15;
`;

export const label = css`
  width: 8px;
  color: var(--color-on-background);
`;

export const labelInactive = css`
  color: var(--color-muted);
`;

interface PaletteProps {
  index: number;
  paletteType: PaletteType;
}

const Palette: Component<PaletteProps> = (props) => {
  const isSelected = () => colorStore.currentPalette === props.paletteType;

  return (
    <div class={container}>
      <p class={clsx(label, !isSelected() && labelInactive)}>{props.index}</p>
      <div class={!isSelected() ? containerInactive : undefined}>
        <ColorBox
          color={getPaletteColor(props.paletteType)}
          sizePx={30}
          onClick={() => selectPalette(props.paletteType)}
          enableUsingSelection={false}
          currentColor={currentColor}
          showDisabledBorder={true}
        />
      </div>
    </div>
  );
};

export default Palette;
