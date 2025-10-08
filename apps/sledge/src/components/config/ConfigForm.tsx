import { css } from '@acab/ecsstatic';
import { componentProps } from '@sledge/core';
import { Button, Checkbox, Dropdown, Light, RadioButton, Slider, ToggleSwitch } from '@sledge/ui';
import { appConfigDir } from '@tauri-apps/api/path';
import { confirm, message } from '@tauri-apps/plugin-dialog';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { Component, createSignal, For, onMount, Show } from 'solid-js';
import { Consts } from '~/Consts';
import { FieldMeta, GlobalConfig, settingsMeta } from '~/features/config/models/GlobalConfig';
import { Sections } from '~/features/config/models/Sections';
import { loadGlobalSettings } from '~/io/config/load';
import { resetToDefaultConfig } from '~/io/config/reset';
import { saveGlobalSettings } from '~/io/config/save';
import { globalConfig, KeyConfigStore, keyConfigStore, setGlobalConfig } from '~/stores/GlobalStores';
import { accentedButton, flexRow } from '~/styles/StyleSnippets';
import { join } from '~/utils/FileUtils';
import { listenEvent } from '~/utils/TauriUtils';
import KeyConfigSettings from './KeyConfigSettings';

// Ecsstatic styles
const configFormRoot = css`
  display: flex;
  flex-direction: row;
  width: 100%;
  position: relative;
  box-sizing: border-box;
  overflow: hidden;
`;

const configFormSections = css`
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border-secondary);
  width: 170px;
  padding-top: 20px;
`;

const configFormSectionItem = css`
  display: flex;
  flex-direction: row;
  padding: var(--spacing-md);
  padding-right: var(--spacing-lg);
  padding-left: var(--spacing-lg);
  gap: var(--spacing-sm);
  align-items: center;
  cursor: pointer;
  pointer-events: all;

  &:hover {
    background-color: var(--color-surface);
  }
`;

const configFormSectionLabel = css`
  font-family: ZFB11;
  font-size: 8px;
  white-space: nowrap;

  &:hover {
    color: var(--color-on-background);
  }
`;

const configFormFields = css`
  display: flex;
  flex-direction: column;
  position: absolute;
  left: 170px;
  right: 0;
  top: 0;
  bottom: 0;
  overflow-y: scroll;
  box-sizing: border-box;
  gap: var(--spacing-xl);

  &::-webkit-scrollbar {
    width: 2px;
    background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: transparent;
  }

  &:hover::-webkit-scrollbar-thumb {
    background-color: #888;
  }
`;

const configFormScrollContent = css`
  display: flex;
  flex-direction: column;
  overflow-y: visible;
  gap: var(--spacing-xl);
  margin: 32px 28px;
  padding-bottom: var(--spacing-md);
`;

const configFormFieldHeader = css`
  margin-bottom: var(--spacing-xs);
  font-size: 12px;
  font-family: ZFB31;
  color: var(--color-accent);
`;

const configFormFieldItem = css`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--spacing-lg);
`;

const configFormFieldLabelTooltip = css`
  width: fit-content;
  font-family: ZFB09;
  color: var(--color-muted);

  &:hover {
    color: var(--color-active);
  }
`;

const configFormFieldLabel = css`
  font-family: ZFB09;
  vertical-align: middle;
  margin-bottom: -1px;
  text-align: left;
  margin-right: 8px;
`;

const configFormFieldControlWrapper = css`
  display: flex;
  flex-direction: row;
  max-width: 260px;
  margin-left: var(--spacing-md);
  align-items: center;
`;

const configFormFieldControlLabel = css`
  min-width: 64px;
  cursor: pointer;
`;

const configFormInfoAreaTop = css`
  display: flex;
  flex-direction: row;
  position: absolute;
  top: var(--spacing-xl);
  right: var(--spacing-xl);
  align-items: center;
  gap: var(--spacing-md);
`;

const configFormInfoAreaBottom = css`
  display: flex;
  flex-direction: column;
  position: absolute;
  bottom: var(--spacing-xl);
  left: var(--spacing-xl);
  gap: var(--spacing-md);
`;

const configFormLoadDefaults = css`
  color: #ccc;
`;

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

  const value = () => getValueFromMetaPath(meta);

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
          defaultValue={value()}
          min={meta.props?.min ?? 0}
          max={meta.props?.max ?? 0}
          labelMode={componentProps.get('Slider')?.labelMode ?? 'left'}
          customFormat={meta.customFormat}
          allowDirectInput={true}
          onChange={onChange}
          {...meta.props}
        />
      );
    case 'CheckBox':
      return <Checkbox id={meta.path.toString()} checked={value()} onChange={onChange} />;
    case 'RadioButton':
      return <RadioButton id={meta.path.toString()} value={value()} onChange={onChange} {...meta.props} />;
    case 'ToggleSwitch':
      return <ToggleSwitch id={meta.path.toString()} checked={value()} onChange={onChange} />;
    case 'Button':
      return (
        <div
          class={css`
            display: flex;
            flex-direction: column;
            gap: 8px;
          `}
        >
          <p
            class={css`
              white-space: pre;
            `}
          >
            {meta.props?.preContent?.()}
          </p>
          <Button
            id={meta.path.toString()}
            onClick={meta.props?.onClick}
            class={css`
              padding: 4px 4px;
            `}
          >
            {meta.props?.content}
          </Button>
        </div>
      );
  }
}

