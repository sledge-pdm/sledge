import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import { Portal } from 'solid-js/web';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const OnscreenControl: Component = () => {
  return (
    <>
      <Title>sledge. - onscreen control</Title>
      <Portal mount={document.querySelector('#portal-root') as Node}>
        <div class={wikiContentRoot}>
          <WikiContentHeader iconSrc='/icons/wiki/wiki_onscreen_control.png'>Onscreen Control</WikiContentHeader>
          <div class={wikiMarkdown}>
            <p>This article is under preparation.</p>
            <p>Onscreen control usage will be added soon.</p>
          </div>
        </div>
      </Portal>
    </>
  );
};

export default OnscreenControl;
