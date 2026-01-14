import { describe, expect, it } from 'vitest';
import { formatNativePath, normalizeJoin, normalizePath, pathToFileLocation } from '~/utils/FileUtils';

describe('normalizePath', () => {
  it('normalizes windows paths', () => {
    expect(normalizePath('C:\\\\Users\\\\foo\\\\')).toBe('C:/Users/foo');
  });

  it('preserves UNC prefixes', () => {
    expect(normalizePath('\\\\\\\\server\\\\share\\\\folder\\\\file.png')).toBe('//server/share/folder/file.png');
  });

  it('trims redundant forward slashes', () => {
    expect(normalizePath(' //var///log// ')).toBe('/var/log');
  });
});

describe('normalizeJoin', () => {
  it('joins segments on windows', () => {
    expect(normalizeJoin('C:\\\\Users', 'foo')).toBe('C:/Users/foo');
  });

  it('keeps UNC root when joining', () => {
    expect(normalizeJoin('\\\\\\\\server\\\\share', 'folder', 'file.png')).toBe('//server/share/folder/file.png');
  });
});

describe('pathToFileLocation', () => {
  it('parses UNC file paths', () => {
    const loc = pathToFileLocation('\\\\\\\\server\\\\share\\\\folder\\\\file.sledge');
    expect(loc).toEqual({
      path: '//server/share/folder',
      name: 'file.sledge',
    });
  });

  it('parses drive rooted paths', () => {
    const loc = pathToFileLocation('C:\\\\foo.sledge');
    expect(loc).toEqual({
      path: 'C:',
      name: 'foo.sledge',
    });
  });
});

describe('formatNativePath', () => {
  it('converts normalized UNC to backslashes on Windows', () => {
    expect(formatNativePath('//server/share/folder/file.png')).toBe('\\\\server\\share\\folder\\file.png');
  });

  it('keeps extended UNC prefix intact', () => {
    expect(formatNativePath('\\\\\\\\?\\\\UNC\\\\server\\\\share\\\\file.png')).toBe('\\\\?\\UNC\\server\\share\\file.png');
  });
});
