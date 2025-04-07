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
  const hasCurrentRelease = existFile ? (await Deno.readTextFile(file)).includes(`# ${current}`) : false;

  if (hasCurrentRelease) {
    return Promise.reject(new ReleaseExistsError(current));
  }

  await writeFile(file, `# ${current}`);
  await writeFile(file, "");
  await writeFile(file, `Date: ${now}`);
  await writeFile(file, `Author: ${author}`);
  await writeFile(file, "");

  const commits = await git.getCommits(previous, current);
  const last = commits.length - 1;
  for (let i = 0; i < commits.length; i += 1) {
    const commit = git.commit(commits[i]);
    const author = await commit.author();
    const message = await commit.message();
    const timestamps = await commit.timestamps();
    await writeFile(file, `## ${commit.hash.slice(0, 6)}`);
    await writeFile(file, `Date: ${timestamps}`);
    await writeFile(file, `Author: @${author}`);
    await writeFile(file, `Commit: ${commit.hash}`);
    await writeFile(file, message);
    if (i !== last) {
      await writeFile(file, "\n--\n");
    }
  }
  if (args.publish) {
    const gh = new GithubCli(cwd);
    await gh.release(current, file);
  }
  console.log(`[${new Date().toISOString()}]The file has been released.`);
};
