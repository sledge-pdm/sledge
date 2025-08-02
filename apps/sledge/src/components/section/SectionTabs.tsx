import { Component } from 'solid-js';
import Color from '~/components/section/editor/Color';
import Draw from '~/components/section/editor/Draw';
import LayerList from '~/components/section/editor/LayerList';
import Selection from '~/components/section/editor/Selection';
import Effects from '~/components/section/effects/Effects';
import PerilousLayers from '~/components/section/perilous/PerilousLayers';
import AutoSave from '~/components/section/project/AutoSave';
import CanvasSettings from '~/components/section/project/CanvasSettings';
import Project from '~/components/section/project/Project';

export type SectionTab = 'editor' | 'effects' | 'project' | 'perilous';

export const EditorTab: Component = () => {
  return (
    <>
      <Color />
      <Draw />
      <Selection />
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

export const ProjectTab: Component = () => {
  return (
    <>
      <Project />
      <AutoSave />
      <CanvasSettings />
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
