import { exists } from "jsr:@std/fs";
import { isAbsolute, join, resolve } from "jsr:@std/path";
import { CliCommand } from "../cli/cli.ts";
import { ReleaseExistsError } from "../errors/release-exist.ts";
import { Git } from "../lib/git.ts";
import { GithubCli } from "../lib/github-cli.ts";
import { getCwd } from "../lib/os.ts";

const writeFile = (file: string, content: string) => Deno.writeTextFile(file, content + "\n", { append: true, create: true });

export const releaseCommand: CliCommand<{ cwd: string; changelog: string; publish: boolean }> = async (args) => {
  const cwd = getCwd(args.cwd);
  const c = args.changelog || "";
  const file = isAbsolute(c) ? c : resolve(join(cwd, c));
  const git = new Git(cwd);
  const now = new Date();
  const [current, previous] = await git.tags(2);
  const author = await git.getConfigAuthor();

  const existFile = await exists(file);
  const changelogFileContent = await Deno.readTextFile(file);
  const hasCurrentRelease = existFile ? changelogFileContent.includes(`# ${current}`) : false;

  if (hasCurrentRelease) {
    return Promise.reject(new ReleaseExistsError(current));
  }

  const lines: string[] = [];
  lines.push(`# ${current}`);
  lines.push("");
  lines.push(`Date: ${now}`);
  lines.push(`Author: ${author}`);
  lines.push("");

  const commits = await git.getCommits(previous, current);
  const last = commits.length - 1;
  for (let i = 0; i < commits.length; i += 1) {
    const commit = git.commit(commits[i]);
    const author = await commit.author();
    const message = await commit.message();
    const timestamps = await commit.timestamps();
    lines.push(`## ${commit.hash.slice(0, 6)}`);
    lines.push(`Date: ${timestamps}`);
    lines.push(`Author: @${author}`);
    lines.push(`Commit: ${commit.hash}`);
    lines.push(message);
    if (i !== last) {
      lines.push("\n--\n");
    }
  }
  await writeFile(file, [...lines, changelogFileContent].join("\n"));
  if (args.publish) {
    const git = new Git(cwd);
    await git.add(".");
    await git.createCommit("-m", "docs: CHANGELOG");
    const gh = new GithubCli(cwd);
    await gh.release(current, file);
  }
  console.log(`[${new Date().toISOString()}]The file has been released.`);
};
