import { Component } from 'solid-js';
import ColorBox from '~/components/common/ColorBox';
import { selectPalette } from '~/controllers/color/ColorController';
import { colorStore } from '~/stores/EditorStores';
import { paletteRoot } from '~/styles/components/palette.css';
import { PaletteType } from '~/types/PaletteType';

const Palette: Component = () => {
  return (
    <div class={paletteRoot}>
      <ColorBox
        color={colorStore.primary}
        sizePx={24}
        onClick={(color) => selectPalette(PaletteType.primary)}
        enableUsingSelection={colorStore.currentPalette === PaletteType.primary}
      />
      <ColorBox
        color={colorStore.secondary}
        sizePx={24}
        onClick={(color) => selectPalette(PaletteType.secondary)}
        enableUsingSelection={colorStore.currentPalette === PaletteType.secondary}
      />
    </div>
  );
};

export default Palette;
