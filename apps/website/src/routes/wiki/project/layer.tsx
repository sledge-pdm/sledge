import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const Layer: Component = () => {
  return (
    <>
      <Title>sledge. - layer</Title>
      <div class={wikiContentRoot}>
        <WikiContentHeader iconSrc='/icons/wiki/wiki_layer.png'>Layer</WikiContentHeader>
        <div class={wikiMarkdown}>
          <p>This article is under preparation.</p>
          <p>Layer management details will be added soon.</p>
        </div>
      </div>
    </>
  );
};

export default Layer;
