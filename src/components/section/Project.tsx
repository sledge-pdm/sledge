import { Component, createSignal, Show } from 'solid-js';
import { saveProject } from '~/io/project/out/save';
import { projectStore, setProjectStore } from '~/stores/ProjectStores';

import { vars } from '~/styles/global.css';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/globals/section_global.css';
import { projectNameInput } from '~/styles/section/project.css';
import { flexCol, flexRow } from '~/styles/snippets.css';

const Project: Component = () => {
  const [saveLog, setSaveLog] = createSignal<string | undefined>(undefined);
  const [newName, setNewName] = createSignal<string | undefined>(projectStore.name);
  const isNameChanged = () => projectStore.name !== newName();
  const isOWPossible = () => projectStore.name !== undefined && projectStore.path !== undefined && !isNameChanged();

  const OWSave = () => {
    setProjectStore('name', newName() ?? projectStore.name);
    // 上書き保存
    saveProject(projectStore.name, `${projectStore.path}`).then(() => {
      setSaveLog('saved!');
      setProjectStore('isProjectChangedAfterSave', false);
    });
  };
  const forceNewSave = () => {
    setProjectStore('name', newName() ?? projectStore.name);
    saveProject(projectStore.name).then(() => {
      setSaveLog('saved!');
      setProjectStore('isProjectChangedAfterSave', false);
    });
  };

  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>project name.</p>
      <div class={sectionContent}>
        <div class={flexCol} style={{}}>
          <Show when={isNameChanged()}>
            <p>{projectStore.name} →</p>
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
            value={projectStore.name}
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
