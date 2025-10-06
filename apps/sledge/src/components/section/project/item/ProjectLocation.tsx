import { flexCol, flexRow } from '@sledge/core';
import { vars, ZFB03, ZFB09 } from '@sledge/theme';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { Component, Show } from 'solid-js';
import { fileStore } from '~/stores/EditorStores';
import { sectionSubCaption } from '~/styles/section/section_item.css';
import { join } from '~/utils/FileUtils';

const ProjectLocation: Component = () => {
  return (
    <>
      <div class={flexRow} style={{ gap: '4px', 'align-items': 'center', 'justify-content': 'space-between' }}>
        <p class={sectionSubCaption}>Location.</p>

        <Show when={fileStore.savedLocation.name && fileStore.savedLocation.path}>
          <a
            href='#'
            onClick={(e) => {
              const loc = fileStore.savedLocation;
              if (!loc || !loc.path || !loc.name) return;
              revealItemInDir(join(loc.path, loc.name));
            }}
            style={{ color: vars.color.muted, 'text-decoration': 'none', 'font-family': ZFB03 }}
          >
            Open in Explorer
          </a>
        </Show>
      </div>
      <div style={{ 'padding-left': '4px' }}>
        <div class={flexCol} style={{ gap: '4px', overflow: 'hidden' }}>
          <div class={flexRow}>
            <p style={{ 'font-family': ZFB03, width: '40px', 'font-size': '8px' }}>path</p>
            <Show when={fileStore.savedLocation.path} fallback={<p style={{ 'font-family': ZFB09, opacity: 0.3 }}></p>}>
              <p style={{ 'white-space': 'wrap' }}>{fileStore.savedLocation.path || '<unknown>'}</p>
            </Show>
          </div>
          <div class={flexRow}>
            <p style={{ 'font-family': ZFB03, width: '40px', 'font-size': '8px' }}>file</p>
            <Show when={fileStore.savedLocation.name} fallback={<p style={{ 'font-family': ZFB09, opacity: 0.3 }}>[ unsaved project ]</p>}>
              <p style={{ 'white-space': 'wrap' }}>{fileStore.savedLocation.name || '<unknown>'}</p>
            </Show>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectLocation;
