import { DitheringMode } from '@sledge/anvil';
import { Dropdown, DropdownOption, Slider } from '@sledge/ui';
import { Component } from 'solid-js';
import { createStore } from 'solid-js/store';
import { EffectControl } from '~/components/section/effects/EffectControl';
import { EffectSectionProps } from '~/components/section/effects/Effects';
import { EffectWrapper } from '~/components/section/effects/EffectWrapper';
import { applyEffect } from '~/features/effect/Effects';

const Dithering: Component<EffectSectionProps> = (props) => {
  const [options, setOptions] = createStore<{
    mode: DitheringMode;
    levels: number;
    strength: number;
  }>({
    mode: DitheringMode.ErrorDiffusion,
    levels: 4,
    strength: 1.0,
  });

  const modeOptions: DropdownOption<DitheringMode>[] = [
    // { label: 'Random', value: DitheringMode.Random },
    { label: 'Error Diffusion', value: DitheringMode.ErrorDiffusion },
    { label: 'Ordered', value: DitheringMode.Ordered },
  ];

  return (
    <EffectWrapper
      title='dithering.'
      onApply={() => {
        applyEffect(props.selectedLayerId(), 'dithering', (buffer) => buffer.dithering(options.mode, options.levels, options.strength));
      }}
    >
      <EffectControl label='mode.'>
        <Dropdown
          value={options.mode}
          options={modeOptions}
          onChange={(value) => {
            setOptions('mode', value);
          }}
        />
      </EffectControl>

      <EffectControl label='levels.'>
        <Slider
          labelMode='left'
          labelWidth={56}
          value={options.levels}
          min={2}
          max={32}
          wheelSpin={true}
          allowFloat={false}
          onDoubleClick={() => setOptions('levels', 4)}
          onChange={(value) => {
            setOptions('levels', value);
          }}
        />
      </EffectControl>

      <EffectControl label='strength.'>
        <Slider
          labelMode='left'
          labelWidth={56}
          value={options.strength}
          min={0.0}
          max={1.0}
          wheelSpin={true}
          floatSignificantDigits={2}
          allowFloat={true}
          onDoubleClick={() => setOptions('strength', 1.0)}
          onChange={(value) => {
            setOptions('strength', value);
          }}
        />
      </EffectControl>
    </EffectWrapper>
  );
};

export default Dithering;
