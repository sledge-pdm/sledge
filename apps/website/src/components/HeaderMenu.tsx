import { vars } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { useLocation } from '@solidjs/router';
import { Component, For, Show } from 'solid-js';
import { menuItem, menuText, menuTextContainer } from '~/styles/header_menu.css';

interface Route {
  path: string;
  label: string;
}

const routes: Route[] = [
  {
    path: '/',
    label: 'About.',
  },
  {
    path: '/download',
    label: 'Download.',
  },
  {
    path: '/features',
    label: 'features.',
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
            const isPlay = () => route.path === '/play';
            return (
              <>
                <div class={menuItem}>
                  {/* <Icon src='icons/misc/dot.png' base={8} color={vars.color.muted} /> */}
                  <a
                    class={menuText}
                    href={route.path}
                    style={{
                      color: isInPath() ? vars.color.active : vars.color.onBackground,
                      opacity: isInPath() ? 1 : 0.8,
                      'text-decoration': isPlay() ? 'line-through' : undefined,
                      'pointer-events': isPlay() || isInPath() ? 'none' : undefined,
                    }}
                  >
                    {route.label}
                  </a>
                  <Show when={route.path === '/play'}>
                    <Icon src='icons/misc/open_external.png' base={8} color={vars.color.muted} />
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
