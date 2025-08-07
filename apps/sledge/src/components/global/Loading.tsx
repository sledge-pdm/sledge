import { pageRoot } from '@sledge/theme';
import { Component } from 'solid-js';
import { loadingText } from '~/styles/globals/loading.css';

const Loading: Component = (props) => {
  return (
    <div class={pageRoot} style={{ 'align-items': 'center', 'justify-content': 'center' }}>
      <p class={loadingText}>loading.</p>
    </div>
  );
};

export default Loading;
