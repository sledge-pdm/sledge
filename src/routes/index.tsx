import CanvasArea from "~/components/canvas/CanvasArea";
import CanvasSettings from "~/components/section/CanvasSettings";
import Color from "~/components/section/Color";
import Companion from "~/components/common/companion/Companion";
import EdgeInfo from "~/components/common/EdgeInfo";
import LayerList from "~/components/section/LayerList";
import PenConfig from "~/components/section/PenConfig";

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
