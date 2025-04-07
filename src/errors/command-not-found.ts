import { css, ErrorFormatter } from "./error-formatter.ts";

export class CommandNotFound extends ErrorFormatter {
  public constructor() {
    super(
      `%cYou need to provide a command`,
      css`color: orange;font-weight: bold`,
    );
  }
}
