import { css } from '@acab/ecsstatic';
import { Nothing } from '@sledge-pdm/ui';
import { Component, For, onMount, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import HistoryItemRow from '~/components/section/history/ProjectHistoryItem';
import SectionItem from '~/components/section/SectionItem';
import { sectionContent, sectionSubCaption, sectionSubContent } from '~/components/section/SectionStyles';
import { BaseHistoryAction, projectHistoryController } from '~/features/history';

const historyContentStyle = css`
  margin-top: 8px;
  gap: 8px;
`;

const redoContentStyle = css`
  flex-direction: column;
  padding: 0;
`;

const undoContentStyle = css`
  flex-direction: column-reverse;
  padding: 0;
`;

const History: Component = () => {
  const [historyStore, setHistoryStore] = createStore<{
    undoStack: BaseHistoryAction[];
    redoStack: BaseHistoryAction[];
  }>({
    undoStack: projectHistoryController.getUndoStack(),
    redoStack: projectHistoryController.getRedoStack(),
  });

  onMount(() => {
    const dispose = projectHistoryController.onChange(() => {
      setHistoryStore({ undoStack: [...projectHistoryController.getUndoStack()], redoStack: [...projectHistoryController.getRedoStack()] });
    });

    return () => dispose();
  });

  return (
    <SectionItem title={`history`}>
      <div class={`${sectionContent} ${historyContentStyle}`}>
        {/* <div class={flexRow} style={{ gap: '8px', 'align-items': 'center' }}>
          <p style={{ color: var(--color-active) }}>top = recent / bottom = oldest</p>
        </div> */}

        <p class={sectionSubCaption}>redo stack ({historyStore.redoStack.length})</p>
        <div class={`${sectionSubContent} ${redoContentStyle}`}>
          <Show when={historyStore.redoStack.length > 0} fallback={<Nothing>no redo stack.</Nothing>}>
            <For each={historyStore.redoStack}>
              {(action, i) => {
                const index = () => historyStore.redoStack.length - i();
                return <HistoryItemRow undo={false} action={action} index={index} />;
              }}
            </For>
          </Show>
        </div>

        <p class={sectionSubCaption}>{`undo stack (${historyStore.undoStack.length})`}</p>
        <div class={`${sectionSubContent} ${undoContentStyle}`}>
          <Show when={historyStore.undoStack.length > 0} fallback={<Nothing>no undo stack.</Nothing>}>
            <For each={historyStore.undoStack}>
              {(action, i) => {
                const index = () => i() + 1;
                return <HistoryItemRow undo={true} action={action} index={index} />;
              }}
            </For>
          </Show>
        </div>
      </div>
    </SectionItem>
  );
};

export default History;
