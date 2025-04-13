// @refresh reload
import { MetaProvider } from "@solidjs/meta";
import { Route, Router } from "@solidjs/router";
import { Suspense } from "solid-js";
import Home from "./routes";
import "./styles/global.css";

export default function App() {
  // onMount(async () => {
  //   safeInvoke<string>("hello_from_rust", { name: "Sledge" }).then((msg) => {
  //     if (msg) {
  //       console.log("[Rustからの返答]:", msg);
  //     }
  //   });
  // });

  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <title>Sledge</title>
          <Suspense>{props.children}</Suspense>
        </MetaProvider>
      )}
    >
      <Route path="/" component={Home} />
    </Router>
  );
}
