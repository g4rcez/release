import { ReleaseType } from "@std/semver/types";
import { CliCommand } from "../cli/cli.ts";
import { canParse, format, increment, parse } from "@std/semver";
import { Git } from "../lib/git.ts";
import { getCwd } from "../lib/os.ts";
import { Strings } from "../lib/strings.ts";

const semver: ReleaseType[] = [
  "pre",
  "major",
  "minor",
  "patch",
  "premajor",
  "preminor",
  "prepatch",
  "prerelease",
];

const pushTag = async (newTagVersion: string, cwd: string) => {
  const git = new Git(getCwd(cwd));
  const hasChanges = await git.hasChanges();
  if (hasChanges) {
    throw new Error("Git has changes. Commit before start this process");
  }
  const tag = await git.tag(newTagVersion);
  if (tag === null) {
    throw new Error(`Tag ${newTagVersion} already exists`);
  }
  await git.push("origin", newTagVersion);
  console.log(
    `[${new Date().toISOString()}] ${newTagVersion} was pushed to remote!`,
  );
};

export const fetchGitDateTag = async (cwd: string, len: number) => {
  const now = new Date();
  const git = new Git(getCwd(cwd));
  const [lastCommit] = await git.lastCommit();
  const tag = `${now.getFullYear()}.${Strings.padDate(now.getMonth() + 1)}.${Strings.padDate(now.getDate())}.${lastCommit.slice(0, len)}`;
  return { tag, create: async () => await pushTag(tag, cwd) };
};

export const gitDateCommand: CliCommand<{
  git: boolean;
  cwd: string;
  length: number;
}> = async (args) => {
  const now = new Date();
  const git = new Git(getCwd(args.cwd));
  const [lastCommit] = await git.lastCommit();
  const len = +args.length;
  const tag = `${now.getFullYear()}.${Strings.padDate(now.getMonth() + 1)}.${Strings.padDate(now.getDate())}.${lastCommit.slice(0, len)}`;
  if (args.git) {
    return await pushTag(tag, args.cwd);
  }
  console.log(`\r${tag}`);
};

export const fetchSemverTag = async (
  incrementType: ReleaseType,
  cwd: string,
) => {
  const git = new Git(cwd);
  const [latest] = await git.tags(1);
  if (!canParse(latest)) {
    throw new Error(`${latest} is invalid semver version`);
  }
  const t = parse(latest);
  const tag = `v${format(increment(t, incrementType))}`;
  return { tag, create: async () => await pushTag(tag, cwd) };
};
