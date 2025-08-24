import { vars } from '@sledge/theme';
import { type Accessor, type Component } from 'solid-js';

interface ColorBoxProps {
  class?: string;
  enableUsingSelection?: boolean;
  sizePx?: number;
  color: string;
  forceBorderColor?: string;
  onClick?: (color: string) => void;
  currentColor?: Accessor<string>;
}

const ColorBox: Component<ColorBoxProps> = (props: ColorBoxProps) => {
  const size = () => props.sizePx || 10;

  const isSelected = () => props.enableUsingSelection && props.currentColor?.() === props.color;
  const isWhiteOrNone = () => props.color === 'none' || props.color.toLowerCase() === '#ffffff';

  const preferedBorder = () => (isWhiteOrNone() || isSelected() ? `1px solid ${vars.color.onBackground}` : `1px solid ${vars.color.border}`);

  const onColorClicked = (color: string) => {
    if (props.onClick) props.onClick(color);
  };

  return (
    <div class={props.class}>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          width: `${size()}px`,
          height: `${size()}px`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            width: `${size()}px`,
            height: `${size()}px`,
            'align-items': 'center',
            'justify-content': 'center',
            cursor: 'pointer',
            'background-color': props.color,
            border: props.forceBorderColor ? `1px solid ${props.forceBorderColor}` : preferedBorder(),
          }}
          onClick={() => {
            onColorClicked(props.color);
          }}
        />
        {props.enableUsingSelection && isSelected() && (
          <div
            style={{
              width: `${Math.round(size() / 3)}px`,
              height: `${Math.round(size() / 3)}px`,
              margin: 0,
              padding: 0,
              'backdrop-filter': 'invert()',
              filter: 'grayscale() contrast(20) contrast(20)',
            }}
            onClick={() => {
              onColorClicked(props.color);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ColorBox;
