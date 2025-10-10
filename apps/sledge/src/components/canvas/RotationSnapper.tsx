// RotationSnapper (pending threshold model):
// Problem: During pinch zoom, tiny unintentional rotations move canvas away from 0° although most work happens at 0°.
// Behavior: If the two-finger gesture starts near 0°, suppress rotation until deviation exceeds THRESHOLD_DEG.
// After threshold is exceeded once in that gesture, all subsequent rotations are passed through.
// If gesture starts from a non-zero angle, rotations are applied immediately (no gating).

import { Consts } from '~/Consts';
import { globalConfig } from '~/stores/GlobalStores';

const NEAR_ZERO_EPS = 0.01; // Values within this of 0 are treated as exactly 0

function normalizeDeg(a: number): number {
  let r = a % 360;
  if (r > 180) r -= 360;
  if (r <= -180) r += 360;
  r = Math.round(r * Math.pow(10, Consts.rotationPrecisionSignificantDigits)) / Math.pow(10, Consts.rotationPrecisionSignificantDigits);
  return r;
}

export class RotationSnapper {
  private rotationOnStart = 0;
  private rotationFromStart = 0;
  private rotationAllowed = false;

  /** Called when the two-finger gesture starts */
  public onGestureStart(initialRotationDeg: number) {
    this.rotationOnStart = normalizeDeg(initialRotationDeg);
    this.rotationFromStart = this.rotationOnStart;
    this.rotationAllowed = Math.abs(this.rotationOnStart) > NEAR_ZERO_EPS;
  }
  /** Called when gesture ends (fingers < 2) */
  public onGestureEnd() {
    // this.rotationAllowed = true;
    this.rotationOnStart = 0;
    this.rotationFromStart = 0;
  }

  public process(candidateDeg: number): number {
    const normalizedDeg = normalizeDeg(candidateDeg);

    if (this.rotationAllowed) {
      return normalizedDeg;
    } else {
      const deltaFromStart = normalizeDeg(normalizedDeg - this.rotationOnStart);
      this.rotationFromStart += deltaFromStart;

      if (Math.abs(this.rotationFromStart) >= globalConfig.editor.touchRotationZeroSnapThreshold) {
        this.rotationAllowed = true;
        return this.rotationFromStart;
      } else {
        return this.rotationOnStart;
      }
    }
  }
}

export default RotationSnapper;
