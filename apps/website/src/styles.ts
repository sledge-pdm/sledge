import { css } from '@acab/ecsstatic';

// Common layout styles
export const flexRow = css`
  display: flex;
  flex-direction: row;
`;

export const flexCol = css`
  display: flex;
  flex-direction: column;
`;

// Common page styles
export const pageRoot = css`
  display: flex;
  flex-direction: column;
  width: 320px;
  padding: 3rem 3.5rem 3rem 3.5rem;
  background-color: var(--color-surface);

  @media (max-width: 599px) {
    box-sizing: border-box;
    width: 100%;
    padding: 3rem 2rem 6rem 2rem;
  }
`;

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

// Common component styles
export const sectionContainer = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  @media (max-width: 599px) {
    width: 100%;
  }
`;

export const sectionImage = css`
  width: 100%;
  height: auto;
  object-fit: cover;
  object-position: 0 0;
  border: 1px solid var(--color-muted);
  border-radius: 8px;
  image-rendering: auto;
  max-height: 200px;
`;

// Common link styles
export const mainLink = css`
  font-family: k12x8;
  font-size: 8px;
  letter-spacing: 0px;
  color: var(--color-accent);
  text-decoration: underline;
  @media (any-hover: hover) {
    &:hover {
      color: var(--color-active);
      text-decoration: none;
    }
  }
`;
