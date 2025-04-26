import { Component } from 'solid-js';
import { SettingsWindowOptions } from '~/routes/settings';

import {
  edgeInfoItem,
  edgeInfoRoot,
  edgeInfoText,
} from '~/styles/components/edge_info.css';
import { openSingletonWindow } from '~/utils/windowUtils';

const EdgeInfo: Component = () => {
  return (
    <div class={edgeInfoRoot}>
      <div class={edgeInfoItem}>
        <a
          class={edgeInfoText}
          onClick={() => openSingletonWindow('settings', SettingsWindowOptions)}
        >
          settings.
        </a>
      </div>
      {/* <p class={sideAreaEdgeText}>{projectStore.name || "name N/A"}</p> */}
    </div>
  );
};

export default EdgeInfo;
