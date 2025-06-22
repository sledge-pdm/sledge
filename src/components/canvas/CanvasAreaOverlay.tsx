import { useMousePosition } from '@solid-primitives/mouse';
import { Component, Show } from 'solid-js';
import CrossCursor from '~/components/canvas/overlays/cursors/CrossCursor';
import PipetteCursor from '~/components/canvas/overlays/cursors/PipetteCursor';
import PixelCursor from '~/components/canvas/overlays/cursors/PixelCursor';
import PipetteDetail from '~/components/canvas/overlays/PipetteDetail';
import SelectionMenu from '~/components/canvas/overlays/SelectionMenu';
import { getActiveToolType } from '~/controllers/tool/ToolController';
import { interactStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { ToolType } from '~/tools/Tools';

const CanvasAreaOverlay: Component<{}> = (props) => {
  const pos = useMousePosition();

  return (
    <>
      <Show when={getActiveToolType() !== ToolType.Pipette}>
        <Show when={interactStore.isMouseOnCanvas && globalConfig.editor.cursor === 'pixel'}>
          <PixelCursor mousePos={{ x: pos.x, y: pos.y }} />
        </Show>

        <Show when={interactStore.isMouseOnCanvas && globalConfig.editor.cursor === 'cross'}>
          <CrossCursor mousePos={{ x: pos.x, y: pos.y }} />
        </Show>
      </Show>

      <Show when={interactStore.isMouseOnCanvas && getActiveToolType() === ToolType.Pipette}>
        <PipetteCursor mousePos={{ x: pos.x, y: pos.y }} />
        <PipetteDetail />
      </Show>

      <SelectionMenu />
    </>
  );
};

export default CanvasAreaOverlay;
