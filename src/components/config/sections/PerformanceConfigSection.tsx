import { Dropdown, Slider } from '@sledge-pdm/ui';
import { Component } from 'solid-js';
import ConfigItem from '~/components/config/ConfigItem';
import { configFormFieldHeader } from '~/components/config/ConfigStyles';
import { globalConfig, setGlobalConfig } from '~/stores/GlobalStores';

const PerformanceConfigSection: Component = () => {
  return (
    <>
      <p class={configFormFieldHeader}>CANVAS.</p>
      <ConfigItem label='canvas target fps' tips='canvas update FPS.'>
        <Dropdown
          value={globalConfig.performance.targetFPS}
          options={[
            { label: '30', value: '30' },
            { label: '60', value: '60' },
            { label: '144', value: '144' },
          ]}
          onChange={(v) => setGlobalConfig('performance', 'targetFPS', v)}
        />
      </ConfigItem>
      <ConfigItem
        label='rendering mode'
        tips={`determines rendering mode of canvas.
"pixelated" shows sharp edges but misses some lines/shapes when zoomed out.
"crispEdges" is stable, but does not show edges of pixels when zoomed in.
"adaptive" will automatically changes those 2 modes (recommended).`}
      >
        <Dropdown
          value={globalConfig.performance.canvasRenderingMode}
          options={[
            { label: 'adaptive', value: 'adaptive' },
            { label: 'pixelated', value: 'pixelated' },
            { label: 'crispEdges', value: 'crisp-edges' },
          ]}
          onChange={(v) => setGlobalConfig('performance', 'canvasRenderingMode', v)}
        />
      </ConfigItem>

      <p class={configFormFieldHeader}>HISTORY.</p>
      <ConfigItem label='max history items count' tips='the maximum number of history items to keep.'>
        <Slider
          labelMode='left'
          labelWidth={32}
          value={globalConfig.editor.maxHistoryItemsCount}
          min={10}
          max={100}
          allowFloat={false}
          allowDirectInput
          wheelSpin
          onChange={(v) => setGlobalConfig('editor', 'maxHistoryItemsCount', v)}
        />
      </ConfigItem>
    </>
  );
};

export default PerformanceConfigSection;
