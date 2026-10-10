import { Dropdown } from '@sledge-pdm/ui';
import { Component } from 'solid-js';
import ConfigItem from '~/components/config/ConfigItem';
import { configFormFieldHeader } from '~/components/config/ConfigStyles';
import CanvasSizeInput from '~/components/section/project/CanvasSizeInput';
import { Consts } from '~/Consts';
import { globalConfig, setGlobalConfig } from '~/stores/GlobalStores';

const StartupConfigSection: Component = () => {
  return (
    <>
      <p class={configFormFieldHeader}>OPEN.</p>
      <ConfigItem label='open on start' tips='the behavior on startup.'>
        <Dropdown
          value={globalConfig.default.open}
          options={[
            { label: 'new project', value: 'new' },
            { label: 'last opened', value: 'last' },
          ]}
          onChange={(v) => setGlobalConfig('default', 'open', v)}
        />
      </ConfigItem>

      <p class={configFormFieldHeader}>PROJECT.</p>
      <ConfigItem label='default canvas size' tips='the default canvas size when new project created.'>
        <CanvasSizeInput
          value={globalConfig.default.canvasSize ?? { width: Consts.minCanvasWidth, height: Consts.minCanvasHeight }}
          minWidth={Consts.minCanvasWidth}
          maxWidth={Consts.maxCanvasWidth}
          minHeight={Consts.minCanvasHeight}
          maxHeight={Consts.maxCanvasHeight}
          applyLabel='apply'
          onApply={(v) => setGlobalConfig('default', 'canvasSize', v)}
        />
      </ConfigItem>
    </>
  );
};

export default StartupConfigSection;
