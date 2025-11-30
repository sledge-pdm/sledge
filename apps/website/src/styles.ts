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
  box-sizing: border-box;
  width: 100%;
  flex-grow: 1;
  height: auto;
  padding: 4rem;
`;
