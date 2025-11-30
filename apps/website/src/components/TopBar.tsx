import { css } from '@acab/ecsstatic';
import { clsx } from '@sledge/core';
import { Icon } from '@sledge/ui';
import { useLocation } from '@solidjs/router';
import { Component, createMemo } from 'solid-js';
import ThemeToggle from '~/components/ThemeToggle';

const barRoot = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  height: 24px;
  border-bottom: 1px solid var(--color-border);
  padding: 0 8px 0 4rem;
`;

const routesMenuContainer = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;
const routesItem = css`
  font-size: 8px;
  font-family: ZFB21;
  text-transform: uppercase;
`;
const routesItemActive = css`
  color: var(--color-enabled);
  text-decoration: none;
`;
const spacer = css`
  flex-grow: 1;
`;

const iconContainer = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

interface RouteItemProps {
  href?: string;
  children: string;
}
const RouteItem: Component<RouteItemProps> = (props) => {
  const location = useLocation();
  const isCurrent = createMemo(() => {
    if (props.href === '/') return location.pathname === props.href;
    return props.href && location.pathname.startsWith(props.href);
  });
  return (
    <a class={clsx(routesItem, isCurrent() && routesItemActive)} href={props.href}>
      {props.children}
    </a>
  );
};

const TopBar: Component = () => {
  return (
    <div class={barRoot}>
      <div class={routesMenuContainer}>
        <RouteItem href={'/'}>home</RouteItem>
        <RouteItem href={'/wiki'}>wiki</RouteItem>
        <RouteItem href={'/playground'}>playground</RouteItem>
      </div>
      <div class={spacer} />
      <ThemeToggle noBackground />
      <div class={iconContainer}>
        <a href='https://x.com/sledge_app' target='_blank' title='@sledge_app'>
          <Icon src='/icons/x_16.png' base={16} />
        </a>
        <a href='https://github.com/sledge-pdm/sledge' target='_blank' title='sledge-pdm/sledge'>
          <Icon src='/icons/github_16.png' base={16} />
        </a>
      </div>
    </div>
  );
};

export default TopBar;
