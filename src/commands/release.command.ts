import { exists } from "jsr:@std/fs";
import { basename, isAbsolute, join, resolve } from "jsr:@std/path";
import { CliCommand } from "../cli/cli.ts";
import { ReleaseExistsError } from "../errors/release-exist.ts";
import { Git } from "../lib/git.ts";
import { GithubCli } from "../lib/github-cli.ts";
import { getCwd } from "../lib/os.ts";
import { fetchGitDateTag, gitDateCommand } from "./versioning.command.ts";

const writeFile = (file: string, content: string) =>
  Deno.writeTextFile(file, content + "\n", { append: true, create: true });

export const releaseCommand: CliCommand<{
  cwd: string;
  changelog: string;
  publish: boolean;
  with: string;
  length: number;
}> = async (args) => {
  const cwd = getCwd(args.cwd);
  const c = args.changelog || "";
  const file = isAbsolute(c) ? c : resolve(join(cwd, c));
  const git = new Git(cwd);

  const existFile = await exists(file);
  if (!existFile) {
    throw new Error("Changelog not exists")
  }
  const changelogFileContent = await Deno.readTextFile(file);

  const now = new Date();
  const author = await git.getConfigAuthor();

  const [, previous] = await git.tags(2);

  const version = await fetchGitDateTag(cwd, args.length);
  const current = version.tag;

  const lines: string[] = [];
  lines.push(`# ${current}`);
  lines.push("");
  lines.push(`Date: ${now.toISOString()}`);
  lines.push(`Author: ${author}`);
  lines.push("");

  const commits = await git.getCommits(previous, current);
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
  }
  await writeFile(file, [...lines, "\n--\n", changelogFileContent].join("\n"));
  if (args.publish) {
    const git = new Git(cwd);
    await git.add(".");
    await git.createCommit("-m", "docs: CHANGELOG");
    await git.push("origin", "");
    console.log("docs: CHANGELOG was pushed");
    const gh = new GithubCli(cwd);
    await gh.release(current, file);
    console.log(`Git tag ${current} was released.`);
  }
  console.log(
    `[${new Date().toISOString()}]The changelog ${basename(file)} has been released.`,
  );
};
