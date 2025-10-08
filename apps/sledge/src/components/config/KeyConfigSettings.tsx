import { css } from '@acab/ecsstatic';
import { color } from '@sledge/theme';
import { confirm, message } from '@tauri-apps/plugin-dialog';
import { Component, createSignal, For, onCleanup, onMount } from 'solid-js';
import { KeyConfigCommands } from '~/Consts';
import {
  isRecordEndWithoutSave as isRecordAbortKey,
  isRecordEndSave as isRecordEndKey,
  isRecordPossible as isRecordPossibleKey,
  parseKeyConfigEntry,
  recordKey,
  restoreDefaultKeyConfig,
  saveKeyConfigEntry,
} from '~/features/config/KeyConfigController';
import { KeyConfigEntry } from '~/features/config/models/KeyConfig';
import { keyConfigStore } from '~/stores/GlobalStores';
import { accentedText, flexCol } from '~/styles/StyleSnippets';

const row = css`
  display: flex;
  flex-direction: row;
  width: 100%;
  box-sizing: border-box;
  background-color: var(--color-surface);
  align-items: center;
  padding: 8px 8px;
`;
const rowName = css`
  font-family: ZFB09;
  font-size: 8px;
  width: 50%;
`;
const rowValue = css`
  font-family: ZFB08;
  font-size: 8px;
  align-content: center;
  width: 100%;
  height: 100%;
`;

interface Props {
  onKeyConfigChange?: () => void;
}

const KeyConfigSettings: Component<Props> = (props) => {
  const [recordingName, setRecordingName] = createSignal<KeyConfigCommands | undefined>(undefined);
  const [recordedEntry, setRecordedEntry] = createSignal<KeyConfigEntry | undefined>(undefined);

  const handleOnKeyDown = (e: KeyboardEvent) => {
    if (!(e.target instanceof HTMLElement) || e.target.closest('input')) return;

    if (!recordingName) return;
    if (isRecordAbortKey(e)) {
      endRecord(false);
      return;
    }
    if (isRecordEndKey(e)) {
      endRecord(true);
      return;
    }
    if (!isRecordPossibleKey(e)) return;

    const entry = recordKey(e);
    setRecordedEntry(entry);
  };

  const startRecord = (name: KeyConfigCommands) => {
    setRecordedEntry(undefined);
    setRecordingName(name);
  };

  const endRecord = (save: boolean) => {
    const name = recordingName();
    if (!name) return;
    if (save) {
      saveKeyConfigEntry(name, recordedEntry());
      props.onKeyConfigChange?.();
    }
    setRecordedEntry(undefined);
    setRecordingName(undefined);
  };

  onMount(() => window.addEventListener('keydown', handleOnKeyDown));
  onCleanup(() => window.removeEventListener('keydown', handleOnKeyDown));

  return (
    <div class={flexCol}>
      <p style={{ 'margin-bottom': '16px' }}>
        <span class={accentedText}>enter</span> to confirm.&nbsp;
        <span style={{ color: color.accent }}>esc</span> to abort.
      </p>
      <div class={flexCol} style={{ gap: '4px', width: '100%' }}>
        <For each={Object.entries(keyConfigStore)}>
          {([name, entry]) => {
            const isRecording = () => name === recordingName();
            return (
              <div class={row}>
                <p class={rowName}>{name}</p>
                <a
                  class={rowValue}
                  onClick={(e) => {
                    if (!isRecording()) startRecord(name as KeyConfigCommands);
                  }}
                  style={{
                    color: isRecording() ? color.active : color.onBackground,
                    'pointer-events': isRecording() ? 'none' : 'all',
                  }}
                >
                  {name === recordingName()
                    ? `rec. [${parseKeyConfigEntry(recordedEntry()) ?? 'press any keys'}]`
                    : parseKeyConfigEntry((entry as KeyConfigEntry[])[0])}
                </a>
              </div>
            );
          }}
        </For>
      </div>

      <button
        style={{ 'margin-top': '24px' }}
        onClick={async (e) => {
          e.preventDefault();
          const confirmed = await confirm('sure to restore default key config?', {
            kind: 'warning',
            okLabel: 'restore defaults.',
            cancelLabel: 'cancel.',
            title: 'confirmation',
          });

          if (confirmed) {
            restoreDefaultKeyConfig();
            props.onKeyConfigChange?.();
            message('restore succeeded.');
          }
        }}
      >
        restore default.
      </button>
    </div>
  );
};

export default KeyConfigSettings;
