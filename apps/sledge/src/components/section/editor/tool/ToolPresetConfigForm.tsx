import { css } from '@acab/ecsstatic';
import { spacing } from '@sledge/theme';
import { Checkbox, Dropdown, Slider, ToggleSwitch } from '@sledge/ui';
import { Component, createEffect, createMemo, createSignal, For, onMount, Show } from 'solid-js';
import { componentProps } from '~/config/ConfigComponent';
import { getPresetMetaByToolId, PresetFieldMeta } from '~/features/tools/presets';
import { ToolCategoryId } from '~/features/tools/Tools';
import { toolStore } from '~/stores/EditorStores';
import { flexCol, flexRow } from '~/styles/styles';
import { eventBus } from '~/utils/EventBus';

const label = css`
  font-family: ZFB09;
  vertical-align: middle;
  margin-bottom: -1px;
  text-align: left;
  margin-right: 8px;
`;

interface Props {
  toolId: ToolCategoryId;
  onConfigChange: (key: string, value: any) => void;
}

function FieldRenderer(props: { meta: PresetFieldMeta; value: any; onChange: (v: any) => void }) {
  const { meta, value, onChange } = props;

  switch (meta.component) {
    case 'Dropdown':
      return <Dropdown value={value()} options={meta.props?.options} onChange={onChange} />;
    case 'Slider':
      return (
        <Slider
          defaultValue={value()}
          value={value()}
          min={meta.props?.min ?? 0}
          max={meta.props?.max ?? 0}
          labelMode={componentProps.get('Slider')?.labelMode ?? 'left'}
          customFormat={meta.customFormat}
          wheelSpin={meta.props?.wheelSpin ?? true}
          allowDirectInput={true}
          allowFloat={meta.props?.allowFloat ?? false}
          floatSignificantDigits={meta.props?.floatSignificantDigits}
          onChange={onChange}
          {...meta.props}
        />
      );
    case 'CheckBox':
      return <Checkbox id={meta.key} checked={value()} onChange={onChange} />;
    case 'ToggleSwitch':
      return <ToggleSwitch id={meta.key} checked={value()} onChange={onChange} />;
    case 'Custom':
      return meta.props?.content?.() ?? null;
    default:
      return <div>Unsupported component: {meta.component}</div>;
  }
}

const ToolPresetConfigForm: Component<Props> = (props) => {
  const presets = createMemo(() => toolStore.tools[props.toolId].presets);
  const [options, setOptions] = createSignal(presets()?.selected ? presets()!.options[presets()!.selected] : undefined);
  const [presetMeta, setPresetMeta] = createSignal(getPresetMetaByToolId(props.toolId));

  if (!presetMeta() || !presets()) {
    return null;
  }

  onMount(() => {
    eventBus.on('tools:presetLoaded', (e) => {
      if (props.toolId === e.toolId) {
        console.log('loaded preset for tool:', props.toolId);
        setPresetMeta(getPresetMetaByToolId(props.toolId));
        setOptions(presets()?.selected ? presets()!.options[presets()!.selected] : undefined);
      }
    });
  });

  createEffect(() => {
    setPresetMeta(getPresetMetaByToolId(props.toolId));
    setOptions(presets()?.selected ? presets()!.options[presets()!.selected] : undefined);
  });

  return (
    <div class={flexCol} style={{ gap: '12px' }}>
      <Show when={presetMeta()?.fields}>
        <For each={presetMeta()!.fields}>
          {(fieldMeta) => {
            if (fieldMeta.condition) {
              const condition = fieldMeta.condition();
              if (!condition) return null;
            }

            const value = () => options()[fieldMeta.key] ?? '';
            const onChange = (newValue: any) => {
              props.onConfigChange(fieldMeta.key, newValue);
            };

            return (
              <div class={flexRow} style={{ width: '100%', 'min-height': '16px', 'align-items': 'center' }}>
                <Show when={fieldMeta.label}>
                  <div class={flexRow} style={{ width: '80px' }}>
                    <label class={label} for={fieldMeta.key}>
                      {fieldMeta.label}
                    </label>
                  </div>
                </Show>
                <div class={flexRow} style={{ 'flex-grow': 1, 'justify-content': 'end' }}>
                  <FieldRenderer meta={fieldMeta} value={value} onChange={onChange} />
                </div>
              </div>
            );
          }}
        </For>
      </Show>
    </div>
  );
};

export default ToolPresetConfigForm;
