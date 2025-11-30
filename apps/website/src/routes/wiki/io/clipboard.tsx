import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import { Portal } from 'solid-js/web';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const Clipboard: Component = () => {
  return (
    <>
      <Title>sledge. - clipboard</Title>
      <Portal mount={document.querySelector('#portal-root') as Node}>
        <div class={wikiContentRoot}>
          <WikiContentHeader iconSrc={'/icons/wiki/wiki_clipboard.png'}>Clipboard</WikiContentHeader>
          <div class={wikiMarkdown}>
            <p>This article is under preparation.</p>
            <p>Clipboard operations will be added soon.</p>
          </div>
        </div>
      </Portal>
    </>
  );
};

export default Clipboard;
