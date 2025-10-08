import { css } from '@acab/ecsstatic';
import { Component, For, onMount, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import HistoryItemRow from '~/components/section/history/ProjectHistoryItem';
import SectionItem from '~/components/section/SectionItem';
import { sectionContent, sectionSubCaption, sectionSubContent } from '~/components/section/SectionStyles';
import { BaseHistoryAction, projectHistoryController } from '~/features/history';

const historyContentStyle = css`
  gap: 8px;
`;

const redoUndoContentStyle = css`
  flex-direction: column-reverse;
`;

const mutedTextStyle = css`
  color: var(--color-muted);
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
        <div class={`${sectionSubContent} ${redoUndoContentStyle}`}>
          <Show when={historyStore.redoStack.length > 0} fallback={<p class={mutedTextStyle}>&lt; no redo stack &gt;</p>}>
            <For each={historyStore.redoStack}>
              {(action, i) => {
                const index = () => historyStore.redoStack.length - i();
                return <HistoryItemRow undo={false} action={action} index={index} />;
              }}
            </For>
          </Show>
        </div>

        <p class={sectionSubCaption}>{`undo stack (${historyStore.undoStack.length})`}</p>
        <div class={`${sectionSubContent} ${redoUndoContentStyle}`}>
          <Show when={historyStore.undoStack.length > 0} fallback={<p class={mutedTextStyle}>&lt; no undo stack &gt;</p>}>
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
