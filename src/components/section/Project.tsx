import { Component, createSignal } from "solid-js";
import { saveProject } from "~/io/project/project";

import styles from "@styles/components/section/project.module.css"
import { projectStore, setProjectStore } from "~/stores/project/projectStore";
import { exportActiveLayerUpscaled } from "~/io/internal/export";

const Project: Component<{}> = (props) => {
    const [saveLog, setSaveLog] = createSignal<string | undefined>(undefined);

    const save = () => {
        if (projectStore.name && projectStore.path) {
            // 上書き保存
            saveProject(`${projectStore.path}`).then(() => {
                setSaveLog("saved!")
                setProjectStore("isProjectChangedAfterSave", false)
            })
        } else {
            saveProject().then(() => {
                setSaveLog("saved!")
                setProjectStore("isProjectChangedAfterSave", false)
            })
        }
    }

    return (
        <div class="section_root">
            <p class="section_caption">project.</p>
            <div class="section_content">

                <div class="fl-col">
                    <input
                        class={styles.project_name_input}
                        type="text"
                        name="height"
                        onChange={(e) => {
                            setProjectStore("name", e.target.value)
                        }}
                        value={projectStore.name}
                        placeholder="project name"
                        autocomplete="off"
                        required
                    />

                    {/* <p class={styles.project_file_path}>{projectStore.path}</p> */}
                </div>
                {/* <button class={styles.loadsave_button} onClick={() => importProjectJsonFromFileSelection()}>
                        load.
                    </button> */}

                <div class="fl-row" style={{ "align-items": "center", "margin-top": "12px" }}>
                    <button class={styles.loadsave_button} onClick={() => exportActiveLayerUpscaled()}>
                        export.
                    </button>
                    {/*   {!projectStore.isProjectChangedAfterSave && <p class={styles.save_log}>{saveLog()}</p>} */}
                </div>

            </div>
        </div>
    );
};

export default Project;
