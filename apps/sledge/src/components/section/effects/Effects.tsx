import { flexCol, flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Dropdown, DropdownOption } from '@sledge/ui';
import { Accessor, Component, createMemo, createSignal } from 'solid-js';
import LayerPreview from '~/components/global/LayerPreview';
import GaussianBlur from '~/components/section/effects/items/GaussianBlur';
import GrayScale from '~/components/section/effects/items/GrayScale';
import Invert from '~/components/section/effects/items/Invert';
import { activeLayer, findLayerById } from '~/features/layer';
import { layerListStore } from '~/stores/ProjectStores';

export interface EffectSectionProps {
  selectedLayerId: Accessor<string>;
}

const Effects: Component = () => {
  const [selectedLayerId, setSelectedLayerId] = createSignal(activeLayer()?.id);
  const selectedLayer = () => findLayerById(selectedLayerId()) ?? layerListStore.layers[0];
  const layersOption = createMemo<DropdownOption<string>[]>(() => {
    const layers = layerListStore.layers;
    return layers.map((l) => {
      return {
        label: l.name,
        value: l.id,
      };
    });
  });

  return (
    <>
      <div
        class={flexCol}
        style={{
          width: '100%',
          height: 'auto',
          gap: '8px',
        }}
      >
        <div
          class={flexCol}
          style={{
            'align-self': 'center',
            width: 'fit-content',
            height: 'auto',
            border: `1px solid ${vars.color.border}`,
            'margin-bottom': '12px',
          }}
        >
          <LayerPreview layer={selectedLayer()} onClick={() => {}} width={170} height={170} />
        </div>
        <div class={flexRow} style={{ 'align-items': 'center', gap: '12px' }}>
          <p>apply to</p>
          <Dropdown options={layersOption()} value={selectedLayerId()} onChange={(v) => setSelectedLayerId(v)} />
        </div>
      </div>

      <Invert selectedLayerId={selectedLayerId} />
      <GrayScale selectedLayerId={selectedLayerId} />
      <GaussianBlur selectedLayerId={selectedLayerId} />
    </>
  );
};

export default Effects;
