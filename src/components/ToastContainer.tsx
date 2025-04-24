import styles from "@styles/components/toast.module.css";
import { For } from "solid-js";
import { setToasts, toasts } from "~/stores/internal/toastStore";

export default function ToastContainer() {
  return (
    <div class={styles.toastContainer}>
      <For each={toasts}>
        {(toast) => (
          <div class={styles.toast_root}>
            <div class={`${styles.toast} ${styles[toast.type]}`}>
              {toast.message}
            </div>
            {toast.isPersistent && (
              <a
                class={styles.close_persistent_button}
                onClick={() => {
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                }}
              >
                x
              </a>
            )}
          </div>
        )}
      </For>
    </div>
  );
}
