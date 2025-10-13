import { css } from '@acab/ecsstatic';
import { Vec2 } from '@sledge/core';
import { Icon } from '@sledge/ui';
import { Component, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { PanZoomController } from './PanZoomController';

const root = css`
  position: fixed;
  display: flex;
  flex-direction: column;
  background-color: #000000e0;
  border: 1px solid var(--color-border);
  border-radius: 2px;
  z-index: var(--zindex-floating-controller);
  backdrop-filter: blur(8px);
  user-select: none;
`;
const titlebar = css`
  display: flex;
  flex-direction: row;
  gap: 8px;
  padding: 6px;
  justify-content: end;
  border-bottom: 1px solid var(--color-border-secondary);
`;
const titlebarBackground = css`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
`;

const controlContainer = css`
  display: flex;
  flex-direction: row;
  gap: 12px;
  padding: 12px;
`;
const iconContainer = css`
  cursor: pointer;
  z-index: calc(var(--zindex-floating-controller) + 2);
  padding: 2px;
  opacity: 0.6;
  :hover {
    opacity: 1;
  }
`;
const panContainer = css`
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid white;
  border-radius: 50%;
  width: 48px;
  height: 48px;
`;
const panStick = css`
  position: absolute;
  background-color: white;
  width: 16px;
  height: 16px;
  cursor: pointer;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: opacity 0.2s ease;
`;
const zoomContainer = css`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 20px;
  height: 48px;
  align-items: center;
`;
const zoomBackground = css`
  background-color: white;
  width: 1px;
  height: 100%;
`;
const zoomHandle = css`
  position: absolute;
  background-color: white;
  width: 20px;
  height: 6px;
  transform: translateY(-50%);
  cursor: pointer;
  transition: opacity 0.2s ease;
`;

// floating(movable) canvas pan/zoom controller that imitates analog sticks by 2d pixels
const FloatingController: Component = () => {
  const [position, setPosition] = createSignal<Vec2>({ x: 0, y: 0 });
  const [positionLocked, setPositionLocked] = createSignal(false);
  const [isVisible, setIsVisible] = createSignal(true);

  // Pan stick state (0.5, 0.5 is center)
  const [panStickPosition, setPanStickPosition] = createSignal<Vec2>({ x: 0.5, y: 0.5 });
  // Zoom fader state (0.5 is center)
  const [zoomFaderPosition, setZoomFaderPosition] = createSignal(0.5);

  // Controller instance
  let panZoomController: PanZoomController;

  // Drag states
  const [isDraggingPan, setIsDraggingPan] = createSignal(false);
  const [isDraggingZoom, setIsDraggingZoom] = createSignal(false);
  const [isDraggingWindow, setIsDraggingWindow] = createSignal(false);

  onMount(() => {
    const sectionsBetweenArea = document.getElementById('sections-between-area');
    const areaRect = sectionsBetweenArea?.getBoundingClientRect();
    if (areaRect) {
      const margin = 16;
      setPosition({ x: areaRect.x + margin, y: areaRect.y + margin });
    }

    // Initialize controller
    panZoomController = new PanZoomController();

    // Keyboard shortcut to toggle visibility (F6)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F6') {
        e.preventDefault();
        setIsVisible(!isVisible());
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown);
    });
  });

  onCleanup(() => {
    panZoomController?.dispose();
  });

  // Window dragging handlers
  const handleWindowPointerDown = (e: PointerEvent) => {
    if (positionLocked()) return;
    setIsDraggingWindow(true);

    const windowEl = e.currentTarget as HTMLElement;
    windowEl.setPointerCapture(e.pointerId);

    const startX = e.clientX - position().x;
    const startY = e.clientY - position().y;

    const handleWindowMove = (moveEvent: PointerEvent) => {
      setPosition({
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY,
      });
    };

    const handleWindowUp = () => {
      setIsDraggingWindow(false);
      windowEl.releasePointerCapture(e.pointerId);

      windowEl.removeEventListener('pointermove', handleWindowMove);
      windowEl.removeEventListener('pointerup', handleWindowUp);
    };

    windowEl.addEventListener('pointermove', handleWindowMove);
    windowEl.addEventListener('pointerup', handleWindowUp);
  };

  // Pan stick handlers
  const handlePanPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPan(true);

    const panEl = e.currentTarget as HTMLElement;
    panEl.setPointerCapture(e.pointerId);

    const handlePanMove = (moveEvent: PointerEvent) => {
      const rect = panEl.parentElement!.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const relativeX = (moveEvent.clientX - centerX) / (rect.width / 2);
      const relativeY = (moveEvent.clientY - centerY) / (rect.height / 2);

      // Clamp to circle and convert to 0-1 range
      const distance = Math.sqrt(relativeX * relativeX + relativeY * relativeY);
      const normalizedX = distance > 1 ? relativeX / distance : relativeX;
      const normalizedY = distance > 1 ? relativeY / distance : relativeY;

      const stickX = (normalizedX + 1) * 0.5;
      const stickY = (normalizedY + 1) * 0.5;

      setPanStickPosition({ x: stickX, y: stickY });
      panZoomController.setPanFromNormalized(stickX, stickY);
    };

    const handlePanUp = () => {
      setIsDraggingPan(false);
      panEl.releasePointerCapture(e.pointerId);

      // Return to center
      setPanStickPosition({ x: 0.5, y: 0.5 });
      panZoomController.releasePan();

      panEl.removeEventListener('pointermove', handlePanMove);
      panEl.removeEventListener('pointerup', handlePanUp);
    };

    panEl.addEventListener('pointermove', handlePanMove);
    panEl.addEventListener('pointerup', handlePanUp);
  };

  // Zoom fader handlers
  const handleZoomPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingZoom(true);

    const zoomEl = e.currentTarget as HTMLElement;
    zoomEl.setPointerCapture(e.pointerId);

    const handleZoomMove = (moveEvent: PointerEvent) => {
      const rect = zoomEl.parentElement!.getBoundingClientRect();
      const relativeY = (moveEvent.clientY - rect.top) / rect.height;
      const clampedY = Math.max(0, Math.min(1, relativeY));

      setZoomFaderPosition(clampedY);
      panZoomController.setZoomFromNormalized(1 - clampedY); // Invert Y for intuitive up=zoom in
    };

    const handleZoomUp = () => {
      setIsDraggingZoom(false);
      zoomEl.releasePointerCapture(e.pointerId);

      // Return to center
      setZoomFaderPosition(0.5);
      panZoomController.releaseZoom();

      zoomEl.removeEventListener('pointermove', handleZoomMove);
      zoomEl.removeEventListener('pointerup', handleZoomUp);
    };

    zoomEl.addEventListener('pointermove', handleZoomMove);
    zoomEl.addEventListener('pointerup', handleZoomUp);
  };

  return (
    <Show when={isVisible()}>
      <div
        class={root}
        style={{
          left: `${position().x}px`,
          top: `${position().y}px`,
        }}
      >
        <div class={titlebar}>
          <div
            class={iconContainer}
            onClick={() => {
              setPositionLocked(!positionLocked());
            }}
            title={positionLocked() ? 'Unlock position' : 'Lock position'}
          >
            <Icon src={positionLocked() ? '/icons/misc/lock_closed.png' : '/icons/misc/lock_opened.png'} base={8} />
          </div>
          <div
            class={iconContainer}
            onClick={() => {
              setIsVisible(false);
            }}
            title='Hide controller (Press F6 to show again)'
          >
            <Icon src={'/icons/misc/remove.png'} base={8} />
          </div>

          <div
            title={positionLocked() ? 'Locked (click to unlock)' : 'Draggable (click to lock)'}
            class={titlebarBackground}
            onPointerDown={handleWindowPointerDown}
          />
        </div>
        <div class={controlContainer}>
          {/* パンを操作するスティック */}
          <div class={panContainer} title='Pan Control - Drag to pan canvas'>
            <div
              class={panStick}
              style={{
                left: `${panStickPosition().x * 100}%`,
                top: `${panStickPosition().y * 100}%`,
                opacity: isDraggingPan() ? 1 : 0.8,
              }}
              onPointerDown={handlePanPointerDown}
            ></div>
          </div>
          {/* ズームを操作するフェーダー */}
          <div class={zoomContainer} title='Zoom Control - Up: Zoom in, Down: Zoom out'>
            <div class={zoomBackground}></div>
            <div
              class={zoomHandle}
              style={{
                top: `${zoomFaderPosition() * 100}%`,
                opacity: isDraggingZoom() ? 1 : 0.8,
              }}
              onPointerDown={handleZoomPointerDown}
            ></div>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default FloatingController;
