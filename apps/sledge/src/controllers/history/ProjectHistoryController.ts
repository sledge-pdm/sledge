import { BaseHistoryAction } from "~/controllers/history/actions/BaseHistoryAction";

// new history controller for project-level history
export class ProjectHistoryController {
  private history: BaseHistoryAction[] = [];
  private redoStack: BaseHistoryAction[] = [];

  constructor() {
    // Initialize the history controller
  }

  addAction(action: BaseHistoryAction): void {
    this.history.push(action);
    this.redoStack = [];
  }

  undo(): void {
    const action = this.history.pop();
    if (action) {
      action.undo();
      this.redoStack.push(action);
    }
  }

  redo(): void {
    const action = this.redoStack.pop();
    if (action) {
      action.redo();
      this.history.push(action);
    }
  }
}
