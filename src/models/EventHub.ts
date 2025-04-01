import { createSignal } from "solid-js";

const [sayRequest, setSayRequest] = createSignal<string | null>(null);

export const CompanionEvents = {
  sayRequest,
  setSayRequest,
};
