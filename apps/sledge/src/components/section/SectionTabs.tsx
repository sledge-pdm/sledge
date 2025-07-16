import { Component } from 'solid-js';
import Color from '~/components/section/editor/Color';
import Draw from '~/components/section/editor/Draw';
import LayerList from '~/components/section/editor/LayerList';
import Selection from '~/components/section/editor/Selection';
import Effects from '~/components/section/effects/Effects';
import CanvasSettings from '~/components/section/project/CanvasSettings';
import Project from '~/components/section/project/Project';

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

export const ProjectTab: Component = () => {
  return (
    <>
      <Project />
      <CanvasSettings />
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
