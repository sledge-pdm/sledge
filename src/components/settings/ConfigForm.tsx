import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { confirm } from '@tauri-apps/plugin-dialog';
import { createSignal, For, onMount, Show } from 'solid-js';
import { loadGlobalSettings, resetToDefaultConfig, saveGlobalSettings } from '~/io/global_config/globalSettings';
import { componentProps, LabelMode } from '~/models/config/ConfigComponents';
import { FieldMeta, Sections, settingsMeta } from '~/models/config/GlobalConfig';
import { globalConfig, setGlobalConfig } from '~/stores/GlobalStores';
import {
  configFormFieldControlLabel,
  configFormFieldControlWrapper,
  configFormFieldHeader,
  configFormFieldItem,
  configFormFieldLabel,
  configFormFieldLabelTooltip,
  configFormFields,
  configFormInfoAreaBottom,
  configFormInfoAreaTop,
  configFormLoadDefaults,
  configFormRoot,
  configFormSectionItem,
  configFormSectionLabel,
  configFormSections,
} from '~/styles/components/config/config_form.css';
import { accentedButton, vars } from '~/styles/global.css';
import { flexRow } from '~/styles/snippets.css';
import { emitGlobalEvent } from '~/utils/TauriUtils';
import Checkbox from '../common/control/Checkbox';
import Dropdown from '../common/control/Dropdown';
import RadioButton from '../common/control/RadioButton';
import Slider from '../common/control/Slider';
import ToggleSwitch from '../common/control/ToggleSwitch';
import Light from '../common/Light';
import KeyConfigSettings from './KeyConfigSettings';

const getValueFromMetaPath = (meta: FieldMeta) => meta.path.reduce((obj, key) => (obj as any)[key], globalConfig) as any;

function getParsedValueFromMetaPath(meta: FieldMeta) {
  let v = getValueFromMetaPath(meta);

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

function FieldRenderer(props: { meta: FieldMeta; onChange?: (v: any) => void }) {
  const { meta } = props;

  const value = getValueFromMetaPath(meta);

  // ─┬─ setGlobalConfig の呼び出し
  //  └─ path タプルを any[] にキャストしてから spread
  const onChange = (v: any) => {
    (setGlobalConfig as unknown as (...args: any[]) => void)(...(meta.path as any[]), v);
    if (props.onChange) props.onChange(v);
  };

  switch (meta.component) {
    case 'Dropdown':
      return <Dropdown value={value} options={meta.props?.options} onChange={onChange} />;
    case 'Slider':
      return (
        <Slider
          defaultValue={value}
          min={meta.props?.min ?? 0}
          max={meta.props?.max ?? 0}
          labelMode={componentProps.get('Slider')?.labelMode ?? LabelMode.LEFT}
          customFormat={meta.customFormat}
          allowDirectInput={true}
          onChange={onChange}
          {...meta.props}
        />
      );
    case 'CheckBox':
      return <Checkbox id={meta.path.toString()} checked={value} onChange={onChange} />;
    case 'RadioButton':
      return <RadioButton id={meta.path.toString()} value={value} onChange={onChange} {...meta.props} />;
    case 'ToggleSwitch':
      return <ToggleSwitch id={meta.path.toString()} checked={value} onChange={onChange} />;
  }
}

export default function ConfigForm() {
  const grouped = settingsMeta.reduce((map, field) => {
    const arr = map.get(field.section) ?? [];
    arr.push(field);
    map.set(field.section, arr);
    return map;
  }, new Map<Sections, FieldMeta[]>());

  const [currentSection, setSection] = createSignal<Sections>(Sections.General);
  const [isSaved, setIsSaved] = createSignal(false);
  const [isDirty, setIsDirty] = createSignal(false);

  const manualSave = async () => {
    await saveGlobalSettings();
    await emitGlobalEvent('onSettingsSaved');
    setIsSaved(true);
    setIsDirty(false);
  };

  const loadDefaults = async () => {
    const confirmed = await confirm('this operation will reset ALL settings.\nsure to reset?', {
      kind: 'warning',
      okLabel: 'reset settings.',
      cancelLabel: 'cancel.',
      title: 'confirmation',
    });

    if (confirmed) {
      resetToDefaultConfig();
      location.reload();
    }
  };

  const onFieldChange = (meta: FieldMeta, v: any) => {
    setIsDirty(true);
  };

  onMount(async () => {
    await loadGlobalSettings();
    getCurrentWebviewWindow().onCloseRequested(async (e) => {
      if (isDirty()) {
        const confirmed = await confirm('there are unsaved changes.\nsure to quit w/o save?', {
          kind: 'warning',
          okLabel: 'quit w/o save.',
          cancelLabel: 'cancel.',
          title: 'confirmation',
        });

        if (!confirmed) {
          e.preventDefault();
        }
      }
    });
  });

  return (
    <div class={configFormRoot}>
      <div class={configFormSections}>
        <For each={Object.values(Sections)}>
          {(section) => (
            <div class={configFormSectionItem} onClick={() => setSection(section)}>
              <Light on={section === currentSection()} color={vars.color.accent} />
              <a class={configFormSectionLabel} style={section === currentSection() ? { color: vars.color.accent } : {}}>
                {section.toUpperCase()}.
              </a>
            </div>
          )}
        </For>
      </div>
      <div class={configFormFields}>
        <Show when={currentSection() !== undefined}>
          <p class={configFormFieldHeader}>{currentSection().toUpperCase()}.</p>
          <Show when={currentSection() === Sections.KeyConfig}>
            <KeyConfigSettings />
          </Show>
          <Show when={currentSection() !== Sections.KeyConfig}>
            <For each={grouped.get(currentSection())}>
              {(meta) => {
                const componentProp = componentProps.get(meta.component);
                const shouldShowLeftLabel = !componentProp?.labelByComponent && componentProp?.labelMode === LabelMode.LEFT;
                const shouldShowRightLabel = !componentProp?.labelByComponent && componentProp?.labelMode === LabelMode.RIGHT;
                return (
                  <div class={configFormFieldItem}>
                    <div class={flexRow}>
                      <p class={configFormFieldLabel}>{meta.label}</p>
                      <Show when={meta.tips !== undefined}>
                        <p class={configFormFieldLabelTooltip} title={meta.tips ?? undefined}>
                          ?
                        </p>
                      </Show>
                    </div>
                    <div class={configFormFieldControlWrapper}>
                      <Show when={shouldShowLeftLabel}>
                        <label for={meta.path.toString()} class={configFormFieldControlLabel}>
                          {getParsedValueFromMetaPath(meta)}.
                        </label>
                      </Show>
                      <FieldRenderer meta={meta} onChange={(v) => onFieldChange(meta, v)}></FieldRenderer>
                      <Show when={shouldShowRightLabel}>
                        <label for={meta.path.toString()} class={configFormFieldControlLabel} style={{ 'padding-left': vars.spacing.sm }}>
                          {getParsedValueFromMetaPath(meta)}.
                        </label>
                      </Show>
                    </div>
                  </div>
                );
              }}
            </For>
          </Show>
        </Show>
      </div>

      <div class={configFormInfoAreaTop}>
        <Show when={!isDirty() && isSaved()}>
          <p>SAVED!</p>
        </Show>
        <button class={accentedButton} disabled={!isDirty()} onClick={manualSave}>
          {isDirty() ? 'save' : 'no changes'}
        </button>
      </div>

      <div class={configFormInfoAreaBottom}>
        <a class={configFormLoadDefaults} onClick={loadDefaults}>
          load defaults
        </a>
      </div>
    </div>
  );
}
