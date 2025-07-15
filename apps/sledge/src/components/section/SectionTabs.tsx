import { Component } from 'solid-js';
import Color from '~/components/section/editor/Color';
import LayerList from '~/components/section/editor/LayerList';
import ToolList from '~/components/section/editor/ToolList';
import Effects from '~/components/section/effects/Effects';
import CanvasSettings from '~/components/section/project/CanvasSettings';
import Project from '~/components/section/project/Project';

export const EditorTab: Component = () => {
  return (
    <>
      <Color />
      <ToolList />
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
