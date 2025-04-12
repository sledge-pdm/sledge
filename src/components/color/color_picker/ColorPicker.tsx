import iro from "@jaames/iro";
import { Component } from "solid-js";
import { setCurrentPenColor } from "~/models/types/Pen";
import { currentPen } from "~/stores/Store";

const ColorPicker: Component<{}> = (props) => {
  let colorPicker;

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
