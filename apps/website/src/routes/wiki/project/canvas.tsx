import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import { Portal } from 'solid-js/web';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const Canvas: Component = () => {
  return (
    <>
      <Title>sledge. - canvas</Title>
      <Portal mount={document.querySelector('#portal-root') as Node}>
        <div class={wikiContentRoot}>
          <WikiContentHeader iconSrc='/icons/wiki/wiki_canvas.png'>Canvas</WikiContentHeader>
          <div class={wikiMarkdown}>
            <p>This article is under preparation.</p>
            <p>Canvas workflow details will be added soon.</p>
          </div>
        </div>
      </Portal>
    </>
  );
};

export default Canvas;
