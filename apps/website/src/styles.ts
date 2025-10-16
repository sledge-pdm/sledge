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
  height: 100%;
  padding: 3.5rem 4.5rem 3rem 4rem;

  @media (max-width: 599px) {
    box-sizing: border-box;
    width: 100%;
    height: auto;
    padding: 3rem 2rem 6rem 2rem;
  }
`;
