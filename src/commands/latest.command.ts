import { CliCommand } from "../cli/cli.ts";
import { Git } from "../lib/git.ts";
import { getCwd } from "../lib/os.ts";

export const latestTagCommand: CliCommand<{ cwd: string }> = async (args) => {
  const git = new Git(getCwd(args.cwd));
  const [latestTag] = await git.tags(1);
  console.log(`\r${latestTag}`);
};
