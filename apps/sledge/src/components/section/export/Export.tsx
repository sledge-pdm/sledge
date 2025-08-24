import { Component } from 'solid-js';
import ExportContent from '~/components/section/export/ExportContent';
import SectionItem from '~/components/section/SectionItem';

const Export: Component = () => {
  return (
    <SectionItem title='export.'>
      <ExportContent />
    </SectionItem>
  );
};

export default Export;
