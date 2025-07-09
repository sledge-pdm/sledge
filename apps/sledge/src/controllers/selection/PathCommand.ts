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
