import { css } from '@acab/ecsstatic';
import { Dropdown } from '@sledge/ui';
import { Component, createSignal, onMount, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import SectionItem from '~/components/section/SectionItem';
import { selectionManager } from '~/features/selection/SelectionAreaManager';
import { isSelectionAvailable } from '~/features/selection/SelectionOperator';
import { SelectionLimitMode } from '~/stores/editor/ToolStore';
import { setToolStore, toolStore } from '~/stores/EditorStores';
import { flexCol } from '~/styles/styles';
import { eventBus, Events } from '~/utils/EventBus';
import { sectionContent } from '../SectionStyles';

const selectionControlContainer = css`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: var(--spacing-md);
  margin-top: var(--spacing-sm);
`;

const iconContainer = css`
  display: flex;
  flex-direction: row;
  width: fit-content;
`;

const modeText = css`
  margin-bottom: 6px;
`;

const pixelatedIcon = css`
  image-rendering: pixelated;
  width: 32px;
  height: 32px;
`;

const Selection: Component = () => {
  const [selectionStatus, setSelectionStatus] = createStore({
    state: selectionManager.getState(),
    status: isSelectionAvailable() ? 'Selected' : 'Not Selected',
    size: { width: selectionManager.getSelectionMask().getWidth(), height: selectionManager.getSelectionMask().getHeight() },
    offset: { x: selectionManager.getAreaOffset().x, y: selectionManager.getAreaOffset().y },
  });

  onMount(() => {
    eventBus.on('selection:stateChanged', (e: Events['selection:stateChanged']) => {
      setSelectionStatus('state', e.newState);
    });
    eventBus.on('selection:maskChanged', (e: Events['selection:maskChanged']) => {
      const bbox = selectionManager.getSelectionMask().getBoundBox();
      if (!bbox) return;
      const { top, left, bottom, right } = bbox;
      const width = right - left;
      const height = bottom - top;
      setSelectionStatus('size', 'width', width);
      setSelectionStatus('size', 'height', height);
    });
    eventBus.on('selection:offsetChanged', (e: Events['selection:offsetChanged']) => {
      setSelectionStatus('offset', 'x', selectionManager.getAreaOffset().x);
      setSelectionStatus('offset', 'y', selectionManager.getAreaOffset().y);
    });
  });

  // ストアから現在のモードを取得し、変更をストアに反映
  const mode = () => toolStore.selectionLimitMode;
  const setMode = (newMode: SelectionLimitMode) => {
    setToolStore('selectionLimitMode', newMode);
  };

  const [isSelected, setIsSelected] = createSignal(isSelectionAvailable());

  onMount(() => {
    setIsSelected(isSelected());
    eventBus.on('selection:stateChanged', () => {
      setIsSelected(isSelected());
    });
  });

  return (
    <Show when={isSelected()}>
      <SectionItem title='selection.'>
        <div class={sectionContent}>
          <div class={selectionControlContainer}>
            <div class={iconContainer}>
              <Show when={mode() === 'outside'}>
                <img src='/icons/tool_bar/config/outside2.png' class={pixelatedIcon} width={16} height={16} />
              </Show>
              <Show when={mode() === 'inside'}>
                <img src='/icons/tool_bar/config/inside2.png' class={pixelatedIcon} width={16} height={16} />
              </Show>
              <Show when={mode() === 'none'}>
                <img src='/icons/tool_bar/config/none.png' class={pixelatedIcon} width={16} height={16} />
              </Show>
            </div>

            <div class={flexCol}>
              <p class={modeText}>Selection Limiting</p>
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
          </div>
        </div>
      </SectionItem>
    </Show>
  );
};

export default Selection;
