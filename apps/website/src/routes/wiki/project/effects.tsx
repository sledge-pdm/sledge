import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const Effects: Component = () => {
  return (
    <>
      <Title>sledge. - effects</Title>
      <div class={wikiContentRoot}>
        <WikiContentHeader iconSrc='/icons/wiki/wiki_effects.png'>Effects</WikiContentHeader>
        <div class={wikiMarkdown}>
          <h2>About</h2>
          <ul>
            <li>Effects run on the selected layer buffer and push a history action.</li>
          </ul>

          <h2>Effects</h2>
          <h3>Brightness / Contrast</h3>
          <p>Brightness and contrast sliders (−100 to 100, dbl-click resets to 0) applied in one pass.</p>

          <h3>Dithering</h3>
          <ul>
            <li>Modes: Error Diffusion, Ordered.</li>
            <li>Levels: 2–32, Strength: 0.0–1.0.</li>
          </ul>

          <h3>Dust removal</h3>
          <p>Removes small opaque spots. Configure maximum size (0–1000) and alpha threshold (0–255).</p>

          <h3>Grayscale / Invert</h3>
          <p>One-click conversions to grayscale or inverted colors.</p>

          <h3>Gaussian blur</h3>
          <p>Radius 0–1000 with optional “clamp at transparency E(toggle to skip blurring fully transparent pixels).</p>

          <h3>Posterize</h3>
          <p>Reduces tonal steps. Levels: 1–32 (default 8).</p>
        </div>
      </div>
    </>
  );
};

export default Effects;