interface Props {
  onClose?: () => void;
}

const ConfigForm: Component<Props> = (props) => {
  const [currentSection, setSection] = createSignal<Sections>(Sections.General);
  const [isSaved, setIsSaved] = createSignal(false);
  const [isDirty, setIsDirty] = createSignal(false);

  const manualSave = async () => {
    await saveGlobalSettings(true);
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
      // location.reload();
      message('reset succeeded.');
    }
  };

  const onFieldChange = (meta: FieldMeta, v: any) => checkDirty();
  const onKeyConfigChange = () => checkDirty();

  const checkDirty = () => {
    console.log(
      'original globalConfig:',
      JSON.stringify({
        ...originalConfig,
        misc: undefined,
      })
    );
    console.log(
      'globalConfig:',
      JSON.stringify({
        ...globalConfig,
        misc: undefined,
      })
    );
    console.log(
      JSON.stringify({
        ...originalConfig,
        misc: undefined,
      }) !==
        JSON.stringify({
          ...globalConfig,
          misc: undefined,
        })
    );
    console.log('original keyConfigStore:', originalKeyConfig);
    console.log('keyConfigStore:', keyConfigStore);
    console.log(JSON.stringify(originalKeyConfig) !== JSON.stringify(keyConfigStore));
    if (
      JSON.stringify({
        ...originalConfig,
        misc: undefined,
      }) !==
        JSON.stringify({
          ...globalConfig,
          misc: undefined,
        }) ||
      JSON.stringify(originalKeyConfig) !== JSON.stringify(keyConfigStore)
    ) {
      setIsDirty(true);
      console.log('dirty');
    } else {
      setIsDirty(false);
      console.log('clean');
    }
  };

  const [grouped, setGrouped] = createSignal<Map<Sections, FieldMeta[]>>(new Map());

  let originalConfig: GlobalConfig | undefined;
  let originalKeyConfig: KeyConfigStore | undefined;
  onMount(async () => {
    await loadGlobalSettings();
    originalConfig = JSON.parse(JSON.stringify(globalConfig));
    originalKeyConfig = JSON.parse(JSON.stringify(keyConfigStore));
    const grouped = settingsMeta.reduce((map, field) => {
      const arr = map.get(field.section) ?? [];
      arr.push(field);
      map.set(field.section, arr);
      return map;
    }, new Map<Sections, FieldMeta[]>());
    setGrouped(grouped);
  });

  listenEvent('onSettingsSaved', async () => {
    await loadGlobalSettings();
    originalConfig = JSON.parse(JSON.stringify(globalConfig));
    originalKeyConfig = JSON.parse(JSON.stringify(keyConfigStore));
    checkDirty();
  });

  return (
    <div class={configFormRoot}>
      <div class={configFormSections}>
        <For each={Object.values(Sections)}>
          {(section) => (
            <div class={configFormSectionItem} onClick={() => setSection(section)}>
              <Light on={section === currentSection()} color='var(--color-accent)' />
              <a class={configFormSectionLabel} style={section === currentSection() ? { color: 'var(--color-accent)' } : {}}>
                {section.toUpperCase()}.
              </a>
            </div>
          )}
        </For>
      </div>
      <div class={configFormFields}>
        <div class={configFormScrollContent}>
          <Show when={currentSection() !== undefined}>
            <p class={configFormFieldHeader}>{currentSection().toUpperCase()}.</p>
            <Show when={currentSection() === Sections.KeyConfig}>
              <KeyConfigSettings onKeyConfigChange={onKeyConfigChange} />
            </Show>
            <Show when={currentSection() !== Sections.KeyConfig}>
              <For each={grouped().get(currentSection())}>
                {(meta) => {
                  const componentProp = componentProps.get(meta.component);
                  const shouldShowLeftLabel = !componentProp?.labelByComponent && componentProp?.labelMode === 'left';
                  const shouldShowRightLabel = !componentProp?.labelByComponent && componentProp?.labelMode === 'right';
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
                          <label for={meta.path.toString()} class={configFormFieldControlLabel} style={{ 'padding-left': 'var(--spacing-sm)' }}>
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
      </div>

      <div class={configFormInfoAreaTop}>
        <Show when={!isDirty() && isSaved()}>
          <p>SAVED!</p>
        </Show>
        <button class={accentedButton} disabled={!isDirty()} onClick={manualSave}>
          {isDirty() ? 'save' : 'no changes'}.
        </button>
        {/* <button onClick={() => props.onClose?.()}>cancel.</button> */}
      </div>

      <div class={configFormInfoAreaBottom}>
        <a
          class={configFormLoadDefaults}
          onClick={async () => {
            revealItemInDir(join(await appConfigDir(), Consts.globalConfigFileName));
          }}
        >
          Open Config File
        </a>
        <a class={configFormLoadDefaults} onClick={loadDefaults}>
          load defaults
        </a>
      </div>
    </div>
  );
};

export default ConfigForm;
