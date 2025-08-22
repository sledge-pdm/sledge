import { flexCol, flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Dropdown } from '@sledge/ui';
import { Component, createSignal, onMount, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import SectionItem from '~/components/section/SectionItem';
import { selectionManager } from '~/controllers/selection/SelectionManager';
import { SelectionFillMode, SelectionLimitMode, setToolStore, toolStore } from '~/stores/EditorStores';
import { sectionContent } from '~/styles/section/section_item.css';
import { eventBus, Events } from '~/utils/EventBus';

const Selection: Component = () => {
  const [selectionStatus, setSelectionStatus] = createStore({
    state: selectionManager.getState(),
    status: selectionManager.isSelected() ? 'Selected' : 'Not Selected',
    size: { width: selectionManager.getSelectionMask().getWidth(), height: selectionManager.getSelectionMask().getHeight() },
    offset: { x: selectionManager.getMoveOffset().x, y: selectionManager.getMoveOffset().y },
  });

  onMount(() => {
    eventBus.on('selection:stateChanged', (e: Events['selection:stateChanged']) => {
      setSelectionStatus('state', e.newState);
    });
    eventBus.on('selection:areaChanged', (e: Events['selection:areaChanged']) => {
      const bbox = selectionManager.getSelectionMask().getBoundBox();
      if (!bbox) return;
      const { top, left, bottom, right } = bbox;
      const width = right - left;
      const height = bottom - top;
      setSelectionStatus('size', 'width', width);
      setSelectionStatus('size', 'height', height);
    });
    eventBus.on('selection:moved', (e: Events['selection:moved']) => {
      setSelectionStatus('offset', 'x', selectionManager.getMoveOffset().x);
      setSelectionStatus('offset', 'y', selectionManager.getMoveOffset().y);
    });
  });

  // ストアから現在のモードを取得し、変更をストアに反映
  const mode = () => toolStore.selectionLimitMode;
  const setMode = (newMode: SelectionLimitMode) => {
    setToolStore('selectionLimitMode', newMode);
  };

  const fillMode = () => toolStore.selectionFillMode;
  const setFillMode = (newMode: SelectionFillMode) => {
    setToolStore('selectionFillMode', newMode);
  };

  const [isSelected, setIsSelected] = createSignal(selectionManager.isSelected());

  onMount(() => {
    setIsSelected(selectionManager.isSelected());
    eventBus.on('selection:stateChanged', () => {
      setIsSelected(selectionManager.isSelected());
    });
  });

  return (
    <Show when={isSelected()}>
      <SectionItem title='selection.'>
        <div class={sectionContent}>
          <div class={flexRow} style={{ 'flex-wrap': 'wrap', gap: '12px', 'margin-bottom': vars.spacing.md, 'margin-top': vars.spacing.sm }}>
            <div
              class={flexRow}
              style={{
                width: 'fit-content',
              }}
            >
              <Show when={mode() === 'outside'}>
                <img
                  src='/icons/tool_bar/config/outside2.png'
                  style={{ 'image-rendering': 'pixelated', width: '32px', height: '32px' }}
                  width={16}
                  height={16}
                />
              </Show>
              <Show when={mode() === 'inside'}>
                <img
                  src='/icons/tool_bar/config/inside2.png'
                  style={{ 'image-rendering': 'pixelated', width: '32px', height: '32px' }}
                  width={16}
                  height={16}
                />
              </Show>
              <Show when={mode() === 'none'}>
                <img
                  src='/icons/tool_bar/config/none.png'
                  style={{ 'image-rendering': 'pixelated', width: '32px', height: '32px ' }}
                  width={16}
                  height={16}
                />
              </Show>
            </div>

            <div class={flexCol}>
              <p style={{ 'margin-bottom': '6px' }}>Selection Limiting</p>
              <Dropdown
                options={[
                  { label: 'Inside', value: 'inside' },
                  { label: 'None', value: 'none' },
                  { label: 'Outside', value: 'outside' },
                ]}
                value={mode()}
                onChange={(e) => setMode(e as SelectionLimitMode)}
              />
            </div>

            <Show when={mode() !== 'none' && toolStore.activeToolCategory === 'fill'}>
              <div class={flexCol}>
                <p style={{ 'margin-bottom': '6px' }}>Fill Mode</p>
                <Dropdown
                  options={[
                    { label: 'Global (with islands)', value: 'global' },
                    { label: 'Boundary (strict)', value: 'boundary' },
                    { label: 'Area Fill (entire selection)', value: 'area' },
                  ]}
                  value={fillMode()}
                  onChange={(e) => setFillMode(e as SelectionFillMode)}
                />
              </div>
            </Show>
          </div>

          {/* <div class={flexRow} style={{ 'flex-wrap': 'wrap', 'row-gap': '2px' }}>
            <p>
              {mode()}
              &nbsp;/&nbsp;
            </p>
            <p>
              {selectionStatus.state}
              &nbsp;/&nbsp;
            </p>
            <p>
              {selectionStatus.status}
              &nbsp;/&nbsp;
            </p>
            <p>
              {selectionStatus.size.width} x {selectionStatus.size.height}
              &nbsp;/&nbsp;
            </p>
            <p>
              Offset: {selectionStatus.offset.x}, {selectionStatus.offset.y}
            </p>
          </div> */}
        </div>
      </SectionItem>
    </Show>
  );
};

export default Selection;
