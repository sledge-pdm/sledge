import { Vec2 } from '@sledge/core';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { Component, createMemo, createSignal, onMount, Show } from 'solid-js';
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

  const [mousePos, setMousePos] = createSignal<Vec2>({ x: 0, y: 0 });
  const [running, start, stop] = createRAF(
    targetFPS(() => {
      setMousePos(interactStore.lastMouseWindow);
    }, 60)
  );

  onMount(() => {
    start();
  });

  return (
    <>
      <Show
        when={toolStore.activeToolCategory === TOOL_CATEGORIES.PIPETTE && !floatingMoveManager.isMoving()}
        fallback={
          <Show when={canShowCursor()}>
            <Show when={globalConfig.editor.cursor === 'pixel'}>
              <PixelCursor mousePos={{ x: mousePos().x, y: mousePos().y }} />;
            </Show>
            <Show when={globalConfig.editor.cursor === 'cross'}>
              <CrossCursor mousePos={{ x: mousePos().x, y: mousePos().y }} />;
            </Show>
          </Show>
        }
      >
        <PipetteCursor mousePos={interactStore.lastMouseWindow} />
        <PipetteDetail />
      </Show>
    </>
  );
};

export default CursorOverlay;
