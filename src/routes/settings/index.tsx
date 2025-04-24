import { onMount } from "solid-js";
import GlobalSettings from "~/components/section/GlobalSettings";
import { loadGlobalSettings } from "~/io/global/globalIO";

export default function Settings() {
  onMount(() => {
    loadGlobalSettings();
  });

  return (
    <div id="root">
      <GlobalSettings />
    </div>
  );
}
