import { useMousePosition } from '@solid-primitives/mouse';
import { Component, createMemo, Show } from 'solid-js';
import CrossCursor from '~/components/canvas/overlays/cursors/CrossCursor';
import PipetteCursor from '~/components/canvas/overlays/cursors/PipetteCursor';
import PixelCursor from '~/components/canvas/overlays/cursors/PixelCursor';
import PipetteDetail from '~/components/canvas/overlays/PipetteDetail';
import { getActiveToolCategory, getActiveToolCategoryId, isToolAllowedInCurrentLayer } from '~/features/tools/ToolController';
import { interactStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';

const CanvasAreaOverlay: Component = () => {
  const pos = useMousePosition();

  const canShowCursor = createMemo(
    () => interactStore.isMouseOnCanvas && !interactStore.isPenOut && isToolAllowedInCurrentLayer(getActiveToolCategory())
  );

  return (
    <>
      <Show when={getActiveToolCategoryId() !== 'pipette'}>
        <Show when={canShowCursor() && globalConfig.editor.cursor === 'pixel'}>
          <PixelCursor mousePos={{ x: pos.x, y: pos.y }} />
        </Show>

        <Show when={canShowCursor() && globalConfig.editor.cursor === 'cross'}>
          <CrossCursor mousePos={{ x: pos.x, y: pos.y }} />
        </Show>
      </Show>

      <Show when={canShowCursor() && getActiveToolCategoryId() === 'pipette'}>
        <PipetteCursor mousePos={{ x: pos.x, y: pos.y }} />
        <PipetteDetail />
      </Show>
    </>
  );
};

export default CanvasAreaOverlay;
