/**
 * @description per-layer cache of the deflated canvas buffer that gets written into `.sledge`.
 *   a save reads back and compresses only the layers whose pixels moved since the last one - the rest
 *   hand over the bytes produced back then, which is the whole point: compression dominates save time.
 *
 *   entries are guarded by a revision counter rather than a boolean flag. saving is asynchronous, so a
 *   compression that started before an edit must not be able to publish its now-stale result afterwards.
 */
export class LayerBufferCache {
  private readonly deflated = new Map<string, Uint8Array>();
  private readonly revisions = new Map<string, number>();

  get(layerId: string): Uint8Array | undefined {
    return this.deflated.get(layerId);
  }

  /**
   * @description token for a compression that is about to read this layer. take it immediately before the
   *   read, then hand it to `commit`; anything that changes the layer in between makes it stale.
   */
  beginCapture(layerId: string): number {
    const revision = this.revisionOf(layerId);
    // register the layer so `clear` can invalidate an in-flight capture even if nothing was cached yet.
    this.revisions.set(layerId, revision);
    return revision;
  }

  commit(layerId: string, token: number, deflated: Uint8Array): void {
    if (this.revisionOf(layerId) !== token) return;
    this.deflated.set(layerId, deflated);
  }

  invalidate(layerId: string): void {
    this.revisions.set(layerId, this.revisionOf(layerId) + 1);
    this.deflated.delete(layerId);
  }

  clear(): void {
    for (const layerId of Array.from(this.revisions.keys())) {
      this.revisions.set(layerId, this.revisionOf(layerId) + 1);
    }
    this.deflated.clear();
  }

  private revisionOf(layerId: string): number {
    return this.revisions.get(layerId) ?? 0;
  }
}
