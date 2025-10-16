import { css } from '@acab/ecsstatic';
import { makeTimer } from '@solid-primitives/timer';
import { Component, createSignal, onMount } from 'solid-js';

// Styles
const headerRoot = css`
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  max-width: 500px;
  box-sizing: content-box;
  height: auto;
  padding: 3rem 0 0.25rem 0;
  margin-bottom: 3rem;
  background-color: var(--color-background);
  z-index: 10;
  @media (max-width: 599px) {
    justify-content: auto;
    padding: 2.5rem 0 0.25rem 0;
  }
`;

const headerContentContainer = css`
  display: flex;
  flex-direction: column;
  justify-self: center;
  height: auto;
  padding: 0 4rem 0 3rem;
  @media (max-width: 599px) {
    box-sizing: border-box;
    width: 100%;
    padding: 0 2rem 0 2rem;
  }
`;

const sledgeText = css`
  font-family: ZFB31, k12x8;
  font-size: 36px;
  letter-spacing: 2px;
  margin-bottom: 6px;
  @media (max-width: 400px) {
    font-size: 32px;
  }
`;

const menuContainer = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  overflow-x: auto;
  margin: 0 4rem 0 3rem;
  touch-action: auto;

  &::-webkit-scrollbar {
    height: 2px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #dddddd75;
  }

  @media (max-width: 599px) {
    box-sizing: border-box;
    width: 100%;
    margin: 0 2rem 0 2rem;
  }
`;

const Header: Component = () => {
  const descriptionFlavors: string[] = [
    'Paint, rearmed.',
    `A tiny hooligan in your pocket.`,
    `Keep it in your pocket. Break when needed.`,
    `Always at hand. Always unruly.`,
    `A hammer with a master.`,
    `Not a studio. A hammer.`,
    `Strike pixels, not canvas.`,
    `8 MB. Free. Always ready.`,
    `The pocket-sized sidearm for your pixels.`,
    `Small enough to carry. Sharp enough to cut.`,
    `Notepad for images.`,
    `A glitchpad for your desktop.`,
  ];

  const [flavor, setFlavor] = createSignal(descriptionFlavors[0]);

  onMount(() => {
    makeTimer(
      () => {
        setFlavor(descriptionFlavors[Math.floor(Math.random() * descriptionFlavors.length)]);
      },
      8000,
      setInterval
    );
  });

  return (
    // <header class={headerRoot}>
    //   <div class={headerContentContainer}>
    //     <p class={sledgeText}>SLEDGE.</p>
    //   </div>

    //   {/* <div class={menuContainer}>
    //     <SideBarMenu />
    //   </div> */}
    // </header>
    <></>
  );
};

export default Header;
