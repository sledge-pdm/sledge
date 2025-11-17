import { RGBA } from '@sledge/anvil';
import { Slider } from '@sledge/ui';
import { Component, createSignal, onMount } from 'solid-js';
import { sliderContainer, sliderContentRoot, sliderLabel } from '~/components/section/editor/color/tabs/SliderStyles';
import { currentColor, registerColorChange, setCurrentColor } from '~/features/color';

const RGB: Component = (props) => {
  const [colorOnPointerDown, setColorOnPointerDown] = createSignal<RGBA | undefined>(undefined);

  const handlePointerUp = () => {
    const oldColor = colorOnPointerDown();
    if (oldColor) {
      registerColorChange(oldColor, currentColor());
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
    <div class={sliderContentRoot}>
      <div class={sliderContainer}>
        <p class={sliderLabel}>Red.</p>
        <Slider
          labelMode='left'
          labelWidth={32}
          min={0}
          max={255}
          allowFloat={false}
          value={currentColor()[0]}
          onPointerDownOnValidArea={(e) => {
            setColorOnPointerDown(currentColor());
            return true;
          }}
          onChange={(v) => {
            const color: RGBA = [v, currentColor()[1], currentColor()[2], currentColor()[3]];
            setCurrentColor(color);
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
          value={currentColor()[1]}
          onPointerDownOnValidArea={(e) => {
            setColorOnPointerDown(currentColor());
            return true;
          }}
          onChange={(v) => {
            const color: RGBA = [currentColor()[0], v, currentColor()[2], currentColor()[3]];
            setCurrentColor(color);
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
          value={currentColor()[2]}
          onPointerDownOnValidArea={(e) => {
            setColorOnPointerDown(currentColor());
            return true;
          }}
          onChange={(v) => {
            const color: RGBA = [currentColor()[0], currentColor()[1], v, currentColor()[3]];
            setCurrentColor(color);
          }}
        />
      </div>
    </div>
  );
};

export default RGB;
