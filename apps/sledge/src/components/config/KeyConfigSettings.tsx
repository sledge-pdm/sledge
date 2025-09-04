import { flexCol } from '@sledge/core';
import { vars } from '@sledge/theme';
import { confirm, message } from '@tauri-apps/plugin-dialog';
import { Component, createSignal, For, onCleanup, onMount } from 'solid-js';
import {
  isRecordEndWithoutSave as isRecordAbortKey,
  isRecordEndSave as isRecordEndKey,
  isRecordPossible as isRecordPossibleKey,
  parseKeyConfigEntry,
  recordKey,
  restoreDefaultKeyConfig,
  saveKeyConfigEntry,
} from '~/controllers/config/KeyConfigController';
import { KeyConfigEntry } from '~/models/config/KeyConfig';
import { KeyConfigCommands } from '~/models/Consts';
import { keyConfigStore } from '~/stores/GlobalStores';
import { keyConfigName, keyConfigRow, keyConfigValue } from '~/styles/components/config/key_config_settings.css';

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
        <span style={{ color: vars.color.accent }}>enter</span> to confirm.&nbsp;
        <span style={{ color: vars.color.accent }}>esc</span> to abort.
      </p>
      <div class={flexCol} style={{ gap: '4px', width: '100%' }}>
        <For each={Object.entries(keyConfigStore)}>
          {([name, entry]) => {
            const isRecording = () => name === recordingName();
            return (
              <div class={keyConfigRow}>
                <p class={keyConfigName}>{name}</p>
                <a
                  class={keyConfigValue}
                  onClick={(e) => {
                    if (!isRecording()) startRecord(name as KeyConfigCommands);
                  }}
                  style={{
                    color: isRecording() ? vars.color.active : vars.color.onBackground,
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
