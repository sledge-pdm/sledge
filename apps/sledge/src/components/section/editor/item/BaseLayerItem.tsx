import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { ColorBox, Dropdown } from '@sledge/ui';
import { Component, createSignal } from 'solid-js';
import { setBaseLayerColorMode, setBaseLayerCustomColor } from '~/controllers/layer/BaseLayerController';
import { BaseLayerColorMode } from '~/models/layer/BaseLayer';
import { layerListStore } from '~/stores/ProjectStores';

interface BaseLayerItemProps {}

const colorModeOptions = [
  { value: 'transparent' as BaseLayerColorMode, label: 'Transparent' },
  { value: 'white' as BaseLayerColorMode, label: 'White' },
  { value: 'black' as BaseLayerColorMode, label: 'Black' },
  { value: 'custom' as BaseLayerColorMode, label: 'Custom' },
];

const BaseLayerItem: Component<BaseLayerItemProps> = () => {
  let colorInput: HTMLInputElement | undefined;
  const baseLayer = () => layerListStore.baseLayer;
  const [customColor, setCustomColor] = createSignal(baseLayer().customColor || '#FFFFFF');

  const handleColorModeChange = (newMode: BaseLayerColorMode) => {
    if (newMode === 'custom') {
      setBaseLayerColorMode(newMode, customColor());
    } else {
      setBaseLayerColorMode(newMode);
    }
  };

  const handleCustomColorInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const color = target.value;
    setCustomColor(color);
    setBaseLayerCustomColor(color);
  };

  return (
    <div
      class={flexRow}
      style={{
        padding: vars.spacing.sm,
        'background-color': vars.color.surface,
        'align-items': 'center',
        gap: vars.spacing.sm,
      }}
    >
      <p style={{ 'font-size': vars.text.sm, color: vars.color.onBackground, height: 'fit-content' }}>Base Layer</p>

      <div class={flexRow} style={{ width: '100px', 'align-items': 'center' }}>
        <Dropdown value={baseLayer().colorMode} options={colorModeOptions} onChange={handleColorModeChange} />
      </div>

      {baseLayer().colorMode === 'custom' && (
        <>
          <ColorBox color={customColor()} currentColor={undefined} onClick={() => colorInput?.click()} sizePx={14} />
          <input
            ref={(ref) => (colorInput = ref)}
            type='color'
            value={customColor()}
            onChange={handleCustomColorInputChange}
            style={{
              visibility: 'collapse',
              width: '0px',
              height: '0px',
              border: 'none',
              cursor: 'pointer',
              'margin-left': '16px',
            }}
          />
        </>
      )}
    </div>
  );
};

export default BaseLayerItem;
