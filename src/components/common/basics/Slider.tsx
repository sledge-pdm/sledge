import { Component, createSignal } from 'solid-js';
import * as styles from '~/styles/components/basics/slider.css'; // vanilla-extractはこれ！

interface SliderProps {
  min: number;
  max: number;
  default: number;
  allowFloat?: boolean;
  onValueChanged?: (newValue: number) => void;
}

const Slider: Component<SliderProps> = (props) => {
  let sliderRef: HTMLDivElement | undefined;
  const [isDrag, setDrag] = createSignal(false);
  const [value, setValue] = createSignal(props.default);

  const percent = () => ((value() - props.min) / (props.max - props.min)) * 100;

  const handlePointerDown = (e: PointerEvent) => {
    setDrag(true);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!sliderRef || !isDrag()) return;
    const rect = sliderRef.getBoundingClientRect();
    let pos = e.clientX - rect.left;
    pos = Math.max(0, Math.min(pos, rect.width));

    const newValueRaw = props.min + (pos / rect.width) * (props.max - props.min);
    const newValue = props.allowFloat ? newValueRaw : Math.round(newValueRaw);
    setValue(newValue);
    props.onValueChanged?.(newValue);
  };

  const handlePointerUp = (e: PointerEvent) => {
    setDrag(false);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  const onLineClick = (e: MouseEvent) => {
    if (!sliderRef) return;
    const rect = sliderRef.getBoundingClientRect();
    let pos = e.clientX - rect.left;
    pos = Math.max(0, Math.min(pos, rect.width));

    const newValueRaw = props.min + (pos / rect.width) * (props.max - props.min);
    const newValue = props.allowFloat ? newValueRaw : Math.round(newValueRaw);
    setValue(newValue);
    props.onValueChanged?.(newValue);
  };

  return (
    <div class={styles.root}>
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
