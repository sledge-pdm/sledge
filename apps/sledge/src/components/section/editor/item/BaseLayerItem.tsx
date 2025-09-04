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
        padding: `${vars.spacing.sm} ${vars.spacing.md}`,
        'background-color': vars.color.surface,
        'align-items': 'center',
      }}
    >
      <p
        style={{
          'flex-grow': 1,
          width: '100%',
          'font-size': vars.text.sm,
          color: vars.color.onBackground,
          height: 'fit-content',
          'white-space': 'nowrap',
        }}
      >
        Base Layer
      </p>

      <div class={flexRow}>
        <Dropdown value={baseLayer().colorMode} options={colorModeOptions} onChange={handleColorModeChange} wheelSpin={true} />
      </div>

      {baseLayer().colorMode === 'custom' && (
        <div class={flexRow} style={{ 'margin-left': '8px' }}>
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
            }}
          />
        </div>
      )}
    </div>
  );
};

export default BaseLayerItem;
