import * as styles from '@styles/components/icon.css';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { Component, JSX, splitProps } from 'solid-js';

interface IconProps extends JSX.HTMLAttributes<HTMLDivElement> {
  /** 透明背景 + 白(255,255,255) で描いた αマスク PNG */
  src: string;
  /** 塗り色。未指定なら currentColor を継承 */
  color?: string;
  hoverColor?: string;
  /** 整数倍率。1 = 元サイズそのまま（既定） */
  scale?: number;
  /** 元PNG のドット数（正方形前提）。省略時 16 */
  base?: number;
}

const Icon: Component<IconProps> = (props) => {
  const [local, rest] = splitProps(props, ['src', 'color', 'hoverColor', 'scale', 'base']);
  const px = () => (local.base ?? 16) * (local.scale ?? 1);

  return (
    <div
      {...rest}
      class={`${styles.icon}`}
      style={assignInlineVars({
        [styles.pxVar]: `${px()}px`, // ユニット付き
        [styles.fillVar]: local.color ?? 'currentColor',
        [styles.hoverFillVar]: local.hoverColor ?? local.color ?? 'currentColor',
        [styles.urlVar]: `url("${local.src}")`,
      })}
    />
  );
};

export default Icon;
