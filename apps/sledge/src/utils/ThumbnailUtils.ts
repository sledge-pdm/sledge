import { Size2D } from '@sledge/core';
import { Consts } from '~/Consts';

export function calcThumbnailSize(origW: number, origH: number): Size2D {
  return calcFitSize(origW, origH, Consts.projectThumbnailSize, Consts.projectThumbnailSize);
}

function calcFitSize(origW: number, origH: number, maxW: number, maxH: number): Size2D {
  const scale = Math.min(maxW / origW, maxH / origH);
  return { width: Math.round(origW * scale), height: Math.round(origH * scale) };
}

export interface PreviewSizeOptions {
  canvasSize: Size2D;
  sizingMode: 'width-based' | 'height-based';
  referenceSize: number;
  fitMode?: 'contain' | 'cover';
  maxWidth?: number;
  maxHeight?: number;
}

export function calcPreviewSize(options: PreviewSizeOptions): Size2D {
  const { canvasSize, sizingMode, referenceSize, fitMode = 'contain', maxWidth, maxHeight } = options;
  const aspectRatio = canvasSize.width / canvasSize.height;
  if (!Number.isFinite(aspectRatio) || referenceSize <= 0) {
    return { width: 0, height: 0 };
  }

  const baseSize =
    sizingMode === 'width-based'
      ? {
          width: referenceSize,
          height: Math.round(referenceSize / aspectRatio),
        }
      : {
          width: Math.round(referenceSize * aspectRatio),
          height: referenceSize,
        };

  if (!maxWidth && !maxHeight) {
    return baseSize;
  }

  return fitMode === 'cover'
    ? applyCoverStrategy(baseSize, sizingMode, referenceSize, maxWidth, maxHeight)
    : applyContainStrategy(baseSize, maxWidth, maxHeight);
}

function applyContainStrategy(baseSize: Size2D, maxWidth?: number, maxHeight?: number): Size2D {
  const limitWidth = maxWidth ?? Number.POSITIVE_INFINITY;
  const limitHeight = maxHeight ?? Number.POSITIVE_INFINITY;

  if (baseSize.width <= limitWidth && baseSize.height <= limitHeight) {
    return baseSize;
  }

  return calcFitSize(baseSize.width, baseSize.height, limitWidth, limitHeight);
}

function applyCoverStrategy(
  baseSize: Size2D,
  sizingMode: 'width-based' | 'height-based',
  referenceSize: number,
  maxWidth?: number,
  maxHeight?: number
): Size2D {
  let finalWidth = baseSize.width;
  let finalHeight = baseSize.height;

  if (sizingMode === 'width-based') {
    if (maxWidth) {
      finalWidth = Math.min(finalWidth, maxWidth);
    }
    if (maxHeight && baseSize.height > maxHeight) {
      finalHeight = maxHeight;
      finalWidth = referenceSize;
    }
  } else {
    if (maxHeight) {
      finalHeight = Math.min(finalHeight, maxHeight);
    }
    if (maxWidth && baseSize.width > maxWidth) {
      finalWidth = maxWidth;
      finalHeight = referenceSize;
    }
  }

  return {
    width: Math.round(finalWidth),
    height: Math.round(finalHeight),
  };
}
