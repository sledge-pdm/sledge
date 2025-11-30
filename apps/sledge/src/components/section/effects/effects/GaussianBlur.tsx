import { AlphaBlurMode } from '@sledge/anvil';
import { Slider, ToggleSwitch } from '@sledge/ui';
import { Component } from 'solid-js';
import { createStore } from 'solid-js/store';
import { EffectControl } from '~/components/section/effects/EffectControl';
import { EffectSectionProps } from '~/components/section/effects/Effects';
import { EffectWrapper } from '~/components/section/effects/EffectWrapper';
import { applyEffect } from '~/features/effect/Effects';

const GaussianBlur: Component<EffectSectionProps> = (props) => {
  const [options, setOptions] = createStore<{
    radius: number;
    alphaMode: AlphaBlurMode;
  }>({
    radius: 500,
    alphaMode: AlphaBlurMode.Blur,
  });

  return (
    <EffectWrapper
      title='gaussian blur.'
      onApply={() => {
        applyEffect(props.selectedLayerId(), 'gaussian blur', (buffer) => buffer.gaussianBlur(options.radius, options.alphaMode));
      }}
    >
      <EffectControl label='radius.'>
        <Slider
          labelMode='left'
          value={options.radius}
          min={0}
          max={1000}
          wheelSpin={true}
          dblClickResetValue={500}
          allowFloat={false}
          onChange={(value) => {
            setOptions('radius', value);
          }}
        />
      </EffectControl>

      <EffectControl label='clamp at transparency.'>
        <ToggleSwitch
          checked={options.alphaMode === AlphaBlurMode.Skip}
          onChange={(value) => {
            setOptions('alphaMode', value ? AlphaBlurMode.Skip : AlphaBlurMode.Blur);
          }}
        />
      </EffectControl>
    </EffectWrapper>
  );
};

export default GaussianBlur;
