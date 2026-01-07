export type UpdateDownloadEvent = {
  event: 'Started' | 'Progress' | 'Finished';
  data: {
    contentLength?: number;
    chunkLength?: number;
  };
};

export interface Update {
  version: string;
  currentVersion?: string;
  date?: string;
  body?: string;
  downloadAndInstall(onEvent: (event: UpdateDownloadEvent) => void): Promise<void>;
}

export interface UpdaterPlatform {
  check(options?: Record<string, unknown>): Promise<Update | null>;
}
