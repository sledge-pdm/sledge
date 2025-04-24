import { open } from "@tauri-apps/plugin-shell";
import { flexRow, w100, wh100 } from "~/styles/snippets.css";
import {
  aaContainer,
  aaText,
  aboutContent,
  aboutDev,
  aboutFeedback,
  aboutLink,
  aboutSubTitle,
  aboutTitle,
  contentContainer,
  sendFBButton,
} from "./about.css";

const About = () => {
  const openLink = (url: string) => {
    open(url);
  };

  return (
    <div id="root">
      <div class={`${flexRow} ${wh100}`}>
        <div class={aaContainer}>
          <p class={aaText}>
            ⠀⠀⠀⠀⠀⠀⠀⠀⢠⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
            <br />
            ⠀⠀⠀⠀⠀⠀⢀⣀⣀⣱⣠⣤⣤⣤⣤⣶⣶⣶⠀⠀⠀⠀⠀⠀
            <br />
            ⠀⢠⢤⣴⣷⣾⣿⣿⣿⣿⣿⣿⣾⣿⣿⣿⣿⣿⡄⠀⠀⠀⠀⠀
            <br />
            ⠀⠀⠀⠹⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣾⠁⠀⠀⠀⠀⠀
            <br />
            ⠀⠀⠀⠀⠹⣟⣻⠿⠿⠿⠭⢽⡿⠛⠊⠁⠁⠀⠀⠀⠀⠀⠀⠀
            <br />
            ⠀⠀⠀⠀⠀⠉⠀⠀⠀⠀⠀⠀⢣⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
            <br />
            ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢳⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀
            <br />
            ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠱⡄⠀⠀⠀⠀⠀⠀⠀⠀
            <br />
            ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⠀⠀⠀⠀⠀⠀⠀⠀
            <br />
            ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢷⠀⠀⠀⠀⠀⠀⠀
            <br />
          </p>
        </div>
        <div class={`${contentContainer} ${w100}`}>
          <div class={`${flexRow}`} style={{ width: "360px" }}>
            <p class={aboutTitle}>SLEDGE.</p>
            <p class={aboutDev} style={{ "margin-top": "3px" }}>
              by alphendp
            </p>
          </div>
          <p class={aboutSubTitle} style={{ "margin-bottom": "24px" }}>
            pre-alpha v0.1
          </p>
          <p
            class={aboutContent}
            style={{ "margin-bottom": "36px", "line-height": "1.2" }}
          >
            made with much <span style={{ color: "magenta" }}>love</span> 4
            <br />-{" "}
            <a
              class={aboutLink}
              onClick={(e) =>
                openLink("https://www.sojamo.de/libraries/controlP5/")
              }
            >
              ControlP5
            </a>
            <br />-{" "}
            <a
              class={aboutLink}
              onClick={(e) => openLink("https://archlinux.org/")}
            >
              Arch Linux
            </a>
            <br />-{" "}
            <a
              class={aboutLink}
              onClick={(e) =>
                openLink("https://apps.apple.com/jp/app/caustic/id775735447/")
              }
            >
              Caustic3
            </a>{" "}
            &lt;HP dead RIP&gt;
            <br />
          </p>
          <button class={sendFBButton}>&gt;&gt; send feedback</button>
          <p class={aboutFeedback}>
            feel free to send feedback!!
            <br />
            気軽に意見を投げつけよう
          </p>
        </div>
      </div>
    </div>
  );
}

export default About;