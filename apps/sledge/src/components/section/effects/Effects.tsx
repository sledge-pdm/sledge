import { css } from '@acab/ecsstatic';
import { Dropdown, DropdownOption } from '@sledge/ui';
import { Accessor, Component, createMemo, createSignal } from 'solid-js';
import LayerPreview from '~/components/global/LayerPreview';
import BrightnessContrast from '~/components/section/effects/effects/BrightnessContrast';
import GaussianBlur from '~/components/section/effects/effects/GaussianBlur';
import GrayScale from '~/components/section/effects/effects/GrayScale';
import Invert from '~/components/section/effects/effects/Invert';
import { activeLayer, findLayerById } from '~/features/layer';
import { layerListStore } from '~/stores/ProjectStores';

const effectsContainer = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: auto;
  gap: 8px;
`;

const previewContainer = css`
  display: flex;
  flex-direction: column;
  align-self: center;
  width: fit-content;
  height: fit-content;
  margin-bottom: 12px;
`;

const layerSelectContainer = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  margin-left: 16px;
  margin-bottom: 16px;
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
          <LayerPreview
            layer={selectedLayer()}
            onClick={() => {}}
            withBorder
            sizingMode='width-based'
            referenceSize={250}
            maxHeight={200}
            fitMode='contain'
            updateInterval={20}
          />
        </div>
        <div class={layerSelectContainer}>
          <p>apply to</p>
          <Dropdown options={layersOption()} value={selectedLayerId()} onChange={(v) => setSelectedLayerId(v)} />
        </div>
      </div>

      <Invert selectedLayerId={selectedLayerId} />
      <GrayScale selectedLayerId={selectedLayerId} />
      <GaussianBlur selectedLayerId={selectedLayerId} />
      <BrightnessContrast selectedLayerId={selectedLayerId} />
    </>
  );
};

export default Effects;
