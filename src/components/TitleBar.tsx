import { Window } from "@tauri-apps/api/window";
import { createSignal } from "solid-js";
import {
  titleBarControlButtonImg,
  titleBarControlCloseButton,
  titleBarControlMaximizeButton,
  titleBarControlMinimizeButton,
  titleBarControls,
  titleBarRoot,
  titleBarTitle,
} from "~/styles/components/title_bar.css";

export default function TitleBar() {
  const appWindow = new Window("main");

  const [isMaximized, setMaximized] = createSignal(false);

  appWindow.onResized(async (handler) => {
    console.log("resize");
    setMaximized(await appWindow.isMaximized());
  });

  return (
    <header style={{ "pointer-events": "all" }}>
      <nav class={titleBarRoot} data-tauri-drag-region="p, button">
        <p class={titleBarTitle}>sledge.</p>
        <div class={titleBarControls}>
          <button
            class={titleBarControlMinimizeButton}
            onClick={() => appWindow.minimize()}
          >
            <img class={titleBarControlButtonImg} src={"/minimize.png"} />
          </button>

          <button
            class={titleBarControlMaximizeButton}
            onClick={() => appWindow.toggleMaximize()}
          >
            <img
              class={titleBarControlButtonImg}
              src={isMaximized() ? "/leave_maximize.png" : "/maximize.png"}
            />
          </button>

          <button
            class={titleBarControlCloseButton}
            onClick={() => appWindow.close()}
          >
            <img class={titleBarControlButtonImg} src={"/close.png"} />
          </button>
        </div>
      </nav>
    </header>
  );
}
