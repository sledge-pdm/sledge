# About

## Note

NOTE that the editor still uses layer-level history in production (= HistoryController & HistoryManager).
Project-level history is under active development and is not wired into the editor UI yet.

A new controller exists at `./ProjectHistoryController.ts` and is used by tests. It provides:

- undo/redo stacks (undoStack/redoStack)
- canUndo()/canRedo()
- onChange(listener) with lastLabel for UI
- action.label support via BaseHistoryAction

## History Actions

A HistoryAction is the atomic "unit" of project-level history.
Each action type implements undo/redo; both operations should be idempotent.

## Actions

### Canvas Size

Status: [Almost there](./actions/CanvasSizeHistoryAction.ts)
Test: [Written](../../../test/history/HistoryActions.canvasSize.test.ts)

- Currently it only changes the canvas dimensions in the store.
- Limitation: it does not restore content that was clipped or create content for newly visible areas after resizing.

### Color History

Status: [OK](./actions/ColorHistoryAction.ts)
Test: [Written](../../../test/history/HistoryActions.color.test.ts)

### Image Pool

Status: [OK](./actions/ImagePoolHistoryAction.ts)
Test: [Written](../../../test/history/HistoryActions.imagePool.test.ts)

### Image Pool Entry Props

Status: [OK](./actions/ImagePoolEntryPropsHistoryAction.ts)
Test: [Written](../../../test/history/HistoryActions.imagePoolEntryProps.test.ts)

### Layer Buffer

Status: [OK](./actions/LayerBufferHistoryAction.ts)
Test: [Written](../../../test/history/HistoryActions.layerBuffer.test.ts)

- Diff payloads are kept as arrays for serialization; bridged to Map when delegating to LayerImageAgent.
- If a selection is currently being moved, the action cancels the move locally and becomes a no-op (not centralized).

### Layer List

Status: [OK](./actions/LayerListHistoryAction.ts)
Test: [Written](../../../test/history/HistoryActions.layerList.test.ts)

- Kinds: add / delete / reorder
- add/delete uses a layer snapshot with an optional pixel buffer to restore content and preserve the layer id
- reorder uses beforeOrder/afterOrder id arrays to be robust across multiple moves

### Layer Props

Status: [OK](./actions/LayerPropsHistoryAction.ts)
Test: [Written](../../../test/history/HistoryActions.layerProps.test.ts)

## Tests (current coverage)

- Unit tests
  - ProjectHistoryController: stack ops, onChange, labels
  - Actions
    - Color / Canvas Size / Image Pool / Image Pool Entry Props / Layer Props
    - Layer Buffer: array-to-Map conversion bridge; duplicate pixel/tile keys resolve by keeping the last occurrence; cancel while selection is moving; guard when agent.canUndo() is false; basic deduplication smoke test with many pixels
    - Layer List: add/delete/reorder, including buffer restoration when available
- Integration tests
  - Sequential scenario: apply → push → undo-all → redo-all; verify state returns to the expected snapshots
  - Randomized scenario: short, seed-fixed sequence; verify undo-all/redo-all consistency and overall idempotence

Optional logging during tests:

- Set VITEST_LOG_SEQ=1 to log sequential steps
- Set VITEST_LOG_RND=1 to log randomized steps (seed is fixed in test)

## Known limitations / next

- Canvas Size action does not restore clipped content after resize.
- Project-level history is not yet connected to editor interactions; wiring and UI exposure are pending.
- Potential future work: action coalescing/transactions, more exhaustive randomized sequences.
