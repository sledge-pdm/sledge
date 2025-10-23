import { Slider } from '@sledge/ui';
import { Component, createMemo, createSignal, onMount } from 'solid-js';
import { sliderContainer, sliderContentRoot, sliderLabel } from '~/components/section/editor/color/tab/SliderStyles';
import { currentColor, hexToRGBA, RGBAColor, RGBAToHex } from '~/features/color';
import { ColorHistoryAction, projectHistoryController } from '~/features/history';
import { colorStore, setColorStore } from '~/stores/EditorStores';

const RGB: Component = (props) => {
  const [colorOnPointerDown, setColorOnPointerDown] = createSignal<RGBAColor | undefined>(undefined);

  const handlePointerUp = () => {
    const oldColor = colorOnPointerDown();
    if (oldColor) {
      const action = new ColorHistoryAction({
        palette: colorStore.currentPalette,
        oldColor,
        newColor: hexToRGBA(currentColor()),
        context: {
          from: 'ColorController.setCurrentColor',
        },
      });
      projectHistoryController.addAction(action);
    }
    setColorOnPointerDown(undefined);
  };

  onMount(() => {
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
    };
  });

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
          onPointerDownOnValidArea={(e) => {
            setColorOnPointerDown(hexToRGBA(currentColor()));
            return true;
          }}
          onChange={(v) => {
            const color: RGBAColor = [v, rgba()[1], rgba()[2], rgba()[3]];
            setColorStore(colorStore.currentPalette, '#' + RGBAToHex(color, true));
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
          onPointerDownOnValidArea={(e) => {
            setColorOnPointerDown(hexToRGBA(currentColor()));
            return true;
          }}
          onChange={(v) => {
            const color: RGBAColor = [rgba()[0], v, rgba()[2], rgba()[3]];
            setColorStore(colorStore.currentPalette, '#' + RGBAToHex(color, true));
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
          onPointerDownOnValidArea={(e) => {
            setColorOnPointerDown(hexToRGBA(currentColor()));
            return true;
          }}
          onChange={(v) => {
            const color: RGBAColor = [rgba()[0], rgba()[1], v, rgba()[3]];
            setColorStore(colorStore.currentPalette, '#' + RGBAToHex(color, true));
          }}
        />
      </div>
    </div>
  );
};

export default RGB;
