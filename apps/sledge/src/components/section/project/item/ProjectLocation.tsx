import { flexCol, flexRow } from '@sledge/core';
import { ZFB03, ZFB09 } from '@sledge/theme';
import { Component, Show } from 'solid-js';
import { getOpenLocation } from '~/utils/WindowUtils';

const ProjectLocation: Component = () => {
  const location = getOpenLocation();

  const isNewProject = () => !location || !location.name || !location.path;

  console.log('ProjectLocation', location);

  return (
    <div class={flexCol} style={{ gap: '4px', overflow: 'hidden' }}>
      <Show when={!isNewProject()} fallback={<p style={{ 'font-family': ZFB09, margin: '4px 0', opacity: 0.3 }}>[ unsaved project ]</p>}>
        <div class={flexRow}>
          <p style={{ 'font-family': ZFB03, width: '40px', 'font-size': '8px' }}>path</p>
          <p style={{ 'white-space': 'wrap' }}>{location?.path || '<unknown>'}</p>
        </div>
        <div class={flexRow}>
          <p style={{ 'font-family': ZFB03, width: '40px', 'font-size': '8px' }}>file</p>
          <p>{location?.name || '<unknown>'}</p>
        </div>
      </Show>
    </div>
  );
};

export default ProjectLocation;
