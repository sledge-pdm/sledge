import { css } from '@acab/ecsstatic';

export const sectionRoot = css`
  display: flex;
  flex-direction: column;
  z-index: var(--zindex-side-section);
  box-sizing: border-box;
  overflow: visible;
`;

export const sectionContent = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-top: 4px;
  padding-left: 16px;
  padding-bottom: 12px;
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
  font-family: ZFB03;
  font-size: var(--text-sm);
  margin-top: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  opacity: 0.8;
`;

export const sectionSubContent = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 8px;
  padding-left: 12px;
  box-sizing: border-box;
  overflow: visible;
`;
