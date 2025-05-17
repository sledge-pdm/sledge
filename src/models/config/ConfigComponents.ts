export enum LabelMode {
  NONE,
  LEFT,
  RIGHT,
}

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
      labelMode: LabelMode.NONE,
    },
  ],
  [
    'Slider',
    {
      labelByComponent: true,
      labelMode: LabelMode.LEFT,
    },
  ],
  [
    'CheckBox',
    {
      labelByComponent: false,
      labelMode: LabelMode.RIGHT,
    },
  ],
  [
    'RadioButton',
    {
      labelByComponent: false,
      labelMode: LabelMode.RIGHT,
    },
  ],
  [
    'ToggleSwitch',
    {
      labelByComponent: false,
      labelMode: LabelMode.RIGHT,
    },
  ],
]);
