import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  tauriInfo: vi.fn(),
  tauriWarn: vi.fn(),
  tauriError: vi.fn(),
  setBottomBarText: vi.fn(),
  setBottomBarTextPermanent: vi.fn(),
}));

vi.mock('~/utils/platform', () => ({
  log: {
    info: mocks.tauriInfo,
    warn: mocks.tauriWarn,
    error: mocks.tauriError,
  },
}));

vi.mock('~/features/log/bottomBar', () => ({
  setBottomBarText: mocks.setBottomBarText,
  setBottomBarTextPermanent: mocks.setBottomBarTextPermanent,
}));

import { debugWarn, formatDetail, logSystemMessage, logUserMessage, logUserSuccess } from '~/features/log/service';

describe('features/log/service', () => {
  beforeEach(() => {
    mocks.tauriInfo.mockReset();
    mocks.tauriWarn.mockReset();
    mocks.tauriError.mockReset();
    mocks.setBottomBarText.mockReset();
    mocks.setBottomBarTextPermanent.mockReset();
  });

  it('formats known detail types', () => {
    expect(formatDetail('plain')).toBe('plain');
    expect(formatDetail({ foo: 1 })).toBe('{"foo":1}');

    const errorText = formatDetail(new Error('boom'));
    expect(errorText).toContain('boom');
  });

  it('falls back to String() when JSON serialization fails', () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;

    expect(formatDetail(circular)).toBe('[object Object]');
  });

  it('logs user message to tauri and bottom bar by default', () => {
    logUserMessage('saved', { label: 'Save', details: ['ok', { elapsed: 12 }] });

    expect(mocks.tauriInfo).toHaveBeenCalledTimes(1);
    const line = mocks.tauriInfo.mock.calls[0][0];
    expect(line).toContain('[Save] saved');
    expect(line).toContain('ok');
    expect(line).toContain('{"elapsed":12}');

    expect(mocks.setBottomBarText).toHaveBeenCalledWith('saved', { kind: 'info', duration: undefined });
  });

  it('logs system message only to tauri by default', () => {
    logSystemMessage('background task');

    expect(mocks.tauriInfo).toHaveBeenCalledTimes(1);
    expect(mocks.setBottomBarText).not.toHaveBeenCalled();
  });

  it('uses permanent bottom bar API when persistent option is enabled', () => {
    logUserMessage('sticky', { kind: 'warn', persistent: true });

    expect(mocks.setBottomBarTextPermanent).toHaveBeenCalledWith('sticky', { kind: 'warn' });
    expect(mocks.setBottomBarText).not.toHaveBeenCalled();
  });

  it('respects explicit channel overrides', () => {
    logUserMessage('bar only', { channels: ['bottomBar'], kind: 'error' });

    expect(mocks.tauriError).not.toHaveBeenCalled();
    expect(mocks.setBottomBarText).toHaveBeenCalledWith('bar only', { kind: 'error', duration: undefined });
  });

  it('maps success user logs to tauri info level', () => {
    logUserSuccess('done');

    expect(mocks.tauriInfo).toHaveBeenCalledTimes(1);
    expect(mocks.tauriWarn).not.toHaveBeenCalled();
    expect(mocks.tauriError).not.toHaveBeenCalled();
  });

  it('swallows tauri logger errors', async () => {
    mocks.tauriInfo.mockImplementationOnce(() => {
      throw new Error('log failure');
    });

    expect(() => logSystemMessage('safe')).not.toThrow();

    mocks.tauriInfo.mockImplementationOnce(() => Promise.reject(new Error('async failure')));
    logSystemMessage('safe async');
    await Promise.resolve();
  });

  it('routes debug warning payload only in dev mode', () => {
    debugWarn('Debug', { state: 'x' }, 'tail');

    if (import.meta.env.DEV) {
      expect(mocks.tauriWarn).toHaveBeenCalledTimes(1);
      const line = mocks.tauriWarn.mock.calls[0][0];
      expect(line).toContain('[Debug] {"state":"x"} | tail');
    } else {
      expect(mocks.tauriWarn).not.toHaveBeenCalled();
    }
  });
});
