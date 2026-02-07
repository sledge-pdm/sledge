import { eventBus } from '~/utils/EventBus';

/**
 * Update WebGL canvas and Layer preview(s) according to options.
 * @param options options for update
 */
export function updateFrascoCanvas(context?: string) {
  eventBus.emit('webgl:requestUpdate', {
    context: context ?? 'unknown context',
  });
}
