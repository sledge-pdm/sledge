import { Component } from "solid-js";
import ColorBox from "~/components/common/ColorBox";
import { sayRandomQuote } from "~/components/common/companion/QuotePool";
import Light from "~/components/common/Light";
import Slider from "~/components/common/Slider";
import { Tool } from "~/models/types/Tool";
import { toolStore, setToolStore } from "~/stores/internal/toolsStore";
import { penConfigRow, penConfigRowName } from "~/styles/section/pen.css";

interface Props {
  pen: Tool;
  isInUse: boolean;
}

const PenItem: Component<Props> = (props: Props) => {
  return (
    <div class={penConfigRow}>
      <Light on={props.isInUse} />

      <p
        class={penConfigRowName}
        style={{
          color: props.isInUse ? "red" : "unset",
        }}
        onClick={() => {
          setToolStore({ usingIndex: toolStore.tools.indexOf(props.pen) });
        }}
      >
        {props.pen.name}.
      </p>

      <ColorBox color={props.pen.color} sizePx={8} />

      <div style={{ "flex-grow": 1 }}>
        <Slider
          min={1}
          max={30}
          default={props.pen.size}
          onValueChanged={(newValue) => {
            sayRandomQuote("pen-resize");
            console.log("size set to " + newValue);
            const penIndex = toolStore.tools.findIndex(
              (p) => p.id === props.pen.id,
            );
            setToolStore("tools", penIndex, "size", newValue);
          }}
        />
      </div>

      <p style={{ width: "auto" }}>{props.pen.size}.</p>
    </div>
  );
};

export default PenItem;
