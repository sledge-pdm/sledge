import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { Component, For, onMount, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import SectionItem from '~/components/section/SectionItem';
import { BaseHistoryAction } from '~/controllers/history/actions/BaseHistoryAction';
import { projectHistoryController } from '~/controllers/history/ProjectHistoryController';
import { sectionContent } from '~/styles/section/section_item.css';

const ProjectHistoryItem: Component = () => {
  const [historyStore, setHistoryStore] = createStore({
    history: projectHistoryController.getHistory(),
    redoStack: projectHistoryController.getRedoStack(),
  });

  onMount(() => {
    setHistoryStore((prev) => {
      return {
        history: projectHistoryController.getHistory(),
        redoStack: projectHistoryController.getRedoStack(),
      };
    });
    projectHistoryController.onChange((state) => {
      setHistoryStore((prev) => {
        return {
          history: projectHistoryController.getHistory(),
          redoStack: projectHistoryController.getRedoStack(),
        };
      });
    });
  });

  return (
    <SectionItem title={'project'}>
      <div class={sectionContent} style={{ gap: '4px', 'margin-bottom': '8px', 'flex-direction': 'column-reverse' }}>
        <Show when={historyStore.history.length > 0} fallback={<p style={{ color: vars.color.muted }}>&lt; no undo stack &gt;</p>}>
          <For each={historyStore.history}>{(action, i) => <HistoryRow undo={true} action={action} />}</For>
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
  return (
    <div class={flexRow} style={{ gap: '8px', 'align-items': 'center' }}>
      <Icon src={undo ? 'icons/misc/undo.png' : 'icons/misc/redo.png'} color={vars.color.onBackground} base={8} />
      <p style={{ width: '50px', 'text-align': 'end' }}>{action.label}</p>
    </div>
  );
};

export default ProjectHistoryItem;
