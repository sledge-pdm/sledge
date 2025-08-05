import { createSignal, onMount, onCleanup, type Component, type JSX } from 'solid-js';

interface Props extends JSX.HTMLAttributes<HTMLInputElement> {
  inputId: string; // needs id because don't want to use ref
  value?: string;
  autocomplete?: string;
  onInputChange?: (e: Event & { target: HTMLInputElement }) => void; // onChange is used for input events
}

// polyfill for field-sizing: content input
const FieldSizingInput: Component<Props> = (props) => {
  const [width, setWidth] = createSignal(0);
  const [height, setHeight] = createSignal(0);

  onMount(() => {
    calculateSize();
    
    // ウィンドウリサイズやフォント変更時の再計算
    const handleResize = () => calculateSize();
    window.addEventListener('resize', handleResize);
    
    onCleanup(() => {
      window.removeEventListener('resize', handleResize);
    });
  });

  const calculateSize = () => {
    const inputElement = document.getElementById(props.inputId) as HTMLInputElement;
    if (inputElement) {
      const computedStyle = getComputedStyle(inputElement);
      
      // calculate inner width based on content
      const content = inputElement.value || inputElement.placeholder || '';
      
      // 最小幅として1文字分を保証（field-sizing: contentの挙動に合わせる）
      const minContent = content || 'M'; // Mは一般的に最も幅が広い文字の一つ

      const horizontalPadding = parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
      const horizontalBorder = parseFloat(computedStyle.borderLeftWidth) + parseFloat(computedStyle.borderRightWidth);
      const verticalPadding = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
      const verticalBorder = parseFloat(computedStyle.borderTopWidth) + parseFloat(computedStyle.borderBottomWidth);

      const span = document.createElement('span');
      
      // より包括的なスタイルコピー
      span.style.position = 'absolute';
      span.style.visibility = 'hidden';
      span.style.whiteSpace = 'pre';
      span.style.pointerEvents = 'none';
      span.style.fontFamily = computedStyle.fontFamily;
      span.style.fontSize = computedStyle.fontSize;
      span.style.fontWeight = computedStyle.fontWeight;
      span.style.fontStyle = computedStyle.fontStyle;
      span.style.letterSpacing = computedStyle.letterSpacing;
      span.style.wordSpacing = computedStyle.wordSpacing;
      span.style.lineHeight = computedStyle.lineHeight;
      span.style.textTransform = computedStyle.textTransform;
      
      span.textContent = minContent;
      
      document.body.appendChild(span);
      const spanRect = span.getBoundingClientRect();
      document.body.removeChild(span); // メモリリーク防止

      const textWidth = spanRect.width ?? 0;
      const textHeight = spanRect.height ?? 0;

      // 実際のコンテンツと最小幅の大きい方を使用
      const finalWidth = content ? Math.max(textWidth, 0) : textWidth;

      setWidth(finalWidth + horizontalPadding + horizontalBorder);
      setHeight(textHeight + verticalPadding + verticalBorder);
    }
  };

  return (
    <input
      id={props.inputId}
      type='text'
      {...props}
      style={{
        ...(typeof props.style === 'object' ? props.style : {}),
        width: `${width()}px`,
        height: `${height()}px`,
        'box-sizing': 'border-box',
        'min-width': '0', // field-sizing: contentの挙動に合わせる
      }}
      onInput={(e) => {
        calculateSize();
        if (props.onInputChange && e.target instanceof HTMLInputElement) {
          props.onInputChange(e as Event & { target: HTMLInputElement });
        }
      }}
    />
  );
};

export default FieldSizingInput;
