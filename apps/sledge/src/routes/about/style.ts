import { css } from '@acab/ecsstatic';

export const aaContainer = css`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 16px;
  right: 84px;
  width: 200px;
  height: 100%;
  pointer-events: none;
`;

export const aaText = css`
  font-family: Terminus;
  text-rendering: geometricPrecision;
  font-size: 32px;
  line-height: 1;
  letter-spacing: -0.75px;
  word-spacing: 0;
  opacity: 0.15;
`;

export const contentContainer = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 0 28px;
  margin-top: 12px;
  pointer-events: none;
`;

export const aboutLink = css`
  pointer-events: all;
  width: fit-content;

  &:hover {
    border-bottom: none;
    color: magenta;
  }
`;

export const aboutTitle = css`
  font-family: ZFB31;
  font-size: 36px;
`;

export const aboutSubTitle = css`
  font-family: k12x8;
  font-size: 8px;
  /* font-style: italic; */
`;

export const newVersionText = css`
  width: fit-content;
  font-family: ZFB03;
  font-size: 8px;
  color: var(--color-accent);
  pointer-events: all;
`;

export const aboutDev = css`
  font-family: ZFB03;
  font-size: 8px;
`;

export const aboutDescription = css`
  color: var(--color-muted);
  font-size: 8px;
`;

export const aboutInspiredText = css`
  font-size: 8px;
  line-height: 2;
`;

export const aboutFeedback = css`
  font-family: k12x8;
  font-size: 8px;
  margin-right: 42px;
  line-height: 1.5;
`;

export const rowContainer = css`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
`;

export const fullWidth = css`
  width: 100%;
`;

export const titleRow = css`
  display: flex;
  flex-direction: row;
  width: 360px;
`;

export const fontSection = css`
  display: flex;
  flex-direction: column;
  margin-top: auto;
`;

export const fontSectionTitle = css`
  color: var(--color-active);
  margin-bottom: 8px;
`;

export const fontItem = css`
  margin-bottom: 5px;
  vertical-align: middle;
`;

export const fontDescription = css`
  font-family: ZFB08;
  opacity: 0.6;
  margin-left: 8px;
`;

export const fontWebsite = css`
  display: none;
  font-family: ZFB08;
  opacity: 0;
`;

export const linkSection = css`
  display: flex;
  flex-direction: column;
  margin-top: 8px;
`;

export const linkContainer = css`
  display: flex;
  flex-direction: row;
  width: 100%;
  align-items: end;
  margin-bottom: 32px;
`;

export const versionText = css`
  margin-right: 12px;
  margin-top: 2px;
  margin-bottom: 16px;
`;
