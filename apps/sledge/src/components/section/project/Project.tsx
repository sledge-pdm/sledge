import { flexCol, flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Component, createSignal, Show } from 'solid-js';
import { saveProject } from '~/io/project/out/save';
import { fileStore, setFileStore } from '~/stores/EditorStores';
import { projectStore, setProjectStore } from '~/stores/ProjectStores';

import { projectNameInput } from '~/styles/section/project/project.css';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/section/section_item.css';

const Project: Component = () => {
  const [saveLog, setSaveLog] = createSignal<string | undefined>(undefined);
  const [newName, setNewName] = createSignal<string | undefined>(fileStore.location.name);
  const isNameChanged = () => fileStore.location.name !== newName();
  const isOWPossible = () => fileStore.location.name !== undefined && fileStore.location.path !== undefined && !isNameChanged();

  const OWSave = () => {
    setFileStore('location', 'name', newName() ?? fileStore.location.name);
    // 上書き保存
    saveProject(fileStore.location.name, `${fileStore.location.path}`).then(() => {
      setSaveLog('saved!');
      setProjectStore('isProjectChangedAfterSave', false);
    });
  };
  const forceNewSave = () => {
    setFileStore('location', 'name', newName() ?? fileStore.location.name);
    saveProject(fileStore.location.name).then(() => {
      setSaveLog('saved!');
      setProjectStore('isProjectChangedAfterSave', false);
    });
  };

  const commitNewName = () => {
    setFileStore('location', 'name', newName());
  };

  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>project name.</p>
      <div class={sectionContent}>
        <div class={flexCol} style={{}}>
          <Show when={isNameChanged()}>
            <p>{fileStore.location.name} →</p>
          </Show>

          <input
            class={projectNameInput}
            type='text'
            name='height'
            onInput={(e) => {
              if (e.target.value) setNewName(e.target.value);
            }}
            onChange={(e) => {
              if (e.target.value) setNewName(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitNewName();
            }}
            value={fileStore.location.name}
            placeholder='project name'
            autocomplete='off'
          />
        </div>

        <div
          class={flexRow}
          style={{
            'align-items': 'center',
            'margin-top': '4px',
            'margin-bottom': '12px',
            gap: vars.spacing.sm,
          }}
        >
          <Show when={isNameChanged()}>
            <button onClick={() => commitNewName()}>change name.</button>
          </Show>
          <Show when={isOWPossible()}>
            <button
              onClick={() => OWSave()}
              style={{
                color: vars.color.accent,
                'border-color': vars.color.accent,
              }}
            >
              save.
            </button>
            <button onClick={() => forceNewSave()}>save (new).</button>
          </Show>
          <Show when={!isOWPossible()}>
            <button
              onClick={() => forceNewSave()}
              style={{
                color: vars.color.accent,
                'border-color': vars.color.accent,
              }}
            >
              save (new).
            </button>
          </Show>
          <Show when={!projectStore.isProjectChangedAfterSave}>
            <p>{saveLog()}</p>
          </Show>
        </div>
      </div>
    </div>
  );
};

export default Project;
