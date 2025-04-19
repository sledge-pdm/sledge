import { useLocation } from "@solidjs/router";
import { createSignal, onMount } from "solid-js";
import CanvasArea from "~/components/canvas/CanvasArea";
import Companion from "~/components/common/companion/Companion";
import EdgeInfo from "~/components/EdgeInfo";
import SideSections from "~/components/SideSections";
import { importProjectJsonFromPath } from "~/io/project/project";
import { adjustZoomToFit, centeringCanvas } from "~/stores/project/canvasStore";
import { flexRow } from "~/styles/components.css";
import { welcomeRoot } from "../start.css";

export default function Editor() {
    const location = useLocation();

    const [isImporting, setIsImporting] = createSignal(false)

    if (location.search) {
        setIsImporting(true);
        const sp = new URLSearchParams(location.search)
        const fileName = sp.get("name")
        const filePath = sp.get("path")
        const path = `${filePath}\\${fileName}`;
        console.log(path)
        importProjectJsonFromPath(path).then(() => {
            setIsImporting(false);
        })
    }

    onMount(() => {
        adjustZoomToFit();
        centeringCanvas();
    });

    return (
        <>
            {isImporting() &&
                <div id="root">
                    <div class={welcomeRoot}>
                        <p style={{ "font-size": "3rem" }}>please wait.</p>
                    </div>
                </div>
            }

            {
                !isImporting() &&
                <div id="root">
                    <div class={flexRow}>
                        <EdgeInfo />
                        <SideSections />
                    </div>

                    <CanvasArea />
                    {/* <Companion /> */}
                </div>
            }
        </>
    );
}
