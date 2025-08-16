import { BaseLayerColorMode } from '~/models/layer/BaseLayer';
import { layerListStore, setLayerListStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import { changeBaseLayerColor } from './BaseLayerManager';

/**
 * ベースレイヤーのカラーモードを変更する
 */
export function setBaseLayerColorMode(colorMode: BaseLayerColorMode, customColor?: string) {
  const updatedBaseLayer = changeBaseLayerColor(layerListStore.baseLayer, colorMode, customColor);
  setLayerListStore('baseLayer', updatedBaseLayer);
  eventBus.emit('webgl:requestUpdate', {
    onlyDirty: false,
    context: `BaseLayer color mode changed to ${colorMode}`,
  });
}

/**
 * ベースレイヤーのカスタムカラーを変更する
 */
export function setBaseLayerCustomColor(customColor: string) {
  const updatedBaseLayer = changeBaseLayerColor(layerListStore.baseLayer, 'custom', customColor);
  setLayerListStore('baseLayer', updatedBaseLayer);
  eventBus.emit('webgl:requestUpdate', {
    onlyDirty: false,
    context: `BaseLayer custom color changed to ${customColor}`,
  });
}
