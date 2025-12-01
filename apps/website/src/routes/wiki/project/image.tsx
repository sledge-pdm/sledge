import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const ImagePool: Component = () => {
  return (
    <>
      <Title>sledge. - image pool</Title>
      <div class={wikiContentRoot}>
        <WikiContentHeader iconSrc='/icons/wiki/wiki_image_pool.png'>Image Pool</WikiContentHeader>
        <div class={wikiMarkdown}>
          <p>This article is under preparation.</p>
          <p>Image pool usage and tips will be added soon.</p>
        </div>
      </div>
    </>
  );
};

export default ImagePool;
