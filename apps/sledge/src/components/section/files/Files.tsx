import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Component, createSignal, Match, Switch } from 'solid-js';
import Explorer from '~/components/section/files/Explorer';
import RecentFiles from '~/components/section/files/RecentFiles';
import { sectionCaption } from '~/styles/section/section_item.css';

type Tab = 'recent' | 'explore';

const Files: Component = () => {
  const [tab, setTab] = createSignal<Tab>('recent');

  return (
    <>
      <div class={flexRow} style={{ gap: '8px', 'align-items': 'center', 'margin-bottom': '-4px' }}>
        <a
          class={sectionCaption}
          style={{ padding: '4px', color: tab() === 'recent' ? vars.color.active : vars.color.muted }}
          onClick={() => setTab('recent')}
        >
          recent
        </a>

        <div style={{ height: '8px', width: '1px', 'background-color': vars.color.muted }} />

        <a
          class={sectionCaption}
          style={{ padding: '4px', color: tab() === 'explore' ? vars.color.active : vars.color.muted }}
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
    </>
  );
};

export default Files;
