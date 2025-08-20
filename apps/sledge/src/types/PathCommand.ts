export class PathCmdList {
  private list: PathCmd[] = [];
  constructor(cmds?: PathCmd[]) {
    if (cmds) this.list = cmds;
  }

  public getList = () => this.list;
  public setList = (cmds: PathCmd[]) => (this.list = cmds);
  public add = (cmd: PathCmd) => this.list.push(cmd);
  public clear = () => (this.list = []);

  public toString(mult?: number) {
    return this.list.map((cmd) => cmd.toString(mult)).join(' ');
  }

  /**
   * 文字列の SVG パス (M/L/Z のみ) から PathCmdList を生成
   */
  public static parse(pathString: string): PathCmdList {
    const pathCmds = new PathCmdList();
    const trimmedAll = pathString.trim();
    if (!trimmedAll) return pathCmds;

    const commands = trimmedAll.split(/(?=[MLZ])/);
    commands.forEach((cmd) => {
      const trimmed = cmd.trim();
      if (!trimmed) return;

      const parts = trimmed.split(/\s+/);
      const command = parts[0];

      if (command === 'M' || command === 'L') {
        const x = parseFloat(parts[1]);
        const y = parseFloat(parts[2]);
        pathCmds.add(new PathCmd(command, x, y));
      } else if (command === 'Z') {
        pathCmds.add(new PathCmd(command));
      }
    });

    return pathCmds;
  }

  /**
   * 平行移動 (dx, dy) を加え、さらに倍率 mult を乗じたパス文字列を返す
   */
  public toStringTranslated(mult: number = 1, dx: number = 0, dy: number = 0) {
    return this.list
      .map((cmd) => {
        if (cmd.p1 !== undefined && cmd.p2 !== undefined) {
          const x = (cmd.p1 + dx) * (mult ?? 1);
          const y = (cmd.p2 + dy) * (mult ?? 1);
          return `${cmd.cmd} ${x} ${y}`;
        }
        return cmd.cmd;
      })
      .join(' ');
  }

  public getCmdsPerZ(mult?: number): string[] {
    let result: string[] = [];
    let current = new PathCmdList([]);
    this.list.forEach((cmd) => {
      if (cmd.cmd !== 'Z') {
        current.add(cmd);
      } else {
        result.push(current.toString(mult));
        current.clear();
      }
    });

    return result;
  }
}

export class PathCmd {
  constructor(
    public cmd: string,
    public p1?: number,
    public p2?: number
  ) {}

  public toString(mult?: number) {
    if (!mult) mult = 1;
    if (this.p1 !== undefined && this.p2 !== undefined) return `${this.cmd} ${this.p1 * mult} ${this.p2 * mult}`;
    else return `${this.cmd}`;
  }
}
