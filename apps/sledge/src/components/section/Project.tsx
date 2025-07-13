import { flexCol, flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Component, createSignal, Show } from 'solid-js';
import { saveProject } from '~/io/project/out/save';
import { canvasStore, projectStore, setProjectStore } from '~/stores/ProjectStores';

import { apply_gaussian_blur, convert_to_grayscale } from '@sledge/wasm';
import { getActiveAgent } from '~/controllers/layer/LayerAgentManager';
import { projectNameInput } from '~/styles/section/project.css';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/section/section.css';
import { eventBus } from '~/utils/EventBus';

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

  const commitNewName = () => {
    setProjectStore('name', newName());
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitNewName();
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
      <button
        onClick={() => {
          const agent = getActiveAgent();
          if (agent) {
            const imageBuffer = agent.getBuffer();
            // 独自の型定義により、Uint8ClampedArrayが直接使用可能
            convert_to_grayscale(imageBuffer, canvasStore.canvas.width, canvasStore.canvas.height);
            agent.setBuffer(imageBuffer);
            eventBus.emit('webgl:requestUpdate', { onlyDirty: false });
          }
        }}
      >
        greeeeet!
      </button>
      <button
        onClick={() => {
          const agent = getActiveAgent();
          if (agent) {
            const imageBuffer = agent.getBuffer();
            apply_gaussian_blur(imageBuffer as unknown as Uint8Array, canvasStore.canvas.width, canvasStore.canvas.height, 500);
            agent.setBuffer(imageBuffer);
            eventBus.emit('webgl:requestUpdate', { onlyDirty: false });
          }
        }}
      >
        blurrrrrrr!
      </button>
    </div>
  );
};

export default Project;
