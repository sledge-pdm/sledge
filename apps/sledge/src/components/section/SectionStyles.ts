import { css } from '@acab/ecsstatic';

export const sectionContent = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-left: 8px;
  box-sizing: border-box;
  overflow: visible;
`;

export const sectionCaption = css`
  font-family: ZFB09;
  letter-spacing: 3px;
  font-size: 8px;
  opacity: 1;
  white-space: nowrap;
`;

export const sectionSubCaption = css`
  font-family: ZFB03B;
  font-size: var(--text-sm);
  margin-top: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  opacity: 0.7;
`;

export const sectionSubContent = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 8px;
  padding-left: 8px;
  box-sizing: border-box;
  overflow: visible;
`;

export const sectionRoot = css`
  display: flex;
  flex-direction: column;
  z-index: var(--zindex-side-section);
  padding: 8px;
  box-sizing: border-box;
  overflow: visible;
`;
