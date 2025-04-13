import { useLocation, useNavigate } from "@solidjs/router";
import { createSignal } from "solid-js";
import CanvasArea from "~/components/canvas/CanvasArea";
import Companion from "~/components/common/companion/Companion";
import EdgeInfo from "~/components/common/EdgeInfo";
import CanvasSettings from "~/components/section/CanvasSettings";
import Color from "~/components/section/Color";
import LayerList from "~/components/section/LayerList";
import PenConfig from "~/components/section/PenConfig";
import Project from "~/components/section/Project";
import { importProjectJsonFromPath } from "~/io/project/project";

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


    return (
        <main>
            {isImporting() &&
                <div id="root">
                    <div class="welcome_root">
                        <p style={{ "font-size": "3rem" }}>please wait.</p>
                    </div>
                </div>
            }

            {
                !isImporting() &&
                <div id="root">
                    <div id="sidebar">
                        <EdgeInfo />

                        <div id="content">
                            <a onClick={() => window.location.href = "/"}>&lt; back</a>
                            <Project />
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
            }
        </main >
    );
}
