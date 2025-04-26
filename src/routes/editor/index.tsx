import { useLocation } from "@solidjs/router";
import { createSignal, onMount } from "solid-js";
import BottomInfo from "~/components/BottomInfo";
import CanvasArea from "~/components/canvas/CanvasArea";
import EdgeInfo from "~/components/EdgeInfo";
import SideSections from "~/components/SideSections";
import { loadGlobalSettings } from "~/io/global/globalIO";
import { importProjectJsonFromPath } from "~/io/project/project";
import { adjustZoomToFit, centeringCanvas } from "~/stores/project/canvasStore";
import { flexCol, flexRow } from "~/styles/snippets.css";
import { welcomeRoot } from "../start.css";
import { pageRoot } from "~/styles/global.css";
import { WindowOptionsProp } from "~/utils/windowUtils";

export const EditorWindowOptions: WindowOptionsProp = {
  width: 1200,
  height: 800,
  acceptFirstMouse: true,
  resizable: true,
  closable: true,
  maximizable: true,
  minimizable: true,
  decorations: false,
  fullscreen: false
};

export default function Editor() {
  const location = useLocation();

  const [isImporting, setIsImporting] = createSignal(false);

  if (location.search) {
    setIsImporting(true);
    const sp = new URLSearchParams(location.search);
    const fileName = sp.get("name");
    const filePath = sp.get("path");
    const path = `${filePath}\\${fileName}`;
    console.log(path);
    importProjectJsonFromPath(path).then(() => {
      setIsImporting(false);
    });
  } else {

  }

  onMount(() => {
    adjustZoomToFit();
    centeringCanvas();
    loadGlobalSettings();
  });

  return (
    <>
      {isImporting() && (
        <div class={pageRoot}>
          <div class={welcomeRoot}>
            <p style={{ "font-size": "2rem" }}>please wait.</p>
          </div>
        </div>
      )}

      {!isImporting() && (
        <div class={pageRoot}>
          <div class={flexRow}
            style={{ height: "100%", overflow: "hidden" }}>
            <EdgeInfo />
            <SideSections />
          </div>

          <div
            class={flexCol}
            style={{ "flex-grow": 1, height: "100%" }}
          >
            <CanvasArea />
            <BottomInfo />
          </div>
          {/* <Companion /> */}
        </div>
      )}
    </>
  );
}
