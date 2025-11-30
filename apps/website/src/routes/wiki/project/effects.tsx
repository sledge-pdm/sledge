import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import { Portal } from 'solid-js/web';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const Effects: Component = () => {
  return (
    <>
      <Title>sledge. - effects</Title>
      <Portal mount={document.querySelector('#portal-root') as Node}>
        <div class={wikiContentRoot}>
          <WikiContentHeader iconSrc='/icons/wiki/wiki_effects.png'>Effects</WikiContentHeader>
          <div class={wikiMarkdown}>
            <p>This article is under preparation.</p>
            <p>Effects settings and usage will be added soon.</p>
          </div>
        </div>
      </Portal>
    </>
  );
};

export default Effects;
