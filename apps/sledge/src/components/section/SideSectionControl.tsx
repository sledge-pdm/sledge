import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Slider } from '@sledge/ui';
import { Component, For, Show } from 'solid-js';
import { SectionTab } from '~/components/section/SectionTabs';
import { Consts } from '~/Consts';
import { adjustZoomToFit, setOffset, setZoomByReference } from '~/features/canvas';
import { appearanceStore, interactStore, setAppearanceStore } from '~/stores/EditorStores';
import {
  sideSectionControlItem,
  sideSectionControlList,
  sideSectionControlRoot,
  sideSectionControlText,
  sideSectionControlTextActive,
} from '~/styles/section/side_section_control.css';
import { eventBus } from '~/utils/EventBus';

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
        'padding-left': props.side === 'leftSide' ? '5px' : '3px',
        'padding-right': props.side === 'leftSide' ? '3px' : '5px',

        'border-right': props.side === 'leftSide' && !appearanceStore[props.side].shown ? `1px solid ${vars.color.border}` : 'none',
        'border-left': props.side === 'rightSide' && !appearanceStore[props.side].shown ? `1px solid ${vars.color.border}` : 'none',

        'z-index': Consts.zIndex.sideSection,
      }}
      // onContextMenu={(e) => {
      //   e.preventDefault();
      //   e.stopImmediatePropagation();
      // }}
    >
      {/* <p
        class={sideSectionControlToggle}
        onClick={() => {
          setAppearanceStore(props.side, 'shown', !appearanceStore[props.side].shown);
        }}
      >
        {showToggle()}
      </p> */}

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
