import { runDSL } from "~/models/dsl/DSLRunner";
import { imageStore } from "~/stores/imageStore";
import { findLayerById } from "~/stores/layerStore";
import { downloadImageData } from "./export";

export const testDSLTime = (layerId: string) => {
  const layer = findLayerById(layerId);
  if (layer === undefined) {
    throw "layer not found.";
    return;
  }
  const imageData = imageStore[layerId].current;

  const start = new Date().getTime();
  console.log(`DSL run started.\n${layer.dsl.build()}`);
  runDSL(layer.dsl, imageData).then((im) => {
    const end = new Date().getTime();
    console.log(`DSL run end.`);
    console.log(
      `result: ${im ? "success" : "failed"}. TOTAL TIME IS ${end - start}ms.`,
    );

    if (im) downloadImageData(im, "test-" + end + ".png");
  });
};
