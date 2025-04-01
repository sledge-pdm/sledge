import { createEffect, Component, createSignal, Ref, onMount } from "solid-js";
import { CompanionEvents } from "~/models/EventHub";

import styles from "./companion.module.css";

const Companion: Component = () => {
    const [quote, setQuote] = createSignal("");

    const say = (text: string) => {
        window.speak?.(text, {
            amplitude: 100,
            pitch: 30,
            speed: 205,
            wordgap: 0
        });
    };

    createEffect(() => {
        const message = CompanionEvents.sayRequest();
        if (message) {
            say(message);
            setQuote(message);
            const element = document.getElementById('companion');
            setTimeout(() => {
                setQuote("");
                if (element) element.className = element.className.replace(` ${styles["giggle"]}`, "");
            }, 5000);
            window.requestAnimationFrame(function (time) {
                window.requestAnimationFrame(function (time) {
                    if (element) element.className += ` ${styles["giggle"]}`;
                });
            });
            CompanionEvents.setSayRequest(null); // 一度で消費
        }
    });

    return (
        <div class={styles.root}>
            <div class={styles.wrapper}>
                <div class={styles.companion} id="companion">
                    <img src="/companion.png" alt="you challenge me?" />
                </div>
                {quote() && (
                    <div class={styles.quote_box_container}>
                        <div class={styles.quote_box}>
                            <p>{quote()}</p>
                        </div>
                    </div>
                )}


            </div>
            <div id="audio" />
        </div>
    );
};


let lastSpoke = 0;
export const smartSay = (text: string): boolean => {
    const now = Date.now();
    if (now - lastSpoke > 5000) {
        CompanionEvents.setSayRequest(text);
        lastSpoke = now;
        return true;
    }
    return false;
};

export default Companion;