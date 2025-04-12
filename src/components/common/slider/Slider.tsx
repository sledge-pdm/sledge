import { Component, createSignal } from "solid-js";
import styles from "./slider.module.css";

interface SliderProps {
  min: number;
  max: number;
  default: number;
  allowFloat?: boolean;

  onValueChanged?: (newValue: number) => void;
}

const Slider: Component<SliderProps> = (props) => {
  let sliderRef: HTMLDivElement | undefined;
  const [value, setValue] = createSignal(props.default);

  const percent = () => ((value() - props.min) / (props.max - props.min)) * 100;

  const startDrag = (e: MouseEvent) => {
    e.preventDefault();
    const onMove = (e: MouseEvent) => {
      if (!sliderRef) return;
      const rect = sliderRef.getBoundingClientRect();
      let pos = e.clientX - rect.left;
      pos = Math.max(0, Math.min(pos, rect.width)); // clamp

      const newValueRaw =
        props.min + (pos / rect.width) * (props.max - props.min);
      const newValue = props.allowFloat ? newValueRaw : Math.round(newValueRaw);
      setValue(newValue);
      if (props.onValueChanged) props.onValueChanged(newValue);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const onLineClick = (e: MouseEvent) => {
    if (!sliderRef) return;
    const rect = sliderRef.getBoundingClientRect();
    let pos = e.clientX - rect.left;
    pos = Math.max(0, Math.min(pos, rect.width)); // clamp

    const newValueRaw =
      props.min + (pos / rect.width) * (props.max - props.min);
    const newValue = props.allowFloat ? newValueRaw : Math.round(newValueRaw);
    setValue(newValue);
    if (props.onValueChanged) props.onValueChanged(newValue);
  };

  return (
    <div class={styles.root}>
      <div class={styles.slider} ref={sliderRef}>
        <div class={styles["line-hitbox"]} onClick={onLineClick}>
          <div class={styles.line} />
        </div>
        <div
          class={styles["handle-hitbox"]}
          style={{ left: `${percent()}%` }}
          onMouseDown={startDrag}
        >
          <div class={styles.handle} />
        </div>
      </div>
    </div>
  );
};

export default Slider;
