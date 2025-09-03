import { makeTimer } from '@solid-primitives/timer';
import { Component, createSignal, onMount } from 'solid-js';
import SideBarMenu from '~/components/HeaderMenu';
import TypewriterText from '~/components/TypewriterText';
import { flavorText, flavorTextContainer, headerContentContainer, headerRoot, menuContainer, sledgeText } from '~/styles/header.css';

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
    <header class={headerRoot}>
      <div class={headerContentContainer}>
        <p class={sledgeText}>SLEDGE.</p>
        <div class={flavorTextContainer}>
          <TypewriterText class={flavorText} text={flavor()} durationPerCharacter={60} />
        </div>
      </div>

      <div class={menuContainer}>
        <SideBarMenu />
      </div>
    </header>
  );
};

export default Header;
