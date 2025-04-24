import { Component } from "solid-js";
import ColorBox from "~/components/common/ColorBox";
import {
  colorStore,
  PaletteType,
  selectPalette,
} from "~/stores/internal/colorStore";
import { paletteRoot } from "~/styles/components/palette.css";

const Palette: Component<{}> = (props) => {
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
        enableUsingSelection={
          colorStore.currentPalette === PaletteType.secondary
        }
      />
    </div>
  );
};

export default Palette;
