export enum BaseDirectory {
  AppConfig = 'app-config',
}

export const exists = async () => false;
export const mkdir = async () => {};
export const writeFile = async () => {};
export const readFile = async () => new Uint8Array();
export const writeTextFile = async () => {};
export const readTextFile = async () => '';
