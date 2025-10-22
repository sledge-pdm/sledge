import { css } from '@acab/ecsstatic';
import { Component } from 'solid-js';
import Explorer from '~/components/section/files/Explorer';

const filesContainer = css`
  display: flex;
  flex-direction: column;
  margin-left: 8px;
`;

const Files: Component = () => {
  return (
    <div class={filesContainer}>
      <Explorer />
    </div>
  );
};

export default Files;
