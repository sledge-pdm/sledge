import { Accessor, Component, Show, type JSX } from 'solid-js';

interface Props extends Omit<JSX.HTMLAttributes<HTMLParagraphElement>, 'children'> {
  children?: string | Accessor<string>;
}

const ErrorText: Component<Props> = (props) => {
  return (
    <Show when={typeof props.children === 'function' ? props.children() : props.children}>
      <p
        {...props}
        style={{
          ...(typeof props.style === 'object' ? props.style : {}),
          color: 'red',
        }}
      >
        ! {typeof props.children === 'function' ? props.children() : (props.children ?? '')}
      </p>
    </Show>
  );
};

export default ErrorText;
