
import Color from "./content/color/Color";
import PenConfig from "./content/pen/PenConfig";
import LayerList from "./content/layer/LayerList";
import Edge from "./edge/Edge";

export default () => {
    return (
        <div id="sidebar">
            <Edge />

            <div id="content">
                <Color />
                <PenConfig />
                <LayerList />
            </div>
        </div>
    );
}