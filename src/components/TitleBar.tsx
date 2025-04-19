import { Window } from "@tauri-apps/api/window";
import styles from "~/styles/components/title_bar.module.css";

export default function TitleBar() {
    const appWindow = new Window('main');

    return (
        <header >
            <nav class={styles.root} data-tauri-drag-region="p, button">
                <p class={styles.title}>sledge.</p>
                <div class={styles.controls}>
                    <button class={styles.control_button} onClick={() => appWindow.minimize()}>–</button>
                    <button class={styles.control_button} onClick={() => appWindow.toggleMaximize()}>◻</button>
                    <button class={styles.control_button_close} onClick={() => appWindow.close()}>×</button>
                </div>
            </nav>
        </header >
    );
}
