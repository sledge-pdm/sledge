import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { Component, For, onMount, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import SectionItem from '~/components/section/SectionItem';
import { BaseHistoryAction } from '~/controllers/history/actions/BaseHistoryAction';
import { LayerBufferHistoryAction } from '~/controllers/history/actions/LayerBufferHistoryAction';
import { projectHistoryController } from '~/controllers/history/ProjectHistoryController';
import { findLayerById } from '~/controllers/layer/LayerListController';
import { sectionContent } from '~/styles/section/section_item.css';

const ProjectHistoryItem: Component = () => {
  const [historyStore, setHistoryStore] = createStore<{
    undoStack: BaseHistoryAction[];
    redoStack: BaseHistoryAction[];
  }>({
    undoStack: projectHistoryController.getUndoStack(),
    redoStack: projectHistoryController.getRedoStack(),
  });

  onMount(() => {
    setHistoryStore((prev) => {
      return {
        undoStack: projectHistoryController.getUndoStack(),
        redoStack: projectHistoryController.getRedoStack(),
      };
    });
    projectHistoryController.onChange((state) => {
      console.log('changed!: ', projectHistoryController.getUndoStack(), projectHistoryController.getRedoStack());
      setHistoryStore((prev) => {
        return {
          undoStack: [...projectHistoryController.getUndoStack()],
          redoStack: [...projectHistoryController.getRedoStack()],
        };
      });
    });
  });

  return (
    <SectionItem title={'project'}>
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

const HistoryRow: Component<{ undo?: boolean; action: BaseHistoryAction }> = ({ undo = true, action }) => {
  let description = '';

  switch (action.type) {
    case 'layer_buffer':
      const lbaction = action as LayerBufferHistoryAction;
      description = `${findLayerById(lbaction.layerId)?.name}/${lbaction.action.diffs.size} diffs`;
      break;
    default:
      description = '<unknown>';
  }

  return (
    <div class={flexRow} style={{ height: 'auto', gap: '8px', 'align-items': 'center' }} title={`${action.label}\n${JSON.stringify(action.context)}`}>
      <div>
        <Icon src={undo ? 'icons/misc/undo.png' : 'icons/misc/redo.png'} color={vars.color.onBackground} base={8} scale={1} />
      </div>
      <p style={{ width: '100px', opacity: 0.75 }}>{action.type}</p>
      <p style={{ width: '100%' }}>{description}</p>
    </div>
  );
};

export default ProjectHistoryItem;
