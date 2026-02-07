import { Component, createMemo, Match, Show, Switch } from 'solid-js';
import CrossCursor from '~/components/canvas/hud/cursors/CrossCursor';
import PipetteCursor from '~/components/canvas/hud/cursors/PipetteCursor';
import PipetteDetail from '~/components/canvas/hud/cursors/PipetteDetail';
import PixelCursor from '~/components/canvas/hud/cursors/PixelCursor';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { getActiveToolCategory, isToolAllowedInCurrentLayer } from '~/features/tools/ToolController';
import { TOOL_CATEGORIES } from '~/features/tools/Tools';
import { interactStore, toolStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';

const Cursor: Component = () => {
  const canShowCursor = createMemo(() => interactStore.isPointerOnStrokeDetectArea && isToolAllowedInCurrentLayer(getActiveToolCategory()));
  const mousePos = createMemo(() => interactStore.lastPointerWindow);

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
          <PipetteCursor mousePos={interactStore.lastPointerWindow} />
          <PipetteDetail mousePos={interactStore.lastPointerWindow} />
        </Show>
      </Show>
    </>
  );
};

export default Cursor;
