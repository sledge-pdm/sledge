import { css } from '@acab/ecsstatic';
import { color } from '@sledge/theme';
import { Component, For, createMemo } from 'solid-js';
import { buildBreadcrumbItems, BreadcrumbEntry } from '~/components/section/explorer/utils/path';

const breadcrumbsContainer = css`
  display: flex;
  flex-direction: row;
  gap: 2px;
  width: 100%;
  flex-wrap: wrap;
  margin-right: auto;
  padding: 4px 8px;
  background: var(--color-surface);
`;

const breadcrumbItem = css`
  display: flex;
  flex-direction: row;
  gap: 4px;
  align-items: center;
`;

const breadcrumbLink = css`
  font-family: PM10;
  font-size: 10px;
`;

interface BreadcrumbsProps {
  path: string;
  onNavigate: (value: string) => void;
}

const Breadcrumbs: Component<BreadcrumbsProps> = (props) => {
  const items = createMemo<BreadcrumbEntry[]>(() => buildBreadcrumbItems(props.path));

  return (
    <div class={breadcrumbsContainer}>
      <For each={items()}>
        {(item, index) => (
          <div class={breadcrumbItem}>
            {index() > 0 && <p>&gt;</p>}
            <a
              onClick={() => {
                if (index() === items().length - 1) return;
                props.onNavigate(item.value);
              }}
              class={breadcrumbLink}
              style={{
                'pointer-events': index() === items().length - 1 ? 'none' : 'auto',
                color: index() === items().length - 1 ? color.accent : color.onBackground,
              }}
            >
              {item.label}
            </a>
          </div>
        )}
      </For>
    </div>
  );
};

export default Breadcrumbs;
