import { ColorBox } from '@sledge/ui';
import { paletteRoot } from '@styles/components/palette.css';
import { Component } from 'solid-js';
import { currentColor, selectPalette } from '~/controllers/color/ColorController';
import { PaletteType } from '~/models/color/PaletteType';
import { colorStore } from '~/stores/EditorStores';

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
