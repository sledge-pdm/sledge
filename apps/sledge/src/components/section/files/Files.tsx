import { css } from '@acab/ecsstatic';
import { clsx } from '@sledge/core';
import { color } from '@sledge/theme';
import { Component, createSignal, Match, Switch } from 'solid-js';
import Explorer from '~/components/section/files/Explorer';
import RecentFiles from '~/components/section/files/RecentFiles';

const sectionCaption = css`
  font-family: ZFB09;
  letter-spacing: 3px;
  font-size: 8px;
  opacity: 1;
  white-space: nowrap;
`;

const filesContainer = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 8px;
`;

const tabsContainer = css`
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  margin-bottom: 4px;
`;

const tabButton = css`
  padding: 4px;
`;

const divider = css`
  height: 8px;
  width: 1px;
  background-color: var(--color-muted);
`;

type Tab = 'recent' | 'explore';

const Files: Component = () => {
  const [tab, setTab] = createSignal<Tab>('recent');

  return (
    <div class={filesContainer}>
      <div class={tabsContainer}>
        <a
          class={clsx(sectionCaption, tabButton)}
          style={{ color: tab() === 'recent' ? color.active : color.muted }}
          onClick={() => setTab('recent')}
        >
          recent
        </a>

        <div class={divider} />

        <a
          class={clsx(sectionCaption, tabButton)}
          style={{ color: tab() === 'explore' ? color.active : color.muted }}
          onClick={() => setTab('explore')}
        >
          explore
        </a>
      </div>

      <Switch fallback={<RecentFiles />}>
        <Match when={tab() === 'recent'}>
          <RecentFiles />
        </Match>
        <Match when={tab() === 'explore'}>
          <Explorer />
        </Match>
      </Switch>
    </div>
  );
};

export default Files;
