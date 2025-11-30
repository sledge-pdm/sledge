import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import { Portal } from 'solid-js/web';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const SupportedFiles: Component = () => {
  return (
    <>
      <Title>sledge. - supported files</Title>
      <Portal mount={document.querySelector('#portal-root') as Node}>
        <div class={wikiContentRoot}>
          <WikiContentHeader iconSrc='/icons/wiki/wiki_supported_files.png'>Supported files / methods</WikiContentHeader>
          <div class={wikiMarkdown}>
            <p>This article is under preparation.</p>
            <p>Supported file formats and import/export methods will be added soon.</p>
          </div>
        </div>
      </Portal>
    </>
  );
};

export default SupportedFiles;
