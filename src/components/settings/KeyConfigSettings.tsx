import { Component, createSignal, For, onCleanup, onMount } from 'solid-js';
import {
  isRecordEndSave as isRecordEndKey,
  isRecordEndWithoutSave as isRecordAbortKey,
  isRecordPossible as isRecordPossibleKey,
  parseKeyConfigEntry,
  recordKey,
  restoreDefaultKeyConfig,
  saveKeyConfigEntry,
} from '~/controllers/config/KeyConfigController';
import { saveGlobalSettings } from '~/io/global_config/globalSettings';
import { keyConfigStore } from '~/stores/GlobalStores';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/components/globals/section_global.css';
import { keyConfigName } from '~/styles/components/settings/key_config_settings.css';
import { flexRow } from '~/styles/snippets.css';
import { KeyConfigEntry } from '~/types/KeyConfig';
import { KeyConfigCommands } from '~/utils/consts';

const KeyConfigSettings: Component = () => {
  const [recordingName, setRecordingName] = createSignal<KeyConfigCommands | undefined>(undefined);
  const [recordedEntry, setRecordedEntry] = createSignal<KeyConfigEntry | undefined>(undefined);

  const handleOnKeyDown = (e: KeyboardEvent) => {
    if (!recordingName) return;
    e.preventDefault();
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
      saveGlobalSettings();
    }
    setRecordedEntry(undefined);
    setRecordingName(undefined);
  };

  onMount(() => {
    window.addEventListener('keydown', handleOnKeyDown);
    onCleanup(() => {
      window.removeEventListener('keydown', handleOnKeyDown);
    });
  });

  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>key config.</p>
      <div class={sectionContent} style={{ gap: '8px' }}>
        <For each={Object.entries(keyConfigStore)}>
          {([name, entry]) => {
            const isRecording = () => name === recordingName();
            return (
              <div class={flexRow}>
                <p class={keyConfigName}>{name}</p>
                <a
                  onClick={(e) => {
                    if (!isRecording()) startRecord(name as KeyConfigCommands);
                  }}
                  style={{
                    color: isRecording() ? 'blue' : 'inherit',
                    'pointer-events': isRecording() ? 'none' : 'all',
                  }}
                >
                  {name === recordingName()
                    ? `rec. [${parseKeyConfigEntry(recordedEntry()) ?? 'enter any key'}]`
                    : parseKeyConfigEntry(entry[0])}
                </a>
              </div>
            );
          }}
        </For>

        <button
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
