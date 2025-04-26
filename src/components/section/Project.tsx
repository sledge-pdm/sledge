import { Component, createSignal } from 'solid-js';
import { exportActiveLayerUpscaled } from '~/io/internal/export';
import { saveProject } from '~/io/project/project';

import { projectStore, setProjectStore } from '~/stores/project/projectStore';
import { projectNameInput } from '~/styles/section/project.css';
import {
  sectionCaption,
  sectionContent,
  sectionRoot,
} from '~/styles/section_global.css';
import { flexCol, flexRow } from '~/styles/snippets.css';

const Project: Component = () => {
  const [saveLog, setSaveLog] = createSignal<string | undefined>(undefined);

  const save = () => {
    if (projectStore.name && projectStore.path) {
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

  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>project.</p>
      <div class={sectionContent}>
        <div class={flexCol}>
          <input
            class={projectNameInput}
            type='text'
            name='height'
            onChange={(e) => {
              setProjectStore('name', e.target.value);
            }}
            value={projectStore.name}
            placeholder='project name'
            autocomplete='off'
            required
          />

          {/* <p class={styles.project_file_path}>{projectStore.path}</p> */}
        </div>
        {/* <button class={styles.loadsave_button} onClick={() => importProjectJsonFromFileSelection()}>
                        load.
                    </button> */}

        <div
          class={flexRow}
          style={{ 'align-items': 'center', 'margin-top': '12px' }}
        >
          <button onClick={() => save()}>save.</button>
          <button onClick={() => exportActiveLayerUpscaled()}>export.</button>
          {/*   {!projectStore.isProjectChangedAfterSave && <p class={styles.save_log}>{saveLog()}</p>} */}
        </div>
      </div>
    </div>
  );
};

export default Project;
