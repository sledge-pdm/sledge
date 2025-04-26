import { Component, Show } from 'solid-js';
import styles from '@styles/components/light.module.css';

interface LightProps {
  class?: string;
  on?: boolean;
}

const Light: Component<LightProps> = (props: LightProps) => {
  const width = 8;
  const height = 8;
  const radius = 2;

  return (
    <svg
      class={props.class}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        overflow: 'visible',
      }}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <Show when={true}>
        <g class={`${styles['light-inner']} ${props.on && styles['on']}`}>
          <circle cx={width / 2} cy={height / 2} r={radius} fill="red" />
        </g>
      </Show>
    </svg>
  );
};

export default Light;
