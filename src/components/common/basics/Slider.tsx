import { Component, createEffect, createSignal } from 'solid-js';
import * as styles from '~/styles/components/basics/slider.css'; // vanilla-extractはこれ！

interface SliderProps {
  min: number;
  max: number;
  defaultValue?: number;
  value?: number;
  allowFloat?: boolean;
  onChange?: (newValue: number) => void;
}

const Slider: Component<SliderProps> = (props) => {
  let sliderRef: HTMLDivElement | undefined;

  const [value, setValue] = createSignal(props.defaultValue ?? props.min);
  createEffect(() => {
    if (props.value !== undefined) setValue(props.value);
  });

  const [isDrag, setDrag] = createSignal(false);
  const percent = () => ((value() - props.min) / (props.max - props.min)) * 100;

  const update = (newValue: number) => {
    setValue(newValue);
    props.onChange?.(newValue);
  };

  const handlePointerDown = () => {
    setDrag(true);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };
  const handlePointerMove = (e: PointerEvent) => {
    if (!sliderRef || !isDrag()) return;
    const { left, width } = sliderRef.getBoundingClientRect();
    let pos = Math.max(0, Math.min(e.clientX - left, width));
    const raw = props.min + (pos / width) * (props.max - props.min);
    const newValue = props.allowFloat ? raw : Math.round(raw);
    update(newValue);
  };
  const handlePointerUp = () => {
    setDrag(false);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };
  const onLineClick = (e: MouseEvent) => {
    if (!sliderRef) return;
    const { left, width } = sliderRef.getBoundingClientRect();
    let pos = Math.max(0, Math.min(e.clientX - left, width));
    const raw = props.min + (pos / width) * (props.max - props.min);
    const newValue = props.allowFloat ? raw : Math.round(raw);
    update(newValue);
  };

  return (
    <div class={styles.sliderRoot}>
      <div class={styles.slider} ref={sliderRef}>
        <div class={styles.lineHitbox} onPointerDown={handlePointerDown} onClick={onLineClick}>
          <div class={styles.line} />
        </div>
        <div style={{ left: `${percent()}%` }} class={styles.handle} />
      </div>
    </div>
  );
};

export default Slider;
