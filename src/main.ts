import { Cli } from "./cli/cli.ts";
import { latestTagCommand } from "./commands/latest.command.ts";
import { releaseCommand } from "./commands/release.command.ts";
import { gitDateCommand, semverCommand } from "./commands/versioning.command.ts";
import { ErrorFormatter } from "./errors/error-formatter.ts";

async function main() {
  const cli = new Cli("release", "v0.0.0", "ReleaseCLI: release process simplified!")
    .option("--changelog|-c [string]", { default: "CHANGELOG", description: "Set changelog file" })
    .option("--git|-g", { description: "Execute git commands (create tag)" })
    .option("--cwd|-p [string]", { default: ".", description: "Work directory" })
    .option("--publish|-P", { default: false, description: "Publish the release using github cli" })
    .option("--increment|-i [string]", { default: "", description: "Increment semver tag using the release types" })
    .option("--length|-l [number]", { default: 6, description: "Length of hash commit" })
    .command("changelog", releaseCommand, { description: "Generate changelog file and publish release" })
    .command("semver", semverCommand, { description: "Generate semver version and publish tag" })
    .command("gitdate", gitDateCommand, { description: "Generate git date and publish tag" })
    .command("tag", latestTagCommand, { description: "Get the latest tag of a git repository" });
  try {
    const parse = cli.parse(Deno.args);
    await parse.command?.fn(parse.args);
    Deno.exit(0);
  } catch (error) {
    cli.help(error);
    Deno.exit(1);
  }
}

main();
