import { GaussianBlurEffect } from '@sledge-pdm/frasco';
import { Dropdown, DropdownOption, Slider } from '@sledge-pdm/ui';
import { Component } from 'solid-js';
import { createStore } from 'solid-js/store';
import { EffectControl } from '~/components/section/effects/EffectControl';
import { EffectSectionProps } from '~/components/section/effects/Effects';
import { EffectWrapper } from '~/components/section/effects/EffectWrapper';
import { applyEffect } from '~/features/effect/Effects';

type AlphaMode = 'skip' | 'blur';

const alphaModeOptions: DropdownOption<AlphaMode>[] = [
  { label: 'skip', value: 'skip' },
  { label: 'blur', value: 'blur' },
];

const GaussianBlur: Component<EffectSectionProps> = (props) => {
  const [options, setOptions] = createStore<{
    radius: number;
    alphaMode: AlphaMode;
  }>({
    radius: 250,
    alphaMode: 'skip',
  });

  return (
    <EffectWrapper
      title='gaussian blur.'
      onApply={() => {
        applyEffect(props.selectedLayerId(), 'gaussian blur', (layer) =>
          GaussianBlurEffect.apply(layer, {
            radius: options.radius,
            alphaMode: options.alphaMode,
            context: { tool: 'fx', fxName: 'gaussian blur' },
          })
        );
      }}
    >
      <EffectControl label='radius.'>
        <Slider
          labelMode='left'
          labelWidth={56}
          value={options.radius}
          min={0}
          max={1000}
          wheelSpin={true}
          wheelStep={10}
          allowFloat={true}
          floatSignificantDigits={1}
          dblClickResetValue={250}
          onChange={(value) => {
            setOptions('radius', value);
          }}
        />
      </EffectControl>

      <EffectControl label='alpha mode.'>
        <Dropdown
          options={alphaModeOptions}
          value={options.alphaMode}
          onChange={(value) => {
            setOptions('alphaMode', value);
          }}
        />
      </EffectControl>
    </EffectWrapper>
  );
};

export default GaussianBlur;
