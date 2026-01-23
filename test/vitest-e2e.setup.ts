import { vi } from 'vitest';
import { setPlatform } from '~/utils/platform';
import { createTestMockPlatform } from '~/utils/platform/TestMockPlatform';

setPlatform(createTestMockPlatform());

vi.mock('@acab/ecsstatic', () => ({
  css: () => '',
}));
