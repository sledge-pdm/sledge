import { css } from '@acab/ecsstatic';
import { type Component } from 'solid-js';
import { Portal } from 'solid-js/web';
import { wikiContentRoot } from '~/routes/wiki/styles';

export const scrollContent = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  height: auto;
`;

// Common typography styles
export const heroHeading = css`
  font-family: ZFB20, k12x8;
  font-size: 16px;
  line-height: 1.25;
  letter-spacing: 1px;
  margin-bottom: 16px;
  vertical-align: baseline;
  inset: 0;
  color: var(--color-on-background);
  opacity: 0.95;
`;

export const WikiNotFound: Component = () => {
  return (
    <Portal mount={document.querySelector('#portal-root') as Node}>
      <div class={wikiContentRoot}>
        <p class={heroHeading}>OOPS!</p>
        <p>The page you are looking for does not exist.</p>
      </div>
    </Portal>
  );
};

export default WikiNotFound;
