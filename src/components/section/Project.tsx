import { Component, createSignal, onMount, Show } from 'solid-js';
import { exportActiveLayerUpscaled } from '~/io/image_io/save';
import { saveProject } from '~/io/project/project';
import { projectStore, setProjectStore } from '~/stores/ProjectStores';

import { sectionContent, sectionRoot } from '~/styles/components/globals/section_global.css';
import { vars } from '~/styles/global.css';
import { projectNameInput } from '~/styles/section/project.css';
import { flexCol, flexRow } from '~/styles/snippets.css';

const Project: Component = () => {
  const [saveLog, setSaveLog] = createSignal<string | undefined>(undefined);
  const isNameChanged = () => projectStore.name !== projectStore.newName;
  const isOWPossible = () => projectStore.name !== undefined && projectStore.path !== undefined && !isNameChanged();

  onMount(() => {
    setProjectStore('newName', projectStore.name);
  });

  const save = () => {
    if (isNameChanged()) {
      setProjectStore('name', projectStore.newName);
    }
    if (isOWPossible()) {
      // 上書き保存
      saveProject(`${projectStore.path}`).then(() => {
        setSaveLog('saved!');
        setProjectStore('isProjectChangedAfterSave', false);
      });
    } else {
      saveProject().then(() => {
        setSaveLog('saved!');
        setProjectStore('isProjectChangedAfterSave', false);
      });
    }
  };
  const OWSave = () => {
    if (isNameChanged()) {
      setProjectStore('name', projectStore.newName);
    }
    // 上書き保存
    saveProject(`${projectStore.path}`).then(() => {
      setSaveLog('saved!');
      setProjectStore('isProjectChangedAfterSave', false);
    });
  };
  const forceNewSave = () => {
    if (isNameChanged()) {
      setProjectStore('name', projectStore.newName);
    }
    saveProject().then(() => {
      setSaveLog('saved!');
      setProjectStore('isProjectChangedAfterSave', false);
    });
  };

  return (
    <div class={sectionRoot}>
      {/* <p class={sectionCaption}>project.</p> */}
      <div class={sectionContent}>
        <div
          class={flexCol}
          style={{
            'margin-top': '8px',
          }}
        >
          <Show when={isNameChanged()}>
            <p>{projectStore.name} →</p>
          </Show>

          <input
            class={projectNameInput}
            type='text'
            name='height'
            onInput={(e) => {
              if (e.target.value) setProjectStore('newName', e.target.value);
            }}
            onChange={(e) => {
              if (e.target.value) setProjectStore('newName', e.target.value);
            }}
            value={projectStore.name}
            placeholder='project name'
            autocomplete='off'
          />

          {/* <p class={styles.project_file_path}>{projectStore.path}</p> */}
        </div>
        {/* <button class={styles.loadsave_button} onClick={() => importProjectJsonFromFileSelection()}>
                        load.
                    </button> */}

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
          <button onClick={() => exportActiveLayerUpscaled(projectStore.newName || projectStore.name)}>export.</button>
          {/*   {!projectStore.isProjectChangedAfterSave && <p class={styles.save_log}>{saveLog()}</p>} */}
        </div>
      </div>
    </div>
  );
};

export default Project;
