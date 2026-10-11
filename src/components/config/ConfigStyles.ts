import { css } from '@acab/ecsstatic';

export const configFormFieldHeader = css`
  font-size: 8px;
  font-family: ZFB09;
  letter-spacing: 1px;
  color: var(--color-accent);
  margin-top: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  text-transform: lowercase;
`;

export const configFormFieldItem = css`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
`;

export const configFormFieldLabelTooltip = css`
  width: fit-content;
  font-family: ZFB09;
  opacity: 0.2;
  cursor: help;
`;

export const configFormFieldLabel = css`
  font-family: ZFB21;
  vertical-align: middle;
  text-align: left;
  margin-left: 8px;
  margin-right: 8px;
`;

export const configFormFieldControlWrapper = css`
  display: flex;
  flex-direction: row;
  max-width: 260px;
  margin-left: 16px;
  align-items: center;
`;

export const configFormFieldControlLabel = css`
  min-width: 64px;
  cursor: pointer;
`;
