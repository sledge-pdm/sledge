import { getAgentOf } from '~/controllers/layer/LayerAgentManager';

export function undoLayer(layerId: string) {
  const agent = getAgentOf(layerId);
  if (!agent) {
    console.log(`no agent found for  ${layerId}.`);
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

  if (agent.canRedo()) {
    agent.redo();
  } else {
    console.log(`can't redo layer ${layerId}.`);
  }
}
