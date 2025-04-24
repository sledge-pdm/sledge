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
        enableUsingSelection={true}
      />
      <ColorBox
        color={colorStore.secondary}
        sizePx={24}
        onClick={(color) => selectPalette(PaletteType.secondary)}
        enableUsingSelection={true}
      />
    </div>
  );
};

export default Palette;
