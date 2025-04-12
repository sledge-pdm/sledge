import { Component } from "solid-js";
import { JSX } from "solid-js/h/jsx-runtime";

const EdgeInfo: Component<{}> = (props) => {
    const edgeFlexStyle: JSX.CSSProperties = { "flex-grow": 1 };

    return <div id="edge">
        <p>autosaved. (4s ago)</p>
        <div style={edgeFlexStyle}></div>
        <p>config.</p>
    </div>;
};

export default EdgeInfo;