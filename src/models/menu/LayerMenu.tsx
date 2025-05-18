import { Menu, MenuItem } from '@tauri-apps/api/menu';
import RightClickMenu from './RightClickMenu';

const remove = await MenuItem.new({
  id: 'remove',
  text: 'remove',
  action: () => {
    console.log('Open clicked');
  },
});

const duplicate = await MenuItem.new({
  id: 'duplicate',
  text: 'duplicate',
  action: () => {
    console.log('Duplicate clicked');
  },
});

const menu = await Menu.new({
  items: [remove, duplicate],
});

export class LayerMenu extends RightClickMenu {
  constructor() {
    super(menu);
  }
}
