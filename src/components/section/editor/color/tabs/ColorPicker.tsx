import iro from '@jaames/iro';
import { IroColorPicker } from '@jaames/iro/dist/ColorPicker';
import { hexWithSharpToRGBA, RGBA, RGBAToHex } from '@sledge-pdm/core';
import { Component, createEffect, createSignal, onMount } from 'solid-js';
import { currentColor, registerColorChange, setCurrentColor } from '~/features/color';
import { colorStore } from '~/stores/EditorStores';

const ColorPicker: Component<{ width: number }> = (props) => {
  let colorPicker: IroColorPicker;

  const [colorOnPointerDown, setColorOnPointerDown] = createSignal<RGBA | undefined>(undefined);
  const [lastHue, setLastHue] = createSignal(0);

  const toHsva = (rgba: RGBA, hueOverride?: number) => {
    const [r, g, b, a] = rgba;
    const hsv = iro.Color.rgbToHsv({ r, g, b });
    return {
      h: hueOverride ?? hsv.h ?? 0,
      s: hsv.s ?? 0,
      v: hsv.v ?? 0,
      a: a / 255,
    };
  };

  const isGray = (rgba: RGBA) => rgba[0] === rgba[1] && rgba[1] === rgba[2];

  const handlePointerUp = () => {
    const oldColor = colorOnPointerDown();
    if (oldColor) {
      registerColorChange(oldColor, hexWithSharpToRGBA(colorPicker.color.hexString));
    }
    setColorOnPointerDown(undefined);
  };

  onMount(() => {
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  });

  createEffect(() => {
    const palette = colorStore.currentPalette;
    const paletteColor = colorStore.palettes[palette];
    if (isGray(paletteColor)) {
      colorPicker.setColors([toHsva(paletteColor, lastHue())]);
      return;
    }
    const paletteHex = RGBAToHex(paletteColor, {
      excludeAlpha: false,
      withSharp: true,
    });
    colorPicker.setColors([paletteHex]);
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
            {
              component: iro.ui.Slider,
              options: {
                // can also be 'saturation', 'value', 'red', 'green', 'blue', 'alpha' or 'kelvin'
                sliderType: 'hue',
              },
            },
          ],
        });
        setLastHue(colorPicker.color.hsv.h ?? 0);
        colorPicker.on('color:change', (color: any, changes?: { h?: boolean }) => {
          if (changes?.h) {
            setLastHue(color.hsv.h);
          }
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
