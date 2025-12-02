import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const Canvas: Component = () => {
  return (
    <>
      <Title>sledge. - canvas</Title>
      <div class={wikiContentRoot}>
        <WikiContentHeader iconSrc='/icons/wiki/wiki_canvas.png'>Canvas</WikiContentHeader>
        <div class={wikiMarkdown}>
          <h2>About</h2>
          <p>Canvas size and view settings (zoom/offset/rotation/flip) are managed together so drawing and overlays stay aligned.</p>

          <h2>Size</h2>
          <ul>
            <li>Acceptable range: 1–8000 px for both width and height.</li>
            <li>If the GPU’s WebGL drawing buffer would exceed its safe memory, a warning is shown and the resize is rejected.</li>
            <li>Resizing reflows every layer buffer and clears the current selection. History is recorded unless explicitly skipped.</li>
          </ul>

          <h2>View</h2>
          <ul>
            <li>
              <strong>Zoom:</strong> Clamped between a min/max derived from the initial zoom. “Fit Eadjusts zoom so the longest side fits the work
              area.
            </li>
            <li>
              <strong>Offset:</strong> Panning moves the canvas origin; centering recenters using the current zoom.
            </li>
            <li>
              <strong>Rotation:</strong> Any angle is normalized to the −180°–180° range.
            </li>
            <li>
              <strong>Flip:</strong> Horizontal/vertical flips are toggled independently and can be reset along with rotation.
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default Canvas;
