import { Component, For } from 'solid-js';
import HistoryItem from '~/components/section/history/HistoryItem';
import ProjectHistoryItem from '~/components/section/history/ProjectHistoryItem';
import { layerListStore } from '~/stores/ProjectStores';

const History: Component = () => {
  return (
    <>
      <ProjectHistoryItem />
      <For each={layerListStore.layers}>{(layer) => <HistoryItem layer={layer} />}</For>
    </>
  );
};

export default History;
