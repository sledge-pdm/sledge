import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const OnscreenControl: Component = () => {
  return (
    <>
      <Title>sledge. - onscreen control</Title>
      <div class={wikiContentRoot}>
        <WikiContentHeader iconSrc='/icons/wiki/wiki_onscreen_control.png'>Onscreen Control</WikiContentHeader>
        <div class={wikiMarkdown}>
          <p>This article is under preparation.</p>
          <p>Onscreen control usage will be added soon.</p>
        </div>
      </div>
    </>
  );
};

export default OnscreenControl;
