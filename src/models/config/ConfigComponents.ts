export type LabelMode = 'none' | 'left' | 'right';

export type ConfigComponentName = 'Dropdown' | 'Slider' | 'CheckBox' | 'RadioButton' | 'ToggleSwitch';

export type ConfigComponentProps = {
  labelByComponent: boolean;
  labelMode: LabelMode;
};

export const componentProps = new Map<ConfigComponentName, ConfigComponentProps>([
  [
    'Dropdown',
    {
      labelByComponent: false,
      labelMode: 'none',
    },
  ],
  [
    'Slider',
    {
      labelByComponent: true,
      labelMode: 'left',
    },
  ],
  [
    'CheckBox',
    {
      labelByComponent: false,
      labelMode: 'right',
    },
  ],
  [
    'RadioButton',
    {
      labelByComponent: false,
      labelMode: 'right',
    },
  ],
  [
    'ToggleSwitch',
    {
      labelByComponent: false,
      labelMode: 'right',
    },
  ],
]);
