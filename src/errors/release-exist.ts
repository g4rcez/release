import { css, ErrorFormatter } from "./error-formatter.ts";

export class ReleaseExistsError extends ErrorFormatter {
  public constructor(release: string) {
    super(`Release %c${release} %calready exists in file`, css`color: red; font-weight: bold`);
  }
}
