import { onMount } from "solid-js";
import EditorSettings from "~/components/section/settings/EditorSettings";
import { loadGlobalSettings } from "~/io/global/globalIO";
import { WindowOptionsProp } from "~/utils/windowUtils";
import { settingContainer } from "./settings.css";
import { pageRoot } from "~/styles/global.css";

export const SettingsWindowOptions: WindowOptionsProp = {
  url: "/settings",
  width: 420,
  height: 290,
  resizable: false,
  decorations: false,
  minimizable: false,
  maximizable: false,
  closable: true,
  acceptFirstMouse: true,
  focus: true,
};

export default function Settings() {
  onMount(() => {
    loadGlobalSettings();
  });

  return (
    <div class={pageRoot}>
      <div class={settingContainer}>
        <EditorSettings />
      </div>
    </div >
  );
}
