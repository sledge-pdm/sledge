import { color } from '@sledge-pdm/ui';
import { Component, createEffect, createSignal, onMount, Show } from 'solid-js';
import { ioStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { Update } from '~/utils/platform';
import { askAndInstallUpdate, getUpdate } from '~/utils/UpdateUtils';
import { addSkippedVersion } from '~/utils/VersionUtils';
import { TopMenuBarItem } from './TopMenuBarItem';

export const UpdateSection: Component = () => {
  const [availableUpdate, setAvailableUpdate] = createSignal<Update | undefined>();

  onMount(async () => {
    await checkUpdate();
  });

  createEffect(async () => {
    globalConfig.debug.updateChannel;
    await checkUpdate();
  });

  createEffect(async () => {
    if (ioStore.isInInitialLoading) {
      await checkUpdate();
    }
  });

  const checkUpdate = async () => {
    const update = await getUpdate();
    if (!availableUpdate()) setAvailableUpdate(update);
  };

  return (
    <>
      <Show when={availableUpdate() && !globalConfig.general.skippedVersions.includes(availableUpdate()?.version || '')}>
        <TopMenuBarItem
          label='! update'
          labelStyleOverride={{
            'font-family': 'ZFB09',
            'font-size': '8px',
            opacity: 1,
            'white-space': 'nowrap',
            color: color.active,
          }}
          action={async () => {
            await askAndInstallUpdate();
          }}
        />
        <TopMenuBarItem
          label='[skip]'
          labelStyleOverride={{
            'font-family': 'ZFB09',
            opacity: 1,
            'white-space': 'nowrap',
            color: color.muted,
          }}
          title={'You can restore skipped updates from settings.'}
          action={() => {
            const skippingVersion = availableUpdate()?.version;
            if (skippingVersion) {
              addSkippedVersion(skippingVersion);
            }
          }}
        />
      </Show>
    </>
  );
};
