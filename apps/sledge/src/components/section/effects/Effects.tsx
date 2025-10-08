import { css } from '@acab/ecsstatic';
import { Dropdown, DropdownOption } from '@sledge/ui';
import { Accessor, Component, createMemo, createSignal } from 'solid-js';
import LayerPreview from '~/components/global/LayerPreview';
import GaussianBlur from '~/components/section/effects/items/GaussianBlur';
import GrayScale from '~/components/section/effects/items/GrayScale';
import Invert from '~/components/section/effects/items/Invert';
import { activeLayer, findLayerById } from '~/features/layer';
import { layerListStore } from '~/stores/ProjectStores';

const effectsContainer = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: auto;
  gap: 8px;
  margin-top: 16px;
`;

const previewContainer = css`
  align-self: center;
  width: fit-content;
  height: auto;
  border: 1px solid var(--color-border);
  margin-bottom: 12px;
`;

const layerSelectContainer = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

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
      <div class={effectsContainer}>
        <div class={previewContainer}>
          <LayerPreview layer={selectedLayer()} onClick={() => {}} height={140} maxWidth={250} updateInterval={20} />
        </div>
        <div class={layerSelectContainer}>
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
