import { Theme, themeOptions } from '@sledge/theme';
import { Dropdown } from '@sledge/ui';
import { Component } from 'solid-js';
import { globalStore, setGlobalStore } from '~/store/GlobalStore';

const ThemeToggle: Component<{ noBackground?: boolean }> = (props) => {
  const omittedThemeOptions = themeOptions.filter((option) => option.value !== 'os');
  const animateThemeChange = () => {
    document.body.classList.add('theme-fade');
    setTimeout(() => {
      document.body.classList.remove('theme-fade');
    }, 300); // CSSのtransitionと同じ時間
  };

  const spinTheme = (isUp: boolean) => {
    const currentThemeIndex = omittedThemeOptions.findIndex((option) => option.value === globalStore.theme);
    const nextThemeIndex = isUp
      ? (currentThemeIndex + 1) % omittedThemeOptions.length
      : (currentThemeIndex - 1 + omittedThemeOptions.length) % omittedThemeOptions.length;
    const nextTheme = omittedThemeOptions[nextThemeIndex].value as Theme;

    setGlobalStore('theme', nextTheme);
    animateThemeChange();
  };

  return (
    <div
      onWheel={(e) => {
        spinTheme(e.deltaY > 0);
      }}
    >
      <Dropdown
        value={globalStore.theme}
        options={omittedThemeOptions}
        noBackground={props.noBackground}
        wheelSpin={true}
        onChange={(v) => {
          setGlobalStore('theme', v as Theme);
          animateThemeChange();
        }}
      />
    </div>
  );
};

export default ThemeToggle;
