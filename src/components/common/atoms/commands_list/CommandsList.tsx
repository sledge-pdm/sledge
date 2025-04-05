import { Component, createSignal, For } from "solid-js";
import { JSX } from "solid-js/h/jsx-runtime";
import { ImageCommands, runAndApplyActive, } from "~/models/Commands";
import { runJpegGlitchAndApply } from "~/models/JpegGlitch";
import { runPipelineAndApplyActive } from "~/models/Pipeline";
import { activeImage, layerStore, } from "~/models/Store";

const CommandsList: Component<{}> = (props) => {
    const [pipelineInput, setPipelineInput] = createSignal("");

    const handlePipeline = async (e: any) => {
        e.preventDefault();
        console.log(pipelineInput());
        await runPipelineAndApplyActive(pipelineInput(), activeImage().current);
    }

    return <div style={{ display: "flex", "flex-direction": "column", gap: "10px", "z-index": 10 }}>
        <p>select command.</p>
        <For each={Object.entries(ImageCommands)}>
            {([label, command]) => {
                const args = command === ImageCommands.BRIGHTNESS
                    ? { command, delta: 30 }
                    : { command };
                return (
                    <a onClick={async () => {
                        await runAndApplyActive(args as any, activeImage().current);
                    }} style={{ cursor: "pointer" }}>
                        &lt; {label}
                    </a>
                );
            }}
        </For>

        <a style={{ "pointer-events": "all", cursor: "pointer" }} onClick={async () => {
            await runPipelineAndApplyActive("grayscale > brightness(20) > *out(layer0)", activeImage().current);
        }}>
            &lt; PIPELINE!!!</a>

        <form onSubmit={(e) => handlePipeline(e)}>
            <input type="text" name="pipeline" onChange={(e) => setPipelineInput(e.target.value)} required />
            <button type="submit">GO!</button>
        </form>

        <a style={{ cursor: "pointer" }} onClick={async () => {
            const canvas = document.getElementById("canvas-" + layerStore.activeLayerId) as HTMLCanvasElement;
            console.log(canvas);
            const image = activeImage().current;
            await runJpegGlitchAndApply(canvas, image, 1337);
        }}>&lt; JPEG GLITCH</a>
    </div>;
};

export default CommandsList;