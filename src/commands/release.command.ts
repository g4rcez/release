import { exists } from "jsr:@std/fs";
import { isAbsolute, join, resolve } from "jsr:@std/path";
import { CliCommand } from "../cli/cli.ts";
import { Git } from "../lib/git.ts";
import { GithubCli } from "../lib/github-cli.ts";
import { getCwd } from "../lib/os.ts";
import { fetchGitDateTag, fetchSemverTag } from "./versioning.command.ts";
import { ReleaseType } from "@std/semver/types";

const writeFile = (file: string, content: string) => Deno.writeTextFile(file, content + "\n", { create: true });

export const releaseCommand: CliCommand<{
  cwd: string;
  changelog: string;
  publish: boolean;
  with: string;
  increment: ReleaseType;
  length: number;
}> = async (args) => {
  const cwd = getCwd(args.cwd);
  const c = args.changelog || "CHANGELOG";
  const CHANGELOG_DIR = isAbsolute(c) ? c : resolve(join(cwd, c));
  const git = new Git(cwd);

  // Ensure CHANGELOG directory exists
  const existDir = await exists(CHANGELOG_DIR);
  if (!existDir) {
    await Deno.mkdir(CHANGELOG_DIR, { recursive: true });
  }

  const now = new Date();
  const author = await git.getConfigAuthor();

  const [latest] = await git.tags(1);
  console.log(`Latest tag: ${latest}`);

  const release = args.with === "semver" ? await fetchSemverTag(cwd, args.increment) : await fetchGitDateTag(cwd, args.length);

  const lines: string[] = [];
  lines.push(`# ${release.tag}\n`);
  lines.push(`Date: ${now.toISOString()}`);
  lines.push(`Author: ${author}`);
  lines.push("");

  const releaseFileContent = lines.join("\n");
  await release.create();

  const commits = await git.getCommits(latest, release.tag);
  console.log(`From: ${latest} | To: ${release.tag}`);
  for (let i = 0; i < commits.length; i += 1) {
    const commit = git.commit(commits[i]);
    const hash = commit.hash.slice(0, 7);
    const author = await commit.author();
    const message = await commit.message();
    const timestamps = await commit.timestamps();
    lines.push(`## ${hash}`);
    lines.push(`Date: ${timestamps}`);
    lines.push(`Author: @${author}`);
    lines.push(`Commit: ${commit.hash}`);
    lines.push(message);
    lines.push("\n");
  }

  // Create individual version file
  const versionFileName = `${release.tag}.md`;
  const versionFilePath = join(CHANGELOG_DIR, versionFileName);
  await writeFile(versionFilePath, lines.join("\n"));
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
