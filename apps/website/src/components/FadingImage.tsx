import { Component, createEffect, createSignal, JSX } from 'solid-js';

const FadingImage: Component<JSX.IntrinsicElements['img']> = (props) => {
  const [currentSrc, setCurrentSrc] = createSignal<string>(props.src || '');
  const [nextSrc, setNextSrc] = createSignal<string | null>(null);
  const [isTransitioning, setIsTransitioning] = createSignal(false);

  createEffect(() => {
    if (props.src && props.src !== currentSrc()) {
      setNextSrc(props.src);
      setIsTransitioning(true);
    }
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 現在の画像 */}
      <img
        {...props}
        style={{
          ...(typeof props.style === 'object' && props.style !== null ? props.style : {}),
          transition: 'opacity 1s ease-in-out',
          opacity: isTransitioning() ? 0 : 1,
          width: '100%',
          height: '100%',
          'object-fit': 'cover',
        }}
        src={currentSrc()}
      />

      {/* 次の画像（フェードイン中のみ表示） */}
      {nextSrc() && (
        <img
          {...props}
          style={{
            ...(typeof props.style === 'object' && props.style !== null ? props.style : {}),
            transition: 'opacity 1s ease-in-out',
            opacity: isTransitioning() ? 1 : 0,
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            'object-fit': 'cover',
          }}
          src={nextSrc()!}
          onLoad={() => {
            setTimeout(() => {
              setCurrentSrc(nextSrc()!);
              setNextSrc(null);
              setIsTransitioning(false);
            }, 50);
          }}
        />
      )}
    </div>
  );
};

export default FadingImage;
