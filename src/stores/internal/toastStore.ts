import { createStore } from "solid-js/store";

export type ToastType = "info" | "success" | "warn" | "error";

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  timeout: number;
  isPersistent: boolean;
}

let toastId = 0;
const MAX_COUNT = 10;
export const [toasts, setToasts] = createStore<Toast[]>([]);

export function showToast(
  message: string | number,
  type: ToastType = "info",
  timeout = 10000,
) {
  if (typeof message === "number") message = message.toString();
  const id = toastId++;
  const isPersistent = timeout < 0;
  if (toasts.length >= MAX_COUNT) {
    const reducedToasts = [...toasts];
    reducedToasts.shift();
    setToasts(reducedToasts);
  }
  setToasts([...toasts, { id, message, type, timeout, isPersistent }]);

  if (!isPersistent) {
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, timeout);
  }
}
