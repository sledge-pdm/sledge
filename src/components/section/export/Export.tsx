import { Component } from 'solid-js';
import ExportContent from '~/components/section/export/ExportContent';
import SectionItem from '~/components/section/SectionItem';
import { eventBus } from '~/utils/EventBus';

export function openExportWithPath(path: string) {
  eventBus.emit('export:requestExportPath', { newPath: path });
}

const Export: Component = () => {
  return (
    <SectionItem title='export.'>
      <ExportContent />
    </SectionItem>
  );
};

export default Export;
