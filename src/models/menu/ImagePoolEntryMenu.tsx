import { Menu, MenuItem } from '@tauri-apps/api/menu';
import { imagePoolController } from '~/controllers/canvas/image_pool/ImagePoolController';
import RightClickMenu from './RightClickMenu';

export class ImagePoolEntryMenu extends RightClickMenu {
  constructor(menu: Menu) {
    super(menu);
  }

  public static async create(id: string): Promise<ImagePoolEntryMenu> {
    const menu = await Menu.new({
      items: [
        await MenuItem.new({
          id: 'remove',
          text: 'remove',
          action: () => {
            imagePoolController.removeEntry(id);
          },
        }),
      ],
    });

    const fruit = new ImagePoolEntryMenu(menu);

    return fruit;
  }
}
