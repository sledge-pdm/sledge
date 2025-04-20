import iro from "@jaames/iro";
import { IroColorPicker } from "@jaames/iro/dist/ColorPicker";
import { Component, createEffect } from "solid-js";
import { setCurrentToolColor } from "~/models/types/Tool";
import { currentTool } from "~/stores/internal/toolsStore";

const ColorPicker: Component<{}> = (props) => {
  let colorPicker: IroColorPicker;

  createEffect(() => {
    colorPicker.setColors([currentTool().color]);
  });

  return (
    <div
      ref={(el) => {
        colorPicker = iro.ColorPicker(el, {
          width: 150,
          padding: 0,
          color: currentTool().color,
          handleRadius: 4,
          layoutDirection: "horizontal",
          layout: [
            {
              component: iro.ui.Box,
              options: {},
            },
            {
              component: iro.ui.Slider,
              options: {
                // can also be 'saturation', 'value', 'red', 'green', 'blue', 'alpha' or 'kelvin'
                sliderType: "hue",
              },
            },
          ],
        });
        colorPicker.on("color:change", function (color: any) {
          setCurrentToolColor(color.hexString);
        });
      }}
    ></div>
  );
};

export default ColorPicker;
