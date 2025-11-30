import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import { Portal } from 'solid-js/web';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const GetStarted: Component = () => {
  return (
    <>
      <Title>sledge. - get started</Title>
      <Portal mount={document.querySelector('#portal-root') as Node}>
        <div class={wikiContentRoot}>
          <WikiContentHeader>Get Started</WikiContentHeader>
          <div class={wikiMarkdown}>
            <h3>Welcome to the sledge wiki!</h3>
            <ol>
              <li>
                If you have not installed sledge yet, start with <a href='/wiki/how_to_install'>How To Install</a>.
              </li>
              <li>
                After launch, try the basic tools first (Pen with <code>B</code>, Eyedropper with <code>I</code>).
              </li>
              <li>I/O topics such as saving and export will be filled in the dedicated section.</li>
            </ol>
          </div>
        </div>
      </Portal>
    </>
  );
};

export default GetStarted;
