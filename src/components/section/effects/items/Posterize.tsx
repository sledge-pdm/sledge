import { PosterizeEffect } from '@sledge-pdm/frasco';
import { Slider } from '@sledge-pdm/ui';
import { Component } from 'solid-js';
import { createStore } from 'solid-js/store';
import { EffectItem } from '~/components/section/effects/EffectItem';
import { EffectSectionProps } from '~/components/section/effects/Effects';
import { EffectControl } from '~/components/section/effects/items/common/EffectControl';
import { applyEffect } from '~/features/effect/Effects';

const Posterize: Component<EffectSectionProps> = (props) => {
  const [options, setOptions] = createStore<{
    levels: number;
  }>({
    levels: 8,
  });

  return (
    <EffectItem
      title='posterize.'
      onApply={() => {
        applyEffect(props.selectedLayerId(), 'posterize', (layer) =>
          PosterizeEffect.apply(layer, { levels: options.levels, context: { tool: 'fx', fxName: 'posterize' } })
        );
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
          dblClickResetValue={8}
          onChange={(value) => {
            setOptions('levels', value);
          }}
        />
      </EffectControl>
    </EffectItem>
  );
};

export default Posterize;
