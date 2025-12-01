import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const Canvas: Component = () => {
  return (
    <>
      <Title>sledge. - canvas</Title>
      <div class={wikiContentRoot}>
        <WikiContentHeader iconSrc='/icons/wiki/wiki_canvas.png'>Canvas</WikiContentHeader>
        <div class={wikiMarkdown}>
          <p>This article is under preparation.</p>
          <p>Canvas workflow details will be added soon.</p>
        </div>
      </div>
    </>
  );
};

export default Canvas;
