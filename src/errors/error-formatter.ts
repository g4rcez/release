export class ErrorFormatter extends Error {
  public style: string[] = [];
  public constructor(public msg: string, ...style: string[]) {
    super(msg);
    this.style = style;
  }

  public log() {
    if (this.message) console.log(this.message, ...this.style);
  }
}

export const css = String.raw;
