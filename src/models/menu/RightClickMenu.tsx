import { LogicalPosition, PhysicalPosition, Position } from '@tauri-apps/api/dpi';
import { Menu } from '@tauri-apps/api/menu';

export default class RightClickMenu {
  constructor(private menu: Menu) {}

  public showBelow = async (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    await this.menu.setAsWindowMenu();
    await this.menu.popup(new LogicalPosition(rect.left, rect.bottom));
  };

  public show = async (at?: PhysicalPosition | LogicalPosition | Position) => {
    await this.menu.setAsWindowMenu();
    await this.menu.popup(at);
  };
}
