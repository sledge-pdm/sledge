import { Theme } from '@tauri-apps/api/window';
import { Component } from 'solid-js';
import Dropdown from '~/components/common/control/Dropdown';
import { saveGlobalSettings } from '~/io/global_config/globalSettings';
import { themeOptions } from '~/models/config/GlobalConfig';
import { globalConfig, setGlobalConfig } from '~/stores/GlobalStores';

const ThemeToggle: Component<{}> = (props) => {
  return (
    <Dropdown
      value={globalConfig.appearance.theme}
      options={themeOptions}
      noBackground={true}
      onChange={(v) => {
        setGlobalConfig('appearance', 'theme', v as Theme);
        saveGlobalSettings();
      }}
    />
  );
};

export default ThemeToggle;
