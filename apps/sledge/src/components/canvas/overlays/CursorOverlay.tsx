import { Vec2 } from '@sledge/core';
import { Component, createMemo, Show } from 'solid-js';
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

  const cursorElement = (pos: Vec2) => {
    switch (globalConfig.editor.cursor) {
      case 'pixel':
        return <PixelCursor mousePos={{ x: pos.x, y: pos.y }} />;
      case 'cross':
        return <CrossCursor mousePos={{ x: pos.x, y: pos.y }} />;
    }

    return <CrossCursor mousePos={{ x: pos.x, y: pos.y }} />;
  };

  return (
    <>
      <Show when={canShowCursor()}>{cursorElement(interactStore.lastMouseWindow)}</Show>

      <Show when={toolStore.activeToolCategory === TOOL_CATEGORIES.PIPETTE && !floatingMoveManager.isMoving()}>
        <PipetteCursor mousePos={interactStore.lastMouseWindow} />
        <PipetteDetail />
      </Show>
    </>
  );
};

export default CursorOverlay;
