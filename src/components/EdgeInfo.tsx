import { Component } from "solid-js";

import { projectStore } from "~/stores/project/projectStore";
import { sideAreaEdge, sideAreaEdgeText } from "~/styles/global.css";

const EdgeInfo: Component<{}> = (props) => {
  return (
    <div class={sideAreaEdge}>
      <p class={sideAreaEdgeText}>
        &nbsp;&nbsp;{projectStore.path || "path N/A"}
      </p>
      {/* <p class={sideAreaEdgeText}>{projectStore.name || "name N/A"}</p> */}
    </div>
  );
};

export default EdgeInfo;
