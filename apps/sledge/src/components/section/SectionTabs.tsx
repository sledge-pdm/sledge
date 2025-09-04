import { Component } from 'solid-js';
import Color from '~/components/section/editor/Color';
import Images from '~/components/section/editor/Images';
import LayerList from '~/components/section/editor/LayerList';
import Selection from '~/components/section/editor/Selection';
import Tools from '~/components/section/editor/Tools';
import Effects from '~/components/section/effects/Effects';
import Export from '~/components/section/export/Export';
import History from '~/components/section/history/History';
import PerilousLayers from '~/components/section/perilous/PerilousLayers';
import AutoSave from '~/components/section/project/AutoSave';
import CanvasSettings from '~/components/section/project/CanvasSettings';
import Project from '~/components/section/project/Project';

export type SectionTab = 'editor' | 'effects' | 'history' | 'project' | 'export' | 'danger';

export const EditorTab: Component = () => {
  return (
    <>
      <Color />
      <Tools />
      <Selection />
      <Images />
      <LayerList />
    </>
  );
};

export const EffectsTab: Component = () => {
  return (
    <>
      <Effects />
    </>
  );
};

export const HistoryTab: Component = () => {
  return (
    <>
      <History />
    </>
  );
};

export const ProjectTab: Component = () => {
  return (
    <>
      <Project />
      <AutoSave />
      <CanvasSettings />
    </>
  );
};

export const ExportTab: Component = () => {
  return (
    <>
      <Export />
    </>
  );
};

export const PerilousTab: Component = () => {
  return (
    <>
      <PerilousLayers />
    </>
  );
};
