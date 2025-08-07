import { assignInlineVars } from '@vanilla-extract/dynamic';
import { type Component, type JSX, splitProps } from 'solid-js';
import { fillVar, hoverFillVar, icon, pxVar, urlVar } from '../styles/icon.css';

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

  transform?: string;
  filter?: string;
  backdropFilter?: string;
}

const Icon: Component<IconProps> = (props) => {
  const [local, rest] = splitProps(props, ['src', 'color', 'hoverColor', 'scale', 'base', 'transform', 'filter', 'backdropFilter']);
  const px = () => (local.base ?? 16) * (local.scale ?? 1);

  return (
    <div
      {...rest}
      class={icon}
      style={{
        transform: local.transform,
        '-webkit-transform': local.transform,
        filter: local.filter,
        '-webkit-filter': local.filter,
        'backdrop-filter': local.backdropFilter,
        '-webkit-backdrop-filter': local.backdropFilter,
        ...assignInlineVars({
          [pxVar]: `${px()}px`, // ユニット付き
          [fillVar]: local.color ?? 'currentColor',
          [hoverFillVar]: local.hoverColor ?? local.color ?? 'currentColor',
          [urlVar]: `url("${local.src}")`,
        }),
      }}
    />
  );
};

export default Icon;
