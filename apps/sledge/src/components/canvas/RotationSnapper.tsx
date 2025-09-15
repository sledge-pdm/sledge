// RotationSnapper (pending threshold model):
// Problem: During pinch zoom, tiny unintentional rotations move canvas away from 0° although most work happens at 0°.
// Behavior: If the two-finger gesture starts near 0°, suppress rotation until deviation exceeds THRESHOLD_DEG.
// After threshold is exceeded once in that gesture, all subsequent rotations are passed through.
// If gesture starts from a non-zero angle, rotations are applied immediately (no gating).

const THRESHOLD_DEG = 5; // Minimum deviation from baseline needed to start applying rotation
const NEAR_ZERO_EPS = 0.01; // Values within this of 0 are treated as exactly 0

function normalizeDeg(a: number): number {
  let r = a % 360;
  if (r > 180) r -= 360;
  if (r <= -180) r += 360;
  return r;
}

export class RotationSnapper {
  private rotationOnStart = 0;
  private rotationAllowed = false;

  /** Called when the two-finger gesture starts */
  public onGestureStart(initialRotationDeg: number) {
    this.rotationOnStart = normalizeDeg(initialRotationDeg);
    this.rotationAllowed = Math.abs(this.rotationOnStart) > NEAR_ZERO_EPS;
  }
  /** Called when gesture ends (fingers < 2) */
  public onGestureEnd() {
    // this.rotationAllowed = true;
  }

  public process(candidateDeg: number): number {
    const normalizedDeg = normalizeDeg(candidateDeg);

    console.log('candidate(normalized): ', normalizedDeg);

    console.log('rotation is ', this.rotationAllowed ? 'allowed' : 'not allowed');
    if (this.rotationAllowed) {
      console.log('returning', normalizedDeg);
      return normalizedDeg;
    } else {
      const deltaFromStart = normalizeDeg(normalizedDeg - this.rotationOnStart);
      console.log('considering', deltaFromStart, 'by', `${normalizedDeg} - ${this.rotationOnStart}`);

      if (Math.abs(deltaFromStart) >= THRESHOLD_DEG) {
        console.log('delta over threshold. allow. returns ', normalizedDeg);
        this.rotationAllowed = true;
        return normalizedDeg;
      } else {
        console.log('delta is not over threshold. deny. returns ', this.rotationOnStart);
        return this.rotationOnStart;
      }
    }
  }
}

export default RotationSnapper;
