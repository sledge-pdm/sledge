import { css } from '@acab/ecsstatic';
import { For, Show, createMemo, createSignal, lazy } from 'solid-js';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import type { SelectionEditMode } from '~/stores/editor/InteractStore';

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

const MODE_ITEMS: { mode: SelectionEditMode; label: string; icon: string }[] = [
  { mode: 'replace', label: 'replace.', icon: '/assets/icons/selection/mode_replace.png' },
  { mode: 'add', label: 'add.', icon: '/assets/icons/selection/mode_add.png' },
  { mode: 'subtract', label: 'subtract.', icon: '/assets/icons/selection/mode_subtract.png' },
  { mode: 'move', label: 'move.', icon: '/assets/icons/selection/mode_move.png' },
];

type SelectionModeFieldProps = {
  value?: SelectionEditMode;
  defaultValue?: SelectionEditMode;
  onSelectMode?: (mode: SelectionEditMode) => void;
  modes?: SelectionEditMode[];
};

export const SelectionModeSelector = (props: SelectionModeFieldProps) => {
  const [localMode, setLocalMode] = createSignal<SelectionEditMode>(props.defaultValue ?? interactStore.selectionEditMode);
  const modes = createMemo(() => props.modes ?? MODE_ITEMS.map((item) => item.mode));
  const items = createMemo(() => MODE_ITEMS.filter((item) => modes().includes(item.mode)));
  const usesExternalState = createMemo(
    () => props.value !== undefined || props.defaultValue !== undefined || props.onSelectMode !== undefined || props.modes !== undefined
  );
  const selectedMode = createMemo(() => {
    if (!usesExternalState()) return interactStore.selectionEditMode;
    return props.value ?? localMode();
  });

  const onSelect = (mode: SelectionEditMode) => {
    if (usesExternalState()) {
      if (props.value === undefined) {
        setLocalMode(mode);
      }
      props.onSelectMode?.(mode);
      return;
    }

    setInteractStore('selectionEditMode', mode);
  };

  return (
    <div class={container}>
      <For each={items()}>
        {(entry) => (
          <div
            class={item}
            onClick={() => {
              onSelect(entry.mode);
            }}
          >
            <Show when={selectedMode() === entry.mode}>
              <p class={label}>{entry.label}</p>
            </Show>
            <Icon src={entry.icon} base={8} color={selectedMode() === entry.mode ? 'var(--color-active)' : 'var(--color-muted)'} />
          </div>
        )}
      </For>
    </div>
  );
};

const SelectionModeField = () => {
  return <SelectionModeSelector />;
};

export default SelectionModeField;
