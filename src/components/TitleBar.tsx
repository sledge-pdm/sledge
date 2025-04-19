import { Window } from "@tauri-apps/api/window";
import { titleBarControlButton, titleBarControlCloseButton, titleBarControls, titleBarRoot, titleBarTitle } from "~/styles/components/title_bar.css";

export default function TitleBar() {
    const appWindow = new Window('main');

    return (
        <header style={{ "pointer-events": "all" }}>
            <nav class={titleBarRoot} data-tauri-drag-region="p, button">
                <p class={titleBarTitle}>sledge.</p>
                <div class={titleBarControls}>
                    <button class={titleBarControlButton} onClick={() => appWindow.minimize()}>–</button>
                    <button class={titleBarControlButton} onClick={() => appWindow.toggleMaximize()}>◻</button>
                    <button class={titleBarControlCloseButton} onClick={() => appWindow.close()}>×</button>
                </div>
            </nav>
        </header >
    );
}
