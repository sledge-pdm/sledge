import { css } from '@acab/ecsstatic';
import { clsx } from '@sledge/core';
import { color } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { useLocation, useNavigate } from '@solidjs/router';
import { Component, createMemo, Show } from 'solid-js';

const container = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  pointer-events: all;
  padding: 8px 12px;
  min-height: 28px;
  gap: 12px;
  cursor: pointer;

  &:hover {
    background-color: #88888830;
  }
  &:hover > * {
    color: var(--color-active);
  }
`;

const containerSelected = css`
  background-color: #88888830;
  cursor: default;
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
      class={clsx(container, isCurrent() && containerSelected)}
      onClick={() => {
        navigate(props.href);
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
