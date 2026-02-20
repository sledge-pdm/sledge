import { Component, Show } from 'solid-js';
import ExportContent from '~/components/section/export/ExportContent';
import SectionItem from '~/components/section/SectionItem';
import { eventBus } from '~/utils/EventBus';
import { core } from '~/utils/platform';
import ExportContentBrowser from './ExportContentBrowser';

export function openExportWithPath(path: string) {
  eventBus.emit('export:requestExportPath', { newPath: path });
}

const Export: Component = () => {
  return (
    <SectionItem title='export.'>
      <Show when={core.isTauri()} fallback={<ExportContentBrowser />}>
        <ExportContent />
      </Show>
    </SectionItem>
  );
};

export default Export;
