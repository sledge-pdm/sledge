import { css } from '@acab/ecsstatic';
import {
  componentProps,
  ConfigFieldRenderer,
  getValueAtPath,
  Icon,
  Light,
  pathToArray,
  type ConfigField,
} from '@sledge/ui';
import { appConfigDir } from '@tauri-apps/api/path';
import { confirm, message } from '@tauri-apps/plugin-dialog';
import { Component, createSignal, For, onMount, Show } from 'solid-js';
import { ConfigSections, FieldMeta } from '~/config/ConfigMeta';
import { GlobalConfig } from '~/config/GlobalConfig';
import { debugMetas } from '~/config/meta/Debug';
import { defaultMetas } from '~/config/meta/Default';
import { editorMetas } from '~/config/meta/Editor';
import { generalMetas } from '~/config/meta/General';
import { performanceMetas } from '~/config/meta/Performance';
import { Consts } from '~/Consts';
import { loadGlobalSettings } from '~/features/io/config/load';
import { resetToDefaultConfig } from '~/features/io/config/reset';
import { saveGlobalSettings } from '~/features/io/config/save';
import { globalConfig, setGlobalConfig } from '~/stores/GlobalStores';
import { accentedButton, flexRow } from '~/styles/styles';
import { normalizeJoin } from '~/utils/FileUtils';
import { revealInFileBrowser } from '~/utils/NativeOpener';
import { listenEvent } from '~/utils/TauriUtils';
import { openWindow } from '~/utils/WindowUtils';
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
  font-family: ZFB09;
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
  margin: 28px 20px;
  padding-bottom: var(--spacing-md);
`;

const configFormFieldHeader = css`
  font-size: 12px;
  font-family: ZFB31;
  letter-spacing: 1px;
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
  opacity: 0.2;
  cursor: help;
`;

const configFormFieldLabel = css`
  font-family: ZFB21;
  vertical-align: middle;
  text-align: left;
  margin-left: 8px;
  margin-right: 8px;
`;

const configFormFieldControlWrapper = css`
  display: flex;
  flex-direction: row;
  max-width: 260px;
  margin-left: 16px;
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

const configFormLink = css`
  width: fit-content;
  color: #ccc;
`;

const configFormAbout = css`
  width: fit-content;
  color: #ccc;
  margin-top: 8px;
`;

const getValueFromMetaPath = (meta: FieldMeta) => getValueAtPath(globalConfig, meta.path);

function getParsedValueFromMetaPath(meta: FieldMeta) {
  let v = getValueFromMetaPath(meta);

  switch (meta.component) {
    case 'CheckBox':
    case 'ToggleSwitch':
      v = v ? 'enabled' : 'disabled';
      break;
  }

  return String(v);
}

interface Props {
  onClose?: () => void;
}

const ConfigForm: Component<Props> = (props) => {
  const [currentSection, setSection] = createSignal<ConfigSections>(ConfigSections.General);
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
      message('reset succeeded.');
    }
  };

  const onFieldChange = (meta: FieldMeta, v: any) => checkDirty();
  const onKeyConfigChange = () => checkDirty();

  const checkDirty = () => {
    if (
      JSON.stringify({
        ...originalConfig,
        misc: undefined,
      }) !==
      JSON.stringify({
        ...globalConfig,
        misc: undefined,
      })
    ) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  };

  const [grouped, setGrouped] = createSignal<Map<ConfigSections, FieldMeta[]>>(new Map());

  let originalConfig: GlobalConfig | undefined;
  onMount(async () => {
    await loadGlobalSettings();

    const settingsMeta = [
      ...generalMetas,
      ...editorMetas,
      ...performanceMetas,
      ...defaultMetas,
      ...debugMetas,
    ] as const satisfies readonly FieldMeta[];

    originalConfig = JSON.parse(JSON.stringify(globalConfig));
    const grouped = settingsMeta.reduce((map, field) => {
      const arr = map.get(field.section) ?? [];
      arr.push(field);
      map.set(field.section, arr);
      return map;
    }, new Map<ConfigSections, FieldMeta[]>());
    setGrouped(grouped);
  });

  listenEvent('onSettingsSaved', async () => {
    await loadGlobalSettings();
    originalConfig = JSON.parse(JSON.stringify(globalConfig));
    checkDirty();
  });

  return (
    <div class={configFormRoot}>
      <div class={configFormSections}>
        <For each={Object.values(ConfigSections)}>
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
            <Show when={currentSection() === ConfigSections.KeyConfig}>
              <KeyConfigSettings onKeyConfigChange={onKeyConfigChange} />
            </Show>
            <Show when={currentSection() !== ConfigSections.KeyConfig}>
              <For each={grouped().get(currentSection())}>
                {(meta) => {
                  const componentName = typeof meta.component === 'string' ? meta.component : undefined;
                  const componentProp = componentName ? componentProps.get(componentName) : undefined;
                  const shouldShowLeftLabel = !componentProp?.labelByComponent && componentProp?.labelMode === 'left';
                  const shouldShowRightLabel = !componentProp?.labelByComponent && componentProp?.labelMode === 'right';
                  const value = () => getValueFromMetaPath(meta);
                  const onChange = (v: any) => {
                    const arrPath = pathToArray(meta.path);
                    (setGlobalConfig as unknown as (...args: any[]) => void)(...arrPath, v);
                    onFieldChange(meta, v);
                  };

                  return (
                    <div class={configFormFieldItem}>
                      <div class={flexRow}>
                        <Icon src={'/icons/misc/bullet_s_8.png'} base={8} />
                        <p class={configFormFieldLabel}>{meta.label?.toUpperCase()}</p>
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
                        <ConfigFieldRenderer field={meta as ConfigField} value={value} onChange={onChange} />
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
      </div>

      <div class={configFormInfoAreaBottom}>
        <a class={configFormLink} onClick={loadDefaults}>
          reset to default.
        </a>
        <a
          class={configFormLink}
          onClick={async () => {
            await revealInFileBrowser(normalizeJoin(await appConfigDir(), Consts.globalConfigFileName));
          }}
        >
          Open Config File.
        </a>

        <a
          class={configFormAbout}
          onClick={() => {
            openWindow('about');
          }}
        >
          about.
        </a>
      </div>
    </div>
  );
};

export default ConfigForm;
