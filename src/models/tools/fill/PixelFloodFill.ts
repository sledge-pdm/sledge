import { PixelDiff } from "~/models/layer_image/HistoryManager";
import { Vec2 } from "~/models/types/Vector";
import { colorMatch } from "~/utils/colorUtils";
import { Fill, FillProps } from "./FillTool";

export class PixelFloodFill implements Fill {
  fill({ agent, color, position }: FillProps) {
    const targetColor = agent.getPixel(position);
    const matches = (p: Vec2) => colorMatch(agent.getPixel(p), targetColor);

    console.log(color);
    console.log(targetColor);

    if (colorMatch(targetColor, color)) return false;

    // console.log(`---${image.width}x${image.height} flood fill---`)

    if (colorMatch(targetColor, color)) return false;
    console.log("fill started.");

    const scanStart = Date.now();
    const queue: Vec2[] = [position];
    const filled: Vec2[] = [];
    const visited = new Uint8Array(agent.getWidth() * agent.getHeight()); // 0:未訪問, 1:訪問済
    const index = (p: Vec2) => p.y * agent.getWidth() + p.x;
    let queueCount = 0;
    let visitCount = 0;
    while (queue.length > 0) {
      queueCount++;
      const c = queue.pop()!;
      if (!agent.isInBounds(c)) continue;

      const i = index(c);
      if (visited[i]) continue;
      visited[i] = 1;
      visitCount++;

      if (matches(c)) {
        filled.push(c);
        queue.push({ x: c.x + 1, y: c.y });
        queue.push({ x: c.x - 1, y: c.y });
        queue.push({ x: c.x, y: c.y + 1 });
        queue.push({ x: c.x, y: c.y - 1 });
      }
    }

    const scanEnd = Date.now();
    console.log("scan finished. " + (scanEnd - scanStart) + "ms.");

    const writeStart = Date.now();

    const pxDiffs: PixelDiff[] = [];
    // バッファに一括反映
    for (const p of filled) {
      const diff = agent.setPixel(p, color, false, false);
      if (diff !== undefined) pxDiffs.push(diff);
    }
    const writeEnd = Date.now();
    console.log("write finished. " + (writeEnd - writeStart) + "ms.");

    agent.addDiffs(pxDiffs);
  }
}
