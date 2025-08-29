import { Component, For } from 'solid-js';
import HistoryItem from '~/components/section/history/HistoryItem';
import { layerListStore } from '~/stores/ProjectStores';

const History: Component = () => {
  return (
    <>
      <For each={layerListStore.layers}>{(layer) => <HistoryItem layer={layer} />}</For>
    </>
  );
};

export default History;
