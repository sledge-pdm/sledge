import { css } from '@acab/ecsstatic';
import { makeTimer } from '@solid-primitives/timer';
import { Component, createSignal, onMount } from 'solid-js';
import TypewriterText from '~/components/TypewriterText';

const flavorTextContainer = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 24px;
  margin-bottom: 16px;
`;

const flavorText = css`
  font-family: k12x8;
  font-size: 8px;
  color: var(--color-active);
  font-style: italic;
  white-space: pre-wrap;
`;

const FlavorText: Component = () => {
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
    <div class={flavorTextContainer}>
      <TypewriterText class={flavorText} text={flavor()} durationPerCharacter={60} />
    </div>
  );
};

export default FlavorText;
