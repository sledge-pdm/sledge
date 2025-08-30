# About

## Note

NOTE that this project is still using layer-level history! (= HistoryController&HistoryManager)
Project-level history is **WIP** , and not implemented to actual editor yet.

Currently new manager is wip in "./ProjectHistoryController.ts".

## History Actions

History action is a "unit" in project-level history.
Each kinds of action can undo/redo it's action (usually both should be idempotent.)

## Actions

### Canvas Size

    Status: Almost there

- For now it's just changing canvas size value.
- But it's incomplete because it won't restore the parts that disappeared/appearing parts between resizing.

### Color History

    Status: Maybe OK

### Image Pool

    Status: Maybe OK

### Image Pool Entry Props

    Status: Maybe OK

### Layer Buffer

    Status: Maybe OK

### Layer List

    Status: No Idea

- This currently has "add/remove/reorder" kinds.

- when the kinds are add/remove it should have buffer of target layer.
- although when the kind is "reorder", action doesn't need buffer. just needs indexes.
- Maybe those 2 kinds should be separated?

### Layer Props

    Status: Maybe OK
