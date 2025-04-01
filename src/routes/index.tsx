import CanvasArea from "~/components/canvas/CanvasArea";
import Companion from "~/components/common/companion/Companion";
import Side from "~/components/side/Side";
import { CompanionEvents } from "~/models/EventHub";

export default function Home() {

  return (
    <main>
      <div id="root">
        <Side />
        <CanvasArea />

        <div id="misc_container">
          <p id="sledge">sledge.</p>
          <Companion />
        </div>
      </div>
    </main>
  );
}
