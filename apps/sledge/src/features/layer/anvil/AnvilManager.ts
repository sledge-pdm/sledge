import type { RawPixelData } from '@sledge/anvil';
import { Anvil } from '@sledge/anvil';

export class AnvilManager {
  private anvils: Map<string, Anvil> = new Map();

  public getAnvil(layerId: string): Anvil | undefined {
    return this.anvils.get(layerId);
  }

  public registerAnvil(layerId: string, buffer: RawPixelData, width: number, height: number): Anvil {
    const anvil = new Anvil(width, height);
    anvil.replaceBuffer(buffer);
    this.anvils.set(layerId, anvil);
    return anvil;
  }

  public removeAnvil(layerId: string): void {
    this.anvils.delete(layerId);
  }
}

export const anvilManager = new AnvilManager();
export const getAnvil = (layerId: string): Anvil => {
  const anvil = anvilManager.getAnvil(layerId);
  if (!anvil) throw new Error(`Anvil not found for layerId: ${layerId}`);
  return anvil;
};
// Test/utility: direct register existing Anvil instance
export const registerLayerAnvil = (layerId: string, anvil: Anvil) => {
  (anvilManager as any).anvils.set(layerId, anvil);
  return anvil;
};
