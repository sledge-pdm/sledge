import { Component } from "solid-js";
import { toolStore } from "~/stores/internal/toolsStore";
import { sayRandomQuote } from "./companion/QuotePool";

interface ColorBoxProps {
  enableUsingSelection?: boolean;
  sizePx?: number;
  color: string;
  onClick?: (color: string) => void;
}

const ColorBox: Component<ColorBoxProps> = (props: ColorBoxProps) => {
  const size = props.sizePx || 10;

  const isSelected = () =>
    props.enableUsingSelection &&
    toolStore.tools[toolStore.usingIndex].color === props.color;
  const isWhiteOrNone = () =>
    props.color === "none" || props.color.toLowerCase() === "#ffffff";

  const onColorClicked = (color: string) => {
    sayRandomQuote("color-pick", { color: color });
    if (props.onClick) props.onClick(color);
  };

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: `${size}px`,
        height: `${size}px`,
        "align-items": "center",
        "justify-content": "center",
        cursor: "pointer",
        "background-color": props.color,
        border:
          isWhiteOrNone() || isSelected()
            ? "0.05rem solid black"
            : "0.05rem solid transparent",
      }}
      onClick={() => {
        onColorClicked(props.color);
      }}
    >
      {props.enableUsingSelection && isSelected() && (
        <div
          style={{
            width: `${Math.round(size / 3)}px`,
            height: `${Math.round(size / 3)}px`,
            margin: 0,
            padding: 0,
            "background-color": "black",
          }}
          onClick={() => {
            onColorClicked(props.color);
          }}
        />
      )}
    </div>
  );
};

export default ColorBox;
