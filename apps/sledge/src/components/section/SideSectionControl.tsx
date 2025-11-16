import { css } from '@acab/ecsstatic';
import { color } from '@sledge/theme';
import { Slider } from '@sledge/ui';
import { Component, For, Show } from 'solid-js';
import { SectionTab } from '~/components/section/SectionTabs';
import { adjustZoomToFit, getMaxZoom, getMinZoom, zoomTowardAreaCenter } from '~/features/canvas';
import { appearanceStore, interactStore, setAppearanceStore } from '~/stores/EditorStores';

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
  tab: SectionTab;
  index: number;
}

const ControlItem: Component<ItemProps> = (props) => {
  const selected = () => appearanceStore[props.side].selectedIndex === props.index && appearanceStore[props.side].shown;
  return (
    <div
      class={sideSectionControlItem}
      style={{ 'margin-top': props.tab === 'danger' ? 'auto' : undefined, 'margin-bottom': props.tab === 'danger' ? '0px' : undefined }}
      onClick={() => {
        if (!appearanceStore[props.side].shown) {
          setAppearanceStore(props.side, 'shown', true);
        } else {
          if (selected()) {
            setAppearanceStore(props.side, 'shown', !appearanceStore[props.side].shown);
          } else {
            setAppearanceStore(props.side, 'shown', true);
          }
        }
        setAppearanceStore(props.side, 'selectedIndex', props.index);
      }}
    >
      <p
        class={selected() ? sideSectionControlTextActive : sideSectionControlText}
        style={{ color: props.tab === 'danger' ? (selected() ? '#FF0000' : '#FF000090') : undefined }}
      >
        {props.tab}.
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
        'border-right': props.side === 'leftSide' && !appearanceStore[props.side].shown ? `1px solid ${color.border}` : 'none',
        'border-left': props.side === 'rightSide' && !appearanceStore[props.side].shown ? `1px solid ${color.border}` : 'none',

        'z-index': 'var(--zindex-side-section)',
      }}
    >
      <div class={sideSectionControlList}>
        <For each={appearanceStore[props.side].tabs}>{(tab, index) => <ControlItem side={props.side} tab={tab} index={index()} />}</For>

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
