import { useNavigate } from "@solidjs/router";
import { For, onMount } from "solid-js";
import EdgeInfo from "~/components/EdgeInfo";
import { loadGlobalSettings } from "~/io/global/globalIO";
import { importProjectJsonFromFileSelection } from "~/io/project/project";
import { createLayer } from "~/models/factories/createLayer";
import { LayerType } from "~/models/types/Layer";
import {
  FileLocation,
  addRecent,
  globalStore,
  setGlobalStore,
} from "~/stores/global/globalStore";
import { setLayerStore } from "~/stores/project/layerStore";
import { sideArea } from "~/styles/global.css";
import { sectionRoot } from "~/styles/section_global.css";
import { flexCol, flexRow, w100 } from "~/styles/snippets.css";
import { getFileNameAndPath } from "~/utils/pathUtils";
import {
  recentFilesCaption,
  recentFilesContainer,
  recentFilesItem,
  recentFilesName,
  recentFilesPath,
  sideSection,
  sideSectionItem,
  welcomeHeadline,
  welcomeRoot,
} from "./start.css";

export default function Home() {
  const navigate = useNavigate();

  onMount(() => {
    loadGlobalSettings();
  });

  const moveToEditor = async (recentFile: FileLocation) => {
    const params = new URLSearchParams();
    params.append("name", recentFile.name);
    params.append("path", recentFile.path);
    navigate(`/editor?${params.toString()}`, { replace: false });
  };

  const createNew = () => {
    const DEFAULT_LAYERS = [createLayer("dot1", LayerType.Dot, true, 1)];
    setLayerStore("layers", DEFAULT_LAYERS);
    setLayerStore("activeLayerId", DEFAULT_LAYERS[0].id);
    navigate(`/editor`, { replace: false });
  };

  const openProject = () => {
    importProjectJsonFromFileSelection().then((file: string | undefined) => {
      if (file !== undefined) {
        const loc = getFileNameAndPath(file);
        if (loc !== undefined) addRecent(loc);
        navigate(`/editor`, { replace: false });
      }
    });
  };

  const clearRecentFiles = () => {
    setGlobalStore("recentOpenedFiles", []);
  };

  return (
    <div id="root">
      <div class={sideArea}>
        <EdgeInfo />
      </div>

      <div class={welcomeRoot}>
        <div class={flexCol}>
          <p class={welcomeHeadline}>HELLO.</p>
          <div class={sideSection}>
            <a class={sideSectionItem} onClick={() => createNew()}>
              + new.
            </a>
            <a
              class={sideSectionItem}
              style={{ "margin-left": "2px" }}
              onClick={(e) => openProject()}
            >
              &gt; open.
            </a>
          </div>

          <div class={sectionRoot}>
            <div class={[flexRow, w100].join(" ")}>
              <p class={recentFilesCaption}>recent files.</p>
              {/* <p class={clear} onClick={() => clearRecentFiles()}>
                clear
              </p> */}
            </div>
            <div class={recentFilesContainer}>
              <For each={globalStore.recentOpenedFiles}>
                {(item, i) => {
                  console.log(item);
                  return (
                    <div class={recentFilesItem}>
                      <p>■</p>
                      <a
                        class={recentFilesName}
                        onClick={(e) => moveToEditor(item)}
                      >
                        {item.name}
                      </a>
                      <p class={recentFilesPath}>{item.path}</p>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
