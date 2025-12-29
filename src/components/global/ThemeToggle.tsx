import { Dropdown, Theme, themeOptions } from '@sledge-pdm/ui';
import { Component } from 'solid-js';
import { saveGlobalSettings } from '~/features/io/config/save';
import { globalConfig, setGlobalConfig } from '~/stores/GlobalStores';

const ThemeToggle: Component<{ noBackground?: boolean }> = (props) => {
  return (
    <Dropdown
      align='right'
      value={globalConfig.general.theme}
      options={themeOptions}
      noBackground={props.noBackground}
      onChange={(v) => {
        setGlobalConfig('general', 'theme', v as Theme);
        saveGlobalSettings(true);
      }}
    />
  );
};

export default ThemeToggle;
