import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const Move: Component = () => {
  return (
    <>
      <Title>sledge. - move</Title>
      <div class={wikiContentRoot}>
        <WikiContentHeader iconSrc='/icons/wiki/wiki_move.png'>Move</WikiContentHeader>
        <div class={wikiMarkdown}>
          <p>This article is under preparation.</p>
          <p>Details for Move tool will be added soon.</p>
        </div>
      </div>
    </>
  );
};

export default Move;
