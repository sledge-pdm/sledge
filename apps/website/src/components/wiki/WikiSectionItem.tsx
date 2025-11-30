import { css } from '@acab/ecsstatic';
import { color } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { useLocation, useNavigate } from '@solidjs/router';
import { Component, createMemo, Show } from 'solid-js';

const container = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-left: 4px;
  pointer-events: all;
  padding: 8px;
  min-height: 28px;
  gap: 12px;

  &:hover {
    background-color: #88888815;
  }
  &:hover > * {
    color: var(--color-active);
  }
`;

const itemLink = css`
  font-size: 8px;
  font-family: ZFB09;
  text-decoration: none;
`;

interface Props {
  iconSrc?: string;
  title: string;
  href: string;
  hrefAlt?: string[];
}

const WikiSectionItem: Component<Props> = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isCurrent = createMemo((prev) => {
    if (location.pathname === props.href) {
      return true;
    }
    if (props.hrefAlt) {
      return props.hrefAlt.some((ha) => ha === location.pathname);
    }
    return false;
  });
  return (
    <div
      class={container}
      onClick={() => {
        navigate(props.href);
      }}
      style={{
        'background-color': isCurrent() ? '#88888815' : undefined,
        cursor: !isCurrent() ? 'pointer' : 'default',
      }}
    >
      <Show when={props.iconSrc}>
        <Icon src={props.iconSrc!} base={8} scale={2} color={isCurrent() ? color.active : undefined} />
      </Show>
      <p
        class={itemLink}
        style={{
          color: isCurrent() ? color.active : undefined,
          'border-color': isCurrent() ? color.active : undefined,
        }}
      >
        {props.title}
      </p>
    </div>
  );
};

export default WikiSectionItem;
