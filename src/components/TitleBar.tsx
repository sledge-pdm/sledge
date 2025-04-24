import { getCurrentWindow } from "@tauri-apps/api/window";
import { createSignal, onMount } from "solid-js";
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
  const window = getCurrentWindow();

  const [isMaximizable, setIsMaximizable] = createSignal(true);
  const [isMinimizable, setIsMinimizable] = createSignal(true);
  const [isClosable, setIsClosable] = createSignal(true);
  const [title, setTitle] = createSignal("");
  const [isMaximized, setMaximized] = createSignal(false);

  onMount(async () => {
    setIsMaximizable(await window.isMaximizable());
    setIsMinimizable(await window.isMinimizable());
    setIsClosable(await window.isClosable());
    setTitle(await window.title());
  });

  window.onResized(async (handler) => {
    console.log("resize");
    setMaximized(await window.isMaximized());
  });

  return (
    <header style={{ "pointer-events": "all" }}>
      <nav class={titleBarRoot} data-tauri-drag-region="p, button">
        <p class={titleBarTitle}>{title()}.</p>
        <div class={titleBarControls}>
          {isMinimizable() && (
            <button
              class={titleBarControlMinimizeButton}
              onClick={() => window.minimize()}
            >
              <img class={titleBarControlButtonImg} src={"/minimize.png"} />
            </button>
          )}
          {isMaximizable() && (
            <button
              class={titleBarControlMaximizeButton}
              onClick={() => window.toggleMaximize()}
            >
              <img
                class={titleBarControlButtonImg}
                src={isMaximized() ? "/leave_maximize.png" : "/maximize.png"}
              />
            </button>
          )}
          {isClosable() && (
            <button
              class={titleBarControlCloseButton}
              onClick={() => window.close()}
            >
              <img class={titleBarControlButtonImg} src={"/close.png"} />
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
