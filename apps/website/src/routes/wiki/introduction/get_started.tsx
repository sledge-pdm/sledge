import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const GetStarted: Component = () => {
  return (
    <>
      <Title>sledge. - get started</Title>
      <div class={wikiContentRoot}>
        <WikiContentHeader>Get Started</WikiContentHeader>
        <div class={wikiMarkdown}>
          <h3>Welcome to the sledge wiki!</h3>
          <ol>
            <li>
              If you have not installed sledge yet, start with <a href='/wiki/introduction/how_to_install'>How To Install</a>.
            </li>
            <li>
              After launch, try the basic tools first (Pen with <code>B</code>, Eyedropper with <code>I</code>).
            </li>
            <li>I/O topics such as saving and export will be filled in the dedicated section.</li>
          </ol>
        </div>
      </div>
    </>
  );
};

export default GetStarted;
