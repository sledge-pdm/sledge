import { DSL } from './DSL';
import { decodeImageData, encodeImageData } from '~/utils/ImageUtils';
import { safeInvoke } from '~/utils/tauriUtils';

export async function runDSL(
  dsl: DSL,
  image: ImageData
): Promise<ImageData | undefined> {
  const encoded = encodeImageData(image);

  const dslStr = dsl.build(true);
  if (dslStr === undefined) return;

  const result = await safeInvoke<string>('run_pipeline', {
    dsl: dslStr,
    encoded,
    width: image.width,
    height: image.height,
  });

  if (!result) return;
  return decodeImageData(result, image.width, image.height);
}
