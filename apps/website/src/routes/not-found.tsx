import { css } from '@acab/ecsstatic';
import { type Component } from 'solid-js';
import { pageRoot } from '~/styles';

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
  @media (max-width: 599px) {
    font-size: 16px;
  }
`;
export const NotFound: Component = () => {
  return (
    <main class={pageRoot}>
      <div class={scrollContent}>
        <p class={heroHeading}>OOPS!</p>
        <p>The page you are looking for doesn’t exist.</p>
      </div>
    </main>
  );
};

export default NotFound;
