import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import { Portal } from 'solid-js/web';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const Selections: Component = () => {
  return (
    <>
      <Title>sledge. - selections</Title>
      <Portal mount={document.querySelector('#portal-root') as Node}>
        <div class={wikiContentRoot}>
          <WikiContentHeader iconSrc='/icons/wiki/wiki_selections.png'>Selection (Rect / Lasso / Auto)</WikiContentHeader>
          <div class={wikiMarkdown}>
            <p>This article is under preparation.</p>
            <p>Details for Selection tools will be added soon.</p>
          </div>
        </div>
      </Portal>
    </>
  );
};

export default Selections;
