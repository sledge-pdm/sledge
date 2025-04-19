// @refresh reload
import { MetaProvider } from "@solidjs/meta";
import { Route, Router } from "@solidjs/router";
import { onMount, Suspense } from "solid-js";
import Home from "./routes";
import Editor from "./routes/editor";
import { loadGlobalSettings } from "./io/global/globalIO";
import TitleBar from "./components/TitleBar";
import ToastContainer from "./components/ToastContainer";

import "./styles/global.css";

export default function App() {
  onMount(() => {
    loadGlobalSettings()
  })


  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <title>Sledge</title>
          <Suspense>
            <div class="fl-col">
              <TitleBar />

              <main class="main">
                {props.children}
              </main>

              <ToastContainer />

              <p id="sledge">sledge.</p>
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
