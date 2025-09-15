// RotationSnapper: Soft snapping logic to 0° only during two-finger touch rotation.
// Concept: Snap to 0° only when the angle stays inside a small band AND motion becomes slow / quiet.
// As long as velocity or dwell-time conditions are not met, any angle inside ±SNAP_ZONE is preserved (no hard clamp).

// Tunable constants (can be externalized later if user configuration is desired).
const SNAP_ZONE_DEG = 5; // Snap candidate band (±5°)
const VELOCITY_LIMIT_DEG_PER_MS = 0.05; // Below this is considered "slow" (≈50 deg/s)
const QUIET_TIME_MS = 120; // Must stay slow inside the band for at least this time to commit snap
const MIN_TIME_IN_ZONE_MS = 40; // Minimum dwell before snap (prevents instant snap when entering the band)

// Normalize angle to (-180, 180]
function normalizeDeg(a: number): number {
  let r = a % 360;
  if (r > 180) r -= 360;
  if (r <= -180) r += 360; // Treat -180 as 180 (aligns with setRotation internal policy)
  return r;
}

// Shortest signed difference (result in -180..180)
function shortestDiff(from: number, to: number): number {
  let d = to - from;
  while (d > 180) d -= 360;
  while (d <= -180) d += 360;
  return d;
}

export class RotationSnapper {
  private active = false; // True only while two-finger gesture is active
  private lastAngleNorm: number | null = null; // Previous frame normalized angle
  private lastTime: number | null = null; // Timestamp of previous frame (ms)
  private zoneEnterTime: number | null = null; // First time we entered SNAP_ZONE
  private snappedThisGesture = false; // Whether we already snapped to 0° in this gesture

  /** Called when the two-finger gesture starts */
  public onGestureStart(initialRotationDeg: number) {
    this.active = true;
    this.lastAngleNorm = normalizeDeg(initialRotationDeg);
    this.lastTime = performance.now();
    this.zoneEnterTime = null;
    this.snappedThisGesture = false;
  }
  /** Called when gesture ends (fingers < 2) */
  public onGestureEnd() {
    this.active = false;
    this.lastAngleNorm = null;
    this.lastTime = null;
    this.zoneEnterTime = null;
    this.snappedThisGesture = false;
  }

  /**
   * Process a per-frame candidate rotation angle and (optionally) return snapped value.
   * @param candidateDeg Newly computed rotation angle (any range)
   */
  public process(candidateDeg: number): number {
    if (!this.active) return candidateDeg; // Safety guard

    const now = performance.now();
    const norm = normalizeDeg(candidateDeg);

    // First frame initialization
    if (this.lastAngleNorm == null || this.lastTime == null) {
      this.lastAngleNorm = norm;
      this.lastTime = now;
      return norm;
    }

    const dt = now - this.lastTime;
    // Abnormal frame interval (tab switch, etc.) -> skip velocity evaluation
    if (dt <= 0) {
      this.lastAngleNorm = norm;
      this.lastTime = now;
      return norm;
    }

    const prev = this.lastAngleNorm;
    const diff = shortestDiff(prev, norm); // shortest signed difference (deg)
    const angularVelocity = Math.abs(diff / dt); // deg/ms

    const absNorm = Math.abs(norm);

    // Inside snapping zone
    if (absNorm <= SNAP_ZONE_DEG) {
      if (this.zoneEnterTime == null) {
        this.zoneEnterTime = now; // mark entry
      }
      const timeInZone = now - this.zoneEnterTime;
      const slowEnough = angularVelocity <= VELOCITY_LIMIT_DEG_PER_MS;
      const stayedEnough = timeInZone >= MIN_TIME_IN_ZONE_MS;
      const quietEnough = timeInZone >= QUIET_TIME_MS && slowEnough;

      if (!this.snappedThisGesture && stayedEnough && quietEnough) {
        // Commit snap to 0°
        this.snappedThisGesture = true;
        this.lastAngleNorm = 0; // update internal state
        this.lastTime = now;
        return 0;
      }
    } else {
      // Outside zone: reset so snapping can happen again next time
      this.zoneEnterTime = null;
      if (absNorm > SNAP_ZONE_DEG + 2) {
        this.snappedThisGesture = false; // Provide small hysteresis margin before allowing re-snap
      }
    }

    // Default path: return candidate unchanged
    this.lastAngleNorm = norm;
    this.lastTime = now;
    return norm;
  }
}

export default RotationSnapper;
