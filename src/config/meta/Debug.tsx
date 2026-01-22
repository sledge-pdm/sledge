import { css } from '@acab/ecsstatic';
import { Dropdown } from '@sledge-pdm/ui';
import { Show } from 'solid-js';
import { ConfigSections, FieldMeta } from '~/config/ConfigMeta';
import { flexCol } from '~/styles/styles';

const devWarnText = css`
  color: var(--color-warn);
`;

export const debugMetas: FieldMeta[] = [
  { section: ConfigSections.Debug, kind: 'header', header: 'monitor' },
  {
    section: ConfigSections.Debug,
    path: 'debug/showPerformanceMonitor',
    label: 'show performance monitor',
    component: 'ToggleSwitch',
    tips: `show performance monitor.`,
  },
  { section: ConfigSections.Debug, kind: 'header', header: 'pen/eraser (experimental)' },
  {
    section: ConfigSections.Debug,
    path: 'debug/useRawMove',
    label: 'use raw pointer update',
    component: 'ToggleSwitch',
    tips: 'use pointerrawupdate for pen/eraser instead of pointermove.',
  },
  {
    section: ConfigSections.Debug,
    path: 'debug/disableCompletionLine',
    label: 'disable completion line',
    component: 'ToggleSwitch',
    tips: 'disable line completion between samples for pen/eraser.',
  },
  { section: ConfigSections.Debug, kind: 'header', header: 'updates' },
  {
    section: ConfigSections.Debug,
    path: 'debug/updateChannel',
    label: 'update channel',
    component: ({ value, onChange }) => {
      return (
        <div class={flexCol} style={{ gap: '8px' }}>
          <Dropdown
            value={value()}
            options={[
              { label: 'stable', value: 'stable' },
              { label: 'stable + dev', value: 'stable|dev' },
              { label: 'dev only', value: 'dev' },
            ]}
            onChange={(v) => onChange(v)}
          />
          <Show when={value().includes('dev')}>
            <p class={devWarnText}>
              Dev builds can be unstable and may put your computer or projects at risk.
              <br />
              Use at your own risk!
            </p>
          </Show>
        </div>
      );
    },
    tips: 'preferred update channel.',
  },
];
