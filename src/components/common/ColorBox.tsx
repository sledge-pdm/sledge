import { Component } from 'solid-js';
import { currentColor } from '~/controllers/color/ColorController';
import { vars } from '~/styles/global.css';

interface ColorBoxProps {
  class?: string;
  enableUsingSelection?: boolean;
  sizePx?: number;
  color: string;
  forceBorderColor?: string;
  onClick?: (color: string) => void;
}

const ColorBox: Component<ColorBoxProps> = (props: ColorBoxProps) => {
  const size = () => props.sizePx || 10;

  const isSelected = () => props.enableUsingSelection && currentColor() === props.color;
  const isWhiteOrNone = () => props.color === 'none' || props.color.toLowerCase() === '#ffffff';

  const preferedBorder = () => (isWhiteOrNone() || isSelected() ? `0.05rem solid ${vars.color.onBackground}` : '0.05rem solid transparent');

  const onColorClicked = (color: string) => {
    if (props.onClick) props.onClick(color);
  };

  return (
    <div class={props.class}>
      <div
        style={{
          position: 'relative',
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
      >
        {props.enableUsingSelection && isSelected() && (
          <div
            style={{
              width: `${Math.round(size() / 3)}px`,
              height: `${Math.round(size() / 3)}px`,
              margin: 0,
              padding: 0,
              'background-color': props.color !== '#000000' ? 'black' : 'white',
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
