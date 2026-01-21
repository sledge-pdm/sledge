import { logSystemError } from '~/features/log/service';
import { clipboard } from '~/utils/platform';

const LOG_LABEL = 'ClipboardUtils';

// Helper function to check if the active element is an input field
export function isInputFocused() {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();
  const isContentEditable = activeElement.getAttribute('contenteditable') === 'true';

  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || isContentEditable;
}

export async function tryGetImageFromClipboard(): Promise<
  | {
      buffer: Uint8Array;
      width: number;
      height: number;
    }
  | undefined
> {
  try {
    const clipboardImage = await clipboard.readImage();
    const buffer = await clipboardImage.rgba();
    const size = await clipboardImage.size();
    // buffer is stored in JS heap so we can release original resource data
    clipboardImage.close();
    return { buffer, width: size.width, height: size.height };
  } catch (e) {
    logSystemError('failed to get image from clipboard.', { label: LOG_LABEL, details: [e] });
    return undefined;
  }
}

export async function tryGetTextFromClipboard(): Promise<string | undefined> {
  try {
    const clipboardText = await clipboard.readText();
    return clipboardText;
  } catch (e) {
    logSystemError('failed to get text from clipboard.', { label: LOG_LABEL, details: [e] });
    return undefined;
  }
}
