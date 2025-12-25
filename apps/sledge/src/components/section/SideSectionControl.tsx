import { css } from '@acab/ecsstatic';
import { color } from '@sledge/theme';
import { Slider } from '@sledge/ui';
import { Component, For, Show } from 'solid-js';
import { SectionTab, SectionTabControl } from '~/config/SectionTabConfig';
import { adjustZoomToFit, getMaxZoom, getMinZoom, zoomTowardAreaCenter } from '~/features/canvas';
import { toggleTabContent } from '~/features/config/TabContentController';
import { moveTabControl } from '~/features/config/TabControlController';
import { appearanceStore, interactStore } from '~/stores/EditorStores';
import { useReorder } from '~/utils/useReorder';

const sideSectionControlRoot = css`
  display: flex;
  flex-direction: column;
  box-sizing: content-box;
  width: 28px;
  justify-content: start;
  align-items: center;
  background-color: var(--color-background);
`;

const sideSectionControlList = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  align-items: center;
`;

const sideSectionControlReorderArea = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
  position: relative;
  touch-action: none; /* keep pen/scroll from cancelling reorder */
`;

const sideSectionControlItem = css`
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

const sideSectionControlText = css`
  font-family: ZFB09;
  font-size: 8px;
  white-space: nowrap;
  writing-mode: vertical-lr;
  color: var(--color-on-background);
  opacity: 0.5;
`;

const sideSectionControlTextActive = css`
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
  shouldSuppressClick?: () => boolean;
  // dnd props
  ref?: (el: HTMLDivElement) => void;
  onPointerDown?: (e: PointerEvent) => void;
}

const ControlItem: Component<ItemProps> = (props) => {
  const { ref, side, control, shouldSuppressClick, onPointerDown } = props;

  const selected = () => appearanceStore[side].content === control;

  return (
    <div
      class={sideSectionControlItem}
      ref={(el) => ref?.(el)}
      style={{ 'margin-top': control === 'danger' ? 'auto' : undefined, 'margin-bottom': control === 'danger' ? '0px' : undefined }}
      onClick={() => {
        if (shouldSuppressClick?.()) return;
        toggleTabContent(side, control);
      }}
      onPointerDown={onPointerDown}
    >
      <p
        class={selected() ? sideSectionControlTextActive : sideSectionControlText}
        style={{ color: control === 'danger' ? (selected() ? '#FF0000' : '#FF000090') : undefined }}
      >
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

const SideSectionControl: Component<Props> = (props) => {
  const dnd = useReorder<'leftSide' | 'rightSide', SectionTabControl>({
    getItems: (side) => visibleControlsBySide(side),
    onDrop: ({ id, fromContainer, toContainer, fromIndex, toIndex }) => {
      const adjustedVisibleTo = fromContainer === toContainer && toIndex > fromIndex ? toIndex - 1 : toIndex;

      const nextTargetTabs =
        toContainer === fromContainer ? appearanceStore[toContainer].controls.filter((c) => c !== id) : appearanceStore[toContainer].controls;
      const visibleTarget = nextTargetTabs.filter((control) => isControlVisible(toContainer, control));
      const targetIndex =
        adjustedVisibleTo >= visibleTarget.length ? nextTargetTabs.length : Math.max(0, nextTargetTabs.indexOf(visibleTarget[adjustedVisibleTo]));

      moveTabControl(id, toContainer, targetIndex);
    },
  });

  return (
    <div
      id={`side-section-control-${props.side}`}
      class={sideSectionControlRoot}
      style={{
        'border-right': props.side === 'leftSide' && !appearanceStore[props.side].content ? `1px solid ${color.border}` : 'none',
        'border-left': props.side === 'rightSide' && !appearanceStore[props.side].content ? `1px solid ${color.border}` : 'none',

        'z-index': 'var(--zindex-side-section)',
      }}
    >
      <div class={sideSectionControlList}>
        <div class={sideSectionControlReorderArea} ref={(el) => dnd.registerContainer(props.side, el)}>
          <For each={visibleControlsBySide(props.side)}>
            {(control) => (
              <ControlItem
                ref={(el) => dnd.registerItem(props.side, el, control)}
                onPointerDown={(e) => dnd.onPointerDown(e, props.side, control)}
                side={props.side}
                control={control}
                shouldSuppressClick={dnd.shouldSuppressClick}
              />
            )}
          </For>
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

export default SideSectionControl;
