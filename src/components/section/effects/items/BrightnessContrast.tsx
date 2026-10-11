import { BrightnessContrastEffect } from '@sledge-pdm/frasco';
import { Slider } from '@sledge-pdm/ui';
import { Component } from 'solid-js';
import { createStore } from 'solid-js/store';
import { EffectItem } from '~/components/section/effects/EffectItem';
import { EffectSectionProps } from '~/components/section/effects/Effects';
import { EffectControl } from '~/components/section/effects/items/common/EffectControl';
import { applyEffect } from '~/features/effect/Effects';

const BrightnessContrast: Component<EffectSectionProps> = (props) => {
  const [options, setOptions] = createStore<{
    brightness: number;
    contrast: number;
  }>({
    brightness: 0,
    contrast: 0,
  });

  return (
    <EffectItem
      title='brightness and contrast.'
      onApply={() => {
        const layerId = props.selectedLayerId();
        applyEffect(layerId, 'brightness and contrast', (layer) =>
          BrightnessContrastEffect.apply(layer, {
            brightness: options.brightness,
            contrast: options.contrast,
            context: { tool: 'fx', fxName: 'brightness and contrast' },
          })
        );
      }}
    >
      <EffectControl label='brightness.'>
        <Slider
          labelMode='left'
          labelWidth={56}
          value={options.brightness}
          min={-100}
          max={100}
          wheelSpin={true}
          floatSignificantDigits={1}
          allowFloat={true}
          dblClickResetValue={0}
          onChange={(value) => {
            setOptions('brightness', value);
          }}
        />
      </EffectControl>

      <EffectControl label='contrast.'>
        <Slider
          labelMode='left'
          labelWidth={56}
          value={options.contrast}
          min={-100}
          max={100}
          wheelSpin={true}
          floatSignificantDigits={1}
          allowFloat={true}
          dblClickResetValue={0}
          onChange={(value) => {
            setOptions('contrast', value);
          }}
        />
      </EffectControl>
    </EffectItem>
  );
};

export default BrightnessContrast;
