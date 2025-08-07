import { flexCol } from '@sledge/core';
import { vars } from '@sledge/theme';
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
import { sectionContent, sectionRoot } from '~/styles/section/section_item.css';

const KeyConfigSettings: Component = () => {
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
    }
    setRecordedEntry(undefined);
    setRecordingName(undefined);
  };

  onMount(() => window.addEventListener('keydown', handleOnKeyDown));
  onCleanup(() => window.removeEventListener('keydown', handleOnKeyDown));

  return (
    <div class={sectionRoot}>
      <div class={sectionContent}>
        <p style={{ 'margin-bottom': '16px' }}>
          <span style={{ color: vars.color.accent }}>enter</span> to confirm.&nbsp;
          <span style={{ color: vars.color.accent }}>esc</span> to abort.
        </p>
        <For each={Object.entries(keyConfigStore)}>
          {([name, entry]) => {
            const isRecording = () => name === recordingName();
            return (
              <div class={flexCol}>
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
                    {name === recordingName() ? `rec. [${parseKeyConfigEntry(recordedEntry()) ?? 'press any keys'}]` : parseKeyConfigEntry(entry[0])}
                  </a>
                </div>
                <div
                  style={{
                    height: '1px',
                    'background-color': vars.color.border,
                    'margin-right': vars.spacing.xl,
                  }}
                />
              </div>
            );
          }}
        </For>

        <button
          style={{ 'margin-top': '24px' }}
          onClick={(e) => {
            e.preventDefault();
            restoreDefaultKeyConfig();
          }}
        >
          restore default.
        </button>
      </div>
    </div>
  );
};

export default KeyConfigSettings;
