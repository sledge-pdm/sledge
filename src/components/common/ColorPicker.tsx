import iro from "@jaames/iro";
import { IroColorPicker } from "@jaames/iro/dist/ColorPicker";
import { Component, createEffect } from "solid-js";
import { setCurrentPenColor } from "~/models/types/Pen";
import { currentPen } from "~/stores/internal/penStore";

const ColorPicker: Component<{}> = (props) => {
  let colorPicker: IroColorPicker;

  createEffect(() => {
    colorPicker.setColors([currentPen().color]);
  });

  return (
    <div
      ref={(el) => {
        colorPicker = iro.ColorPicker(el, {
          width: 200,
          padding: 0,
          color: currentPen().color,
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
          setCurrentPenColor(color.hexString);
        });
      }}
    ></div>
  );
};

export default ColorPicker;
