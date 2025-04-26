import { Component, createSignal, For, onMount } from 'solid-js';
import { ALL_NODES } from '~/dsl/nodes/AvailableNodes';
import { activeIndex, activeLayer, setLayerStore } from '~/stores/project/layerStore';

const DSLEditor: Component<{}> = (props) => {
  const [activeDSLStr, setDSLStr] = createSignal('');

  onMount(() => {
    setDSLStr(activeLayer()?.dsl.toString() || '');
  });

  return (
    <div style={{ display: 'flex', position: 'relative' }}>
      <p style={{ 'white-space': 'pre-wrap' }}>{activeDSLStr()}</p>
      <div
        style={{
          display: 'flex',
          'flex-direction': 'column',
          gap: '10px',
          'z-index': 10,
        }}
      >
        <p>select command.</p>
        <For each={ALL_NODES}>
          {(node) => {
            return (
              <a
                onClick={async () => {
                  const dsl = activeLayer()?.dsl;
                  if (dsl === undefined) return;
                  dsl.addNode(node);
                  setLayerStore('layers', activeIndex(), 'dsl', dsl);
                  setDSLStr(dsl.toString());
                }}
                style={{ cursor: 'pointer' }}
              >
                &lt; {node.name}
              </a>
            );
          }}
        </For>
      </div>
      ;
    </div>
  );
};

export default DSLEditor;
