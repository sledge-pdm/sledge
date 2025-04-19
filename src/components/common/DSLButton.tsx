import styles from "@styles/components/dsl_button.module.css";
import { Component } from "solid-js";

interface Props {
  onClick?: (e: MouseEvent) => {};
}

const DSLButton: Component<Props> = (props: Props) => {
  return (
    <div
      class={styles.root}
      onMouseOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={props.onClick}
    >
      <img src="/DSL.png" />
    </div>
  );
};

export default DSLButton;
