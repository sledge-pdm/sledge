export function isMacOS(): boolean {
  let isMac = false;
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Mac OS X')) {
    isMac = true;
  }
  return isMac;
}
