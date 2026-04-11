import { css } from '@acab/ecsstatic';
import { Show, lazy } from 'solid-js';
import { interactStore, setInteractStore } from '~/stores/EditorStores';

const Icon = lazy(() => import('@sledge-pdm/ui').then((mod) => ({ default: mod.Icon })));

const container = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: end;
  width: 100%;
  gap: 8px;
  min-height: 24px;
`;
const item = css`
  display: flex;
  padding: 2px;
  cursor: pointer;
  gap: 8px;
`;

const label = css`
  color: var(--color-active);
`;

const SelectionModeField = () => {
  return (
    <div class={container}>
      <div
        class={item}
        onClick={() => {
          setInteractStore('selectionEditMode', 'replace');
        }}
      >
        <Show when={interactStore.selectionEditMode === 'replace'}>
          <p class={label}>replace.</p>
        </Show>
        <Icon src='/assets/icons/selection/mode_replace.png' base={8} color={interactStore.selectionEditMode === 'replace' ? 'var(--color-active)' : 'var(--color-muted)'} />
      </div>
      <div
        class={item}
        onClick={() => {
          setInteractStore('selectionEditMode', 'add');
        }}
      >
        <Show when={interactStore.selectionEditMode === 'add'}>
          <p class={label}>add.</p>
        </Show>
        <Icon src='/assets/icons/selection/mode_add.png' base={8} color={interactStore.selectionEditMode === 'add' ? 'var(--color-active)' : 'var(--color-muted)'} />
      </div>
      <div
        class={item}
        onClick={() => {
          setInteractStore('selectionEditMode', 'subtract');
        }}
      >
        <Show when={interactStore.selectionEditMode === 'subtract'}>
          <p class={label}>subtract.</p>
        </Show>
        <Icon src='/assets/icons/selection/mode_subtract.png' base={8} color={interactStore.selectionEditMode === 'subtract' ? 'var(--color-active)' : 'var(--color-muted)'} />
      </div>
      <div
        class={item}
        onClick={() => {
          setInteractStore('selectionEditMode', 'move');
        }}
      >
        <Show when={interactStore.selectionEditMode === 'move'}>
          <p class={label}>move.</p>
        </Show>
        <Icon src='/assets/icons/selection/mode_move.png' base={8} color={interactStore.selectionEditMode === 'move' ? 'var(--color-active)' : 'var(--color-muted)'} />
      </div>
    </div>
  );
};

export default SelectionModeField;
