import { css } from '@acab/ecsstatic';
import { color } from '@sledge-pdm/ui';
import { Component, For, createMemo } from 'solid-js';
import { BreadcrumbEntry, buildBreadcrumbItems } from '~/components/section/explorer/utils/path';

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
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: PM10;
  font-size: 10px;

  &:disabled {
    cursor: default;
    opacity: 1;
  }
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
            <button
              type='button'
              disabled={index() === items().length - 1}
              onClick={() => {
                if (index() === items().length - 1) return;
                props.onNavigate(item.value);
              }}
              class={breadcrumbLink}
              style={{
                color: index() === items().length - 1 ? color.accent : color.onBackground,
              }}
            >
              {item.label}
            </button>
          </div>
        )}
      </For>
    </div>
  );
};

export default Breadcrumbs;
