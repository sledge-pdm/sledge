// @refresh reload
import { MetaProvider } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";
import { createScriptLoader } from "@solid-primitives/script-loader";

export default function App() {
  createScriptLoader({
    src: "/libs/speakjs/speakClient.js",
    async onLoad() {
      console.log(window.print);
    }
  });

  return (
    <Router
      root={props => (
        <MetaProvider>
          <title>Sledge</title>
          <Suspense>
            {props.children}
          </Suspense>
        </ MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
