import { Component } from 'solid-js';
import Dropdown from '~/components/common/control/Dropdown';
import { saveGlobalSettings } from '~/io/global_config/globalSettings';
import { themeOptions } from '~/models/config/GlobalConfig';
import { Theme } from '~/models/config/types/Theme';
import { interactStore, logStore } from '~/stores/EditorStores';
import { globalConfig, setGlobalConfig } from '~/stores/GlobalStores';

import {
  bottomInfoContainer,
  bottomInfoContainerRight,
  bottomInfoRoot,
  bottomInfoText as bottomInfoTextStyle,
} from '~/styles/globals/bottom_info.css';
import { openWindow } from '~/utils/WindowUtils';

const BottomInfo: Component = () => {
  return (
    <div class={bottomInfoRoot} style={{ width: `${interactStore.canvasAreaSize.width}px` }}>
      <div class={bottomInfoContainer}>
        <a class={bottomInfoTextStyle} style={{ 'pointer-events': 'all', cursor: 'pointer' }} onClick={() => openWindow('about')}>
          sledge.
        </a>
        <p class={bottomInfoTextStyle}>x{interactStore.zoom}</p>
        <p class={bottomInfoTextStyle}>{logStore.bottomBarText}</p>
        <div class={bottomInfoContainerRight}>
          {/* <p class={bottomInfoTextStyle}>theme</p> */}
          <Dropdown
            value={globalConfig.appearance.theme}
            options={themeOptions}
            onChange={(v) => {
              setGlobalConfig('appearance', 'theme', v as Theme);
              saveGlobalSettings();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default BottomInfo;
