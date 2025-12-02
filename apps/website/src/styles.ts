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
  flex-direction: row;
  box-sizing: border-box;
  width: 100%;
  flex-grow: 1;
  height: 100%;
`;

// scrollbar style
export const simpleScrollbar = css`
  &::-webkit-scrollbar {
    width: 2px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #88888875;
  }
`;
