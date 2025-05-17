import { Component } from 'solid-js';

import { edgeInfoItem, edgeInfoRoot, edgeInfoText } from '~/styles/components/globals/edge_info.css';
import { safeInvoke } from '~/utils/TauriUtils';

const EdgeInfo: Component = () => {
  return (
    <div class={edgeInfoRoot}>
      <div class={edgeInfoItem}>
        <a
          class={edgeInfoText}
          onClick={async () => {
            await safeInvoke('open_window', {
              kind: 'settings',
            });
          }}
        >
          settings.
        </a>
      </div>
      {/* <p class={sideAreaEdgeText}>{projectStore.name || "name N/A"}</p> */}
    </div>
  );
};

export default EdgeInfo;
