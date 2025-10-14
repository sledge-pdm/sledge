import { css } from '@acab/ecsstatic';

export const flexRow = css`
  display: flex;
  flex-direction: row;
`;

export const flexCol = css`
  display: flex;
  flex-direction: column;
`;

export const accentedText = css`
  color: var(--color-accent);
`;

export const errorButton = css`
  width: fit-content;
  border: 1px solid var(--color-error);
  background: var(--color-button-bg);
  color: var(--color-error);
  pointer-events: all;

  &:hover {
    color: #ffffff;
    background: var(--color-error);
  }

  &:disabled {
    color: var(--color-muted);
    border: 1px solid var(--color-muted);
    pointer-events: none;
  }
`;

export const accentedButton = css`
  width: fit-content;
  border: 1px solid var(--color-accent);
  background: var(--color-button-bg);
  color: var(--color-accent);
  pointer-events: all;

  &:hover {
    color: #ffffff;
    background: var(--color-accent);
  }

  &:disabled {
    color: var(--color-muted);
    border: 1px solid var(--color-muted);
    pointer-events: none;
  }
`;

export const pageRoot = css`
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;
  user-select: none;
  background-color: var(--color-background);
`;

export const sledgeLogo = css`
  bottom: 2px;
  position: absolute;
  right: 2px;
`;
