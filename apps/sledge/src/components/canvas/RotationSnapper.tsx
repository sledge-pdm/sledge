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
  private active = false;
  private baselineRotation = 0; // Normalized rotation at gesture start
  private committed = false; // Whether rotation updates are allowed in this gesture

  /** Called when the two-finger gesture starts */
  public onGestureStart(initialRotationDeg: number) {
    this.active = true;
    this.baselineRotation = normalizeDeg(initialRotationDeg);
    // If starting away from zero, allow immediately
    this.committed = Math.abs(this.baselineRotation) > NEAR_ZERO_EPS;
  }
  /** Called when gesture ends (fingers < 2) */
  public onGestureEnd() {
    this.active = false;
    this.committed = false;
  }

  /**
   * Returns the rotation to apply this frame.
   * If not yet committed and still below threshold, returns baseline (likely 0°).
   */
  public process(candidateDeg: number): number {
    if (!this.active) return candidateDeg;

    const norm = normalizeDeg(candidateDeg);

    if (!this.committed) {
      const deviation = Math.abs(normalizeDeg(norm - this.baselineRotation));
      if (deviation >= THRESHOLD_DEG) {
        this.committed = true;
        return norm; // first allowed rotation
      }
      return this.baselineRotation; // keep baseline (suppress tiny accidental rotation)
    }

    return norm;
  }
}

export default RotationSnapper;
