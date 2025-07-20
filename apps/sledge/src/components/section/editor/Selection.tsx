import { flexCol, flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Dropdown } from '@sledge/ui';
import { Component, createSignal, onMount, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { selectionManager } from '~/controllers/selection/SelectionManager';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/section/section_item.css';
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

  const [mode, setMode] = createSignal<'outside' | 'inside' | 'all'>('outside');

  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>selection.</p>
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
            <Show when={mode() === 'all'}>
              <img
                src='/icons/tool_bar/config/all.png'
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
                { label: 'Outside', value: 'outside' },
                { label: 'Inside', value: 'inside' },
                { label: 'All', value: 'all' },
              ]}
              value={mode()}
              onChange={(e) => setMode(e as 'outside' | 'inside' | 'all')}
            />
          </div>
        </div>

        <div class={flexRow} style={{ 'flex-wrap': 'wrap', 'row-gap': '2px', 'column-gap': '4px' }}>
          <p> Mode: {mode()}</p>
          <p>{selectionStatus.state}</p>
          <p>{selectionStatus.status}</p>
          <p>
            {selectionStatus.size.width} x {selectionStatus.size.height}
          </p>
          <p>
            Offset: {selectionStatus.offset.x}, {selectionStatus.offset.y}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Selection;
