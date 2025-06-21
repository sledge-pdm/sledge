import LayerImageAgent from '~/controllers/layer/image/LayerImageAgent';
import ToolArgs from '~/tools/ToolArgs';

export default interface ToolBehavior {
  onStart: (agent: LayerImageAgent, args: ToolArgs) => boolean;

  onMove: (agent: LayerImageAgent, args: ToolArgs) => boolean;

  onEnd: (agent: LayerImageAgent, args: ToolArgs) => boolean;
}
