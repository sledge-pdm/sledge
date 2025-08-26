import { selectionManager } from '~/controllers/selection/SelectionManager';
import { cancelMove } from '~/controllers/selection/SelectionOperator';
import { getAgentOf } from '../layer/LayerAgentManager';

export function undoLayer(layerId: string) {
  const agent = getAgentOf(layerId);
  if (!agent) {
    console.log(`no agent found for  ${layerId}.`);
    return;
  }

  // If the selection is in move state, cancel the move
  if (selectionManager.isMoveState()) {
    cancelMove();
    return;
  }

  if (agent.canUndo()) {
    console.log(`undo layer ${layerId}.`);
    agent.undo();
  } else {
    console.log(`can't undo layer ${layerId}.`);
  }
}

export function redoLayer(layerId: string) {
  const agent = getAgentOf(layerId);
  if (!agent) {
    return;
  }

  // If the selection is in move state, cancel the move
  if (selectionManager.isMoveState()) {
    cancelMove();
  }

  if (agent.canRedo()) {
    agent.redo();
  } else {
    console.log(`can't redo layer ${layerId}.`);
  }
}

export function clearHistory(layerId: string) {
  const agent = getAgentOf(layerId);
  if (!agent) {
    console.log(`no agent found for  ${layerId}.`);
    return;
  }

  agent.getHistoryManager().clear();
}

export function isHistoryAvailable(layerId: string) {
  const agent = getAgentOf(layerId);
  if (!agent) {
    console.log(`no agent found for  ${layerId}.`);
    return;
  }

  return agent.getHistoryManager().getRedoStack().length > 0 || agent.getHistoryManager().getUndoStack().length > 0;
}
