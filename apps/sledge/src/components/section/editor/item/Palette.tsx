import { ColorBox } from '@sledge/ui';
import { Component } from 'solid-js';
import { currentColor, PaletteType, selectPalette } from '~/features/color';
import { colorStore } from '~/stores/EditorStores';
import { paletteRoot } from '~/styles/components/palette.css';

const Palette: Component = () => {
  return (
    <div class={paletteRoot}>
      <ColorBox
        color={colorStore.primary}
        sizePx={28}
        onClick={(color) => selectPalette(PaletteType.primary)}
        enableUsingSelection={colorStore.currentPalette === PaletteType.primary}
        currentColor={currentColor}
      />
      <ColorBox
        color={colorStore.secondary}
        sizePx={28}
        onClick={(color) => selectPalette(PaletteType.secondary)}
        enableUsingSelection={colorStore.currentPalette === PaletteType.secondary}
        currentColor={currentColor}
      />
    </div>
  );
};

export default Palette;
