import { Dropdown, Slider, ToggleSwitch } from '@sledge-pdm/ui';
import { Component } from 'solid-js';
import ConfigItem from '~/components/config/ConfigItem';
import ConfigNumberInput from '~/components/config/ConfigNumberInput';
import { configFormFieldControlLabel, configFormFieldHeader } from '~/components/config/ConfigStyles';
import { maxLayerCountConfig } from '~/config/GlobalConfig';
import { globalConfig, setGlobalConfig } from '~/stores/GlobalStores';

const centeringOptions = [
  { label: 'disabled', value: 'disabled' },
  { label: 'offset only', value: 'offset' },
  { label: 'offset+zoom', value: 'offset_zoom' },
] as const;

const CanvasConfigSection: Component = () => {
  return (
    <>
      <p class={configFormFieldHeader}>POINTER.</p>
      <ConfigItem label='cursor' tips='cursor type.'>
        <Dropdown
          value={globalConfig.editor.cursor}
          options={[
            { label: 'none', value: 'none' },
            { label: 'pixel', value: 'pixel' },
            { label: 'cross', value: 'cross' },
          ]}
          onChange={(v) => setGlobalConfig('editor', 'cursor', v)}
        />
      </ConfigItem>
      <ConfigItem label='show pointed pixel' tips='whether if shows pointed pixel as rect.'>
        <ToggleSwitch
          labelMode='none'
          checked={globalConfig.editor.showPointedPixel}
          onChange={(v) => setGlobalConfig('editor', 'showPointedPixel', v)}
        />
        <label class={configFormFieldControlLabel} style={{ 'padding-left': 'var(--spacing-sm)' }}>
          {globalConfig.editor.showPointedPixel ? 'enabled' : 'disabled'}.
        </label>
      </ConfigItem>
      <ConfigItem label='use raw pointer update' tips='use higher frequency pointer tracking.'>
        <ToggleSwitch labelMode='none' checked={globalConfig.editor.useRawMove} onChange={(v) => setGlobalConfig('editor', 'useRawMove', v)} />
        <label class={configFormFieldControlLabel} style={{ 'padding-left': 'var(--spacing-sm)' }}>
          {globalConfig.editor.useRawMove ? 'enabled' : 'disabled'}.
        </label>
      </ConfigItem>

      <p class={configFormFieldHeader}>ZOOM / ROTATE.</p>
      <ConfigItem label='rotate degree per shift+wheel' tips='the amount of rotation per wheel scroll with pressing shift key.'>
        <Slider
          labelMode='left'
          labelWidth={32}
          value={globalConfig.editor.rotateDegreePerWheelScroll}
          min={1}
          max={45}
          allowFloat={false}
          allowDirectInput
          wheelSpin
          customFormat={(v) => v + '°'}
          onChange={(v) => setGlobalConfig('editor', 'rotateDegreePerWheelScroll', v)}
        />
      </ConfigItem>
      <ConfigItem
        label='0 degree snap threshold (on touch)'
        tips={`Available in two-finger touch rotation only.\ncanvas rotation degree will be snapped to 0° until this threshold.`}
      >
        <Slider
          labelMode='left'
          labelWidth={32}
          value={globalConfig.editor.touchRotationZeroSnapThreshold}
          min={1}
          max={15}
          allowFloat={false}
          allowDirectInput
          wheelSpin
          customFormat={(v) => v + '°'}
          onChange={(v) => setGlobalConfig('editor', 'touchRotationZeroSnapThreshold', v)}
        />
      </ConfigItem>
      <ConfigItem label='center canvas on resize' tips='centering canvas when area resized.'>
        <Dropdown
          value={globalConfig.editor.centerCanvasOnResize}
          options={[...centeringOptions]}
          onChange={(v) => setGlobalConfig('editor', 'centerCanvasOnResize', v)}
        />
      </ConfigItem>
      <ConfigItem label='center canvas on window maximize' tips='centering canvas when window maximized.'>
        <Dropdown
          value={globalConfig.editor.centerCanvasOnMaximize}
          options={[...centeringOptions]}
          onChange={(v) => setGlobalConfig('editor', 'centerCanvasOnMaximize', v)}
        />
      </ConfigItem>

      <p class={configFormFieldHeader}>LAYERS.</p>
      <ConfigItem label='max layer count' tips='maximum number of layers that can exist in a project.'>
        <ConfigNumberInput
          value={globalConfig.editor.maxLayerCount ?? maxLayerCountConfig.defaultValue}
          min={maxLayerCountConfig.min}
          max={maxLayerCountConfig.max}
          applyLabel='apply'
          onApply={(v) => setGlobalConfig('editor', 'maxLayerCount', v)}
        />
      </ConfigItem>

      <p class={configFormFieldHeader}>MISC.</p>
      <ConfigItem
        label='ruler mark direction'
        tips='direction of ruler marks. outward: marks extend away from canvas, inward: marks extend into canvas area.'
      >
        <Dropdown
          value={globalConfig.editor.rulerMarkDirection}
          options={[
            { label: 'outward', value: 'outward' },
            { label: 'inward', value: 'inward' },
          ]}
          onChange={(v) => setGlobalConfig('editor', 'rulerMarkDirection', v)}
        />
      </ConfigItem>
    </>
  );
};

export default CanvasConfigSection;
