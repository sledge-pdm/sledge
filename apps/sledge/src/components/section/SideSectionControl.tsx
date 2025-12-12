import { css } from '@acab/ecsstatic';
import { color } from '@sledge/theme';
import { Slider } from '@sledge/ui';
import { Component, For, Show } from 'solid-js';
import { SectionTab, SectionTabControl } from '~/config/SectionTabConfig';
import { adjustZoomToFit, getMaxZoom, getMinZoom, zoomTowardAreaCenter } from '~/features/canvas';
import { toggleTabContent } from '~/features/config/TabContentController';
import { appearanceStore, interactStore } from '~/stores/EditorStores';

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
  margin-top: auto;
  gap: 8px;
`;

const dangerTabContainer = css`
  display: flex;
  flex-direction: column;
  margin-top: auto;
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
}

const ControlItem: Component<ItemProps> = (props) => {
  const selected = () => appearanceStore[props.side].content === props.control;
  return (
    <div
      class={sideSectionControlItem}
      style={{ 'margin-top': props.control === 'danger' ? 'auto' : undefined, 'margin-bottom': props.control === 'danger' ? '0px' : undefined }}
      onClick={() => {
        toggleTabContent(props.side, props.control);
      }}
    >
      <p
        class={selected() ? sideSectionControlTextActive : sideSectionControlText}
        style={{ color: props.control === 'danger' ? (selected() ? '#FF0000' : '#FF000090') : undefined }}
      >
        {props.control}.
      </p>
    </div>
  );
};

interface Props {
  side: 'leftSide' | 'rightSide';
}
const SideSectionControl: Component<Props> = (props) => {
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
        <For each={appearanceStore[props.side].controls}>{(control) => <ControlItem side={props.side} control={control} />}</For>

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
