import { Anvil } from '@sledge/anvil';

export class AnvilManager {
  private anvils: Map<string, Anvil> = new Map();

  public getAnvil(layerId: string): Anvil | undefined {
    return this.anvils.get(layerId);
  }

  public registerAnvil(layerId: string, buffer: Uint8ClampedArray, width: number, height: number): Anvil {
    const anvil = new Anvil(width, height);
    anvil.loadImageData(buffer);
    this.anvils.set(layerId, anvil);
    return anvil;
  }

  public removeAnvil(layerId: string): void {
    this.anvils.delete(layerId);
  }
}

export const anvilManager = new AnvilManager();
export const getAnvilOf = (layerId: string) => anvilManager.getAnvil(layerId);
// Test/utility: direct register existing Anvil instance
export const registerLayerAnvil = (layerId: string, anvil: Anvil) => {
  (anvilManager as any).anvils.set(layerId, anvil);
  return anvil;
};
