import { useNavigate } from "@solidjs/router";
import { For } from "solid-js";
import EdgeInfo from "~/components/common/EdgeInfo";
import { importProjectJsonFromFileSelection } from "~/io/project/project";
import { createLayer } from "~/models/factories/createLayer";
import { LayerType } from "~/models/types/Layer";
import { globalStore, RecentFile } from "~/stores/global/globalStore";
import { setLayerStore } from "~/stores/project/layerStore";

export default function Home() {
  const navigate = useNavigate();

  const moveToEditor = async (recentFile: RecentFile) => {
    const params = new URLSearchParams();
    params.append("name", recentFile.name)
    params.append("path", recentFile.path)
    navigate(`/editor?${params.toString()}`, { replace: false });
  }

  const createNew = () => {
    const DEFAULT_LAYERS = [createLayer('dot1', LayerType.Dot, true, 1)]
    setLayerStore("layers", DEFAULT_LAYERS);
    setLayerStore("activeLayerId", DEFAULT_LAYERS[0].id);
    navigate(`/editor`, { replace: false });
  }

  return (
    <main>
      <div id="root">
        <div id="sidebar">
          <EdgeInfo />

        </div>
        <div class="welcome_root">
          <div class="fl-row" style={{ width: "50%" }}>

            <div class="welcome_container">
              <p class="welcome_headline">hello.</p>

              <div class="section_root">
                <p class="section_caption">recent files.</p>
                <div class="section_content" style={{ gap: "8px", "margin-top": "4px" }}>
                  <For each={globalStore.recentOpenedFiles}>
                    {(item, i) => {
                      console.log(item)
                      return <div class="recent_files">
                        <p>■</p>
                        <p class="name" onClick={(e) => moveToEditor(item)}>{item.name}</p>
                        <p class="path">{item.path}</p>
                      </div>
                    }}
                  </For>
                </div>
              </div>
            </div>

            <div class="side_section">
              <a class="side_item" onClick={() => createNew()}>+ new.</a>
              <a class="side_item" style={{ "margin-left": "2px" }} onClick={(e) => importProjectJsonFromFileSelection()}>&gt; open.</a>
            </div>
          </div>
        </div>
      </div>
    </main >
  );
}
