import { Slider } from '@sledge/ui';
import { BrightnessContrastOption } from '@sledge/wasm';
import { Component } from 'solid-js';
import { createStore } from 'solid-js/store';
import { EffectControl } from '~/components/section/effects/EffectControl';
import { EffectSectionProps } from '~/components/section/effects/Effects';
import { EffectWrapper } from '~/components/section/effects/EffectWrapper';
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
    <EffectWrapper
      title='brightness and contrast.'
      onApply={() => {
        applyEffect(props.selectedLayerId(), 'brightness_contrast', new BrightnessContrastOption(options.brightness, options.contrast));
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
          onDoubleClick={() => setOptions('brightness', 0)}
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
          onDoubleClick={() => setOptions('contrast', 0)}
          onChange={(value) => {
            setOptions('contrast', value);
          }}
        />
      </EffectControl>
    </EffectWrapper>
  );
};

export default BrightnessContrast;
