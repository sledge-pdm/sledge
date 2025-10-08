import { css } from '@acab/ecsstatic';
import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Slider } from '@sledge/ui';
import { Component, For, Show } from 'solid-js';
import { SectionTab } from '~/components/section/SectionTabs';
import { Consts } from '~/Consts';
import { adjustZoomToFit, setOffset, setZoomByReference } from '~/features/canvas';
import { appearanceStore, interactStore, setAppearanceStore } from '~/stores/EditorStores';
import { eventBus } from '~/utils/EventBus';

const sideSectionControlRoot = css`
  display: flex;
  flex-direction: column;
  box-sizing: content-box;
  padding-top: 20px;
  padding-bottom: 16px;
  width: 23px;
  justify-content: start;
  align-items: center;
  background-color: var(--color-background);
`;

const sideSectionControlList = css`
  display: flex;
  flex-direction: column;
  height: 100%;
  align-items: center;
  gap: 24px;
`;

const sideSectionControlItem = css`
  display: flex;
  flex-direction: row;
  justify-content: center;
  transform: rotate(180deg);
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
    >
      <a
        class={selected() ? sideSectionControlTextActive : sideSectionControlText}
        style={{ color: props.tab === 'danger' ? (selected() ? '#FF0000' : '#FF000090') : undefined }}
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
        {props.tab}.
      </a>
    </div>
  );
};

interface Props {
  side: 'leftSide' | 'rightSide';
}
const SideSectionControl: Component<Props> = (props) => {
  const showToggle = () => {
    if (props.side === 'leftSide') {
      return appearanceStore[props.side].shown ? '>' : '<';
    } else {
      return appearanceStore[props.side].shown ? '<' : '>';
    }
  };

  return (
    <div
      id={`side-section-control-${props.side}`}
      class={sideSectionControlRoot}
      style={{
        'padding-left': '4px',
        'padding-right': '4px',

        'border-right': props.side === 'leftSide' && !appearanceStore[props.side].shown ? `1px solid ${vars.color.border}` : 'none',
        'border-left': props.side === 'rightSide' && !appearanceStore[props.side].shown ? `1px solid ${vars.color.border}` : 'none',

        'z-index': Consts.zIndex.sideSection,
      }}
    >
      <div class={sideSectionControlList}>
        <For each={appearanceStore[props.side].tabs}>{(tab, index) => <ControlItem side={props.side} tab={tab} index={index()} />}</For>

        <Show when={props.side === 'rightSide'}>
          <div style={{ height: '150px', display: 'flex', 'flex-direction': 'column', 'align-items': 'center', 'margin-top': 'auto', gap: '8px' }}>
            <p
              style={{
                'writing-mode': 'vertical-lr',
                'vertical-align': 'middle',
                height: '48px',
              }}
            >
              x{interactStore.zoomByReference}
            </p>
            <div class={flexRow} style={{ height: '100%', 'justify-content': 'center' }}>
              <Slider
                orientation='vertical'
                labelMode='none'
                value={interactStore.zoomByReference}
                min={interactStore.zoomMin}
                max={interactStore.zoomMax}
                wheelSpin={true}
                wheelStep={0.1}
                allowFloat={true}
                floatSignificantDigits={Consts.zoomByReferencePrecisionSignificantDigits}
                onChange={(v) => {
                  // 既存ズーム値を基に、可視領域中心へ向かうオフセット補正を行いながら zoomByReference を更新
                  const zoomOld = interactStore.zoom;
                  const zoomChanged = setZoomByReference(v); // interactStore.zoom が更新される
                  const zoomNew = interactStore.zoom;
                  if (!zoomChanged) return;

                  const canvasStack = document.getElementById('canvas-stack');
                  const betweenArea = document.getElementById('sections-between-area');
                  if (!canvasStack || !betweenArea) {
                    eventBus.emit('canvas:onZoomChanged', {});
                    return;
                  }

                  const stackRect = canvasStack.getBoundingClientRect();
                  const areaRect = betweenArea.getBoundingClientRect();

                  // 可視領域中心 (ビューポート中心 in between area)
                  const viewCenterX = areaRect.left + areaRect.width / 2;
                  const viewCenterY = areaRect.top + areaRect.height / 2;

                  // 旧ズームでの view 中心がキャンバス座標でどこだったか
                  const canvasCenterX = (viewCenterX - stackRect.left) / zoomOld;
                  const canvasCenterY = (viewCenterY - stackRect.top) / zoomOld;

                  // 新ズーム適用後も同じキャンバス座標が中心に来るようにオフセット調整
                  // stackRect.left/top は transform 由来で後続再描画まで旧値なので、相対変化のみ計算
                  const dx = canvasCenterX * (zoomOld - zoomNew);
                  const dy = canvasCenterY * (zoomOld - zoomNew);
                  setOffset({
                    x: interactStore.offset.x + dx,
                    y: interactStore.offset.y + dy,
                  });

                  eventBus.emit('canvas:onZoomChanged', {});
                }}
                onDoubleClick={() => {
                  adjustZoomToFit();
                }}
                onPointerDownOnValidArea={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    adjustZoomToFit();
                    return false;
                  }
                  return true;
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
