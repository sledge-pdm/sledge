import { css } from '@acab/ecsstatic';
import { Component, createSignal } from 'solid-js';
import ErrorText from '~/components/global/ErrorText';
import { fileStore, setFileStore } from '~/stores/EditorStores';

const projectNameContainerStyle = css`
  display: flex;
  flex-direction: column;
`;

const nameInputRowStyle = css`
  display: flex;
  align-items: baseline;
  gap: 4px;
`;

const projectNameInputStyle = css`
  width: 0;
  flex-grow: 1;
  border: none;
  font-size: var(--text-xl);
  margin-left: -2px;
  outline: none;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 2px;
  font-family: k12x8;
  overflow: visible;

  &::placeholder {
    opacity: 0.5;
  }
`;

const errorTextStyle = css`
  margin-top: 8px;
`;

const ProjectName: Component = () => {
  const [inputName, setInputName] = createSignal<string | undefined>(undefined);
  const [error, setError] = createSignal<string | undefined>(undefined);

  const commitNewName = (name: string) => {
    if (!name || name.trim() === '') {
      // 初期からの変更はエラーを出さない
      if (fileStore.savedLocation.name) setError('Project name cannot be empty.');
      return;
    }
    if (!name.endsWith('.sledge')) {
      name += '.sledge';
    }
    setFileStore('savedLocation', 'name', name);
    setError(undefined);
  };

  return (
    <div class={projectNameContainerStyle}>
      <div class={nameInputRowStyle}>
        <input
          class={projectNameInputStyle}
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
            e.target.value = fileStore.savedLocation.name?.replace(/\.sledge$/, '') || '';
            setInputName(e.target.value);
            commitNewName(e.target.value);
          }}
          onBlur={(e) => {
            e.target.value = fileStore.savedLocation.name?.replace(/\.sledge$/, '') || '';
            setInputName(e.target.value);
            commitNewName(e.target.value);
          }}
          value={fileStore.savedLocation.name?.replace(/\.sledge$/, '') || ''}
          placeholder='project'
          autocomplete='off'
        />
        <p>.sledge</p>
      </div>

      <ErrorText class={errorTextStyle}>{error()}</ErrorText>
    </div>
  );
};

export default ProjectName;
