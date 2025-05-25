import { IconMenuItem, Menu } from '@tauri-apps/api/menu';
import { resolveResource } from '@tauri-apps/api/path';
import { duplicateLayer, resetLayerImage } from '~/controllers/layer/LayerController';
import { findLayerById, removeLayer } from '~/controllers/layer/LayerListController';
import { emitEvent } from '~/utils/TauriUtils';
import RightClickMenu from './RightClickMenu';

export class LayerMenu extends RightClickMenu {
  constructor(menu: Menu) {
    super(menu);
  }

  public static async create(layerId: string): Promise<LayerMenu> {
    const dir = 'resources/icons/menu/layer/';

    const clear = await IconMenuItem.new({
      id: 'clear',
      text: 'clear.',
      icon: await resolveResource(dir + '/clear.png'),
      action: () => {
        resetLayerImage(layerId, findLayerById(layerId)?.dotMagnification ?? 1);
        emitEvent('onResetAllLayers');
      },
    });

    const remove = await IconMenuItem.new({
      id: 'remove',
      text: 'remove.',
      icon: await resolveResource(dir + '/remove.png'),
      action: () => {
        removeLayer(layerId);
      },
    });

    const duplicate = await IconMenuItem.new({
      id: 'duplicate',
      text: 'duplicate.',
      icon: await resolveResource(dir + '/duplicate.png'),
      action: () => {
        duplicateLayer(layerId);
      },
    });

    const menu = await Menu.new({
      items: [clear, remove, duplicate],
    });

    const instance = new LayerMenu(menu);

    return instance;
  }
}
