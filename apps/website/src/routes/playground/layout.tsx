import { css } from '@acab/ecsstatic';
import { Title } from '@solidjs/meta';
import { RouteSectionProps } from '@solidjs/router';
import { Component } from 'solid-js';
import NormalPortal from '~/components/NormalPortal';
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

const PlaygroundWrapper: Component<RouteSectionProps> = (props) => {
  return (
    <>
      <Title>sledge. - playground</Title>
      <main class={pageRoot}>
        <a class={title} href='/playground' style={{ 'text-decoration': 'none', color: 'inherit' }}>
          Play
          <br />
          ground
        </a>
        {props.children}

        <NormalPortal />
      </main>
    </>
  );
};

export default PlaygroundWrapper;
