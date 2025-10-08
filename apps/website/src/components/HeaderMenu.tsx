import { css } from '@acab/ecsstatic';
import { Icon } from '@sledge/ui';
import { A, useLocation } from '@solidjs/router';
import { Component, For, Show } from 'solid-js';

// Styles
const menuTextContainer = css`
  display: flex;
  flex-direction: row;
  box-sizing: border-box;
  width: auto;
  gap: 16px;
`;

const menuItem = css`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const menuText = css`
  font-family: ZFB08, k12x8;
  font-size: 8px;
  letter-spacing: 2px;
  text-decoration: none;

  @media (any-hover: hover) {
    &:hover {
      text-decoration: underline;
    }
  }
  @media (max-width: 599px) {
    font-size: 8px;
  }
`;

interface Route {
  path: string;
  label: string;
}

const routes: Route[] = [
  {
    path: '/about',
    label: 'about.',
  },
  {
    path: '/features',
    label: 'features.',
  },
  {
    path: '/download',
    label: 'download.',
  },
  // {
  //   path: '/play',
  //   label: 'Play.',
  // },
];

const SideBarMenu: Component = () => {
  const location = useLocation();
  return (
    <nav>
      <ul class={menuTextContainer}>
        <For each={routes}>
          {(route, i) => {
            const isInPath = () => location.pathname === route.path;
            const isDownload = () => route.path === '/download';
            const isPlay = () => route.path === '/play';
            return (
              <>
                <div class={menuItem}>
                  {/* <Icon src='/icons/misc/dot.png' base={8} color={vars.color.muted} /> */}
                  <A
                    class={menuText}
                    href={route.path}
                    style={{
                      color: isInPath() ? 'var(--color-active)' : 'var(--color-on-background)',
                      opacity: isInPath() ? 1 : 0.8,
                      'text-decoration': isPlay() ? 'line-through' : undefined,
                      'pointer-events': isPlay() || isInPath() ? 'none' : undefined,
                    }}
                  >
                    {route.label}
                  </A>
                  <Show when={route.path === '/play'}>
                    <Icon src='/icons/misc/open_external.png' base={8} color={'var(--color-muted)'} />
                  </Show>
                  {/* <p>/</p> */}
                </div>
              </>
            );
          }}
        </For>
      </ul>
    </nav>
  );
};

export default SideBarMenu;
