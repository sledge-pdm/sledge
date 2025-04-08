
import styles from "./layer_list.module.css";

export const Arrow = <svg
    xmlns="http://www.w3.org/2000/svg"
    class={styles.image_insert_arrow}
>
    <defs>
        <marker
            id="arrow"
            viewBox="0 0 10 5"
            refX="5"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
        >
            <path d="M 0 0 L 10 5 L 0 5 z" />
        </marker>
    </defs>
    <path
        d="M 10 45 h -17 v 194 h 8"
        fill="none"
        stroke-width="1px"
        shape-rendering="optimizeSpeed"
        stroke="black"
        marker-end="url(#arrow)"
    />
</svg>;