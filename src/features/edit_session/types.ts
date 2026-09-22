/**
 * @description an edit the user has started but not yet finished: a stroke under the pointer, a floating
 *   move waiting on commit, a frame being dragged. each one reads the project at `begin`, holds what it
 *   read, and writes it back at commit - so anything that edits the same state in between is lost when
 *   that write-back lands.
 *
 *   a session is registered for exactly as long as it is open. the registry therefore holds the open
 *   sessions and nothing else, and asking whether one is open is asking whether the registry has any.
 */
export interface EditSession {
  /** @description names this session in refusals and logs: 'move', 'stroke', 'canvas-frame'. */
  readonly label: string;

  /**
   * @description whether this session is holding captured state right now, so that interleaving an edit
   *   would corrupt its write-back.
   *
   *   a live query rather than a stored flag, because it moves within a single session: the canvas size
   *   frame is a mode the user turns on and off from the side panel, and only the stretches where a handle
   *   is actually under the pointer have a `startRect` to spoil.
   *
   *   it must not go false until the captured state has been written back or dropped. going false first
   *   opens a window where a guard passes while the write-back is still to come.
   */
  isExclusive(): boolean;

  /**
   * @description the user has asked for something this session conflicts with. what that costs is the
   *   session's own call: a stroke still under the pointer ends where it is, because throwing the line
   *   away would destroy more than it saves, while a floating move is cancelled - it has its own commit
   *   and cancel in the UI, so the user has not asked for it to be applied yet.
   */
  interrupt(): void;

  /**
   * @description an exclusive operation needs the project settled before it reads it. unlike `interrupt`,
   *   this always commits: what a save writes has to match what the user sees and what undo will walk back
   *   through.
   */
  finalize(): void;
}
