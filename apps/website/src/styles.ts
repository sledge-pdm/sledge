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
  width: 420px;
  flex-grow: 1;
  height: auto;
  box-sizing: border-box;
  padding: 4rem;

  @media (max-width: 599px) {
    box-sizing: border-box;
    width: 100%;
    height: auto;
    padding: 3.5rem 2rem 4rem 2rem;
  }
`;
