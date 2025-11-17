import iro from '@jaames/iro';
import { IroColorPicker } from '@jaames/iro/dist/ColorPicker';
import { hexWithSharpToRGBA, RGBA, RGBAToHex } from '@sledge/anvil';
import { Component, createSignal, onMount } from 'solid-js';
import { currentColor, registerColorChange, setCurrentColor } from '~/features/color';

const ColorPicker: Component<{ width: number }> = (props) => {
  let colorPicker: IroColorPicker;

  const [colorOnPointerDown, setColorOnPointerDown] = createSignal<RGBA | undefined>(undefined);

  const handlePointerUp = () => {
    const oldColor = colorOnPointerDown();
    if (oldColor) {
      registerColorChange(oldColor, hexWithSharpToRGBA(colorPicker.color.hexString));
    }
    setColorOnPointerDown(undefined);
  };

  onMount(() => {
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
    };
  });

  return (
    <div
      ref={(el) => {
        colorPicker = iro.ColorPicker(el, {
          width: props.width,
          padding: 0,
          color: RGBAToHex(currentColor(), {
            excludeAlpha: false,
            withSharp: true,
          }),
          handleRadius: 4,
          layoutDirection: 'horizontal',
          layout: [
            {
              component: iro.ui.Box,
              options: {},
            },
            // {
            //   component: iro.ui.Slider,
            //   options: {
            //     // can also be 'saturation', 'value', 'red', 'green', 'blue', 'alpha' or 'kelvin'
            //     sliderType: 'value',
            //   },
            // },
            {
              component: iro.ui.Slider,
              options: {
                sliderType: 'hue',
              },
            },
          ],
        });
        colorPicker.on('color:change', (color: any) => {
          const rgba = hexWithSharpToRGBA(color.hexString);
          setCurrentColor(rgba);
        });
      }}
      onPointerDown={(e) => {
        setColorOnPointerDown(currentColor());
      }}
    />
  );
};

export default ColorPicker;
