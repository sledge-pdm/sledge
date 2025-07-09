import iro from '@jaames/iro';
import { IroColorPicker } from '@jaames/iro/dist/ColorPicker';
import { Component, createEffect } from 'solid-js';
import { currentColor, setCurrentColor } from '~/controllers/color/ColorController';

const ColorPicker: Component<{ width: number }> = (props) => {
  let colorPicker: IroColorPicker;

  createEffect(() => {
    colorPicker.setColors([currentColor()]);
  });

  return (
    <div
      ref={(el) => {
        colorPicker = iro.ColorPicker(el, {
          width: props.width,
          padding: 0,
          color: currentColor(),
          handleRadius: 4,
          layoutDirection: 'horizontal',
          layout: [
            {
              component: iro.ui.Box,
              options: {},
            },
            {
              component: iro.ui.Slider,
              options: {
                // can also be 'saturation', 'value', 'red', 'green', 'blue', 'alpha' or 'kelvin'
                sliderType: 'hue',
              },
            },
          ],
        });
        colorPicker.on('color:change', function (color: any) {
          setCurrentColor(color.hexString);
        });
      }}
    />
  );
};

export default ColorPicker;
