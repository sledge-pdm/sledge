import { Component, createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { LabelMode } from '~/models/config/ConfigComponents';
import * as styles from '~/styles/components/basics/slider.css';

interface SliderProps {
  min: number;
  max: number;
  defaultValue?: number;
  value?: number;
  allowFloat?: boolean;
  labelMode: LabelMode;
  customFormat?: string;
  allowDirectInput?: boolean;
  onChange?: (newValue: number) => void;
}

const Slider: Component<SliderProps> = (props) => {
  let labelRef: HTMLDivElement;
  let directInputRef: HTMLInputElement;
  let rootRef: HTMLDivElement;
  let sliderRef: HTMLDivElement;
  const [directInputMode, setDirectInputMode] = createSignal(false);

  const [value, setValue] = createSignal(props.defaultValue ?? props.min);
  createEffect(() => {
    if (props.value !== undefined) setValue(props.value);
  });

  const getFormattedValue = (value: number): string => {
    let formatted = `${value}`;
    // format (like "[value]px" -> "1200px")
    if (props.customFormat !== undefined) {
      formatted = props.customFormat.replaceAll('[value]', formatted);
    }
    return formatted;
  };

  const [isDrag, setDrag] = createSignal(false);
  const percent = () => ((value() - props.min) / (props.max - props.min)) * 100;

  const update = (newValue: number) => {
    setValue(newValue);
    props.onChange?.(newValue);
  };

  const handlePointerDown = () => {
    setDrag(true);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!sliderRef || !isDrag()) {
      setDrag(false);
    } else {
      const { left, width } = sliderRef.getBoundingClientRect();
      let pos = Math.max(0, Math.min(e.clientX - left, width));
      const raw = props.min + (pos / width) * (props.max - props.min);
      const newValue = props.allowFloat ? raw : Math.round(raw);
      update(newValue);
    }
  };

  const cancelHandling = () => {
    setDrag(false);
  };

  const onLineClick = (e: MouseEvent) => {
    if (!sliderRef) return;
    const { left, width } = sliderRef.getBoundingClientRect();
    let pos = Math.max(0, Math.min(e.clientX - left, width));
    const raw = props.min + (pos / width) * (props.max - props.min);
    const newValue = props.allowFloat ? raw : Math.round(raw);
    update(newValue);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (directInputMode() && labelRef && !labelRef.contains(e.target as Node)) {
      update(Number(directInputRef.value));
      setDirectInputMode(false);
    }
  };

  const cancelDirectInput = () => {
    setDirectInputMode(false);
  };

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', cancelHandling);
    document.addEventListener('pointercancel', cancelHandling);
  });
  onCleanup(() => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', cancelHandling);
    document.removeEventListener('pointercancel', cancelHandling);
  });

  const labelArea = (
    <div ref={(el) => (labelRef = el)} class={styles.valueLabelContainer}>
      <Show
        when={directInputMode()}
        fallback={
          <p
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              setDirectInputMode(true);
              directInputRef.select();
            }}
          >
            {getFormattedValue(value())}.
          </p>
        }
      >
        <input
          class={styles.valueLabelInput}
          ref={(el) => (directInputRef = el)}
          onSubmit={(e) => {
            setDirectInputMode(false);
          }}
          onFocusOut={cancelDirectInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              update(Number(directInputRef.value));
              setDirectInputMode(false);
            }
          }}
          value={value()}
          type={'number'}
        />
      </Show>
    </div>
  );

  return (
    <div class={styles.sliderRoot} ref={(el) => (rootRef = el)}>
      <Show when={props.labelMode === 'left'}>{labelArea}</Show>

      <div class={styles.slider} ref={(el) => (sliderRef = el)} onPointerDown={handlePointerDown} onClick={onLineClick}>
        <div class={styles.lineHitbox}>
          <div class={styles.line} />
        </div>
        <div style={{ left: `${percent()}%` }} class={styles.handle} />
      </div>

      <Show when={props.labelMode === 'right'}>{labelArea}</Show>
    </div>
  );
};

export default Slider;
