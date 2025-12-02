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
          <h2>About</h2>
          <p>Move drags the current selection. If no selection exists, it temporarily selects the whole active layer and drags that buffer.</p>
          <div>
            <img alt='Move tool UI' src='/wiki/tools/move/about.png' />
          </div>
        </div>
      </div>
    </>
  );
};

export default Move;
