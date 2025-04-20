// @refresh reload
import { MetaProvider } from "@solidjs/meta";
import { Route, Router } from "@solidjs/router";
import { onMount, Suspense } from "solid-js";
import TitleBar from "./components/TitleBar";
import ToastContainer from "./components/ToastContainer";
import { loadGlobalSettings } from "./io/global/globalIO";
import Home from "./routes";
import Editor from "./routes/editor";

import { sledgeLogo } from "./styles/global.css";
import { flexCol, h100 } from "./styles/snippets.css";

export default function App() {
  onMount(() => {
    loadGlobalSettings();
  });

  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <title>Sledge</title>
          <Suspense>
            <div
              class={[flexCol, h100].join(" ")}
              style={{ "pointer-events": "all" }}
            >
              <TitleBar />

              <main>{props.children}</main>

              <ToastContainer />

              {/* <p class={sledgeLogo}>sledge.</p> */}
            </div>
          </Suspense>
        </MetaProvider>
      )}
    >
      <Route path="/" component={Home} />
      <Route path="/editor" component={Editor} />
    </Router>
  );
}
