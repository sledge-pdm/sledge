import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { Component, For, onMount, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import SectionItem from '~/components/section/SectionItem';
import { getAgentOf } from '~/controllers/layer/LayerAgentManager';
import { DiffAction, DiffKind } from '~/controllers/layer/image/managers/HistoryManager';
import { Layer } from '~/models/layer/Layer';
import { sectionContent } from '~/styles/section/section_item.css';
import { eventBus, Events } from '~/utils/EventBus';

interface Props {
  layer: Layer;
}

const HistoryItem: Component<Props> = ({ layer }) => {
  const agent = getAgentOf(layer.id);
  if (!agent) return null;

  const [historyStore, setHistoryStore] = createStore({
    undoStack: agent.getHistoryManager().getUndoStack(),
    redoStack: agent.getHistoryManager().getRedoStack(),
  });

  onMount(() => {
    setHistoryStore('redoStack', [...agent.getHistoryManager().getRedoStack()]);
    setHistoryStore('undoStack', [...agent.getHistoryManager().getUndoStack()]);
    eventBus.on('layerHistory:changed', (e: Events['layerHistory:changed']) => {
      setHistoryStore('redoStack', [...agent.getHistoryManager().getRedoStack()]);
      setHistoryStore('undoStack', [...agent.getHistoryManager().getUndoStack()]);
    });
  });

  return (
    <SectionItem title={layer.name}>
      <div class={sectionContent} style={{ gap: '4px', 'margin-bottom': '8px', 'flex-direction': 'column-reverse' }}>
        <Show when={historyStore.undoStack.length > 0} fallback={<p style={{ color: vars.color.muted }}>&lt; no undo stack &gt;</p>}>
          <For each={historyStore.undoStack}>{(action, i) => <HistoryRow undo={true} action={action} />}</For>
        </Show>

        <div class={flexRow} style={{ gap: '8px', 'align-items': 'center' }}>
          <p style={{ color: vars.color.active }}>---present---</p>
        </div>

        <Show when={historyStore.redoStack.length > 0} fallback={<p style={{ color: vars.color.muted }}>&lt; no redo stack &gt;</p>}>
          <For each={historyStore.redoStack}>{(action, i) => <HistoryRow undo={false} action={action} />}</For>
        </Show>
      </div>
    </SectionItem>
  );
};

const HistoryRow: Component<{ undo?: boolean; action: DiffAction }> = ({ undo = true, action }) => {
  const diffs = action.diffs.values().toArray();
  const counts = diffs.reduce<Record<DiffKind, number>>(
    (acc, curr) => {
      acc[curr.kind] = (acc[curr.kind] || 0) + 1;
      return acc;
    },
    {
      pixel: 0,
      tile: 0,
      whole: 0,
    }
  );
  return (
    <div class={flexRow} style={{ gap: '8px', 'align-items': 'center' }}>
      <Icon src={undo ? 'icons/misc/undo.png' : 'icons/misc/redo.png'} color={vars.color.onBackground} base={8} />
      <Show when={counts['pixel'] > 0}>
        <p style={{ width: '50px', 'text-align': 'end' }}>{counts['pixel']} px</p>
      </Show>
      <Show when={counts['tile'] > 0}>
        <p style={{ width: '50px', 'text-align': 'end' }}>{counts['tile']} tiles</p>
      </Show>
      <Show when={counts['whole'] > 0}>
        <p style={{ width: '50px', 'text-align': 'end' }}>{counts['whole']} whole</p>
      </Show>
    </div>
  );
};

export default HistoryItem;
