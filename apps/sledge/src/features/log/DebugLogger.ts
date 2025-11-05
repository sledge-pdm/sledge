import { debugError, debugLog, debugWarn } from '~/features/log/service';

export class DebugLogger {
  private label: string = '';
  constructor(
    label: string,
    public enabled: boolean
  ) {
    this.label = label;
  }

  public debugLog = (...msg: any) => {
    if (this.enabled) debugLog(this.label, ...msg);
  };
  public debugWarn = (...msg: any) => {
    if (this.enabled) debugWarn(this.label, ...msg);
  };
  public debugError = (...msg: any) => {
    if (this.enabled) debugError(this.label, ...msg);
  };
}
