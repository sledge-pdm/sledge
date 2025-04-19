import { Component } from "solid-js";

import styles from "@styles/components/edge_info.module.css"
import { projectStore } from "~/stores/project/projectStore";

const EdgeInfo: Component<{}> = (props) => {
  return (
    <div class={styles.root}>
      <p class={styles.text}>{projectStore.path}</p>
      <div style={{ "flex-grow": 1 }}></div>
      <p class={styles.text}>{projectStore.name}</p>
    </div>
  );
};

export default EdgeInfo;
