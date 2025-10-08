import { css } from '@acab/ecsstatic';
import { Component, createSignal, Show } from 'solid-js';
import { saveProject } from '~/io/project/out/save';
import { fileStore } from '~/stores/EditorStores';
import { projectStore, setProjectStore } from '~/stores/ProjectStores';

const saveContainerStyle = css`
  display: flex;
  align-items: center;
  margin-top: 4px;
  margin-bottom: 12px;
  gap: var(--spacing-sm);
`;

const primarySaveButtonStyle = css`
  color: var(--color-accent);
  border-color: var(--color-accent);
`;

const ProjectSave: Component = () => {
  const [saveLog, setSaveLog] = createSignal<string | undefined>(undefined);
  const isOWPossible = () => fileStore.savedLocation.name !== undefined && fileStore.savedLocation.path !== undefined;

  const save = () => {
    saveProject(fileStore.savedLocation.name, fileStore.savedLocation.path).then((result) => {
      if (result) {
        setSaveLog('saved!');
        setProjectStore('isProjectChangedAfterSave', false);
      } else {
        setSaveLog('save failed.');
      }
    });
  };

  return (
    <div class={saveContainerStyle}>
      <Show when={isOWPossible()}>
        <button onClick={() => save()} class={primarySaveButtonStyle}>
          save.
        </button>
        <button onClick={() => save()}>save (new).</button>
      </Show>
      <Show when={!isOWPossible()}>
        <button onClick={() => save()} class={primarySaveButtonStyle}>
          save (new).
        </button>
      </Show>
      <Show when={!projectStore.isProjectChangedAfterSave}>
        <p>{saveLog()}</p>
      </Show>
    </div>
  );
};

export default ProjectSave;
