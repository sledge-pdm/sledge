export enum LabelMode {
  NONE,
  LEFT,
  RIGHT,
}

export type ConfigComponentName = 'Dropdown' | 'Slider' | 'CheckBox' | 'RadioButton' | 'ToggleSwitch';

export type ConfigComponentProps = {
  labelMode: LabelMode;
};

export const componentProps = new Map<ConfigComponentName, ConfigComponentProps>([
  [
    'Dropdown',
    {
      labelMode: LabelMode.NONE,
    },
  ],
  [
    'Slider',
    {
      labelMode: LabelMode.LEFT,
    },
  ],
  [
    'CheckBox',
    {
      labelMode: LabelMode.RIGHT,
    },
  ],
  [
    'RadioButton',
    {
      labelMode: LabelMode.RIGHT,
    },
  ],
  [
    'ToggleSwitch',
    {
      labelMode: LabelMode.RIGHT,
    },
  ],
]);
