export type FsBaseDirectory = Record<string, unknown>;

export type DirEntry = {
  name: string;
  path: string;
  children?: DirEntry[];
  isFile?: boolean;
  isDirectory?: boolean;
};

export type FileInfo = {
  size?: number;
  mtime?: Date;
  isFile?: boolean;
  isDirectory?: boolean;
};

export interface FsPlatform {
  BaseDirectory?: FsBaseDirectory;
  exists(path: string, options?: Record<string, unknown>): Promise<boolean>;
  mkdir(path: string, options?: Record<string, unknown>): Promise<void>;
  readFile(path: string, options?: Record<string, unknown>): Promise<Uint8Array>;
  writeFile(path: string, data: Uint8Array, options?: Record<string, unknown>): Promise<void>;
  readTextFile(path: string, options?: Record<string, unknown>): Promise<string>;
  writeTextFile(path: string, data: string, options?: Record<string, unknown>): Promise<void>;
  readDir(path: string, options?: Record<string, unknown>): Promise<DirEntry[]>;
  remove(path: string, options?: Record<string, unknown>): Promise<void>;
  stat(path: string, options?: Record<string, unknown>): Promise<FileInfo>;
}
