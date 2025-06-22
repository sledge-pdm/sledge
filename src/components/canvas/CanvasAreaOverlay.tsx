import { useMousePosition } from '@solid-primitives/mouse';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { makeTimer } from '@solid-primitives/timer';
import { Component, createSignal, onCleanup, onMount, Show } from 'solid-js';
import CrossCursor from '~/components/canvas/overlays/cursors/CrossCursor';
import PipetteCursor from '~/components/canvas/overlays/cursors/PipetteCursor';
import PixelCursor from '~/components/canvas/overlays/cursors/PixelCursor';
import PipetteDetail from '~/components/canvas/overlays/PipetteDetail';
import SelectionMenu from '~/components/canvas/overlays/SelectionMenu';
import Icon from '~/components/common/Icon';
import { selectionManager } from '~/controllers/selection/SelectionManager';
import { BoundBox } from '~/controllers/selection/SelectionMask';
import { cancelSelection, deletePixelInSelection } from '~/controllers/selection/SelectionOperator';
import { getActiveToolType } from '~/controllers/tool/ToolController';
import { interactStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { vars } from '~/styles/global.css';
import { flexRow } from '~/styles/snippets.css';
import { ToolType } from '~/tools/Tools';
import { eventBus, Events } from '~/utils/EventBus';

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
