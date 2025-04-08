import iro from "@jaames/iro";
import { IroColorPicker } from "@jaames/iro/dist/ColorPicker";
import { Component } from "solid-js";
import { setCurrentPenColor } from "~/models/types/Pen";

const ColorPicker: Component<{}> = (props) => {
    return <div ref={el => {
        let colorPicker = iro.ColorPicker(el, {
            width: 200,
            padding: 0,
            handleRadius: 4,
            layoutDirection: "horizontal",
            layout: [
                {
                    component: iro.ui.Box,
                    options: {}
                }, {
                    component: iro.ui.Slider,
                    options: {
                        // can also be 'saturation', 'value', 'red', 'green', 'blue', 'alpha' or 'kelvin'
                        sliderType: 'hue',
                    }
                }

            ]
        })
        colorPicker.on('color:change', function (color: any) {
            setCurrentPenColor(color.hexString);
        });
    }}></div>;
};

export default ColorPicker;