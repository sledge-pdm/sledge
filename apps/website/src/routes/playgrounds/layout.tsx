import { color } from '@sledge/theme';
import { RouteSectionProps } from '@solidjs/router';
import { Component } from 'solid-js';
import Header from '~/components/top/Header';
import { pageRoot } from '~/styles';

const PlaygroundWrapper: Component<RouteSectionProps> = (props) => {
  return (
    <main class={pageRoot}>
      <Header subTitle={(<span style={{ color: color.enabled }}>Playground</span>) as HTMLSpanElement} />
      {props.children}
    </main>
  );
};

export default PlaygroundWrapper;
