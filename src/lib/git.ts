import { run } from "./os.ts";

class Commit {
  constructor(public readonly hash: string, public readonly cwd: string) {
  }

  public author() {
    return run(this.cwd, ["git", "show", "-s", "--format=%an", this.hash]);
  }

  public timestamps() {
    return run(this.cwd, ["git", "show", "-s", "--format=%cI", this.hash]);
  }

  public message() {
    return run(this.cwd, ["git", "show", "-s", "--format=%s", this.hash]);
  }
}

export class Git {
  public constructor(public readonly cwd: string) {}

  public async lastCommit() {
    const tags = await run(this.cwd, [
      "git",
      "log",
      "-1",
      "--pretty=%H",
    ]);
    return tags.split("\n").map((x) => x.trim());
  }

  public async tags(slice: number) {
    const tags = await run(this.cwd, [
      "git",
      "for-each-ref",
      "--sort=-creatordate",
      "--format=%(refname:short)",
      "refs/tags",
    ]);
    return tags.split("\n").slice(0, slice).map((x) => x.trim());
  }

  public getConfigAuthor() {
    return run(this.cwd, ["git", "config", "user.name"]);
  }

  public async getCommits(previous: string, current: string): Promise<string[]> {
    try {
      const commits = await run(this.cwd, [
        "git",
        "log",
        "--pretty=format:%H",
        `${previous}..${current}`,
      ]);
      return commits.split("\n");
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  public commit(commit: string) {
    return new Commit(commit, this.cwd);
  }

  public async push(origin: string, remote: string) {
    try {
      const result = await run(this.cwd, ["git", "push", origin, remote]);
      return result;
    } catch (error) {
      return null;
    }
  }

  public async tag(tag: string) {
    try {
      const result = await run(this.cwd, ["git", "tag", tag]);
      return result;
    } catch (error) {
      return null;
    }
  }

  public async hasChanges() {
    try {
      const result = await run(this.cwd, [
        "git",
        "status",
        "--porcelain",
      ]);
      return result !== "";
    } catch (error) {
      return true;
    }
  }
}
