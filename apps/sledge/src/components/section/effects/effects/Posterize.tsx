import { Slider } from '@sledge/ui';
import { Component } from 'solid-js';
import { createStore } from 'solid-js/store';
import { EffectControl } from '~/components/section/effects/EffectControl';
import { EffectSectionProps } from '~/components/section/effects/Effects';
import { EffectWrapper } from '~/components/section/effects/EffectWrapper';
import { applyEffect } from '~/features/effect/Effects';

const Posterize: Component<EffectSectionProps> = (props) => {
  const [options, setOptions] = createStore<{
    levels: number;
  }>({
    levels: 8,
  });

  return (
    <EffectWrapper
      title='posterize.'
      onApply={() => {
        applyEffect(props.selectedLayerId(), 'posterize', (buffer) => buffer.posterize(options.levels));
      }}
    >
      <EffectControl label='levels.'>
        <Slider
          labelMode='left'
          labelWidth={56}
          value={options.levels}
          min={1}
          max={32}
          wheelSpin={true}
          allowFloat={false}
          onDoubleClick={() => setOptions('levels', 8)}
          onChange={(value) => {
            setOptions('levels', value);
          }}
        />
      </EffectControl>
    </EffectWrapper>
  );
};

export default Posterize;
