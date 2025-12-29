import { css } from '@acab/ecsstatic';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { color, Slider } from '@sledge-pdm/ui';
import { Component, createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { SectionTab, SectionTabControl } from '~/config/SectionTabConfig';
import { adjustZoomToFit, getMaxZoom, getMinZoom, zoomTowardAreaCenter } from '~/features/canvas';
import { toggleTabContent } from '~/features/config/TabContentController';
import { moveTabControl } from '~/features/config/TabControlController';
import { appearanceStore, interactStore } from '~/stores/EditorStores';
import { ensureDropLine, getDropCandidates, getDropIndex, hideDropLine, setDraggingCursor, updateDropLine } from '~/utils/dndUtils';

const controlsRoot = css`
  display: flex;
  flex-direction: column;
  box-sizing: content-box;
  width: 28px;
  justify-content: start;
  align-items: center;
  background-color: var(--color-background);
`;

const controlsList = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  align-items: center;
`;

const reorderArea = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
  position: relative;
  touch-action: none; /* keep pen/scroll from cancelling reorder */
`;

const itemRoot = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  transform: rotate(180deg);
  width: 100%;
  padding-top: 14px;
  padding-bottom: 14px;
  box-sizing: content-box;

  cursor: pointer;

  &:hover {
    background-color: var(--color-surface);
  }
  &:hover > p {
    color: var(--color-accent);
  }
`;

const label = css`
  font-family: ZFB09;
  font-size: 8px;
  white-space: nowrap;
  writing-mode: vertical-lr;
  color: var(--color-on-background);
  opacity: 0.5;
`;

const labelActive = css`
  font-family: ZFB09;
  font-size: 8px;
  white-space: nowrap;
  writing-mode: vertical-lr;
  color: var(--color-accent);
  opacity: 1;
`;

const zoomContainer = css`
  height: 170px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const dangerTabContainer = css`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const zoomLabelContainer = css`
  writing-mode: vertical-lr;
  vertical-align: middle;
  white-space: nowrap;
  height: 72px;
`;

const zoomSliderContainer = css`
  display: flex;
  flex-direction: row;
  height: 100%;
  justify-content: center;
  margin-bottom: 12px;
`;

interface ItemProps {
  side: 'leftSide' | 'rightSide';
  control: SectionTabControl | SectionTab; // accept non-control content for individual controls (e.g, "danger")
  draggable?: boolean;
}

const ControlItem: Component<ItemProps> = (props) => {
  const { side, control } = props;
  let itemEl: HTMLDivElement | undefined;
  const [isDragging, setIsDragging] = createSignal(false);

  const selected = () => appearanceStore[side].content === control;

  onMount(() => {
    if (!props.draggable || !itemEl) return;
    const cleanup = draggable({
      element: itemEl,
      getInitialData: () => ({ type: 'section-control', id: control, fromSide: side }),
      onDragStart: () => {
        setIsDragging(true);
        setDraggingCursor(true);
      },
      onDrop: () => {
        setIsDragging(false);
        setDraggingCursor(false);
      },
    });
    onCleanup(() => cleanup());
  });

  return (
    <div
      class={itemRoot}
      ref={(el) => (itemEl = el)}
      data-control-id={props.draggable ? String(control) : undefined}
      style={{ 'margin-top': control === 'danger' ? 'auto' : undefined, 'margin-bottom': control === 'danger' ? '0px' : undefined }}
      onClick={() => {
        if (props.draggable && isDragging()) return;
        toggleTabContent(side, control);
      }}
    >
      <p class={selected() ? labelActive : label} style={{ color: control === 'danger' ? (selected() ? '#FF0000' : '#FF000090') : undefined }}>
        {control}.
      </p>
    </div>
  );
};

interface Props {
  side: 'leftSide' | 'rightSide';
}

const isControlVisible = (side: 'leftSide' | 'rightSide', control: SectionTabControl) =>
  appearanceStore[side].controlsVisibility?.[control] !== false;

const visibleControlsBySide = (side: 'leftSide' | 'rightSide') => appearanceStore[side].controls.filter((control) => isControlVisible(side, control));

const SideSectionControls: Component<Props> = (props) => {
  let listEl: HTMLDivElement | undefined;
  let dropLineEl: HTMLDivElement | null = null;

  const getCandidates = (containerEl: HTMLElement, sourceId: SectionTabControl) =>
    getDropCandidates(containerEl, '[data-control-id]', String(sourceId), (el) => el.dataset.controlId);

  onMount(() => {
    if (!listEl) return;
    const cleanup = dropTargetForElements({
      element: listEl,
      canDrop: ({ source }) => {
        const data = source.data as { type?: string };
        return data?.type === 'section-control';
      },
      onDrop: ({ source, location }) => {
        const data = source.data as { type?: string; id?: SectionTabControl; fromSide?: 'leftSide' | 'rightSide' };
        if (data?.type !== 'section-control' || !data.id || !data.fromSide || !listEl) return;

        const fromSide = data.fromSide;
        const toSide = props.side;
        const visibleFrom = visibleControlsBySide(fromSide);
        const fromIndex = visibleFrom.indexOf(data.id);
        if (fromIndex < 0) return;

        const candidates = getCandidates(listEl, data.id);
        const toIndex = getDropIndex(candidates, location.current.input.clientY);
        if (fromSide === toSide && toIndex === fromIndex) return;

        const nextTargetTabs = toSide === fromSide ? appearanceStore[toSide].controls.filter((c) => c !== data.id) : appearanceStore[toSide].controls;
        const visibleTarget = nextTargetTabs.filter((control) => isControlVisible(toSide, control));
        const targetIndex = toIndex >= visibleTarget.length ? nextTargetTabs.length : Math.max(0, nextTargetTabs.indexOf(visibleTarget[toIndex]));

        moveTabControl(data.id, toSide, targetIndex);
        hideDropLine(dropLineEl);
      },
      onDrag: ({ source, location }) => {
        const data = source.data as { type?: string; id?: SectionTabControl; fromSide?: 'leftSide' | 'rightSide' };
        if (data?.type !== 'section-control' || !data.id || !data.fromSide || !listEl) return;
        const candidates = getCandidates(listEl, data.id);
        const toIndex = getDropIndex(candidates, location.current.input.clientY);
        const visibleFrom = visibleControlsBySide(data.fromSide);
        const fromIndex = visibleFrom.indexOf(data.id);
        if (data.fromSide === props.side && toIndex === fromIndex) {
          hideDropLine(dropLineEl);
          return;
        }

        dropLineEl = ensureDropLine(listEl, dropLineEl);
        updateDropLine(dropLineEl, listEl, candidates, toIndex, 1);
      },
      onDragLeave: () => {
        hideDropLine(dropLineEl);
      },
    });

    onCleanup(() => cleanup());
  });

  return (
    <div
      id={`side-section-control-${props.side}`}
      class={controlsRoot}
      style={{
        'border-right': props.side === 'leftSide' && !appearanceStore[props.side].content ? `1px solid ${color.border}` : 'none',
        'border-left': props.side === 'rightSide' && !appearanceStore[props.side].content ? `1px solid ${color.border}` : 'none',

        'z-index': 'var(--zindex-side-section)',
      }}
    >
      <div class={controlsList}>
        <div class={reorderArea} ref={(el) => (listEl = el)}>
          <For each={visibleControlsBySide(props.side)}>{(control) => <ControlItem side={props.side} control={control} draggable={true} />}</For>
        </div>

        <Show when={props.side === 'leftSide'}>
          <div class={dangerTabContainer}>
            <ControlItem control='danger' side='leftSide' />
          </div>
        </Show>
        <Show when={props.side === 'rightSide'}>
          <div class={zoomContainer}>
            <p class={zoomLabelContainer}>x {(interactStore.zoom / interactStore.initialZoom).toFixed(2)}</p>
            <div class={zoomSliderContainer}>
              <Slider
                orientation='vertical'
                labelMode='none'
                value={interactStore.zoom}
                min={getMinZoom()}
                max={getMaxZoom()}
                wheelSpin={true}
                wheelStep={0.1}
                allowFloat={true}
                dblClickResetValue={interactStore.initialZoom}
                onChange={(v) => {
                  // centeringCanvas();
                  zoomTowardAreaCenter(v);
                }}
                onDoubleClick={() => {
                  adjustZoomToFit();
                }}
              />
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default SideSectionControls;
