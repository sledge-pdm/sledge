import { allLayers } from '~/features/layer';
import { eventBus } from '~/utils/EventBus';

/**
 * Update WebGL canvas and Layer preview(s) according to options.
 * @param options options for update
 */
export function updateWebGLCanvas(onlyDirty: boolean, context?: string) {
  eventBus.emit('webgl:requestUpdate', {
    context: context ?? 'unknown context',
    onlyDirty,
  });
}

/**
 * Update layers' previews.
 */
export function updateLayerPreview(layerId?: string) {
  if (!layerId) return updateLayerPreviewAll();

  eventBus.emit('preview:requestUpdate', {
    layerId,
  });
}

/**
 * Update all layer's previews.
 */
export function updateLayerPreviewAll() {
  allLayers().forEach((layer) => {
    eventBus.emit('preview:requestUpdate', {
      layerId: layer.id,
    });
  });
}
