import { Vec2 } from '@sledge/core';
import { useMousePosition } from '@solid-primitives/mouse';
import { Component, createMemo, Show } from 'solid-js';
import CrossCursor from '~/components/canvas/overlays/cursors/CrossCursor';
import PipetteCursor from '~/components/canvas/overlays/cursors/PipetteCursor';
import PipetteDetail from '~/components/canvas/overlays/cursors/PipetteDetail';
import PixelCursor from '~/components/canvas/overlays/cursors/PixelCursor';
import { getActiveToolCategory, getActiveToolCategoryId, isToolAllowedInCurrentLayer } from '~/features/tools/ToolController';
import { interactStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';

const CursorOverlay: Component = () => {
  const pos = useMousePosition();

  const canShowCursor = createMemo(() => interactStore.isMouseOnCanvas && isToolAllowedInCurrentLayer(getActiveToolCategory()));

  const cursorElement = (pos: Vec2) => {
    if (getActiveToolCategoryId() === 'pipette') {
      return (
        <>
          <PipetteCursor mousePos={{ x: pos.x, y: pos.y }} />
          <PipetteDetail />
        </>
      );
    }
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
      <Show when={canShowCursor()}>{cursorElement(pos)}</Show>
    </>
  );
};

export default CursorOverlay;
