import { Component } from 'solid-js';
import { loadingText } from '~/styles/components/globals/loading.css';
import { pageRoot } from '~/styles/global.css';

const Loading: Component<{}> = (props) => {
  return (
    <div class={pageRoot} style={{ 'align-items': 'center', 'justify-content': 'center' }}>
      <p class={loadingText}>loading.</p>
    </div>
  );
};

export default Loading;
