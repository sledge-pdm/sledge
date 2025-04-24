import { Component, createSignal } from "solid-js";
import { saveGlobalSettings } from "~/io/global/globalIO";
import {
  CanvasRenderingMode,
  globalStore,
  setGlobalStore,
} from "~/stores/global/globalStore";
import {
  sectionCaption,
  sectionContent,
  sectionRoot,
} from "~/styles/section_global.css";
import Dropdown, { DropdownOption } from "../common/Dropdown";
import ToggleSwitch from "../common/ToggleSwitch";

const renderingOptions: DropdownOption<CanvasRenderingMode>[] = [
  { label: "adaptive", value: "adaptive" },
  { label: "pixelated", value: "pixelated" },
  { label: "crispEdges", value: "crispEdges" },
];

const [autoSave, setAutoSave] = createSignal(true);

const GlobalSettings: Component<{}> = (props) => {
  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>settings.</p>
      <div class={sectionContent} style={{ gap: "8px" }}>
        <ToggleSwitch checked={autoSave()} onChange={setAutoSave}>
          <p style={{ "font-size": "0.5rem" }}> autosave.</p>
        </ToggleSwitch>

        <p>canvas rendering.</p>

        <Dropdown
          selected={globalStore.canvasRenderingMode}
          value={globalStore.canvasRenderingMode}
          options={renderingOptions}
          onChange={(v) => {
            setGlobalStore("canvasRenderingMode", v);
            saveGlobalSettings();
          }}
        />
      </div>
    </div>
  );
};

export default GlobalSettings;
