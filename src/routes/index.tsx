import CanvasArea from "~/components/canvas/CanvasArea";
import CanvasSettings from "~/components/canvas_settings/CanvasSettings";
import Color from "~/components/color/Color";
import Companion from "~/components/common/companion/Companion";
import EdgeInfo from "~/components/edge_info/EdgeInfo";
import LayerList from "~/components/layer/LayerList";
import PenConfig from "~/components/pen/PenConfig";

export default function Home() {
  return (
    <main>
      <div id="root">
        <div id="sidebar">
          <EdgeInfo />

          <div id="content">
            <Color />
            <PenConfig />
            <LayerList />
            <CanvasSettings />
          </div>
        </div>

        <CanvasArea />
        <div id="misc_container">
          <p id="sledge">sledge.</p>
        </div>
        <Companion />
      </div>
    </main>
  );
}
