import { css } from '@acab/ecsstatic';

export const startRoot = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
`;

export const startContent = css`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  padding: 40px;
  overflow: hidden;
`;

export const startHeader = css`
  font-family: ZFB31;
  font-size: 36px;
  letter-spacing: 2px;
  margin-bottom: 8px;
`;

export const header = css`
  display: flex;
  flex-direction: row;
  gap: 24px;
  padding-bottom: 48px;
  padding-top: 12px;
`;

export const headerItem = css`
  display: flex;
  flex-direction: row;
  cursor: pointer;
  font-size: 1rem;
  width: fit-content;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--color-active);
  }
`;

export const recentFilesCaption = css`
  font-family: ZFB08;
  font-size: 8px;
  color: #777;
  margin-bottom: 8px;
`;

export const clear = css`
  font-family: ZFB03;
  font-size: 15px;

  &:hover {
    color: var(--color-active);
  }
`;

export const recentFilesContainerGrid = css`
  width: 100%;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(3, auto);
  gap: 8px;
  flex-grow: 1;
  height: 0;
  margin-top: 12px;
`;

export const recentFilesContainerScroll = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  flex-grow: 1;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: transparent;
  }

  &:hover::-webkit-scrollbar-thumb {
    background-color: #ddd;
  }
`;

export const rightTopArea = css`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  right: 0;
  margin: var(--spacing-xl);
  box-sizing: border-box;
  gap: var(--spacing-md);
  align-items: end;
`;

export const openButtonMargin = css`
  margin-left: 2px;
`;
