
import Color from "./color/Color";
import PenConfig from "./pen/PenConfig";
import LayerList from "./layer/LayerList";
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