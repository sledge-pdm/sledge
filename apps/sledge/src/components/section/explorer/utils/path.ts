import { normalizePath } from '~/utils/FileUtils';

export type BreadcrumbEntry = { label: string; value: string };

export const normalizeDirectoryPath = (rawPath: string): string => {
  if (!rawPath) return '';
  let candidate = rawPath.trim();
  if (/^[a-zA-Z]:$/.test(candidate)) {
    candidate = `${candidate}/`;
  }
  const normalized = normalizePath(candidate);
  if (!normalized) {
    const slashOnly = candidate.replace(/\\/g, '/');
    if (/^\/+$/.test(slashOnly)) return '/';
  }
  return normalized;
};

export const getParentDirectory = (path: string): string | undefined => {
  const normalized = normalizePath(path);
  if (!normalized) return undefined;
  const parts = normalized.split('/');
  if (parts.length <= 1) return undefined;
  let parent = parts.slice(0, -1).join('/');
  if (parts.length === 2) parent += '/';
  if (!parent || parent === normalized) return undefined;
  return parent;
};

export const buildBreadcrumbItems = (rawPath: string): BreadcrumbEntry[] => {
  const normalized = normalizeDirectoryPath(rawPath);
  if (!normalized) return [];

  if (normalized === '/') {
    return [{ label: '/', value: '/' }];
  }

  if (normalized.startsWith('//')) {
    const withoutPrefix = normalized.replace(/^\/\//, '');
    const parts = withoutPrefix.split('/').filter((part) => part);
    if (parts.length < 2) {
      return [{ label: normalized, value: normalized }];
    }
    const [server, share, ...rest] = parts;
    let acc = `//${server}/${share}`;
    const items: BreadcrumbEntry[] = [{ label: `//${server}/${share}`, value: acc }];
    rest.forEach((part) => {
      acc = `${acc}/${part}`;
      items.push({ label: part, value: acc });
    });
    return items;
  }

  if (normalized.startsWith('/')) {
    const rest = normalized.split('/').filter((part) => part);
    const items: BreadcrumbEntry[] = [{ label: '/', value: '/' }];
    let acc = '';
    rest.forEach((part) => {
      acc = acc ? `${acc}/${part}` : `/${part}`;
      items.push({ label: part, value: acc });
    });
    return items;
  }

  if (/^[a-zA-Z]:/.test(normalized)) {
    const segments = normalized.split('/').filter((part, index) => part || index === 0);
    if (segments.length === 0) return [];
    const driveLabel = segments[0].endsWith(':') ? `${segments[0]}/` : segments[0];
    let acc = driveLabel;
    const items: BreadcrumbEntry[] = [{ label: driveLabel, value: driveLabel }];
    segments.slice(1).forEach((part) => {
      acc = acc.endsWith('/') ? `${acc}${part}` : `${acc}/${part}`;
      items.push({ label: part, value: acc });
    });
    return items;
  }

  const parts = normalized.split('/').filter((part) => part);
  let acc = '';
  return parts.map((part) => {
    acc = acc ? `${acc}/${part}` : part;
    return { label: part, value: acc };
  });
};
