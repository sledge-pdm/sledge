import { Component, createMemo, Match, Show, Switch } from 'solid-js';
import CrossCursor from '~/components/canvas/overlays/cursors/CrossCursor';
import PipetteCursor from '~/components/canvas/overlays/cursors/PipetteCursor';
import PipetteDetail from '~/components/canvas/overlays/cursors/PipetteDetail';
import PixelCursor from '~/components/canvas/overlays/cursors/PixelCursor';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { getActiveToolCategory, isToolAllowedInCurrentLayer } from '~/features/tools/ToolController';
import { TOOL_CATEGORIES } from '~/features/tools/Tools';
import { interactStore, toolStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';

const CursorOverlay: Component = () => {
  const canShowCursor = createMemo(() => interactStore.isMouseOnCanvas && isToolAllowedInCurrentLayer(getActiveToolCategory()));
  const mousePos = createMemo(() => interactStore.lastMouseWindow);

  return (
    <>
      <Show when={canShowCursor()}>
        <Show
          when={toolStore.activeToolCategory === TOOL_CATEGORIES.PIPETTE && !floatingMoveManager.isMoving()}
          fallback={
            <Switch>
              <Match when={globalConfig.editor.cursor === 'pixel'}>
                <PixelCursor mousePos={{ x: mousePos().x, y: mousePos().y }} />
              </Match>
              <Match when={globalConfig.editor.cursor === 'cross'}>
                <CrossCursor mousePos={{ x: mousePos().x, y: mousePos().y }} />
              </Match>
            </Switch>
          }
        >
          <PipetteCursor mousePos={interactStore.lastMouseWindow} />
          <PipetteDetail mousePos={interactStore.lastMouseWindow} />
        </Show>
      </Show>
    </>
  );
};

export default CursorOverlay;
