import { ColorBox } from '@sledge/ui';
import { Component } from 'solid-js';
import { currentColor, PaletteType, selectPalette } from '~/features/color';
import { colorStore } from '~/stores/EditorStores';
import { paletteColorBoxCaption, paletteColorBoxContainer, paletteRoot } from '~/styles/components/palette.css';

const Palette: Component = () => {
  return (
    <div class={paletteRoot}>
      <div class={paletteColorBoxContainer}>
        <p class={paletteColorBoxCaption}>1.</p>
        <ColorBox
          color={colorStore.primary}
          sizePx={30}
          onClick={(color) => selectPalette(PaletteType.primary)}
          enableUsingSelection={colorStore.currentPalette === PaletteType.primary}
          currentColor={currentColor}
        />
      </div>
      <div class={paletteColorBoxContainer}>
        <p class={paletteColorBoxCaption}>2.</p>
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
