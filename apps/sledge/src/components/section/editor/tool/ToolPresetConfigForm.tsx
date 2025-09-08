import { componentProps, flexCol, flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Button, Checkbox, Dropdown, Slider, ToggleSwitch } from '@sledge/ui';
import { Component, For } from 'solid-js';
import { getPresetMetaByToolId, PresetFieldMeta } from '~/tools/presets';
import { configFormFieldLabel } from '~/styles/components/config/config_form.css';
import { ToolCategoryId } from '~/tools/Tools';

interface Props {
  toolId: ToolCategoryId;
  presetConfig: any;
  onConfigChange: (key: string, value: any) => void;
}

function FieldRenderer(props: { meta: PresetFieldMeta; value: any; onChange: (v: any) => void }) {
  const { meta, value, onChange } = props;

  function getParsedValue() {
    let v = value();

    switch (meta.component) {
      case 'CheckBox':
      case 'ToggleSwitch':
        v = v ? 'enabled' : 'disabled';
        break;
    }

    // format (like "[value]px" -> "1200px")
    if (meta.customFormat !== undefined) {
      v = meta.customFormat.replaceAll('[value]', v);
    }

    return v;
  }

  switch (meta.component) {
    case 'Dropdown':
      return <Dropdown value={value} options={meta.props?.options} onChange={onChange} />;
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
    case 'Button':
      return (
        <div class={flexCol} style={{ gap: '8px' }}>
          <p style={{ 'white-space': 'pre', 'white-space-trim': 'none' }}>{meta.props?.preContent?.()}</p>
          <Button id={meta.key} onClick={meta.props?.onClick}>
            {meta.props?.content}
          </Button>
        </div>
      );
    default:
      return <div>Unsupported component: {meta.component}</div>;
  }
}

const ToolPresetConfigForm: Component<Props> = (props) => {
  const presetMeta = () => getPresetMetaByToolId(props.toolId);

  if (!presetMeta()) {
    return <div>No preset configuration available for this tool.</div>;
  }

  return (
    <div class={flexCol} style={{ gap: vars.spacing.sm }}>
      <For each={presetMeta()!.fields}>
        {(fieldMeta) => {
          const value = () => props.presetConfig[fieldMeta.key] ?? '';
          const onChange = (newValue: any) => {
            props.onConfigChange(fieldMeta.key, newValue);
          };

          return (
            <div class={flexRow} style={{ width: '100%', 'min-height': '20px', 'align-items': 'center' }}>
              <div class={flexRow} style={{ width: '80px' }}>
                <label class={configFormFieldLabel} for={fieldMeta.key}>
                  {fieldMeta.label}
                </label>
              </div>
              <div class={flexRow} style={{ 'flex-grow': 1, 'justify-content': 'end' }}>
                <FieldRenderer meta={fieldMeta} value={value} onChange={onChange} />
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
};

export default ToolPresetConfigForm;
