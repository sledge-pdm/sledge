import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  hasSelection: vi.fn(),
}));

vi.mock('~/features/selection/SelectionManager', () => ({
  selectionManager: {
    hasSelection: mocks.hasSelection,
  },
}));

import { TOOL_CATEGORIES } from '~/features/tools/Tools';
import { fillPresetMeta } from '~/features/tools/presets/FillPresets';
import { getPresetMetaByToolId, toolPresetMetas } from '~/features/tools/presets/index';

describe('features/tools/presets', () => {
  beforeEach(() => {
    mocks.hasSelection.mockReset();
    mocks.hasSelection.mockReturnValue(false);
  });

  it('resolves preset meta by tool id', () => {
    const fillMeta = getPresetMetaByToolId(TOOL_CATEGORIES.FILL);
    const penMeta = getPresetMetaByToolId(TOOL_CATEGORIES.PEN);

    expect(fillMeta?.toolId).toBe(TOOL_CATEGORIES.FILL);
    expect(penMeta?.toolId).toBe(TOOL_CATEGORIES.PEN);
    expect(getPresetMetaByToolId('unknown')).toBeUndefined();
  });

  it('contains expected core tool metas', () => {
    const ids = toolPresetMetas.map((meta) => meta.toolId);

    expect(ids).toContain(TOOL_CATEGORIES.PEN);
    expect(ids).toContain(TOOL_CATEGORIES.ERASER);
    expect(ids).toContain(TOOL_CATEGORIES.FILL);
    expect(ids).toContain(TOOL_CATEGORIES.AUTO_SELECTION);
    expect(ids).toContain(TOOL_CATEGORIES.LASSO_SELECTION);
    expect(ids).toContain(TOOL_CATEGORIES.RECT_SELECTION);
  });

  it('fill selectionFillMode field condition follows current selection state', () => {
    const modeField = fillPresetMeta.fields.find((field) => field.key === 'selectionFillMode');

    expect(modeField).toBeDefined();
    expect(modeField?.condition?.()).toBe(false);

    mocks.hasSelection.mockReturnValue(true);
    expect(modeField?.condition?.()).toBe(true);
  });
});
