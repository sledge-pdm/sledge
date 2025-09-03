import { makeTimer } from '@solid-primitives/timer';
import { Component, createEffect, createMemo, createSignal, JSX, onMount } from 'solid-js';

interface Props extends JSX.HTMLAttributes<HTMLParagraphElement> {
  text: string;
  durationPerCharacter: number;
}

const TypewriterText: Component<Props> = (props) => {
  const [writingText, setWritingText] = createSignal('');

  let disposeWrite: VoidFunction | undefined = undefined;

  const startWrite = () => {
    if (props.text.trim().length !== 0) {
      if (disposeWrite) disposeWrite();
      disposeWrite = makeTimer(
        () => {
          setWritingText((prev) => prev + props.text.charAt(prev.length));
          if (writingText().length === props.text.length) {
            disposeWrite?.();
            disposeWrite = undefined;
          }
        },
        props.durationPerCharacter,
        setInterval
      );
    }
  };

  const [cursorTicker, setCursorTicker] = createSignal(true);
  onMount(() => {
    startWrite();

    makeTimer(
      () => {
        setCursorTicker((t) => !t);
      },
      800,
      setInterval
    );
  });

  const shouldShowCursor = createMemo(() => cursorTicker() || disposeWrite !== undefined);

  createEffect(() => {
    const newText = props.text;
    setWritingText('');
    startWrite();
  });

  return (
    <p {...props}>
      {writingText()}
      {shouldShowCursor() ? '|' : ''}
    </p>
  );
};

export default TypewriterText;
