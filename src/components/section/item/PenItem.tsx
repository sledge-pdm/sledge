import { Component } from "solid-js";
import ColorBox from "~/components/common/ColorBox";
import { sayRandomQuote } from "~/components/common/companion/QuotePool";
import Light from "~/components/common/Light";
import Slider from "~/components/common/Slider";
import { Pen } from "~/models/types/Pen";
import { penStore, setPenStore } from "~/stores/internal/penStore";

import styles from "@styles/components/section/pen.module.css";

interface Props {
  pen: Pen;
  isInUse: boolean;
}

const PenItem: Component<Props> = (props: Props) => {
  return (
    <div class={styles.row}>
      <Light on={props.isInUse} />

      <p
        style={{
          width: "20%",
          padding: "10px 0",
          color: props.isInUse ? "red" : "unset",
          cursor: "pointer",
          "pointer-events": "all",
        }}
        onClick={() => {
          setPenStore({ usingIndex: penStore.pens.indexOf(props.pen) });
        }}
      >
        {props.pen.name}.
      </p>

      <ColorBox color={props.pen.color} />

      <div style={{ "flex-grow": 1 }}>
        <Slider
          min={1}
          max={30}
          default={props.pen.size}
          onValueChanged={(newValue) => {
            sayRandomQuote("pen-resize");
            console.log("size set to " + newValue);
            const penIndex = penStore.pens.findIndex(
              (p) => p.id === props.pen.id,
            );
            setPenStore("pens", penIndex, "size", newValue);
          }}
        />
      </div>

      <p style={{ width: "auto" }}>{props.pen.size}.</p>
    </div>
  );
};

export default PenItem;
