import { Slider } from '@sledge/ui';
import { DustRemovalOption } from '@sledge/wasm';
import { Component } from 'solid-js';
import { createStore } from 'solid-js/store';
import { EffectControl } from '~/components/section/effects/EffectControl';
import { EffectSectionProps } from '~/components/section/effects/Effects';
import { EffectWrapper } from '~/components/section/effects/EffectWrapper';
import { applyEffect } from '~/features/effect/Effects';

const DustRemoval: Component<EffectSectionProps> = (props) => {
  const [options, setOptions] = createStore<{
    maxSize: number;
    alphaThreshold: number;
  }>({
    maxSize: 5,
    alphaThreshold: 0,
  });
  return (
    <EffectWrapper
      title='dust removal.'
      onApply={() => {
        applyEffect(props.selectedLayerId(), 'dust_removal', new DustRemovalOption(options.maxSize, options.alphaThreshold));
      }}
    >
      <EffectControl label='max size.'>
        <Slider
          labelMode='left'
          value={options.maxSize}
          min={0}
          max={1000}
          wheelSpin={true}
          onDoubleClick={() => setOptions('maxSize', 5)}
          allowFloat={false}
          onChange={(value) => {
            setOptions('maxSize', value);
          }}
        />
      </EffectControl>
      <EffectControl label='alpha threshold.'>
        <Slider
          labelMode='left'
          value={options.alphaThreshold}
          min={0}
          max={255}
          wheelSpin={true}
          onDoubleClick={() => setOptions('alphaThreshold', 0)}
          allowFloat={false}
          onChange={(value) => {
            setOptions('alphaThreshold', value);
          }}
        />
      </EffectControl>
    </EffectWrapper>
  );
};

export default DustRemoval;
