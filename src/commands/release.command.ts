import { exists } from "jsr:@std/fs";
import { isAbsolute, join, resolve } from "jsr:@std/path";
import { CliCommand } from "../cli/cli.ts";
import { Git } from "../lib/git.ts";
import { GithubCli } from "../lib/github-cli.ts";
import { getCwd } from "../lib/os.ts";
import { fetchGitDateTag, fetchSemverTag } from "./versioning.command.ts";

const writeFile = (file: string, content: string) =>
  Deno.writeTextFile(file, content + "\n", { append: true, create: true });

export const releaseCommand: CliCommand<{
  cwd: string;
  changelog: string;
  publish: boolean;
  with: string;
  increment: string;
  length: number;
}> = async (args) => {
  const cwd = getCwd(args.cwd);
  const c = args.changelog || "";
  const CHANGELOG = isAbsolute(c) ? c : resolve(join(cwd, c));
  const git = new Git(cwd);

  const existFile = await exists(CHANGELOG);
  if (!existFile) {
    await Deno.writeFile(CHANGELOG, new TextEncoder().encode(""), {
      createNew: true,
    });
  }
  const changelogFileContent = await Deno.readTextFile(CHANGELOG);

  const now = new Date();
  const author = await git.getConfigAuthor();

  const [latest] = await git.tags(1);
  console.log(`Latest tag: ${latest}`);

  const release =
    args.with === "semver"
      ? await fetchSemverTag(cwd, args.increment)
      : await fetchGitDateTag(cwd, args.length);

  const lines: string[] = [];
  lines.push(`# ${release.tag}\n`);
  lines.push(`Date: ${now.toISOString()}`);
  lines.push(`Author: ${author}`);
  lines.push("");

  const releaseFileContent = lines.join("\n");
  await release.create();

  const commits = await git.getCommits(latest, release.tag);
  console.log(`Getting commits...${latest}..${release.tag}`);
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
    lines.push("\n");
  }
  await writeFile(CHANGELOG, [...lines, "--", changelogFileContent].join("\n"));
  await git.add(".");
  const changelogCommit = `docs(${release.tag}): CHANGELOG`;
  await git.createCommit("-m", changelogCommit);
  await git.push("origin", "");
  console.log(changelogCommit);
  const gh = new GithubCli(cwd);
  const tempFile = await Deno.makeTempFile();
  await writeFile(tempFile, releaseFileContent);
  await gh.release(release.tag, tempFile);
  console.log(`Git tag ${release.tag} was released.`);
  console.log(release.tag);
};
