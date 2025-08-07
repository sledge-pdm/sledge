import { pageRoot } from '@sledge/theme';
import { loadingText } from '@styles/globals/loading.css';
import { Component } from 'solid-js';

const Loading: Component = (props) => {
  return (
    <div class={pageRoot} style={{ 'align-items': 'center', 'justify-content': 'center' }}>
      <p class={loadingText}>loading.</p>
    </div>
  );
};

export default Loading;
