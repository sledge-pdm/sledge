// @refresh reload
import { MetaProvider } from "@solidjs/meta";
import { Route, Router } from "@solidjs/router";
import { Suspense } from "solid-js";
import TitleBar from "./components/TitleBar";
import Home from "./routes";
import Editor from "./routes/editor";

import About from "./routes/about";
import Settings from "./routes/settings";
import { flexCol, h100 } from "./styles/snippets.css";

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <title>Sledge</title>
          <Suspense>
            <div
              class={[flexCol, h100].join(" ")}
            >
              <TitleBar />

              <main>{props.children}</main>

              {/* <p class={sledgeLogo}>sledge.</p> */}
            </div>
          </Suspense>
        </MetaProvider>
      )}
    >
      <Route path="/" component={Home} />
      <Route path="/editor" component={Editor} />
      <Route path="/settings" component={Settings} />
      <Route path="/about" component={About} />;
    </Router>
  );
}
