import { createSignal, type Component } from 'solid-js';
import type { JSX } from 'solid-js/h/jsx-runtime';

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  hoverContent?: string;
}

const Button: Component<ButtonProps> = (props) => {
  const [isHovered, setIsHovered] = createSignal(false);

  return (
    <button
      {...(props as any)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        ...(typeof props.style === 'object' ? props.style : {}),
      }}
    >
      {/* 元のテキスト - サイズ確保のため常に表示（透明にする場合もある） */}
      <span
        style={{
          visibility: isHovered() && props.hoverContent !== undefined ? 'hidden' : 'visible',
          ...(typeof props.style === 'object' ? props.style : {}),
        }}
      >
        {props.children as any}
      </span>

      {/* ホバー時のテキスト - 絶対配置で重ねる */}
      {isHovered() && props.hoverContent !== undefined && (
        <span
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            'text-align': 'center',
            ...(typeof props.style === 'object' ? props.style : {}),
          }}
        >
          {props.hoverContent}
        </span>
      )}
    </button>
  );
};

export default Button;
