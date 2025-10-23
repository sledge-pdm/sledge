import { Slider } from '@sledge/ui';
import { Component, createMemo } from 'solid-js';
import { sliderContainer, sliderContentRoot, sliderLabel } from '~/components/section/editor/color/tab/SliderStyles';
import { hexToRGBA, RGBAToHex, setCurrentColor } from '~/features/color';
import { colorStore } from '~/stores/EditorStores';

const HSV: Component = (props) => {
  const rgba = createMemo(() => hexToRGBA(colorStore[colorStore.currentPalette]));

  return (
    <div class={sliderContentRoot}>
      <div class={sliderContainer}>
        <p class={sliderLabel}>Red.</p>
        <Slider
          labelMode='left'
          labelWidth={32}
          min={0}
          max={255}
          allowFloat={false}
          value={rgba()[0]}
          onChange={(v) => {
            setCurrentColor('#' + RGBAToHex([v, rgba()[1], rgba()[2], rgba()[3]], true));
          }}
        />
      </div>

      <div class={sliderContainer}>
        <p class={sliderLabel}>Green.</p>
        <Slider
          labelMode='left'
          labelWidth={32}
          min={0}
          max={255}
          allowFloat={false}
          value={rgba()[1]}
          onChange={(v) => {
            setCurrentColor('#' + RGBAToHex([rgba()[0], v, rgba()[2], rgba()[3]], true));
          }}
        />
      </div>

      <div class={sliderContainer}>
        <p class={sliderLabel}>Blue.</p>
        <Slider
          labelMode='left'
          labelWidth={32}
          min={0}
          max={255}
          allowFloat={false}
          value={rgba()[2]}
          onChange={(v) => {
            setCurrentColor('#' + RGBAToHex([rgba()[0], rgba()[1], v, rgba()[3]], true));
          }}
        />
      </div>
    </div>
  );
};

export default HSV;
