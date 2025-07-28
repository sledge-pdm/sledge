import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Component, createSignal, Show } from 'solid-js';
import { saveProject } from '~/io/project/out/save';
import { fileStore, setFileStore } from '~/stores/EditorStores';
import { projectStore, setProjectStore } from '~/stores/ProjectStores';

const SaveSection: Component = () => {
  const [saveLog, setSaveLog] = createSignal<string | undefined>(undefined);
  const isOWPossible = () => fileStore.location.name !== undefined && fileStore.location.path !== undefined;

  const save = (forceNew?: boolean) => {
    setFileStore('location', 'name', fileStore.location.name);
    saveProject(fileStore.location.name, forceNew ? undefined : fileStore.location.path).then((result) => {
      if (result) {
        setSaveLog('saved!');
        setProjectStore('isProjectChangedAfterSave', false);
      } else {
        setSaveLog('save failed.');
      }
    });
  };

  return (
    <div
      class={flexRow}
      style={{
        'align-items': 'center',
        gap: vars.spacing.sm,
      }}
    >
      <Show when={!projectStore.isProjectChangedAfterSave}>
        <p>{saveLog()}</p>
      </Show>
      <Show when={isOWPossible()}>
        <button
          onClick={() => save()}
          style={{
            color: vars.color.accent,
            'border-color': vars.color.accent,
          }}
        >
          save.
        </button>
        <button onClick={() => save(true)}>save (new).</button>
      </Show>
      <Show when={!isOWPossible()}>
        <button
          onClick={() => save(true)}
          style={{
            color: vars.color.accent,
            'border-color': vars.color.accent,
          }}
        >
          save (new).
        </button>
      </Show>
    </div>
  );
};

export default SaveSection;
