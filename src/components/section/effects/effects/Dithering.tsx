import { DitheringEffect } from '@sledge-pdm/frasco';
import { Dropdown, DropdownOption, Slider } from '@sledge-pdm/ui';
import { Component } from 'solid-js';
import { createStore } from 'solid-js/store';
import { EffectControl } from '~/components/section/effects/EffectControl';
import { EffectSectionProps } from '~/components/section/effects/Effects';
import { EffectWrapper } from '~/components/section/effects/EffectWrapper';
import { applyEffect } from '~/features/effect/Effects';

type Mode = 'ordered' | 'random';

const modeOptions: DropdownOption<Mode>[] = [
  { label: 'ordered', value: 'ordered' },
  { label: 'random', value: 'random' },
];

const Dithering: Component<EffectSectionProps> = (props) => {
  const [options, setOptions] = createStore<{
    mode: Mode;
    levels: number;
    strength: number;
  }>({
    mode: 'ordered',
    levels: 4,
    strength: 1,
  });

  return (
    <EffectWrapper
      title='dithering.'
      onApply={() => {
        applyEffect(props.selectedLayerId(), 'dithering', (layer) =>
          DitheringEffect.apply(layer, {
            mode: options.mode,
            levels: options.levels,
            strength: options.strength,
            context: { tool: 'fx', fxName: 'dithering' },
          })
        );
      }}
    >
      <EffectControl label='mode.'>
        <Dropdown
          options={modeOptions}
          value={options.mode}
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
          dblClickResetValue={4}
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
          min={0}
          max={1}
          wheelSpin={true}
          wheelStep={0.05}
          allowFloat={true}
          floatSignificantDigits={2}
          dblClickResetValue={1}
          onChange={(value) => {
            setOptions('strength', value);
          }}
        />
      </EffectControl>
    </EffectWrapper>
  );
};

export default Dithering;
