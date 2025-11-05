## Instruction for history test

* Always care to create common utilities to make everything simple and clean. For example, if there's a common layer used across different test, it should be stored in utility file.
* **DON'T assume that redo() means "doing it's action"!!** Some actions need to be called with registerXXX functions, and this sometimes causes conflict when redo() called before undo(). Instead, use the actual methods to add/remove/modify something.
* Try to uniform the name of entries, layers, etc. It doesn't mean name should be complicated, just make it unified.

### Naming Convention

* **Layer IDs**: Use alphabetical sequence: `A`, `B`, `C`, `D`... for easy identification in tests
* **Layer Names**: Default to same as ID, or descriptive like `Layer A`, `Layer B`
* **Entry IDs**: Use format `entry-A`, `entry-B` for image pool entries
* **Context**: Use consistent context like `test-action` for all test actions
* **Test Layer IDs**: For dedicated test layers, use format `test-layer-A`, `test-layer-B`