import { run } from "./os.ts";

export class GithubCli {
  constructor(public readonly cwd: string) {
  }

  public async release(tag: string, file: string) {
    await run(this.cwd, [
      "gh",
      "release",
      "create",
      tag,
      "--title",
      `Release - ${tag}`,
      "--notes-file",
      file,
      "--latest",
    ]);
  }
}
