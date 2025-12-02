import { css } from '@acab/ecsstatic';
import { Icon } from '@sledge/ui';
import { Component, JSX } from 'solid-js';

export const subHeading = css`
  font-family: k12x8;
  letter-spacing: 1px;
  width: 100%;
  line-height: 1.5;
  color: var(--color-on-background);
  vertical-align: middle;
  user-select: text;
`;

export const subHeadingContainer = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
`;

export const SubHeadingWithDot: Component<JSX.HTMLAttributes<HTMLParagraphElement>> = (props) => {
  return (
    <div class={subHeadingContainer}>
      <Icon src='/icons/misc/bullet_s_8.png' base={8} color={'var(--color-on-background)'} />
      <p class={subHeading} {...props}>
        {props.children}
      </p>
    </div>
  );
};

export const SubHeadingWithCheck: Component<JSX.HTMLAttributes<HTMLParagraphElement>> = (props) => {
  return (
    <div class={subHeadingContainer}>
      <Icon src='/icons/misc/check_8.png' base={8} color={'var(--color-enabled)'} />
      <p class={subHeading} {...props}>
        {props.children}
      </p>
    </div>
  );
};

export const SubHeadingWithX: Component<JSX.HTMLAttributes<HTMLParagraphElement>> = (props) => {
  return (
    <div class={subHeadingContainer}>
      <Icon src='/icons/misc/remove.png' base={8} color={'var(--color-error)'} />
      <p class={subHeading} {...props}>
        {props.children}
      </p>
    </div>
  );
};
