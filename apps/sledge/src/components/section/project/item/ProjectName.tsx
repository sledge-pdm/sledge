import { flexCol, flexRow } from '@sledge/core';
import { projectNameInput } from '@styles/section/project/project.css';
import { Component, createSignal } from 'solid-js';
import ErrorText from '~/components/global/ErrorText';
import { fileStore, setFileStore } from '~/stores/EditorStores';

const ProjectName: Component = () => {
  const [inputName, setInputName] = createSignal<string | undefined>(undefined);
  const [error, setError] = createSignal<string | undefined>(undefined);

  const commitNewName = (name: string) => {
    if (!name || name.trim() === '') {
      setError('Project name cannot be empty.');
      return;
    }
    if (!name.endsWith('.sledge')) {
      name += '.sledge';
    }
    setFileStore('location', 'name', name);
    setError(undefined);
  };

  return (
    <div class={flexCol}>
      <div class={flexRow} style={{ 'align-items': 'baseline', gap: '4px' }}>
        <input
          class={projectNameInput}
          type='text'
          name='project_name'
          onInput={(e) => {
            setInputName(e.target.value);
            commitNewName(e.target.value);
          }}
          onChange={(e) => {
            setInputName(e.target.value);
            commitNewName(e.target.value);
          }}
          onFocus={(e) => {
            e.target.value = fileStore.location.name?.replace(/\.sledge$/, '') || '';
            setInputName(e.target.value);
            commitNewName(e.target.value);
          }}
          onBlur={(e) => {
            e.target.value = fileStore.location.name?.replace(/\.sledge$/, '') || '';
            setInputName(e.target.value);
            commitNewName(e.target.value);
          }}
          value={fileStore.location.name?.replace(/\.sledge$/, '') || ''}
          placeholder='project name'
          autocomplete='off'
        />
        <p>.sledge</p>
      </div>

      <ErrorText style={{ 'margin-top': '8px' }}>{error()}</ErrorText>
    </div>
  );
};

export default ProjectName;
