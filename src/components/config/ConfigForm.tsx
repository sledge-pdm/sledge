import { css } from '@acab/ecsstatic';
import { clsx } from '@sledge-pdm/core';
import { Light } from '@sledge-pdm/ui';
import { Component, createEffect, createSignal, For, Match, on, onCleanup, onMount, Show, Switch } from 'solid-js';
import { ConfigSections } from '~/components/config/ConfigSections';
import CanvasConfigSection from '~/components/config/sections/CanvasConfigSection';
import DebugConfigSection from '~/components/config/sections/DebugConfigSection';
import GeneralConfigSection from '~/components/config/sections/GeneralConfigSection';
import PerformanceConfigSection from '~/components/config/sections/PerformanceConfigSection';
import ProtectionConfigSection from '~/components/config/sections/ProtectionConfigSection';
import StartupConfigSection from '~/components/config/sections/StartupConfigSection';
import { GlobalConfig } from '~/config/GlobalConfig';
import { Consts } from '~/Consts';
import { loadGlobalConfig } from '~/features/io/config/load';
import { resetToDefaultConfig } from '~/features/io/config/reset';
import { saveGlobalSettings } from '~/features/io/config/save';
import { globalConfig } from '~/stores/GlobalStores';
import { accentedButton } from '~/styles/styles';
import { normalizeJoin } from '~/utils/FileUtils';
import { revealInFileBrowser } from '~/utils/NativeOpener';
import { dialog, path, UnlistenFn } from '~/utils/platform';
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
  padding-top: 18px;
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

const configFormSectionItemSelected = css`
  background-color: var(--color-surface);
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
  margin: 8px 20px 28px 20px;
  padding-bottom: var(--spacing-md);
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
    const confirmed = await dialog.confirm('this operation will reset ALL settings.\nsure to reset?', {
      kind: 'warning',
      okLabel: 'reset settings.',
      cancelLabel: 'cancel.',
      title: 'confirmation',
    });

    if (confirmed) {
      resetToDefaultConfig();
      dialog.message('reset succeeded.');
    }
  };

  const onKeyConfigChange = () => checkDirty();

  const checkDirty = () => {
    if (!originalConfig) return;
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

  let originalConfig: GlobalConfig | undefined;

  let unlistenOnSettingSaved: UnlistenFn | undefined;

  // The sections write to globalConfig directly, so any change to it re-evaluates the dirty state.
  createEffect(on(() => JSON.stringify(globalConfig), checkDirty, { defer: true }));

  onMount(async () => {
    await loadGlobalConfig();

    originalConfig = JSON.parse(JSON.stringify(globalConfig));

    unlistenOnSettingSaved = await listenEvent('onSettingsSaved', async () => {
      await loadGlobalConfig();
      originalConfig = JSON.parse(JSON.stringify(globalConfig));
      checkDirty();
    });
  });

  onCleanup(() => {
    unlistenOnSettingSaved?.();
  });

  return (
    <div class={configFormRoot}>
      <div class={configFormSections}>
        <For each={Object.values(ConfigSections)}>
          {(section) => (
            <div
              class={clsx(configFormSectionItem, section === currentSection() && configFormSectionItemSelected)}
              onClick={() => setSection(section)}
            >
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
          <Switch>
            <Match when={currentSection() === ConfigSections.General}>
              <GeneralConfigSection />
            </Match>
            <Match when={currentSection() === ConfigSections.Performance}>
              <PerformanceConfigSection />
            </Match>
            <Match when={currentSection() === ConfigSections.Canvas}>
              <CanvasConfigSection />
            </Match>
            <Match when={currentSection() === ConfigSections.Startup}>
              <StartupConfigSection />
            </Match>
            <Match when={currentSection() === ConfigSections.Protection}>
              <ProtectionConfigSection />
            </Match>
            <Match when={currentSection() === ConfigSections.Shortcuts}>
              <KeyConfigSettings onKeyConfigChange={onKeyConfigChange} />
            </Match>
            <Match when={currentSection() === ConfigSections.Debug}>
              <DebugConfigSection />
            </Match>
          </Switch>
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
            await revealInFileBrowser(normalizeJoin(await path.appConfigDir(), Consts.globalConfigFileName));
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
