import { css } from '@acab/ecsstatic';
import { Title } from '@solidjs/meta';
import { RouteSectionProps } from '@solidjs/router';
import { Component } from 'solid-js';
import { pageRoot } from '~/styles';

const title = css`
  font-family: ZFB31;
  text-transform: uppercase;
  letter-spacing: 0px;
  font-size: 24px;
  height: auto;
  overflow: hidden;
  gap: 4px 8px;
  margin-bottom: 16px;
  width: 100%;
  overflow-wrap: break-word;
`;
const menuBar = css`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 450px;
  padding: 48px;
`;
// const content = css`
//   display: flex;
//   flex-direction: column;
//   height: 100%;
//   width: 100%;
//   flex-grow: 1;
// `;

const PlaygroundIndex: Component<RouteSectionProps> = (props) => {
  return (
    <>
      <Title>sledge. - playground</Title>
      <main class={pageRoot}>
        <div class={menuBar}>
          <a class={title} href='/playground' style={{ 'text-decoration': 'none', color: 'inherit' }}>
            Playground
          </a>

          <p>Under construction.</p>
        </div>
      </main>
    </>
  );
};

export default PlaygroundIndex;
